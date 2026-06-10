// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Loading, Map, ErrorBoundary } from "@/components";
import { useAuth } from "@/hooks";

export default function HomePage() {
  const { user, loading } = useAuth(); // Remove duplicate loading declaration
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/welcome");
    }
  }, [loading, user, router]);

  // Lock page scrolling while the full-screen map is mounted. On iOS Safari
  // the body is taller than the visible area (100vh excludes the toolbar), so
  // a touch would otherwise scroll the page into blank space instead of
  // panning the map.
  useEffect(() => {
    const previous = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (loading) return <Loading />;
  if (!user) return null;

  return (
    <main className="fixed inset-0 h-dvh w-screen overflow-hidden overscroll-none">
      <ErrorBoundary>
        <Map />
      </ErrorBoundary>
    </main>
  );
}
