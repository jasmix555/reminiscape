// src/app/setup-profile/page.tsx
"use client";
import { useState, FormEvent, useEffect } from "react";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

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

  // Set initial values when profile is loaded
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setProfileImageUrl(profile.photoURL || null); // Ensure the image URL is set
    } else {
      // Reset fields if no profile is found
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

        setProfileImageUrl(downloadURL); // Set the uploaded image URL
      }
    } catch (error) {
      setError("Failed to upload image");
      console.error(error);
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);

        // Use merge: true to preserve existing data
        await setDoc(
          userDocRef,
          {
            username,
            bio,
            photoURL: profileImageUrl, // Ensure the photoURL is set correctly
            email: auth.currentUser.email,
            updatedAt: new Date().toISOString(),
            ...(profile ? {} : { createdAt: new Date().toISOString() }),
          },
          { merge: true },
        );

        // Redirect to homepage after saving changes
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
    return <div>Error loading profile: {profileError}</div>;
  }

  return (
    <div className="flex h-screen items-center justify-center ">
      <div className="container mx-auto max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 text-center">
            {profile ? "Edit Your Profile" : "Set Up Your Profile"}
          </h1>
          <div className="w-10" /> {/* Placeholder for alignment */}
        </div>
        {error && <p className="mb-4 text-center text-red-600">{error}</p>}

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <ProfileImageUpload
            currentImage={profileImageUrl || null} // Ensure currentImage is either string or null
            loading={imageLoading}
            onImageSelect={handleImageUpload}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              required
              className="mt-1 block w-full border-b-2 border-gray-300 bg-transparent px-3 py-2 placeholder-gray-500 focus:border-yellow-900 focus:outline-none"
              placeholder="Enter your username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              required
              className="mt-1 block w-full resize-none rounded-md border border-gray-300 p-2 placeholder-gray-500 focus:border-yellow-900 focus:outline-none" // Add 'resize-none' class
              placeholder="Tell us about yourself"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="w-full flex justify-between gap-8">
            <button
              className="text-gray-600 hover:text-gray-800 flex py-2 bg-gray-200 rounded-full px-8 justify-center items-center"
              onClick={() => router.back()}
            >
              Cancel
            </button>
            <button
              className={`w-full rounded-full py-2 font-bold text-white transition ${
                loading || imageLoading || !username
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-yellow-900 hover:bg-yellow-800"
              }`}
              disabled={loading || imageLoading || !username} // Disable if loading, image loading, or username is empty
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
    </div>
  );
}
