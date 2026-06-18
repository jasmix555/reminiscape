import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  HiClock,
  HiCalendar,
  HiLocationMarker,
  HiX,
  HiPhotograph,
  HiPlay,
  HiMicrophone,
} from "react-icons/hi";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  StorageReference,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { createPortal } from "react-dom";
import { User } from "firebase/auth";

import MediaPopup from "./MediaPopup";

import { useAuth } from "@/hooks";
import { Memory, UserProfile } from "@/types";

// Constants
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_DIMENSION = 1600; // px (longest edge)

interface MemoryUploadProps {
  user: User | null;
  profile: UserProfile | null;
  isOpen: boolean;
  location: { latitude: number; longitude: number };
  onUpload: (
    memoryData: Omit<Memory, "id" | "createdBy" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  onClose: () => void;
}

// ===== Helpers =====
const getFileType = (file: File): string => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };

  if (extension === "mov") return "video/quicktime";
  if (extension === "mp4") return "video/mp4";

  return mimeTypes[extension || ""] || file.type || "application/octet-stream";
};

const isVideoFile = (file: File): boolean => {
  const extension = file.name.split(".").pop()?.toLowerCase();

  return (
    ["mov", "mp4", "avi"].includes(extension || "") ||
    file.type.startsWith("video/")
  );
};

// Translate Firebase Storage error codes into language a user can act on.
const friendlyStorageError = (code?: string): string => {
  switch (code) {
    case "storage/unauthorized":
      return "You don't have permission to upload. Make sure you're signed in.";
    case "storage/canceled":
      return "Upload was canceled.";
    case "storage/quota-exceeded":
      return "Storage is full. Please try again later.";
    case "storage/retry-limit-exceeded":
      return "Your connection is too slow and the upload timed out. Try again.";
    case "storage/unauthenticated":
      return "Your session expired. Please sign in again.";
    default:
      return "Something went wrong while uploading. Please try again.";
  }
};

// Downscale + re-encode large photos before upload so "sealing a capsule"
// doesn't hang on mobile. Returns the original if compression won't help.
const compressImage = (file: File): Promise<File> =>
  new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.type === "image/gif") {
      resolve(file);

      return;
    }

    const url = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      const scale = Math.min(
        1,
        MAX_IMAGE_DIMENSION / Math.max(img.width, img.height),
      );
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file);

        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);

            return;
          }

          resolve(
            new File(
              [blob],
              file.name.replace(/\.(png|webp|heic|heif|jpeg|jpg)$/i, ".jpg"),
              { type: "image/jpeg" },
            ),
          );
        },
        "image/jpeg",
        0.8,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });

type UploadKind = "image" | "video" | "voice";

