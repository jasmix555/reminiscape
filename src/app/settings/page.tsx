"use client";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaArrowLeft,
  FaArrowRightFromBracket,
  FaUserPen,
} from "react-icons/fa6";
import { HiCheckCircle, HiExclamationCircle } from "react-icons/hi";

import { supabase } from "@/libs/supabaseClient";
import { useAuth } from "@/hooks";
import { Loading } from "@/components";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/welcome");
  }, [loading, user, router]);

  if (loading || !user) return <Loading />;

  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage({
        type: "err",
        text: "Password must be at least 6 characters.",
      });

      return;
    }

    if (password !== confirm) {
      setMessage({ type: "err", text: "Passwords don't match." });

      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });

    setSaving(false);

    if (error) {
      setMessage({
        type: "err",
        text: error.message || "Couldn't update password.",
      });

      return;
    }

    setPassword("");
    setConfirm("");
    setMessage({ type: "ok", text: "Password updated." });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/welcome");
  };

  const inputClass =
    "w-full rounded-xl border border-line bg-surface-raised px-4 py-3 text-ink placeholder-ink-faint outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent disabled:opacity-60";

  return (
    <div className="min-h-screen bg-background text-ink">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <button
            aria-label="Back"
            className="ctrl-btn h-10 w-10"
            type="button"
            onClick={() => router.back()}
          >
            <FaArrowLeft className="h-4 w-4 text-ink" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </div>

        {/* Account */}
        <section className="glass-strong rounded-3xl p-6 shadow-glass">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-faint">
            Account
          </h2>
          <p className="text-sm text-ink-muted">Signed in as</p>
          <p className="truncate font-medium text-ink">{user.email}</p>

          <Link
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-white/15"
            href="/setup-profile"
          >
            <FaUserPen className="h-4 w-4" />
            Edit profile (name, bio, photo)
          </Link>
        </section>

        {/* Change password */}
        <section className="glass-strong rounded-3xl p-6 shadow-glass">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-faint">
            Change password
          </h2>
          <form className="flex flex-col gap-4" onSubmit={handleChangePassword}>
            <input
              className={inputClass}
              disabled={saving}
              minLength={6}
              placeholder="New password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (message) setMessage(null);
              }}
            />
            <input
              className={inputClass}
              disabled={saving}
              minLength={6}
              placeholder="Confirm new password"
              type="password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (message) setMessage(null);
              }}
            />

            {message && (
              <p
                className={`flex items-center gap-1.5 text-sm ${
                  message.type === "ok" ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {message.type === "ok" ? (
                  <HiCheckCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <HiExclamationCircle className="h-4 w-4 shrink-0" />
                )}
                {message.text}
              </p>
            )}

            <button
              className={`flex items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-colors ${
                !password || !confirm || saving
                  ? "cursor-not-allowed bg-accent/50 text-black/60"
                  : "bg-accent text-black hover:bg-accent-soft"
              }`}
              disabled={!password || !confirm || saving}
              type="submit"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Updating...
                </>
              ) : (
                "Update password"
              )}
            </button>
          </form>
        </section>

        {/* Appearance (informational for now) */}
        <section className="glass-strong rounded-3xl p-6 shadow-glass">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-faint">
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">Theme</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-ink">
              Dark
            </span>
          </div>
        </section>

        <button
          className="flex items-center justify-center gap-2 rounded-xl border border-red-500/40 px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/15"
          type="button"
          onClick={handleLogout}
        >
          <FaArrowRightFromBracket className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );
}
