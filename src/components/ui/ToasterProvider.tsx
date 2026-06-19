"use client";
import { Toaster } from "react-hot-toast";

// Mounts react-hot-toast once for the whole app, themed to match the dark UI.
// Without this, every toast.success/error call silently does nothing.
export default function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: "rgba(26, 26, 30, 0.96)",
          color: "#f5f5f7",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "12px",
          fontSize: "14px",
          backdropFilter: "blur(12px)",
        },
        success: { iconTheme: { primary: "#f5b942", secondary: "#000" } },
        error: { iconTheme: { primary: "#f87171", secondary: "#000" } },
      }}
    />
  );
}
