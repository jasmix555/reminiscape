// src/app/welcome/page.tsx
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HiLocationMarker } from "react-icons/hi";

import { useAuth } from "@/hooks";
import { Loading } from "@/components";

export default function Welcome() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading) return <Loading />;
  if (user) return null;

  return (
    <main className="relative flex h-dvh w-full flex-col overflow-hidden bg-background">
      {/* Atmospheric background photo */}
      <div className="absolute inset-0 bg-trail-pattern bg-cover bg-center" />

      {/* Gradient scrim so the photo stays moody but the copy reads cleanly */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-[#1b2026]" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
        {/* Brand mark */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-black shadow-glass">
            <HiLocationMarker className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-white/90">
            Reminiscape
          </span>
        </div>

        {/* Headline pinned to the lower third */}
        <div className="mt-auto space-y-4">
          <h1 className="text-[2.75rem] font-bold leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
            Unlock the past,
            <br />
            treasure the present.
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-white/75">
            Bury photos, videos and voice notes as time capsules on the map —
            then rediscover them when you return to the spot.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <Link
              className="w-full rounded-full bg-accent py-3.5 text-center font-semibold text-black transition-all hover:bg-accent-soft active:scale-[0.98]"
              href="/login"
            >
              Log in
            </Link>
            <Link
              className="glass w-full rounded-full py-3.5 text-center font-semibold text-white transition-colors hover:bg-white/10 active:scale-[0.98]"
              href="/register"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
