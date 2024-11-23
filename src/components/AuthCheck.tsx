"use client";

import React from "react";
import {usePathname} from "next/navigation"; // Import usePathname

import {Header} from "@/components";
import {useAuth} from "@/hooks";

export default function AuthCheck() {
  const {user, loading} = useAuth();
  const pathname = usePathname(); // Get the current pathname

  if (loading) {
    return null;
  }

  // Check if the current route is the capture page
  const isCapturePage = pathname === "/capture";

  return user && !isCapturePage ? ( // Render Header only if not on capture page
    <>
      <Header />
      <div className="pt-10"> </div>
    </>
  ) : null;
}
