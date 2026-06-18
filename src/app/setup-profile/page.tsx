// src/app/setup-profile/page.tsx
"use client";
import { useState, FormEvent, useEffect } from "react";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaArrowRightFromBracket } from "react-icons/fa6";

import { uploadProfileImage } from "@/libs/profileUtils";
import { auth } from "@/libs/firebaseConfig";
import { useProfile } from "@/hooks";
import { ProfileImageUpload, Loading } from "@/components";

const db = getFirestore();

export default function SetupProfilePage() {
  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useProfile();
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
    try {
      if (auth.currentUser) {
        const downloadURL = await uploadProfileImage(
          auth.currentUser.uid,
          file,
        );

        setProfileImageUrl(downloadURL);
      }
    } catch (error) {
      setError("Failed to upload image");
      console.error(error);
    } finally {
      setImageLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/welcome");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);

        await setDoc(
          userDocRef,
          {
            username,
            bio,
            photoURL: profileImageUrl,
            email: auth.currentUser.email,
            updatedAt: new Date().toISOString(),
            ...(profile ? {} : { createdAt: new Date().toISOString() }),
          },
          { merge: true },
        );

        router.push("/");
      }
    } catch (error) {
      setError("Failed to save profile");
      console.error("Error saving profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return <Loading />;
  }

  if (profileError) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-ink-muted">
        Error loading profile: {profileError}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-ink">
      <div className="mx-auto flex w-full max-w-md flex-col px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))]">
        {/* Header */}
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
            {profile ? "Edit Profile" : "Set Up Profile"}
          </h1>
        </div>

        <div className="glass-strong rounded-3xl p-6 shadow-glass">
          {error && (
            <p className="mb-4 rounded-xl bg-red-500/15 p-3 text-center text-sm text-red-400">
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
                className="w-full rounded-xl border border-line bg-surface-raised px-4 py-3 text-ink placeholder-ink-faint outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent"
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
                required
                className="w-full resize-none rounded-xl border border-line bg-surface-raised px-4 py-3 text-ink placeholder-ink-faint outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent"
                placeholder="Tell us about yourself"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="flex justify-between gap-3">
              <button
                className="rounded-xl bg-white/10 px-6 py-3 font-medium text-ink-muted transition-colors hover:bg-white/15"
                type="button"
                onClick={() => router.back()}
              >
                Cancel
              </button>
              <button
                className={`flex flex-1 items-center justify-center rounded-xl py-3 font-semibold transition-colors ${
                  loading || imageLoading || !username
                    ? "cursor-not-allowed bg-accent/50 text-black/60"
                    : "bg-accent text-black hover:bg-accent-soft"
                }`}
                disabled={loading || imageLoading || !username}
                type="submit"
              >
                {loading
                  ? "Saving..."
                  : profile
                    ? "Save Changes"
                    : "Complete Setup"}
              </button>
            </div>
          </form>
        </div>

        {/* Logout */}
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
