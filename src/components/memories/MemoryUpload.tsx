import React from "react";
import {
  HiClock,
  HiCalendar,
  HiLocationMarker,
  HiX,
  HiPhotograph,
  HiMicrophone,
  HiLockClosed,
} from "react-icons/hi";
import { createPortal } from "react-dom";

import MemoryFilePreview from "./MemoryFilePreview";
import { useMemoryUpload } from "./useMemoryUpload";

import { Memory } from "@/types";

interface MemoryUploadProps {
  location: { latitude: number; longitude: number };
  onUpload: (
    memoryData: Omit<Memory, "id" | "createdBy" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  onClose: () => void;
}

const MemoryUpload: React.FC<MemoryUploadProps> = ({
  location,
  onUpload,
  onClose,
}) => {
  const {
    files,
    previewUrls,
    title,
    setTitle,
    notes,
    setNotes,
    voiceMessage,
    setVoiceMessage,
    uploading,
    uploadProgress,
    unlockAt,
    setUnlockAt,
    dropzone,
    removeFile,
    handleVoiceChange,
    handleSubmit,
  } = useMemoryUpload(location, onUpload, onClose);

  const today = new Date().toISOString().split("T")[0];
  const { getRootProps, getInputProps, isDragActive } = dropzone;

  const modalContent = (
    <div
      className="memory-modal fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) onClose();
      }}
    >
      <div className="glass-strong thin-scroll animate-sheet-up max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl text-ink shadow-glass-lg sm:rounded-3xl">
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1.5 w-10 rounded-full bg-white/20" />
        </div>

        <div className="space-y-6 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-ink">
                Create Time Capsule
              </h2>
              <p className="mt-1 text-sm text-ink-faint">
                Preserve this moment in time
              </p>
            </div>
            <button
              className="ctrl-btn h-9 w-9"
              disabled={uploading}
              type="button"
              onClick={onClose}
            >
              <HiX className="h-5 w-5 text-ink" />
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink-muted">
                Capsule Title
              </label>
              <input
                required
                className="w-full rounded-xl border border-line bg-surface-raised px-4 py-3 text-ink placeholder-ink-faint outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent"
                maxLength={100}
                placeholder="Name your time capsule..."
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-3 rounded-xl border border-line bg-surface-raised p-4">
              <HiLocationMarker className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-ink">Location</p>
                <p className="text-xs text-ink-faint">
                  {`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink-muted">
                Capsule Contents
              </label>
              <div
                {...getRootProps()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 transition-all ${
                  isDragActive
                    ? "border-accent bg-accent/10"
                    : "border-white/15 hover:border-white/30 hover:bg-white/5"
                }`}
              >
                <input {...getInputProps()} />
                <div className="text-center">
                  <HiPhotograph className="mx-auto h-12 w-12 text-ink-faint" />
                  <p className="mt-2 text-sm text-ink-muted">
                    Drop your memories here, or tap to browse
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    Images (max 5MB) or videos (max 50MB)
                  </p>
                </div>
              </div>
            </div>

            <MemoryFilePreview
              files={files}
              previewUrls={previewUrls}
              onRemove={removeFile}
            />

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-ink-muted">
                <HiMicrophone className="h-4 w-4" />
                Voice Message
                <span className="font-normal text-ink-faint">(optional)</span>
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line bg-surface-raised px-4 py-3 text-sm transition-colors hover:bg-surface-hover">
                <span className={voiceMessage ? "text-ink" : "text-ink-faint"}>
                  {voiceMessage ? voiceMessage.name : "Add a voice note..."}
                </span>
                {voiceMessage && (
                  <button
                    className="text-ink-faint hover:text-red-400"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setVoiceMessage(null);
                    }}
                  >
                    <HiX className="h-4 w-4" />
                  </button>
                )}
                <input
                  accept="audio/*"
                  className="hidden"
                  type="file"
                  onChange={handleVoiceChange}
                />
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink-muted">
                Message for the Future
              </label>
              <textarea
                className="w-full rounded-xl border border-line bg-surface-raised px-4 py-3 text-ink placeholder-ink-faint outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent"
                maxLength={500}
                placeholder="Write a message to your future self..."
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-ink-muted">
                <HiLockClosed className="h-4 w-4" />
                Lock until
                <span className="font-normal text-ink-faint">(optional)</span>
              </label>
              <input
                className="w-full rounded-xl border border-line bg-surface-raised px-4 py-3 text-ink outline-none transition-all [color-scheme:dark] focus:border-transparent focus:ring-2 focus:ring-accent"
                min={today}
                type="date"
                value={unlockAt}
                onChange={(e) => setUnlockAt(e.target.value)}
              />
              {unlockAt && (
                <p className="text-xs text-ink-faint">
                  Sealed until {unlockAt} — not even you can open it early.
                </p>
              )}
            </div>

            {uploading && uploadProgress > 0 && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <div className="flex justify-between gap-3 pt-2">
              <button
                className="rounded-xl bg-white/10 px-6 py-3 font-medium text-ink-muted transition-colors hover:bg-white/15 disabled:opacity-50"
                disabled={uploading}
                type="button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-black transition-colors ${
                  uploading
                    ? "cursor-not-allowed bg-accent/60"
                    : "bg-accent hover:bg-accent-soft"
                }`}
                disabled={uploading}
                type="submit"
              >
                {uploading ? (
                  <>
                    <HiClock className="animate-spin" />
                    {uploadProgress > 0 && uploadProgress < 100
                      ? `Sealing... ${uploadProgress}%`
                      : "Sealing..."}
                  </>
                ) : (
                  <>
                    <HiCalendar />
                    Seal Time Capsule
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return typeof window !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};

export default MemoryUpload;
