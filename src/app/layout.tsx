// src/app/layout.tsx
import React from "react";

import Providers from "./providers";
import "./globals.css";

export const metadata = {
  title: "Reminiscape - Digital Time Capsules",
  description: "Create and share location-based digital time capsules with Reminiscape",
  keywords: ["time capsule", "digital memories", "location-based", "reminiscape"],
  authors: [{name: "Jason Ng", instagram: "https://instagram.com/jason_ng555"}],
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
