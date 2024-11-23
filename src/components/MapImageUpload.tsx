// src/components/MapImageUpload.tsx
import React, { useState } from "react";
import { storage } from "@/libs/firebaseConfig"; // Ensure you have Firebase storage initialized
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const MapImageUpload: React.FC<{
  onUpload: (urls: string[], notes: string, title: string) => void;
  onClose: () => void;
}> = ({ onUpload, onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState(""); // New state for title

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      const urls = selectedFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please select at least one image or video to upload.");
      return; // Prevent upload if no files are selected
    }

    const uploadedUrls: string[] = [];
    for (const file of files) {
      const storageRef = ref(storage, `uploads/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      uploadedUrls.push(url);
    }
    onUpload(uploadedUrls, notes, title); // Pass title to onUpload
  };

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50'>
      <div className='bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md'>
        <h2 className='text-xl font-semibold mb-4'>Upload Image/Video</h2>
        <input
          type='text'
          placeholder='Title'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className='border border-gray-300 rounded-md p-2 w-full mb-4'
        />
        <input
          type='file'
          multiple
          onChange={handleFileChange}
          className='mb-4'
        />
        <div className='flex flex-wrap mb-4'>
          {previewUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Preview ${index}`}
              className='w-24 h-24 object-cover m-1 border rounded-md'
            />
          ))}
        </div>
        <textarea
          placeholder='Add notes here...'
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className='border border-gray-300 rounded-md p-2 w-full mb-4'
          rows={3}
        />
        <div className='flex justify-end'>
          <button
            onClick={handleUpload}
            className='bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition'
          >
            Upload
          </button>
          <button
            onClick={onClose}
            className='ml-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapImageUpload;
