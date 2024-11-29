// components/MediaPopup.tsx
import React from "react";

interface MediaPopupProps {
  mediaUrl: string;
  mediaType: "image" | "video";
  onClose: () => void;
}

const MediaPopup: React.FC<MediaPopupProps> = ({
  mediaUrl,
  mediaType,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000]">
      <div className="relative max-w-3xl max-h-full">
        <button
          className="absolute top-4 right-4 text-white text-2xl"
          onClick={onClose}
        >
          &times;
        </button>
        {mediaType === "video" ? (
          <video controls className="w-full h-auto rounded-lg">
            <source src={mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            alt="Preview"
            className="w-full h-auto rounded-lg"
            src={mediaUrl}
          />
        )}
      </div>
    </div>
  );
};

export default MediaPopup;
