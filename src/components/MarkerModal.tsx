// MarkerModal.tsx
import React from "react";
import { HiX } from "react-icons/hi";
import Image from "next/image";

interface MarkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: {
    title: string;
    notes: string;
    imageUrls: string[];
    videoUrls: string[];
    voiceMessageUrl?: string;
    createdBy: {
      username?: string;
    };
  } | null;
}

const MarkerModal: React.FC<MarkerModalProps> = ({
  isOpen,
  onClose,
  memory,
}) => {
  if (!isOpen || !memory) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-1 hover:bg-gray-100 transition-colors"
          onClick={onClose}
        >
          <HiX className="w-6 h-6 text-gray-600" />
        </button>

        {/* Content */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg">{memory.title}</h3>
          <p className="text-sm text-gray-600">{memory.notes}</p>

          <div className="space-y-4">
            {memory.imageUrls.map((url, index) => (
              <div
                key={`image-${index}`}
                className="relative w-full aspect-video"
              >
                <Image
                  fill
                  alt={`Memory ${index + 1}`}
                  className="rounded-lg object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  src={url}
                />
              </div>
            ))}

            {memory.videoUrls.map((url, index) => (
              <div
                key={`video-${index}`}
                className="relative w-full aspect-video"
              >
                <video
                  controls
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                >
                  <source src={url} type="video/mp4" />
                  <source src={url} type="video/quicktime" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ))}
          </div>

          {memory.voiceMessageUrl && (
            <div className="w-full">
              <audio controls className="w-full">
                <source src={memory.voiceMessageUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p>Created by {memory.createdBy.username || "Unknown"}</p>
            <p>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkerModal;
