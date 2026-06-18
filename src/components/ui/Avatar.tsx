"use client";
import { useState } from "react";
import { FaUser } from "react-icons/fa6";

interface AvatarProps {
  src?: string;
  size?: number;
  className?: string;
}

// Shared avatar with a graceful icon fallback. Uses a plain <img> (not
// next/image) on purpose so an unconfigured remote host can never throw and
// crash a parent that lives outside an ErrorBoundary (e.g. the Header).
const Avatar = ({ src, size = 44, className = "" }: AvatarProps) => {
  const [errored, setErrored] = useState(false);
  const show = src && src.trim() !== "" && !errored;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-raised ${className}`}
      style={{ width: size, height: size }}
    >
      {show ? (
        <img
          alt="Profile"
          className="h-full w-full object-cover"
          src={src}
          onError={() => setErrored(true)}
        />
      ) : (
        <FaUser className="text-ink-faint" style={{ fontSize: size * 0.42 }} />
      )}
    </div>
  );
};

export default Avatar;
