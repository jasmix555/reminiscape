"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { HiExclamationCircle } from "react-icons/hi";
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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const router = useRouter();

  // Redirect after render (never call router.push during render).
  useEffect(() => {
    if (!loading && user) router.push("/");
  }, [loading, user, router]);

  if (loading) return <Loading />;
  if (user) return null;

  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(error);
      // Supabase returns a generic "Invalid login credentials" for both wrong
      // email and wrong password — surface it clearly under the fields.
      setError(
        error.message?.toLowerCase().includes("invalid")
          ? "Incorrect email or password. Please try again."
          : error.message || "Login failed. Please try again.",
      );
      setIsSubmitting(false);

      return;
    }

    router.push("/");
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });

    if (error) {
      console.error("Google Sign-In Error: ", error);
      setError("Google sign-in failed. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  const busy = isSubmitting || isGoogleLoading;
  // Highlight both fields when there's an auth error (it could be either one).
  const inputClass = `w-full rounded-xl border bg-surface-raised px-4 py-3 text-ink placeholder-ink-faint outline-none transition-all focus:ring-2 focus:ring-accent ${
    error
      ? "border-red-500/60 focus:border-transparent"
      : "border-line focus:border-transparent"
  }`;

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
              aria-invalid={Boolean(error)}
              aria-label="Email Address"
              autoComplete="email"
              className={inputClass}
              disabled={busy}
              placeholder="Email address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
            />
            <div className="relative">
              <input
                required
                aria-invalid={Boolean(error)}
                aria-label="Password"
                autoComplete="current-password"
                className={`${inputClass} pr-11`}
                disabled={busy}
                placeholder="Password"
                type={isPasswordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
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

            {/* Inline error directly under the fields */}
            {error && (
              <p
                aria-live="assertive"
                className="flex items-center gap-1.5 text-sm text-red-400"
                role="alert"
              >
                <HiExclamationCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
          </div>

          <button
            className={`flex w-full items-center justify-center gap-2 rounded-full py-3 font-semibold transition ${
              email && password && !busy
                ? "bg-accent text-black hover:bg-accent-soft"
                : "cursor-not-allowed bg-white/10 text-ink-faint"
            }`}
            disabled={!email || !password || busy}
            type="submit"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Logging in...
              </>
            ) : (
              "Log in"
            )}
          </button>

          <div className="flex items-center gap-4">
            <hr className="flex-grow border-t border-line" />
            <span className="text-sm text-ink-faint">or</span>
            <hr className="flex-grow border-t border-line" />
          </div>

          <button
            aria-label="Sign in with Google"
            className={`flex w-full items-center justify-center gap-2 rounded-full border border-line bg-white py-3 font-semibold text-gray-700 transition ${
              busy ? "cursor-not-allowed opacity-50" : "hover:bg-gray-100"
            }`}
            disabled={busy}
            type="button"
            onClick={handleGoogleSignIn}
          >
            {isGoogleLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                Signing in...
              </>
            ) : (
              <>
                <Image alt="Google" height={20} src="/google.svg" width={20} />
                <span>Sign in with Google</span>
              </>
            )}
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
