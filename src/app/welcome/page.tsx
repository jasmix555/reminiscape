"use client"; // Ensure this is a client component
import Link from "next/link";
import {useEffect} from "react";
import {useRouter} from "next/navigation";

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
    <div
      className="container mx-auto flex h-screen flex-col justify-between gap-4 p-4"
      style={{
        backgroundImage: "url('/trail.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="mt-36 flex flex-col items-center justify-center gap-2">
        <h1 className="text-4xl font-bold">Reminiscape</h1>
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
  );
}
