// next.config.ts
import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com", // For Google Auth profile images
      "firebasestorage.googleapis.com", // For Firebase Storage images
    ],
  },
};

export default nextConfig;
