// components/MapImageUpload.tsx
import React, { useState, useCallback } from "react";
import Image from "next/image";
import {
  HiClock,
  HiCalendar,
  HiLocationMarker,
  HiX,
  HiPhotograph,
} from "react-icons/hi";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { createPortal } from "react-dom";

import MediaPopup from "./MediaPopup"; // Import the MediaPopup component

import { useAuth } from "@/hooks/useAuth";
import { Memory } from "@/types";

interface MapImageUploadProps {
  location: { latitude: number; longitude: number };
  onUpload: (
    memoryData: Omit<Memory, "id" | "createdBy" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  onClose: () => void;
}

const MapImageUpload: React.FC<MapImageUploadProps> = ({
  location,
  onUpload,
  onClose,
}) => {
  const { user, profile } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [voiceMessage, setVoiceMessage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const validFiles = acceptedFiles.filter((file) => file.size <= MAX_SIZE);

    // Notify user about files that are too large
    const tooLargeFiles = acceptedFiles.filter((file) => file.size > MAX_SIZE);

    if (tooLargeFiles.length > 0) {
      toast.error(
        "Some files were too large. Maximum size is 5MB per image/video.",
      );
    }

    // Update state with valid files
    setFiles((prevFiles) => [...prevFiles, ...validFiles]);
    const newUrls = validFiles.map((file) => URL.createObjectURL(file));

    setPreviewUrls((prevUrls) => [...prevUrls, ...newUrls]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "video/*": [".mp4", ".mov", ".avi"],
    },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024,
  });

  const uploadFilesToFirebase = async (): Promise<{
    imageUrls: string[];
    videoUrls: string[];
  }> => {
    const storage = getStorage();
    const uploadedImageUrls: string[] = [];
    const uploadedVideoUrls: string[] = [];

    for (const file of files) {
      const storageRef = ref(storage, `memories/${uuidv4()}-${file.name}`);

      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      if (file.type.startsWith("image/")) {
        uploadedImageUrls.push(downloadUrl);
      } else if (file.type.startsWith("video/")) {
        uploadedVideoUrls.push(downloadUrl);
      }
    }

    return { imageUrls: uploadedImageUrls, videoUrls: uploadedVideoUrls };
  };

  const handleVoiceMessageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (file && file.size <= 5 * 1024 * 1024) {
      // 5MB limit
      setVoiceMessage(file);
    } else {
      toast.error("Voice message must be less than 5MB.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      toast.error("You must be logged in to create memories");

      return;
    }

    if (!files.length) {
      toast.error("Please add at least one image or video");

      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title");

      return;
    }

    try {
      setUploading(true);
      const { imageUrls, videoUrls } = await uploadFilesToFirebase();
      let voiceMessageUrl = "";

      if (voiceMessage) {
        const storage = getStorage();
        const voiceRef = ref(
          storage,
          `memories/${uuidv4()}-${voiceMessage.name}`,
        );

        await uploadBytes(voiceRef, voiceMessage);

        voiceMessageUrl = await getDownloadURL(voiceRef);
      }

      await onUpload({
        title: title.trim(),
        description: "",
        location,
        imageUrls,
        videoUrls,
        voiceMessageUrl, // Include voice message URL
        notes: notes.trim(),
      });

      toast.success("Memory created successfully!");
      onClose();
    } catch (error) {
      console.error("Error creating memory:", error);
      toast.error("Failed to create memory. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const openMediaPopup = (url: string, type: "image" | "video") => {
    setSelectedMedia(url);
    setMediaType(type);
    setIsPopupOpen(true);
  };

  const closeMediaPopup = () => {
    setSelectedMedia(null);
    setMediaType(null);
    setIsPopupOpen(false);
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm memory-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Create Time Capsule
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Preserve this moment in time
              </p>
            </div>
            <button
              className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-full"
              onClick={onClose}
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Title Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Capsule Title
              </label>
              <input
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700"
                maxLength={100}
                placeholder="Name your time capsule..."
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Location Display */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center space-x-3">
              <HiLocationMarker className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Location</p>
                <p className="text-xs text-gray-500">
                  {`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                </p>
              </div>
            </div>

            {/* Image/Video Upload Section */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Capsule Contents
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 transition-all ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input {...getInputProps()} />
                <div className="text-center">
                  <HiPhotograph className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Drop your memories here (images or videos)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Up to 5 files (max 5MB each)
                  </p>
                </div>
              </div>
            </div>

            {/* Voice Message Upload Section */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Voice Message (optional)
              </label>
              <input
                accept="audio/*"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700"
                type="file"
                onChange={handleVoiceMessageUpload}
              />
            </div>

            {/* Image and Video Preview Grid */}
            {previewUrls.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Preview Contents
                </label>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {files.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="relative w-full pb-[100%]">
                          <div className="absolute inset-0">
                            {file.type.startsWith("video/") ? (
                              <video
                                controls
                                className="object-cover rounded-lg cursor-pointer"
                                src={previewUrls[index]}
                                onClick={() =>
                                  openMediaPopup(previewUrls[index], "video")
                                }
                              />
                            ) : (
                              <Image
                                fill
                                alt={`Preview ${index + 1}`}
                                className="object-cover rounded-lg transform transition-transform group-hover:scale-102 cursor-pointer"
                                src={previewUrls[index]}
                                onClick={() =>
                                  openMediaPopup(previewUrls[index], "image")
                                }
                              />
                            )}
                          </div>
                        </div>
                        <button
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          type="button"
                          onClick={() => {
                            setFiles((prev) =>
                              prev.filter((_, i) => i !== index),
                            );
                            setPreviewUrls((prev) =>
                              prev.filter((_, i) => i !== index),
                            );
                          }}
                        >
                          <HiX className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Message for the Future
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700"
                maxLength={500}
                placeholder="Write a message to your future self..."
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                disabled={uploading}
                type="button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className={`px-6 py-3 rounded-xl text-white font-medium ${
                  uploading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                } transition-colors flex items-center gap-2`}
                disabled={uploading}
                type="submit"
              >
                {uploading ? (
                  <>
                    <HiClock className="animate-spin" />
                    Sealing Capsule...
                  </>
                ) : (
                  <>
                    <HiCalendar />
                    Seal Time Capsule
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Media Popup */}
      {isPopupOpen && selectedMedia && mediaType && (
        <MediaPopup
          mediaType={mediaType}
          mediaUrl={selectedMedia}
          onClose={closeMediaPopup}
        />
      )}
    </div>
  );

  return typeof window !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};

export default MapImageUpload;
