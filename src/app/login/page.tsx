"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import Link from "next/link";
import Image from "next/image";

import { useAuth } from "@/hooks";
import { supabase } from "@/libs/supabaseClient";
import { Loading } from "@/components";

export default function Login() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const router = useRouter();

  if (loading) return <Loading />;
  if (user) {
    router.push("/");

    return null;
  }

  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(error);
      setError("Login failed. Incorrect email address or password.");

      return;
    }

    router.push("/");
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });

    if (error) {
      console.error("Google Sign-In Error: ", error);
      setError("Google Sign-In failed.");
      setIsGoogleLoading(false);
    }
    // On success the browser redirects to Google, so no further action here.
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-ink">
      <div className="glass-strong w-full max-w-md rounded-3xl p-8 shadow-glass-lg">
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-ink-faint">Log in to Reminiscape</p>
          </div>

          <div className="flex flex-col gap-4">
            <input
              required
              aria-label="Email Address"
              autoComplete="email"
              className="w-full rounded-xl border border-line bg-surface-raised px-4 py-3 text-ink placeholder-ink-faint outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent"
              placeholder="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="relative">
              <input
                required
                aria-label="Password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-line bg-surface-raised px-4 py-3 pr-11 text-ink placeholder-ink-faint outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent"
                placeholder="Password"
                type={isPasswordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                aria-label={
                  isPasswordVisible ? "Hide password" : "Show password"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
                type="button"
                onClick={togglePasswordVisibility}
              >
                {isPasswordVisible ? (
                  <AiOutlineEye />
                ) : (
                  <AiOutlineEyeInvisible />
                )}
              </button>
            </div>
            {error && (
              <p
                aria-live="assertive"
                className="text-center text-sm text-red-400"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          <button
            className={`w-full rounded-full py-3 font-semibold transition ${
              email && password
                ? "bg-accent text-black hover:bg-accent-soft"
                : "cursor-not-allowed bg-white/10 text-ink-faint"
            }`}
            disabled={!email || !password}
            type="submit"
          >
            Log in
          </button>

          <div className="flex items-center gap-4">
            <hr className="flex-grow border-t border-line" />
            <span className="text-sm text-ink-faint">or</span>
            <hr className="flex-grow border-t border-line" />
          </div>

          <button
            aria-label="Sign in with Google"
            className={`flex w-full items-center justify-center gap-2 rounded-full border border-line bg-white py-3 font-semibold text-gray-700 transition ${
              isGoogleLoading
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-gray-100"
            }`}
            disabled={isGoogleLoading}
            type="button"
            onClick={handleGoogleSignIn}
          >
            <Image alt="Google" height={20} src="/google.svg" width={20} />
            <span>
              {isGoogleLoading ? "Signing in..." : "Sign in with Google"}
            </span>
          </button>

          <p className="text-center text-sm text-ink-muted">
            Don&apos;t have an account?{" "}
            <Link className="font-semibold text-accent" href="/register">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
