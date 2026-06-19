// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public objects
      { protocol: "https", hostname: "*.supabase.co" },
      // Google account avatars (Supabase Google OAuth)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Placeholder photos for demo/seed capsules
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), camera=(), microphone=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
