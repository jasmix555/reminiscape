// src/app/layout.tsx
import type { Metadata } from "next";

import { ReactNode } from "react";

import "./globals.css";
import AuthCheck from "@/components/layout/AuthCheck";
import ToasterProvider from "@/components/ui/ToasterProvider";

export const metadata: Metadata = {
  title: "Reminiscape",
  description: "Unlock the Past, Treasure the Present",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          as="style"
          href="/_next/static/css/app/layout.css"
          precedence="high"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-noise-pattern bg-cover bg-fixed bg-center"
      >
        <AuthCheck />
        <ToasterProvider />
        {children}
      </body>
    </html>
  );
}
