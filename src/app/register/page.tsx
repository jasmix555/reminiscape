"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";

import { supabase } from "@/libs/supabaseClient";
import { Loading } from "@/components";
import { useAuth } from "@/hooks";

export default function Register() {
  const { loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });

    if (error) {
      setError(error.message);
      console.error("Signup Error:", error);

      return;
    }

    // If the project requires email confirmation there is no session yet.
    setHasSession(Boolean(data.session));
    setIsConfirming(true);
  };

  const handleResend = async () => {
    const { error } = await supabase.auth.resend({ type: "signup", email });

    if (error) setError(error.message);
    else setError(null);
  };

  if (loading) return <Loading />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-ink">
      <div className="glass-strong w-full max-w-md rounded-3xl p-8 shadow-glass-lg">
        {error && (
          <p className="mb-4 rounded-xl bg-red-500/15 p-3 text-center text-sm text-red-400">
            {error}
          </p>
        )}

        {!isConfirming ? (
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">
                Create account
              </h1>
              <p className="mt-1 text-sm text-ink-faint">
                Start collecting your time capsules
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <input
                required
                autoComplete="email"
                className="w-full rounded-xl border border-line bg-surface-raised px-4 py-3 text-ink placeholder-ink-faint outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent"
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-line bg-surface-raised px-4 py-3 text-ink placeholder-ink-faint outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent"
                minLength={6}
                placeholder="Password (min 6 characters)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              className={`w-full rounded-full py-3 font-semibold transition ${
                !email || !password
                  ? "cursor-not-allowed bg-white/10 text-ink-faint"
                  : "bg-accent text-black hover:bg-accent-soft"
              }`}
              disabled={!email || !password}
              type="submit"
            >
              Sign up
            </button>
            <p className="text-center text-sm text-ink-muted">
              Already have an account?{" "}
              <Link className="font-semibold text-accent" href="/login">
                Log in
              </Link>
            </p>
          </form>
        ) : (
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold tracking-tight">
              Check your email
            </h1>
            <p className="text-sm text-ink-muted">
              {hasSession
                ? "Your account is ready — you can log in."
                : `We sent a confirmation link to ${email}. Click it to activate your account, then come back and log in.`}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                className="w-full rounded-full bg-accent py-3 font-semibold text-black transition hover:bg-accent-soft"
                href="/login"
              >
                Go to login
              </Link>
              {!hasSession && (
                <button
                  className="text-sm text-ink-faint underline hover:text-ink"
                  type="button"
                  onClick={handleResend}
                >
                  Resend confirmation email
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
