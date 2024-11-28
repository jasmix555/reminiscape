// src/components/MapImageUpload.tsx
"use client";

import React, { useState } from "react";
import { storage } from "@/libs/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid"; // Install with: npm install uuid @types/uuid

interface MapImageUploadProps {
  onUpload: (urls: string[], notes: string, title: string) => void;
  onClose: () => void;
}

const MapImageUpload: React.FC<MapImageUploadProps> = ({
  onUpload,
  onClose,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);

      // Clean up previous preview URLs
      previewUrls.forEach((url) => URL.revokeObjectURL(url));

      const urls = selectedFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please select at least one image or video to upload.");
      return;
    }

    try {
      setUploading(true);
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const fileId = uuidv4();
        const fileExtension = file.name.split(".").pop();
        const fileName = `${fileId}.${fileExtension}`;
        const storageRef = ref(storage, `uploads/${fileName}`);

        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploadedUrls.push(url);
      }

      onUpload(uploadedUrls, notes, title);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New Memory</h2>

        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-gray-300 rounded-md p-2 w-full mb-4"
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Images
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-24 h-24 object-cover rounded-lg"
              />
            </div>
          ))}
        </div>

        <textarea
          placeholder="Add notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border border-gray-300 rounded-md p-2 w-full mb-4"
          rows={3}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`px-4 py-2 rounded-md text-white 
                     ${uploading ? "bg-blue-400" : "bg-blue-500 hover:bg-blue-600"} 
                     transition flex items-center`}
          >
            {uploading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading...
              </>
            ) : (
              "Create Memory"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapImageUpload;
