// src/app/setup-profile/page.tsx
"use client";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaArrowRightFromBracket } from "react-icons/fa6";
import { HiExclamationCircle } from "react-icons/hi";

import { uploadProfileImage } from "@/libs/profileUtils";
import { supabase } from "@/libs/supabaseClient";
import { useAuth } from "@/hooks";
import { ProfileImageUpload, Loading } from "@/components";

export default function SetupProfilePage() {
  const { profile, loading: profileLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setProfileImageUrl(profile.photoURL || null);
    } else {
      setUsername("");
      setBio("");
      setProfileImageUrl(null);
    }
  }, [profile]);

  const handleImageUpload = async (file: File) => {
    setImageLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const downloadURL = await uploadProfileImage(user.id, file);

        setProfileImageUrl(downloadURL);
      }
    } catch (err) {
      setError("Failed to upload image. Please try again.");
      console.error(err);
    } finally {
      setImageLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/welcome");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Your session expired. Please log in again.");

        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          bio,
          photo_url: profileImageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      router.push("/");
    } catch (err) {
      setError("Failed to save profile. Please try again.");
      console.error("Error saving profile:", err);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) return <Loading />;

  const busy = loading || imageLoading;

  return (
    <div className="min-h-screen bg-background text-ink">
      <div className="mx-auto flex w-full max-w-md flex-col px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mb-6 flex items-center gap-3">
          <button
            aria-label="Back"
            className="ctrl-btn h-10 w-10"
            type="button"
            onClick={() => router.back()}
          >
            <FaArrowLeft className="h-4 w-4 text-ink" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">
            {profile?.username ? "Edit Profile" : "Set Up Profile"}
          </h1>
        </div>

        <div className="glass-strong rounded-3xl p-6 shadow-glass">
          {error && (
            <p className="mb-4 flex items-center gap-1.5 rounded-xl bg-red-500/15 p-3 text-sm text-red-400">
              <HiExclamationCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <ProfileImageUpload
              currentImage={profileImageUrl || null}
              loading={imageLoading}
              onImageSelect={handleImageUpload}
            />

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink-muted">
                Username
              </label>
              <input
                required
                className="w-full rounded-xl border border-line bg-surface-raised px-4 py-3 text-ink placeholder-ink-faint outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent disabled:opacity-60"
                disabled={busy}
                placeholder="Enter your username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink-muted">
                Bio
              </label>
              <textarea
                className="w-full resize-none rounded-xl border border-line bg-surface-raised px-4 py-3 text-ink placeholder-ink-faint outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent disabled:opacity-60"
                disabled={busy}
                placeholder="Tell us about yourself"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="flex justify-between gap-3">
              <button
                className="rounded-xl bg-white/10 px-6 py-3 font-medium text-ink-muted transition-colors hover:bg-white/15 disabled:opacity-50"
                disabled={busy}
                type="button"
                onClick={() => router.back()}
              >
                Cancel
              </button>
              <button
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-colors ${
                  busy || !username
                    ? "cursor-not-allowed bg-accent/50 text-black/60"
                    : "bg-accent text-black hover:bg-accent-soft"
                }`}
                disabled={busy || !username}
                type="submit"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : imageLoading ? (
                  "Uploading photo..."
                ) : profile?.username ? (
                  "Save Changes"
                ) : (
                  "Complete Setup"
                )}
              </button>
            </div>
          </form>
        </div>

        <button
          className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-red-500/40 px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/15"
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
