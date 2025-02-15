import React, { useEffect, useCallback } from "react";
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
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1001] p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white p-3 bg-black/40 border-2 border-white rounded-full hover:bg-black/60 transition-all shadow-lg hover:shadow-xl hover:border-gray-300 focus:outline-none
          hover:text-gray-300 hover:bg-gray-800
        "
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <HiX className="w-6 h-6" />
      </button>

      <div
        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {mediaType === "image" ? (
          <img
            alt="Full size preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-lg"
            src={mediaUrl}
          />
        ) : (
          <video
            autoPlay
            controls
            playsInline
            className="max-w-full max-h-[90vh] rounded-lg shadow-lg"
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
