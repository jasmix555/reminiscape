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
    <div className='min-h-fit'>
      <div className='container mx-auto px-4 py-8'>
        <h1>Welcome </h1>
        <Map />
      </div>
    </div>
  );
}
