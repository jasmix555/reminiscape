// src/libs/profileUtils.ts
import type { UserProfile } from "@/types";

import { supabase } from "./supabaseClient";
import { uploadMedia, deleteMediaByUrl } from "./supabaseStorage";

/** Fetch a user's raw profile row (or null). */
export const getUserProfile = async (uid: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", uid)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user profile:", error.message);
    throw error;
  }

  return data;
};

/** Update an existing profile (snake_case columns). */
export const updateUserProfile = async (
  uid: string,
  data: Partial<{ username: string; bio: string; photoURL: string }>,
) => {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.username !== undefined) patch.username = data.username;
  if (data.bio !== undefined) patch.bio = data.bio;
  if (data.photoURL !== undefined) patch.photo_url = data.photoURL;

  const { error } = await supabase.from("profiles").update(patch).eq("id", uid);

  if (error) {
    console.error("Error updating user profile:", error.message);
    throw error;
  }
};

/**
 * Upload a new profile image to Supabase Storage, remove the old one, and
 * save the new public URL on the profile.
 */
export const uploadProfileImage = async (
  uid: string,
  file: File,
): Promise<string> => {
  const existing = await getUserProfile(uid);

  if (existing?.photo_url) {
    try {
      await deleteMediaByUrl(existing.photo_url);
    } catch (error) {
      console.warn("Could not delete old profile image:", error);
    }
  }

  const url = await uploadMedia(file, "profiles", file.type);

  await updateUserProfile(uid, { photoURL: url });

  return url;
};

export type { UserProfile };
