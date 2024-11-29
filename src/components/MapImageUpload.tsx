// components/MapImageUpload.tsx
import React, { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Memory } from "@/types";
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

interface MapImageUploadProps {
  location: { latitude: number; longitude: number };
  onUpload: (
    memoryData: Omit<Memory, "id" | "createdBy" | "createdAt" | "updatedAt">
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
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const validFiles = acceptedFiles.filter((file) => file.size <= MAX_SIZE);
    if (validFiles.length !== acceptedFiles.length) {
      toast.error("Some files were too large. Maximum size is 5MB per image.");
    }
    setFiles((prevFiles) => [...prevFiles, ...validFiles]);
    const newUrls = validFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prevUrls) => [...prevUrls, ...newUrls]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024,
  });

  const uploadImagesToFirebase = async (): Promise<string[]> => {
    const storage = getStorage();
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const storageRef = ref(storage, `memories/${uuidv4()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      uploadedUrls.push(downloadUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      toast.error("You must be logged in to create memories");
      return;
    }

    if (!files.length) {
      toast.error("Please add at least one image");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      setUploading(true);
      const imageUrls = await uploadImagesToFirebase();

      await onUpload({
        title: title.trim(),
        description: "",
        location,
        imageUrls,
        videoUrls: [],
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

  const modalContent = (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm memory-modal'
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto'>
        <div className='p-6 space-y-6'>
          {/* Header */}
          <div className='flex justify-between items-center'>
            <div>
              <h2 className='text-2xl font-bold text-gray-800'>
                Create Time Capsule
              </h2>
              <p className='text-sm text-gray-500 mt-1'>
                Preserve this moment in time
              </p>
            </div>
            <button
              onClick={onClose}
              className='text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-full'
            >
              <HiX className='w-6 h-6' />
            </button>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Title Input */}
            <div className='space-y-2'>
              <label className='block text-sm font-semibold text-gray-700'>
                Capsule Title
              </label>
              <input
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Name your time capsule...'
                className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700'
                required
                maxLength={100}
              />
            </div>

            {/* Location Display */}
            <div className='bg-gray-50 rounded-xl p-4 flex items-center space-x-3'>
              <HiLocationMarker className='w-5 h-5 text-blue-500' />
              <div>
                <p className='text-sm font-medium text-gray-700'>Location</p>
                <p className='text-xs text-gray-500'>
                  {`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                </p>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className='space-y-2'>
              <label className='block text-sm font-semibold text-gray-700'>
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
                <div className='text-center'>
                  <HiPhotograph className='mx-auto h-12 w-12 text-gray-400' />
                  <p className='mt-2 text-sm text-gray-600'>
                    Drop your memories here
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>
                    Up to 5 images (max 5MB each)
                  </p>
                </div>
              </div>
            </div>

            {/* Image Preview Grid */}
            {previewUrls.length > 0 && (
              <div className='space-y-2'>
                <label className='block text-sm font-semibold text-gray-700'>
                  Preview Contents
                </label>
                <div className='bg-gray-50 rounded-xl p-4'>
                  <div className='grid grid-cols-2 gap-3'>
                    {previewUrls.map((url, index) => (
                      <div key={index} className='relative group'>
                        <div className='relative w-full pb-[100%]'>
                          <div className='absolute inset-0'>
                            <Image
                              src={url}
                              alt={`Preview ${index + 1}`}
                              fill
                              className='object-cover rounded-lg transform transition-transform group-hover:scale-102'
                            />
                          </div>
                        </div>
                        <button
                          type='button'
                          onClick={() => {
                            setFiles((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                            setPreviewUrls((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                          className='absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg'
                        >
                          <HiX className='w-4 h-4' />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div className='space-y-2'>
              <label className='block text-sm font-semibold text-gray-700'>
                Message for the Future
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Write a message to your future self...'
                className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700'
                rows={4}
                maxLength={500}
              />
            </div>

            {/* Action Buttons */}
            <div className='flex justify-end gap-3 pt-4'>
              <button
                type='button'
                onClick={onClose}
                className='px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium'
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={uploading}
                className={`px-6 py-3 rounded-xl text-white font-medium ${
                  uploading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                } transition-colors flex items-center gap-2 shadow-lg`}
              >
                {uploading ? (
                  <>
                    <HiClock className='animate-spin' />
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
    </div>
  );

  return typeof window !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};

export default MapImageUpload;
