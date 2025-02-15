import React, { useState } from "react";
import {
  HiX,
  HiPencil,
  HiCheck,
  HiXCircle,
  HiLockOpen,
  HiTrash,
} from "react-icons/hi";
import { FaLock } from "react-icons/fa6";
import Image from "next/image";
import toast from "react-hot-toast";

import MediaPopup from "./MediaPopup"; // Import MediaPopup

import { useMemories } from "@/hooks/useMemories";
import { Memory } from "@/types";

interface MarkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: Memory | null;
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
  const { updateMemory, deleteMemory, refreshMemories } = useMemories();

  const [isEditing, setIsEditing] = useState(false);
  const [updatedTitle, setUpdatedTitle] = useState("");
  const [updatedNotes, setUpdatedNotes] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);

  if (!isOpen || !memory) return null;

  const isCurrentUserMemory = memory.createdBy.uid === user?.uid;
  const isMemoryUnlocked = memory.isUnlocked || isCurrentUserMemory;

  const handleEditToggle = () => setIsEditing(!isEditing);

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

  const handleDeleteMemory = async () => {
    if (!memory || !user) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this memory? This action cannot be undone.",
    );

    if (!confirmDelete) return;

    try {
      await deleteMemory(memory.id, memory);
      toast.success("Memory deleted successfully!");

      refreshMemories();
      onClose();
    } catch (error) {
      console.error("Failed to delete memory", error);
      toast.error("Failed to delete memory.");
    }
  };

  const openMediaPopup = (url: string, type: "image" | "video") => {
    setSelectedMedia(url);
    setMediaType(type);
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
          className="bg-slate-100 border rounded-full p-2 hover:bg-slate-200 transition-colors absolute top-4 right-4"
          onClick={onClose}
        >
          <HiX className="w-6 h-6 text-black" />
        </button>

        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="font-bold text-lg">Title</span>
              <input
                className="w-full border p-2 rounded"
                type="text"
                value={updatedTitle}
                onChange={(e) => setUpdatedTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <span className="font-bold text-lg">Notes</span>
              <textarea
                className="w-full border p-2 rounded"
                rows={3}
                value={updatedNotes}
                onChange={(e) => setUpdatedNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-between font-bold">
              <button
                className="px-4 py-2 bg-gray-300 text-white rounded-lg hover:bg-gray-400 transition-colors"
                onClick={handleEditToggle}
              >
                <HiXCircle className="inline w-5 h-5" /> Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-green-600 transition-colors"
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
                {memory.imageUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative w-full aspect-video cursor-pointer"
                    onClick={() => openMediaPopup(url, "image")}
                  >
                    <Image
                      fill
                      alt={`Memory ${index + 1}`}
                      className="rounded-lg object-cover"
                      sizes="100vw"
                      src={url}
                    />
                  </div>
                ))}
                {memory.videoUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative w-full aspect-video cursor-pointer"
                    onClick={() => openMediaPopup(url, "video")}
                  >
                    <video className="w-full h-full rounded-lg object-cover">
                      <source src={url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ))}
              </>
            )}

            {isCurrentUserMemory && (
              <div className="flex justify-between mt-4">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  onClick={handleEditToggle}
                >
                  <HiPencil className="inline w-5 h-5" /> Edit
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  onClick={handleDeleteMemory}
                >
                  <HiTrash className="inline w-5 h-5" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedMedia && mediaType && (
        <MediaPopup
          mediaType={mediaType}
          mediaUrl={selectedMedia}
          onClose={() => {
            setSelectedMedia(null);
            setMediaType(null);
          }}
        />
      )}
    </div>
  );
};

export default MarkerModal;
