import React from "react";
import { HiX } from "react-icons/hi";

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
      username?: string; // Make username optional
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
    <div className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50'>
      <div className='bg-white rounded-lg shadow-lg p-6 max-w-lg w-full transform transition-transform duration-300 scale-100'>
        <button onClick={onClose} className='absolute top-2 right-2'>
          <HiX className='w-6 h-6 text-gray-600' />
        </button>
        <h3 className='font-bold text-lg mb-2'>{memory.title}</h3>
        <p className='text-sm text-gray-600 mb-2'>{memory.notes}</p>
        <div className='memory-images mb-2 space-y-2'>
          {memory.imageUrls.map((url, index) => (
            <img
              key={index}
              alt={`Memory ${index + 1}`}
              className='w-full h-ful object-cover rounded-lg'
              src={url}
            />
          ))}
          {memory.videoUrls.map((url, index) => (
            <video
              key={index}
              controls
              className='w-full h-full object-cover rounded-lg'
            >
              <source src={url} type='video/mp4' />
              Your browser does not support the video tag.
            </video>
          ))}
        </div>
        {memory.voiceMessageUrl && (
          <audio controls className='mt-2'>
            <source src={memory.voiceMessageUrl} type='audio/mpeg' />
            Your browser does not support the audio element.
          </audio>
        )}
        <p className='text-xs text-gray-500 mt-2'>
          Created by {memory.createdBy.username || "Unknown"}
        </p>
        <p className='text-xs text-gray-500'>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  );
};

export default MarkerModal;
