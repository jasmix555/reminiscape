import type {Metadata} from "next";

import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reminiscape",
  description: "Reminiscape is a platform for sharing memories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
