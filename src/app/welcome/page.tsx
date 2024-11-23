// src/app/welcome/page.tsx
"use client";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useEffect} from "react";

import {useAuth} from "@/hooks";
import {Loading} from "@/components";

export default function Welcome() {
  const {user, loading} = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading) return <Loading />;
  if (user) return null;

  return (
    <main className="relative min-h-screen">
      {/* Dark gray background layer */}
      <div className="absolute inset-0 bg-black opacity-10" />

      {/* Base layer - Trail pattern with reduced opacity */}
      <div
        className="absolute inset-0 bg-trail-pattern bg-cover bg-center"
        style={{
          mixBlendMode: "multiply", // Adjust blend mode if needed
        }}
      />

      {/* Content */}
      <div className="container relative mx-auto flex h-screen flex-col justify-between gap-4 p-4">
        <div className="mt-36 flex flex-col items-center justify-center gap-2">
          <h1 className="text-4xl font-bold text-yellow-900">Reminiscape</h1>
          <p className="text-xl text-gray-500">Unlock the Past, Treasure the Present</p>
        </div>
        <div className="mb-16 flex flex-col justify-between gap-4 text-center">
          <Link
            aria-label="Login for parents"
            className="w-full rounded bg-yellow-900 px-4 py-2 font-bold text-white transition duration-100 ease-in hover:bg-yellow-700"
            href="/login"
          >
            Login
          </Link>
          <Link
            aria-label="Sign up for new parents"
            className="w-full rounded border-2 border-orange-400 bg-none px-4 py-2 font-bold text-orange-400 transition duration-100 ease-in hover:bg-orange-400 hover:text-white"
            href="/register"
          >
            Register Now
          </Link>
        </div>
      </div>
    </main>
  );
}