const MemoryUpload: React.FC<MemoryUploadProps> = ({
  location,
  onUpload,
  onClose,
}) => {
  const { user, profile } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [, setFileTypes] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [voiceMessage, setVoiceMessage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Close on Escape (unless mid-upload, to avoid orphaned uploads).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !uploading) onClose();
    };

    document.addEventListener("keydown", onKey);

    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, uploading]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((file) => {
      const isVideo = isVideoFile(file);
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

      if (file.size > maxSize) {
        toast.error(
          `${file.name} is too large (max ${isVideo ? "50MB" : "5MB"})`,
        );

        return false;
      }

      if (!isVideo && !file.type.startsWith("image/")) {
        toast.error(`File type not supported: ${file.name}`);

        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    validFiles.forEach((file) => {
      const fileType = getFileType(file);
      const url = URL.createObjectURL(file);

      setFiles((prev) => [...prev, file]);
      setFileTypes((prev) => [...prev, fileType]);
      setPreviewUrls((prev) => [...prev, url]);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "video/quicktime": [".mov"],
      "video/mp4": [".mp4"],
      "video/*": [".mov", ".mp4", ".avi"],
    },
    maxFiles: 5,
    maxSize: MAX_VIDEO_SIZE,
    onDropRejected: (fileRejections) => {
      fileRejections.forEach(({ file, errors }) => {
        const errorMessages = errors.map((e) => {
          switch (e.code) {
            case "file-too-large":
              return `${file.name} is too large`;
            case "file-invalid-type":
              return `File type not supported: ${file.name}`;
            default:
              return e.message;
          }
        });

        toast.error(errorMessages.join(", "));
      });
    },
  });

  const handleVideoError = (
    e: React.SyntheticEvent<HTMLVideoElement, Event>,
    index: number,
  ) => {
    const videoElement = e.target as HTMLVideoElement;
    const error = videoElement.error;
    const file = files[index];

    console.error("Video error:", {
      file: file?.name,
      type: file?.type,
      error: error?.code,
    });

    toast.error(
      "Couldn't preview this video. Try a different format (e.g. MP4).",
    );
  };

  // Upload every asset (images, videos, voice) in one pass with a single
  // aggregated progress bar. If ANY asset fails, the ones that already
  // succeeded are deleted so we never leave orphaned files in Storage.
  const uploadAllToFirebase = async (): Promise<{
    imageUrls: string[];
    videoUrls: string[];
    voiceMessageUrl: string;
  }> => {
    const storage = getStorage();

    const prepared: { kind: UploadKind; file: File; original: File }[] =
      await Promise.all(
        files.map(async (original) => {
          const isVideo = isVideoFile(original);

          return {
            kind: (isVideo ? "video" : "image") as UploadKind,
            file: isVideo ? original : await compressImage(original),
            original,
          };
        }),
      );

    if (voiceMessage) {
      prepared.push({
        kind: "voice",
        file: voiceMessage,
        original: voiceMessage,
      });
    }

    const totalBytes = prepared.reduce((sum, p) => sum + p.file.size, 0) || 1;
    const transferred = new Array(prepared.length).fill(0);
    const uploadedRefs: StorageReference[] = [];

    setUploadProgress(0);

    const tasks = prepared.map(({ kind, file, original }, index) => {
      const folder =
        kind === "voice" ? "voice" : kind === "video" ? "videos" : "images";
      const storageRef = ref(
        storage,
        `memories/${folder}/${uuidv4()}-${file.name}`,
      );
      const metadata = {
        contentType: getFileType(file),
        customMetadata: {
          originalName: original.name,
          fileSize: file.size.toString(),
        },
      };

      const task = uploadBytesResumable(storageRef, file, metadata);

      task.on("state_changed", (snapshot) => {
        transferred[index] = snapshot.bytesTransferred;
        const sum = transferred.reduce((a, b) => a + b, 0);

        setUploadProgress(Math.round((sum / totalBytes) * 100));
      });

      // `task` itself is a thenable that settles exactly once — resolves when
      // the upload completes, rejects on error. Chaining getDownloadURL here
      // means the promise can never strand (which previously left the UI
      // stuck on "Sealing..." forever if getDownloadURL threw).
      return task.then(async () => {
        const url = await getDownloadURL(storageRef);

        uploadedRefs.push(storageRef);

        return { kind, url };
      });
    });

    const results = await Promise.allSettled(tasks);
    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );

    if (failures.length > 0) {
      // Roll back anything that made it through so Storage stays clean.
      await Promise.allSettled(uploadedRefs.map((r) => deleteObject(r)));

      const code = (failures[0].reason as { code?: string })?.code;

      throw new Error(friendlyStorageError(code));
    }

    const ok = results
      .filter(
        (r): r is PromiseFulfilledResult<{ kind: UploadKind; url: string }> =>
          r.status === "fulfilled",
      )
      .map((r) => r.value);

    return {
      imageUrls: ok.filter((x) => x.kind === "image").map((x) => x.url),
      videoUrls: ok.filter((x) => x.kind === "video").map((x) => x.url),
      voiceMessageUrl: ok.find((x) => x.kind === "voice")?.url || "",
    };
  };

  const handleVoiceMessageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("Please upload an audio file");

      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Voice message must be less than 5MB");

      return;
    }

    setVoiceMessage(file);
    toast.success("Voice message added");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      toast.error("You must be logged in to create memories");

      return;
    }

    if (!files.length) {
      toast.error("Please add at least one photo or video");

      return;
    }

    if (!title.trim()) {
      toast.error("Please give your capsule a title");

      return;
    }

    try {
      setUploading(true);
      const { imageUrls, videoUrls, voiceMessageUrl } =
        await uploadAllToFirebase();

      await onUpload({
        title: title.trim(),
        description: "",
        location,
        imageUrls,
        videoUrls,
        voiceMessageUrl,
        notes: notes.trim(),
        isUnlocked: false,
      });

      toast.success("Time capsule sealed!");
      onClose();
    } catch (error) {
      console.error("Error creating memory:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create memory. Please try again.",
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const openMediaPopup = (url: string, type: "image" | "video") => {
    setSelectedMedia(url);
    setMediaType(type);
    setIsPopupOpen(true);
  };

  const closeMediaPopup = () => {
    setSelectedMedia(null);
    setMediaType(null);
    setIsPopupOpen(false);
  };

  const modalContent = (
    <div
      className="memory-modal fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) onClose();
      }}
    >
      <div className="glass-strong thin-scroll animate-sheet-up max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl text-ink shadow-glass-lg sm:rounded-3xl">
        {/* Grab handle (mobile sheet affordance) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1.5 w-10 rounded-full bg-white/20" />
        </div>

        <div className="space-y-6 p-6">
          {/* Header */}
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
            {/* Title */}
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

            {/* Location */}
            <div className="flex items-center space-x-3 rounded-xl border border-line bg-surface-raised p-4">
              <HiLocationMarker className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-ink">Location</p>
                <p className="text-xs text-ink-faint">
                  {location
                    ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                    : "Location not available"}
                </p>
              </div>
            </div>

            {/* Upload dropzone */}
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

            {/* Preview grid */}
            {previewUrls.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-ink-muted">
                  Preview
                </label>
                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-surface-raised p-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="group relative">
                      <div className="relative w-full pb-[100%]">
                        <div className="absolute inset-0">
                          {isVideoFile(files[index]) ? (
                            <div className="relative h-full w-full">
                              <video
                                className="absolute inset-0 h-full w-full rounded-lg object-cover"
                                onClick={() => openMediaPopup(url, "video")}
                                onError={(e) => handleVideoError(e, index)}
                              >
                                <source
                                  src={url}
                                  type={getFileType(files[index])}
                                />
                              </video>
                              <div
                                className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30 transition-all group-hover:bg-black/20"
                                style={{ pointerEvents: "none" }}
                              >
                                <HiPlay className="h-12 w-12 text-white opacity-80 transition-opacity group-hover:opacity-100" />
                              </div>
                            </div>
                          ) : (
                            <Image
                              fill
                              alt={`Preview ${index + 1}`}
                              className="cursor-pointer rounded-lg object-cover transition-transform group-hover:scale-[1.02]"
                              src={url}
                              onClick={() => openMediaPopup(url, "image")}
                            />
                          )}
                        </div>
                      </div>
                      <button
                        className="absolute right-2 top-2 z-10 rounded-full bg-black/70 p-1.5 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                        type="button"
                        onClick={() => {
                          setFiles((prev) =>
                            prev.filter((_, i) => i !== index),
                          );
                          setPreviewUrls((prev) =>
                            prev.filter((_, i) => i !== index),
                          );
                          setFileTypes((prev) =>
                            prev.filter((_, i) => i !== index),
                          );
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <HiX className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Voice message */}
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
                  onChange={handleVoiceMessageUpload}
                />
              </label>
            </div>

            {/* Notes */}
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

            {/* Progress bar */}
            {uploading && uploadProgress > 0 && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Actions */}
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

      {isPopupOpen && selectedMedia && mediaType && (
        <MediaPopup
          mediaType={mediaType}
          mediaUrl={selectedMedia}
          onClose={closeMediaPopup}
        />
      )}
    </div>
  );

  return typeof window !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};

export default MemoryUpload;
