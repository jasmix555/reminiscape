import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  HiClock,
  HiCalendar,
  HiLocationMarker,
  HiX,
  HiPhotograph,
  HiPlay,
} from "react-icons/hi";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { createPortal } from "react-dom";
import { User } from "firebase/auth";

import MediaPopup from "./MediaPopup";

import { useAuth } from "@/hooks";
import { Memory, UserProfile } from "@/types";

// Constants
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

interface MemoryUploadProps {
  user: User | null; // Add this line
  profile: UserProfile | null;
  isOpen: boolean;
  location: { latitude: number; longitude: number };
  onUpload: (
    memoryData: Omit<Memory, "id" | "createdBy" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  onClose: () => void;
}

// Helper Functions
const getFileType = (file: File): string => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };

  if (extension === "mov") return "video/quicktime";
  if (extension === "mp4") return "video/mp4";

  return mimeTypes[extension || ""] || file.type || "application/octet-stream";
};

const isVideoFile = (file: File): boolean => {
  const extension = file.name.split(".").pop()?.toLowerCase();

  return (
    ["mov", "mp4", "avi"].includes(extension || "") ||
    file.type.startsWith("video/")
  );
};

const MemoryUpload: React.FC<MemoryUploadProps> = ({
  location,
  onUpload,
  onClose,
}) => {
  const { user, profile } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [fileTypes, setFileTypes] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [voiceMessage, setVoiceMessage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log(
      "Accepted files:",
      acceptedFiles.map((f) => ({
        name: f.name,
        type: f.type,
        size: f.size,
      })),
    );

    const validFiles = acceptedFiles.filter((file) => {
      const isVideo = isVideoFile(file);
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

      if (file.size > maxSize) {
        toast.error(
          `File ${file.name} is too large (max ${isVideo ? "50MB" : "5MB"})`,
        );

        return false;
      }

      if (!isVideo && !file.type.startsWith("image/")) {
        toast.error(`File type not supported: ${file.name}`);

        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    validFiles.forEach((file) => {
      const fileType = getFileType(file);
      const url = URL.createObjectURL(file);

      setFiles((prev) => [...prev, file]);
      setFileTypes((prev) => [...prev, fileType]);
      setPreviewUrls((prev) => [...prev, url]);

      console.log("Added file:", {
        name: file.name,
        type: fileType,
        url: url,
      });
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "video/quicktime": [".mov"],
      "video/mp4": [".mp4"],
      "video/*": [".mov", ".mp4", ".avi"],
    },
    maxFiles: 5,
    maxSize: MAX_VIDEO_SIZE,
    onDropRejected: (fileRejections) => {
      fileRejections.forEach(({ file, errors }) => {
        console.log("Rejected file:", file.name, file.type, errors);
        const errorMessages = errors.map((e) => {
          switch (e.code) {
            case "file-too-large":
              return `File ${file.name} is too large`;
            case "file-invalid-type":
              return `File type not supported: ${file.name}`;
            default:
              return e.message;
          }
        });

        toast.error(errorMessages.join(", "));
      });
    },
  });

  const handleVideoError = (
    e: React.SyntheticEvent<HTMLVideoElement, Event>,
    index: number,
  ) => {
    const videoElement = e.target as HTMLVideoElement;
    const error = videoElement.error;
    const file = files[index];

    console.error("Video error:", {
      file: file.name,
      type: file.type,
      error: error?.code,
      message: error?.message,
    });

    let errorMessage = "Error loading video preview. ";

    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage += "The video playback was aborted.";
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage += "A network error occurred while loading the video.";
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage += "The video format is not supported by your browser.";
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage += "The video format or MIME type is not supported.";
          break;
        default:
          errorMessage += "An unknown error occurred.";
      }
    } else {
      errorMessage += "Please try a different video format (e.g., MP4).";
    }

    toast.error(errorMessage);
  };

  const uploadFilesToFirebase = async (): Promise<{
    imageUrls: string[];
    videoUrls: string[];
  }> => {
    const storage = getStorage();
    const uploadedImageUrls: string[] = [];
    const uploadedVideoUrls: string[] = [];

    for (const file of files) {
      try {
        const isVideo = isVideoFile(file);
        const folder = isVideo ? "videos" : "images";
        const storageRef = ref(
          storage,
          `memories/${folder}/${uuidv4()}-${file.name}`,
        );

        const metadata = {
          contentType: getFileType(file),
          customMetadata: {
            originalName: file.name,
            fileSize: file.size.toString(),
          },
        };

        const snapshot = await uploadBytes(storageRef, file, metadata);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        if (isVideo) {
          uploadedVideoUrls.push(downloadUrl);
        } else {
          uploadedImageUrls.push(downloadUrl);
        }
      } catch (error) {
        console.error("Error uploading file:", file.name, error);
        toast.error(`Error uploading ${file.name}`);
        throw error;
      }
    }

    return { imageUrls: uploadedImageUrls, videoUrls: uploadedVideoUrls };
  };

  const handleVoiceMessageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("Please upload an audio file");

      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Voice message must be less than 5MB");

      return;
    }

    setVoiceMessage(file);
    toast.success("Voice message added successfully");
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
          `memories/voice/${uuidv4()}-${voiceMessage.name}`,
        );

        const metadata = {
          contentType: voiceMessage.type,
          customMetadata: {
            originalName: voiceMessage.name,
            fileSize: voiceMessage.size.toString(),
          },
        };

        await uploadBytes(voiceRef, voiceMessage, metadata);
        voiceMessageUrl = await getDownloadURL(voiceRef);
      }

      await onUpload({
        title: title.trim(),
        description: "",
        location,
        imageUrls,
        videoUrls,
        voiceMessageUrl,
        notes: notes.trim(),
        isUnlocked: false,
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
                  {location
                    ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                    : "Location not available"}
                </p>
              </div>
            </div>

            {/* Upload Section */}
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
                    Drop your memories here
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Images (max 5MB) or Videos (max 50MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Preview Grid */}
            {previewUrls.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Preview Contents
                </label>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="relative w-full pb-[100%]">
                          <div className="absolute inset-0">
                            {isVideoFile(files[index]) ? (
                              <div className="relative w-full h-full">
                                <video
                                  controls
                                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                                  onClick={() => openMediaPopup(url, "video")}
                                  onError={(e) => handleVideoError(e, index)}
                                >
                                  <source
                                    src={url}
                                    type={getFileType(files[index])}
                                  />
                                  Your browser does not support the video tag.
                                </video>
                                <div
                                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg group-hover:bg-opacity-20 transition-all"
                                  style={{ pointerEvents: "none" }}
                                >
                                  <HiPlay className="w-12 h-12 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            ) : (
                              <Image
                                fill
                                alt={`Preview ${index + 1}`}
                                className="object-cover rounded-lg transform transition-transform group-hover:scale-102 cursor-pointer"
                                src={url}
                                onClick={() => openMediaPopup(url, "image")}
                              />
                            )}
                          </div>
                        </div>
                        <button
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                          type="button"
                          onClick={() => {
                            setFiles((prev) =>
                              prev.filter((_, i) => i !== index),
                            );
                            setPreviewUrls((prev) =>
                              prev.filter((_, i) => i !== index),
                            );
                            setFileTypes((prev) =>
                              prev.filter((_, i) => i !== index),
                            );
                            URL.revokeObjectURL(url);
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

            {/* Voice Message Upload */}
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
            <div className="flex justify-between gap-3 pt-4">
              <button
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
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

export default MemoryUpload;
