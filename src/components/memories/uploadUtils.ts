// Pure helpers + the Supabase upload routine for memory creation.
import { uploadMedia, deleteMediaByUrl } from "@/libs/supabaseStorage";

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_DIMENSION = 1600; // px (longest edge)

export type UploadKind = "image" | "video" | "voice";

export interface UploadedMedia {
  imageUrls: string[];
  videoUrls: string[];
  voiceMessageUrl: string;
}

export const getFileType = (file: File): string => {
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

export const isVideoFile = (file: File): boolean => {
  const extension = file.name.split(".").pop()?.toLowerCase();

  return (
    ["mov", "mp4", "avi"].includes(extension || "") ||
    file.type.startsWith("video/")
  );
};

// Turn a Supabase storage error into language a user can act on.
export const friendlyStorageError = (err: unknown): string => {
  const m = (
    err instanceof Error ? err.message : String(err ?? "")
  ).toLowerCase();

  if (
    m.includes("row-level security") ||
    m.includes("unauthorized") ||
    m.includes("permission")
  )
    return "You don't have permission to upload. Make sure you're signed in.";
  if (m.includes("bucket") && m.includes("not found"))
    return "Storage bucket missing. Create a public 'media' bucket in Supabase.";
  if (
    m.includes("exceeded") ||
    m.includes("too large") ||
    m.includes("payload")
  )
    return "That file is too large for the storage limit.";
  if (m.includes("network") || m.includes("failed to fetch"))
    return "Network error during upload. Check your connection and try again.";

  return "Something went wrong while uploading. Please try again.";
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

/**
 * Upload images/videos/voice in one pass, reporting aggregated progress.
 * If any asset fails, the ones that already uploaded are removed so Storage
 * never keeps orphans.
 */
export const uploadMemoryAssets = async (
  files: File[],
  voiceMessage: File | null,
  onProgress: (pct: number) => void,
): Promise<UploadedMedia> => {
  const prepared: { kind: UploadKind; file: File }[] = await Promise.all(
    files.map(async (original) => {
      const isVideo = isVideoFile(original);

      return {
        kind: (isVideo ? "video" : "image") as UploadKind,
        file: isVideo ? original : await compressImage(original),
      };
    }),
  );

  if (voiceMessage) prepared.push({ kind: "voice", file: voiceMessage });

  const total = prepared.length || 1;
  let completed = 0;
  const uploadedUrls: string[] = [];

  onProgress(0);

  try {
    const results = await Promise.all(
      prepared.map(async ({ kind, file }) => {
        const folder =
          kind === "voice" ? "voice" : kind === "video" ? "videos" : "images";
        const url = await uploadMedia(file, folder, getFileType(file));

        uploadedUrls.push(url);
        completed += 1;
        onProgress(Math.round((completed / total) * 100));

        return { kind, url };
      }),
    );

    return {
      imageUrls: results.filter((x) => x.kind === "image").map((x) => x.url),
      videoUrls: results.filter((x) => x.kind === "video").map((x) => x.url),
      voiceMessageUrl: results.find((x) => x.kind === "voice")?.url || "",
    };
  } catch (err) {
    await Promise.allSettled(uploadedUrls.map((u) => deleteMediaByUrl(u)));
    console.error("Time capsule upload failed:", err);
    throw new Error(friendlyStorageError(err));
  }
};
