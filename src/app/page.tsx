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

  if (loading) return <Loading />;
  if (!user) return null;

  return (
    <main className="absolute inset-0 overflow-hidden">
      <ErrorBoundary>
        <Map />
      </ErrorBoundary>
    </main>
  );
}
