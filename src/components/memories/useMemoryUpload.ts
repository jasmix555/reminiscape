import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

import {
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  isVideoFile,
  uploadMemoryAssets,
} from "./uploadUtils";

import { useAuth } from "@/hooks";
import { Memory } from "@/types";

type OnUpload = (
  memoryData: Omit<Memory, "id" | "createdBy" | "createdAt" | "updatedAt">,
) => Promise<void>;

export const useMemoryUpload = (
  location: { latitude: number; longitude: number },
  onUpload: OnUpload,
  onClose: () => void,
) => {
  const { user, profile } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [voiceMessage, setVoiceMessage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [unlockAt, setUnlockAt] = useState<string>("");

  useEffect(
    () => () => previewUrls.forEach((url) => URL.revokeObjectURL(url)),
    [previewUrls],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !uploading) onClose();
    };

    document.addEventListener("keydown", onKey);

    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, uploading]);

  const onDrop = useCallback((accepted: File[]) => {
    const valid = accepted.filter((file) => {
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

    valid.forEach((file) => {
      const url = URL.createObjectURL(file);

      setFiles((prev) => [...prev, file]);
      setPreviewUrls((prev) => [...prev, url]);
    });
  }, []);

  const dropzone = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "video/quicktime": [".mov"],
      "video/mp4": [".mp4"],
      "video/*": [".mov", ".mp4", ".avi"],
    },
    maxFiles: 5,
    maxSize: MAX_VIDEO_SIZE,
    onDropRejected: (rejections) => {
      rejections.forEach(({ file, errors }) => {
        const msgs = errors.map((e) =>
          e.code === "file-too-large"
            ? `${file.name} is too large`
            : e.code === "file-invalid-type"
              ? `File type not supported: ${file.name}`
              : e.message,
        );

        toast.error(msgs.join(", "));
      });
    },
  });

  const removeFile = (index: number) => {
    const url = previewUrls[index];

    if (url) URL.revokeObjectURL(url);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        await uploadMemoryAssets(files, voiceMessage, setUploadProgress);

      await onUpload({
        title: title.trim(),
        description: "",
        location,
        imageUrls,
        videoUrls,
        voiceMessageUrl,
        notes: notes.trim(),
        isUnlocked: false,
        unlockAt: unlockAt ? new Date(unlockAt) : null,
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

  return {
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
  };
};
