// src/components/ImageUpload.tsx

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";

interface ImageUploadProps {
  currentImage?: string | null;
  onImageSelect: (file: File) => Promise<void>;
  loading?: boolean;
}

export const ProfileImageUpload = ({
  currentImage,
  onImageSelect,
  loading = false,
}: ImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImage || null,
  );

  useEffect(() => {
    setPreviewUrl(currentImage ?? null);
  }, [currentImage]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];

      if (file) {
        setPreviewUrl(URL.createObjectURL(file));
        await onImageSelect(file);
      }
    },
    [onImageSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    multiple: false,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`relative mx-auto h-32 w-32 cursor-pointer rounded-full border-2 border-dashed ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
      >
        <input {...getInputProps()} />
        {previewUrl ? (
          <div className="relative h-full w-full overflow-hidden rounded-full">
            <Image
              fill
              alt="Profile preview"
              className="object-cover"
              src={previewUrl}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 transition-opacity hover:opacity-100">
              <span className="text-sm text-white">Change Photo</span>
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl text-gray-400">👤</span>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>
      <p className="text-center text-sm text-gray-500">
        {isDragActive
          ? "Drop the image here"
          : "Click or drag to upload profile picture"}
      </p>
    </div>
  );
};
