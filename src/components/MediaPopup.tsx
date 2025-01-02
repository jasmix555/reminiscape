// MediaPopup.tsx
import React from "react";
import { HiX } from "react-icons/hi";

interface MediaPopupProps {
  mediaType: "image" | "video";
  mediaUrl: string;
  onClose: () => void;
}

const MediaPopup: React.FC<MediaPopupProps> = ({
  mediaType,
  mediaUrl,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[1001]">
      <button
        className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
        onClick={onClose}
      >
        <HiX className="w-6 h-6" />
      </button>

      <div className="max-w-[90vw] max-h-[90vh]">
        {mediaType === "image" ? (
          <img
            alt="Full size preview"
            className="max-w-full max-h-[90vh] object-contain"
            src={mediaUrl}
          />
        ) : (
          <video
            autoPlay
            controls
            playsInline
            className="max-w-full max-h-[90vh]"
          >
            <source src={mediaUrl} type="video/mp4" />
            <source src={mediaUrl} type="video/quicktime" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    </div>
  );
};

export default MediaPopup;
