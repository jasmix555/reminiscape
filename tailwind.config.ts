// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: {
          DEFAULT: "#f5f5f7",
          muted: "#a1a1aa",
          faint: "#71717a",
        },
        surface: {
          DEFAULT: "#16161a",
          raised: "#1f1f24",
          hover: "#2a2a30",
        },
        accent: {
          DEFAULT: "#f5b942",
          soft: "#fbbf24",
          ring: "rgba(245, 185, 66, 0.35)",
        },
        line: "rgba(255, 255, 255, 0.10)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.45)",
        "glass-lg": "0 16px 48px rgba(0, 0, 0, 0.55)",
      },
      backgroundImage: {
        "noise-pattern": "url('/noise.png')",
        "trail-pattern": "url('/trail.jpg')",
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "sheet-up": "sheetUp 0.32s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fadeIn 0.2s ease-out",
      },
      keyframes: {
        sheetUp: {
          "0%": { transform: "translateY(100%)", opacity: "0.6" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionProperty: {
        height: "height",
        spacing: "margin, padding",
      },
      scale: {
        "102": "1.02",
      },
    },
  },
  plugins: [],
} satisfies Config;
