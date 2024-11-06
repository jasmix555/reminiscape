import type {Metadata} from "next";

import {ReactNode} from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reminiscape",
  description: "Reminiscape is a platform for sharing memories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
