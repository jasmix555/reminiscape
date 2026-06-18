import React, { useState } from "react";
import Image from "next/image";
import { HiX, HiPlay } from "react-icons/hi";
import toast from "react-hot-toast";

import MediaPopup from "../ui/MediaPopup";

import { getFileType, isVideoFile } from "./uploadUtils";

interface MemoryFilePreviewProps {
  files: File[];
  previewUrls: string[];
  onRemove: (index: number) => void;
}

const MemoryFilePreview: React.FC<MemoryFilePreviewProps> = ({
  files,
  previewUrls,
  onRemove,
}) => {
  const [popup, setPopup] = useState<{
    url: string;
    type: "image" | "video";
  } | null>(null);

  if (previewUrls.length === 0) return null;

  const onVideoError = (
    e: React.SyntheticEvent<HTMLVideoElement>,
    index: number,
  ) => {
    console.error("Video preview error:", {
      file: files[index]?.name,
      code: (e.target as HTMLVideoElement).error?.code,
    });
    toast.error(
      "Couldn't preview this video. Try a different format (e.g. MP4).",
    );
  };

  return (
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
                      onClick={() => setPopup({ url, type: "video" })}
                      onError={(e) => onVideoError(e, index)}
                    >
                      <source src={url} type={getFileType(files[index])} />
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
                    onClick={() => setPopup({ url, type: "image" })}
                  />
                )}
              </div>
            </div>
            <button
              className="absolute right-2 top-2 z-10 rounded-full bg-black/70 p-1.5 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
              type="button"
              onClick={() => onRemove(index)}
            >
              <HiX className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {popup && (
        <MediaPopup
          mediaType={popup.type}
          mediaUrl={popup.url}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
};

export default MemoryFilePreview;
