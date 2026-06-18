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

  // Pages that render their own top bar (back button + title) must NOT also
  // get the global Header, or the two stack and the profile button covers the
  // page's back button (notably on iOS).
  const ownHeaderPaths = [
    "/capture",
    "/friends",
    "/setup-profile",
    "/settings",
  ];
  const hideGlobalHeader = ownHeaderPaths.includes(pathname);

  // Hide the app header for unverified users (e.g. the "verify your email"
  // screen) — they haven't completed registration yet.
  return user && user.emailVerified && !hideGlobalHeader ? (
    <>
      <Header />
      <div className=""> </div>
    </>
  ) : null;
}
