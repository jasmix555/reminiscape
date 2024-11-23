// src/components/MapImageUpload.tsx
import React, { useState } from "react";
import { storage } from "@/libs/firebaseConfig"; // Ensure you have Firebase storage initialized
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const MapImageUpload: React.FC<{
  onUpload: (urls: string[], notes: string) => void;
  onClose: () => void;
}> = ({ onUpload, onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

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
    onUpload(uploadedUrls, notes);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 0 10px rgba(0,0,0,0.5)",
      }}
    >
      <h2>Upload Image/Video</h2>
      <input type='file' multiple onChange={handleFileChange} />
      <div>
        {previewUrls.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`Preview ${index}`}
            style={{ width: "100px", height: "100px", margin: "5px" }}
          />
        ))}
      </div>
      <textarea
        placeholder='Add notes here...'
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ width: "100%", height: "60px", marginBottom: "10px" }}
      />
      <button onClick={handleUpload}>Upload</button>
      <button onClick={onClose} style={{ marginLeft: "10px" }}>
        Cancel
      </button>
    </div>
  );
};

export default MapImageUpload;
