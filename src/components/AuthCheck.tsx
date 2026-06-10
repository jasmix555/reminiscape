"use client";

import React from "react";
import { usePathname } from "next/navigation"; // Import usePathname

import { Header } from "@/components";
import { useAuth } from "@/hooks";

export default function AuthCheck() {
  const { user, loading } = useAuth();
  const pathname = usePathname(); // Get the current pathname

  if (loading) {
    return null;
  }

  // Check if the current route is the capture page
  const isCapturePage = pathname === "/capture";

  // Hide the app header for unverified users (e.g. the "verify your email"
  // screen) — they haven't completed registration yet.
  return user && user.emailVerified && !isCapturePage ? ( // Render Header only if not on capture page
    <>
      <Header />
      <div className=""> </div>
    </>
  ) : null;
}
