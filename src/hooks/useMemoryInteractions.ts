import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useAuth } from "./useAuth";

import { supabase } from "@/libs/supabaseClient";
import { MemoryComment, ReactionSummary } from "@/types";

const emptyReactions = (): ReactionSummary => ({
  counts: {},
  total: 0,
  mine: null,
});

const summarize = (
  rows: { user_id: string; emoji: string }[],
  selfId: string | null,
): ReactionSummary => {
  const counts: Record<string, number> = {};
  let mine: string | null = null;

  for (const r of rows) {
    counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
    if (r.user_id === selfId) mine = r.emoji;
  }

  return { counts, total: rows.length, mine };
};

const mapComment = (row: Record<string, any>): MemoryComment => ({
  id: row.id,
  memoryId: row.memory_id,
  userId: row.user_id,
  body: row.body,
  authorUsername: row.author_username ?? "Someone",
  authorPhotoUrl: row.author_photo_url ?? "",
  createdAt: row.created_at ? new Date(row.created_at) : new Date(),
});

/**
 * Loads and mutates reactions + comments for a single memory. Pass `null` (e.g.
 * when the modal is closed or the capsule is still sealed) to stay idle.
 */
export const useMemoryInteractions = (memoryId: string | null) => {
  const { user, profile } = useAuth();
  const [reactions, setReactions] = useState<ReactionSummary>(emptyReactions);
  const [comments, setComments] = useState<MemoryComment[]>([]);
  const [loading, setLoading] = useState(false);

  const selfUid = user?.uid ?? null;

  const loadReactions = useCallback(async () => {
    if (!memoryId) return;

    const { data } = await supabase
      .from("memory_reactions")
      .select("user_id, emoji")
      .eq("memory_id", memoryId);

    setReactions(summarize(data ?? [], selfUid));
  }, [memoryId, selfUid]);

  const loadComments = useCallback(async () => {
    if (!memoryId) return;

    const { data } = await supabase
      .from("memory_comments")
      .select("*")
      .eq("memory_id", memoryId)
      .order("created_at", { ascending: true });

    setComments((data ?? []).map(mapComment));
  }, [memoryId]);

  // Initial load whenever the open memory changes.
  useEffect(() => {
    if (!memoryId) {
      setReactions(emptyReactions());
      setComments([]);

      return;
    }

    setLoading(true);
    Promise.all([loadReactions(), loadComments()]).finally(() =>
      setLoading(false),
    );
  }, [memoryId, loadReactions, loadComments]);

  // Live updates for the open capsule. RLS scopes which events we receive.
  useEffect(() => {
    if (!memoryId) return;

    const filter = `memory_id=eq.${memoryId}`;
    const channel = supabase
      .channel(`memory-interactions:${memoryId}`)
      // Reactions are aggregated, so just refetch the (tiny) set on any change.
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "memory_reactions", filter },
        () => loadReactions(),
      )
      // Comments update granularly to keep the list smooth.
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "memory_comments", filter },
        (payload) => {
          const incoming = mapComment(payload.new);

          setComments((curr) =>
            curr.some((c) => c.id === incoming.id) ? curr : [...curr, incoming],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "memory_comments", filter },
        (payload) => {
          const goneId = (payload.old as { id?: string }).id;

          if (goneId) {
            setComments((curr) => curr.filter((c) => c.id !== goneId));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memoryId, loadReactions]);

  // Tap an emoji: set it, switch to it, or (if it's already yours) clear it.
  const react = async (emoji: string) => {
    if (!user || !memoryId) return;

    const previous = reactions;
    const removing = previous.mine === emoji;

    // Optimistic update.
    setReactions((curr) => {
      const counts = { ...curr.counts };

      if (curr.mine)
        counts[curr.mine] = Math.max(0, (counts[curr.mine] ?? 1) - 1);
      if (!removing) counts[emoji] = (counts[emoji] ?? 0) + 1;
      Object.keys(counts).forEach((k) => counts[k] === 0 && delete counts[k]);

      return {
        counts,
        total: Object.values(counts).reduce((a, b) => a + b, 0),
        mine: removing ? null : emoji,
      };
    });

    const { error } = removing
      ? await supabase
          .from("memory_reactions")
          .delete()
          .eq("memory_id", memoryId)
          .eq("user_id", user.uid)
      : await supabase
          .from("memory_reactions")
          .upsert(
            { memory_id: memoryId, user_id: user.uid, emoji },
            { onConflict: "memory_id,user_id" },
          );

    if (error) {
      console.error("Error saving reaction:", error.message);
      toast.error("Couldn't save your reaction.");
      setReactions(previous); // rollback
    }
  };

  const addComment = async (raw: string) => {
    const body = raw.trim();

    if (!user || !memoryId || !body) return;

    const { data, error } = await supabase
      .from("memory_comments")
      .insert({
        memory_id: memoryId,
        user_id: user.uid,
        body,
        author_username: profile?.username || user.email || "Someone",
        author_photo_url: profile?.photoURL || "",
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error adding comment:", error.message);
      toast.error("Couldn't post your comment.");

      return;
    }

    setComments((curr) => [...curr, mapComment(data)]);
  };

  const deleteComment = async (id: string) => {
    const previous = comments;

    setComments((curr) => curr.filter((c) => c.id !== id)); // optimistic

    const { error } = await supabase
      .from("memory_comments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting comment:", error.message);
      toast.error("Couldn't delete that comment.");
      setComments(previous); // rollback
    }
  };

  return {
    reactions,
    comments,
    loading,
    selfId: user?.uid ?? null,
    react,
    addComment,
    deleteComment,
  };
};
