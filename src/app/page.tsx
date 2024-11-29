// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Loading, Map } from "@/components";
import { useAuth } from "@/hooks";

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/welcome");
    }
  }, [loading, user, router]);

  if (authLoading || loading) return <Loading />;
  if (!user) return null;

  return (
    <main className="absolute inset-0 overflow-hidden">
      <Map />
    </main>
  );
}
