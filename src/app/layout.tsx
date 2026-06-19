// src/app/layout.tsx
import type { Metadata, Viewport } from "next";

import { ReactNode } from "react";

import "./globals.css";
import AuthCheck from "@/components/layout/AuthCheck";
import ToasterProvider from "@/components/ui/ToasterProvider";

export const metadata: Metadata = {
  title: "Reminiscape",
  description: "Unlock the Past, Treasure the Present",
};

// Dark browser chrome (Safari toolbar / status bar) + edge-to-edge safe areas,
// so no light/white band shows around the app on iOS.
export const viewport: Viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="min-h-screen bg-background">
        <AuthCheck />
        <ToasterProvider />
        {children}
      </body>
    </html>
  );
}
