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

import MediaPopup from "../ui/MediaPopup";

import MemoryInteractions from "./MemoryInteractions";

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

const Spinner = () => (
  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
);

const fmtCountdown = (d: Date): string => {
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);

  if (days <= 0) return "Unlocking now";
  if (days === 1) return "Unlocks tomorrow";
  if (days < 31) return `Unlocks in ${days} days`;
  const months = Math.round(days / 30);

  return `Unlocks in ~${months} month${months > 1 ? "s" : ""}`;
};

const MarkerModal: React.FC<MarkerModalProps> = ({
  isOpen,
  onClose,
  memory,
  onUnlock,
  user,
  isNearMarker,
}) => {
  const { updateMemory, deleteMemory } = useMemories();

  const [isEditing, setIsEditing] = useState(false);
  const [updatedTitle, setUpdatedTitle] = useState("");
  const [updatedNotes, setUpdatedNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);

  if (!isOpen || !memory) return null;

  const isCurrentUserMemory = memory.createdBy.uid === user?.uid;
  const isMemoryUnlocked = memory.isUnlocked || isCurrentUserMemory;
  const timeLocked = memory.unlockAt
    ? new Date(memory.unlockAt) > new Date()
    : false;

  const startEdit = () => {
    setUpdatedTitle(memory.title);
    setUpdatedNotes(memory.notes ?? "");
    setIsEditing(true);
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    if (!updatedTitle.trim()) {
      toast.error("Title can't be empty.");

      return;
    }

    setSaving(true);
    await updateMemory(memory.id, {
      title: updatedTitle.trim(),
      notes: updatedNotes.trim(),
      imageUrls: memory.imageUrls,
      videoUrls: memory.videoUrls,
    });
    setSaving(false);
    setIsEditing(false);
  };

  const handleDeleteMemory = async () => {
    if (!user) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this memory? This action cannot be undone.",
      )
    )
      return;

    setDeleting(true);
    try {
      await deleteMemory(memory.id, memory);
      onClose();
    } catch (error) {
      console.error("Failed to delete memory", error);
    } finally {
      setDeleting(false);
    }
  };

  const openMediaPopup = (url: string, type: "image" | "video") => {
    setSelectedMedia(url);
    setMediaType(type);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-strong thin-scroll text-ink rounded-3xl shadow-glass-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close"
          className="ctrl-btn h-9 w-9 absolute top-4 right-4"
          onClick={onClose}
        >
          <HiX className="w-5 h-5 text-ink" />
        </button>

        {isEditing ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <span className="text-sm font-semibold text-ink-muted">
                Title
              </span>
              <input
                className="w-full rounded-xl border border-line bg-surface-raised px-4 py-3 text-ink outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent disabled:opacity-60"
                disabled={saving}
                type="text"
                value={updatedTitle}
                onChange={(e) => setUpdatedTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-semibold text-ink-muted">
                Notes
              </span>
              <textarea
                className="w-full rounded-xl border border-line bg-surface-raised px-4 py-3 text-ink outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent disabled:opacity-60"
                disabled={saving}
                rows={3}
                value={updatedNotes}
                onChange={(e) => setUpdatedNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-between gap-3 font-medium">
              <button
                className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-ink-muted transition-colors hover:bg-white/15 disabled:opacity-50"
                disabled={saving}
                onClick={() => setIsEditing(false)}
              >
                <HiXCircle className="inline w-5 h-5" /> Cancel
              </button>
              <button
                className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-black transition-colors hover:bg-accent-soft disabled:opacity-60"
                disabled={saving}
                onClick={handleSaveChanges}
              >
                {saving ? (
                  <>
                    <Spinner /> Saving...
                  </>
                ) : (
                  <>
                    <HiCheck className="inline w-5 h-5" /> Save
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="pr-10 text-lg font-bold">{memory.title}</h3>
            {!timeLocked && memory.notes && (
              <p className="text-sm text-ink-muted">{memory.notes}</p>
            )}

            {timeLocked ? (
              <div className="flex w-full flex-col items-center gap-1 rounded-xl border border-accent/30 bg-accent/10 p-4 text-center">
                <FaLock className="text-accent" />
                <p className="font-semibold text-ink">
                  Sealed until{" "}
                  {memory.unlockAt
                    ? new Date(memory.unlockAt).toLocaleDateString()
                    : ""}
                </p>
                <p className="text-sm text-ink-muted">
                  {memory.unlockAt
                    ? fmtCountdown(new Date(memory.unlockAt))
                    : ""}
                </p>
              </div>
            ) : !isMemoryUnlocked ? (
              !isNearMarker ? (
                <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/15 p-3 text-center text-red-400">
                  <FaLock />
                  <p>Move closer to unlock this memory.</p>
                </div>
              ) : (
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent p-3 text-center font-semibold text-black transition-colors hover:bg-accent-soft"
                  onClick={onUnlock}
                >
                  <HiLockOpen className="inline w-5 h-5" />
                  <span>Unlock Memory</span>
                </button>
              )
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

            {isMemoryUnlocked && !timeLocked && (
              <MemoryInteractions
                memoryId={memory.id}
                ownerId={memory.createdBy.uid}
              />
            )}

            {isCurrentUserMemory && (
              <div className="flex justify-between gap-3 pt-2 font-medium">
                {!timeLocked && (
                  <button
                    className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-ink transition-colors hover:bg-white/15"
                    onClick={startEdit}
                  >
                    <HiPencil className="inline w-5 h-5" /> Edit
                  </button>
                )}
                <button
                  className="flex items-center gap-1.5 rounded-xl border border-red-500/40 px-4 py-2.5 text-red-400 transition-colors hover:bg-red-500/15 disabled:opacity-50"
                  disabled={deleting}
                  onClick={handleDeleteMemory}
                >
                  {deleting ? (
                    <>
                      <Spinner /> Deleting...
                    </>
                  ) : (
                    <>
                      <HiTrash className="inline w-5 h-5" /> Delete
                    </>
                  )}
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
