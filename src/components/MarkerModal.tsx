import React, { useState, useEffect } from "react";
import { HiX, HiPencil, HiCheck, HiXCircle, HiLockOpen } from "react-icons/hi";
import { FaLock } from "react-icons/fa6";
import Image from "next/image";
import toast from "react-hot-toast";

import { useMemories } from "@/hooks/useMemories";

interface MarkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: {
    id: string;
    title: string;
    notes: string;
    imageUrls: string[];
    videoUrls: string[];
    voiceMessageUrl?: string;
    createdBy: {
      username?: string;
      uid: string;
    };
    isUnlocked: boolean;
  } | null;
  onUnlock?: () => void;
  user?: { uid: string };
  isNearMarker: boolean;
}

const MarkerModal: React.FC<MarkerModalProps> = ({
  isOpen,
  onClose,
  memory,
  onUnlock,
  user,
  isNearMarker,
}) => {
  const { updateMemory, refreshMemories } = useMemories();

  const [isEditing, setIsEditing] = useState(false);
  const [updatedTitle, setUpdatedTitle] = useState("");
  const [updatedNotes, setUpdatedNotes] = useState("");

  useEffect(() => {
    if (memory) {
      setUpdatedTitle(memory.title);
      setUpdatedNotes(memory.notes);
    }
  }, [memory]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
    }
  }, [isOpen]);

  if (!isOpen || !memory) return null;

  const isCurrentUserMemory = memory.createdBy.uid === user?.uid;
  const isMemoryUnlocked = memory.isUnlocked || isCurrentUserMemory;

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    if (!memory || !user) return;

    try {
      await updateMemory(memory.id, {
        title: updatedTitle,
        notes: updatedNotes,
        imageUrls: memory.imageUrls,
        videoUrls: memory.videoUrls,
      });

      toast.success("Memory updated successfully!");
      setIsEditing(false);
      refreshMemories();
    } catch (error) {
      console.error("Failed to update memory", error);
      toast.error("Failed to update memory.");
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-1 hover:bg-gray-100 transition-colors"
          onClick={onClose}
        >
          <HiX className="w-6 h-6 text-gray-600" />
        </button>

        {isEditing ? (
          <div className="space-y-4">
            <input
              className="w-full border p-2 rounded"
              type="text"
              value={updatedTitle}
              onChange={(e) => setUpdatedTitle(e.target.value)}
            />
            <textarea
              className="w-full border p-2 rounded"
              rows={3}
              value={updatedNotes}
              onChange={(e) => setUpdatedNotes(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                onClick={handleEditToggle}
              >
                <HiXCircle className="inline w-5 h-5" /> Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                onClick={handleSaveChanges}
              >
                <HiCheck className="inline w-5 h-5" /> Save
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="font-bold text-lg">{memory.title}</h3>
            <p className="text-sm text-gray-600">{memory.notes}</p>

            {!isMemoryUnlocked ? (
              <>
                <div className="text-white bg-red-500 p-2 rounded-lg text-center flex items-center gap-2 justify-center">
                  <FaLock />
                  <p>
                    {isNearMarker
                      ? "This memory is locked. Click to unlock!"
                      : "Move closer to unlock this memory."}
                  </p>
                </div>
                {isNearMarker && (
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    onClick={onUnlock}
                  >
                    <HiLockOpen className="inline w-5 h-5" /> Unlock Memory
                  </button>
                )}
              </>
            ) : (
              <>
                {memory.imageUrls.length > 0 && (
                  <div className="space-y-4">
                    {memory.imageUrls.map((url, index) => (
                      <div key={index} className="relative w-full aspect-video">
                        <Image
                          fill
                          alt={`Memory ${index + 1}`}
                          className="rounded-lg object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          src={url}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {memory.videoUrls.length > 0 && (
                  <div className="space-y-4">
                    {memory.videoUrls.map((url, index) => (
                      <video key={index} controls className="w-full rounded-lg">
                        <source src={url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ))}
                  </div>
                )}
              </>
            )}

            {isCurrentUserMemory && (
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mt-2"
                onClick={handleEditToggle}
              >
                <HiPencil className="inline w-5 h-5" /> Edit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkerModal;
