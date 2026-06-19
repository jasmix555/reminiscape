"use client";

import React from "react";
import { usePathname } from "next/navigation";

import { Header } from "@/components";
import { useAuth } from "@/hooks";

export default function AuthCheck() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return null;
  }

  // Pages that render their own top bar must NOT also get the global Header.
  const ownHeaderPaths = [
    "/capture",
    "/friends",
    "/setup-profile",
    "/settings",
    "/memories",
  ];
  const hideGlobalHeader = ownHeaderPaths.includes(pathname);

  return user && user.emailVerified && !hideGlobalHeader ? (
    <>
      <Header />
      <div className=""> </div>
    </>
  ) : null;
}
