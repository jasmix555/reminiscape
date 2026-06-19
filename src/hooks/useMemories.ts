import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";

import { useAuth } from "./useAuth";

import { supabase } from "@/libs/supabaseClient";
import { deleteMediaByUrl } from "@/libs/supabaseStorage";
import { Memory, UserProfile } from "@/types";

const mapRow = (
  row: Record<string, any>,
  selfUid: string,
  unlockedSet: Set<string>,
): Memory => ({
  id: row.id,
  title: row.title,
  description: row.description ?? "",
  notes: row.notes ?? "",
  location: { latitude: row.latitude, longitude: row.longitude },
  imageUrls: row.image_urls ?? [],
  videoUrls: row.video_urls ?? [],
  voiceMessageUrl: row.voice_message_url ?? "",
  isUnlocked:
    row.unlock_at && new Date(row.unlock_at) > new Date()
      ? false
      : row.user_id === selfUid
        ? true
        : Boolean(row.is_unlocked) || unlockedSet.has(row.id),
  unlockAt: row.unlock_at ? new Date(row.unlock_at) : null,
  createdBy: {
    uid: row.user_id,
    email: "",
    username: row.created_by_username ?? "",
    photoURL: row.created_by_photo_url ?? "",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserProfile,
  createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
});

export const useMemories = () => {
  const { user, profile } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMemories = useCallback(async () => {
    if (!user) {
      setMemories([]);
      setLoading(false);

      return;
    }

    try {
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Which capsules has this user already unlocked (persisted)?
      const { data: unlocks } = await supabase
        .from("memory_unlocks")
        .select("memory_id")
        .eq("user_id", user.uid);
      const unlockedSet = new Set(
        (unlocks ?? []).map((u: { memory_id: string }) => u.memory_id),
      );

      setMemories(
        (data ?? []).map((r: Record<string, any>) =>
          mapRow(r, user.uid, unlockedSet),
        ),
      );
      setError(null);
    } catch (err: any) {
      console.error("Error loading memories:", err.message);
      setError(err.message || "Failed to load memories.");
      toast.error("Failed to load memories. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Persist that the current user has unlocked someone else's capsule.
  const recordUnlock = async (memoryId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("memory_unlocks")
      .upsert(
        { user_id: user.uid, memory_id: memoryId },
        { onConflict: "user_id,memory_id" },
      );

    if (error) {
      console.error("Error recording unlock:", error.message);

      return;
    }

    await loadMemories();
  };

  const addMemory = async (
    memoryData: Omit<Memory, "id" | "createdBy" | "createdAt" | "updatedAt">,
  ) => {
    if (!user) throw new Error("User must be authenticated to create memories");

    const insert = {
      user_id: user.uid,
      title: memoryData.title,
      description: memoryData.description ?? "",
      notes: memoryData.notes ?? "",
      latitude: memoryData.location.latitude,
      longitude: memoryData.location.longitude,
      image_urls: memoryData.imageUrls ?? [],
      video_urls: memoryData.videoUrls ?? [],
      voice_message_url: memoryData.voiceMessageUrl ?? "",
      is_unlocked: memoryData.isUnlocked ?? false,
      unlock_at: memoryData.unlockAt
        ? new Date(memoryData.unlockAt).toISOString()
        : null,
      created_by_username: profile?.username || user.email || "",
      created_by_photo_url: profile?.photoURL || "",
    };

    const { data, error } = await supabase
      .from("memories")
      .insert(insert)
      .select("id")
      .single();

    if (error) {
      console.error("Error adding memory:", error.message);
      toast.error(error.message || "Failed to create memory.");
      throw error;
    }

    await loadMemories();

    return data.id;
  };

  const updateMemory = async (memoryId: string, updates: Partial<Memory>) => {
    if (!user) {
      toast.error("You must be logged in to update memories.");

      return;
    }

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.notes !== undefined) patch.notes = updates.notes;
    if (updates.imageUrls !== undefined) patch.image_urls = updates.imageUrls;
    if (updates.videoUrls !== undefined) patch.video_urls = updates.videoUrls;

    const { error } = await supabase
      .from("memories")
      .update(patch)
      .eq("id", memoryId);

    if (error) {
      console.error("Error updating memory:", error.message);
      toast.error("Failed to update memory.");

      return;
    }

    await loadMemories();
    toast.success("Memory updated successfully!");
  };

  const deleteMemory = async (
    memoryId: string,
    memoryData: Partial<Memory>,
  ) => {
    if (!user) {
      toast.error("You must be logged in to delete memories.");

      return;
    }

    try {
      const urls = [
        ...(memoryData.imageUrls || []),
        ...(memoryData.videoUrls || []),
      ];

      if (memoryData.voiceMessageUrl) urls.push(memoryData.voiceMessageUrl);

      await Promise.allSettled(urls.map((u) => deleteMediaByUrl(u)));

      const { error } = await supabase
        .from("memories")
        .delete()
        .eq("id", memoryId);

      if (error) throw error;

      toast.success("Memory deleted successfully!");
      await loadMemories();
    } catch (error) {
      console.error("Error deleting memory:", error);
      toast.error("Failed to delete memory.");
      throw error;
    }
  };

  const refreshMemories = useCallback(() => {
    if (user) {
      setLoading(true);
      loadMemories();
    }
  }, [user, loadMemories]);

  useEffect(() => {
    if (user) loadMemories();
    else {
      setMemories([]);
      setLoading(false);
    }
  }, [user, loadMemories]);

  return {
    memories,
    loading,
    error,
    addMemory,
    updateMemory,
    deleteMemory,
    refreshMemories,
    recordUnlock,
  };
};
