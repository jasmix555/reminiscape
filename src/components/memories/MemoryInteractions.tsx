import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { HiTrash } from "react-icons/hi";
import { FiSend } from "react-icons/fi";

import Avatar from "../ui/Avatar";

import { useMemoryInteractions } from "@/hooks";
import { REACTION_EMOJIS } from "@/types";

interface MemoryInteractionsProps {
  memoryId: string;
  /** The memory creator's uid — lets the owner moderate any comment. */
  ownerId: string;
}

const timeAgo = (d: Date) => {
  try {
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "";
  }
};

const MemoryInteractions: React.FC<MemoryInteractionsProps> = ({
  memoryId,
  ownerId,
}) => {
  const { reactions, comments, selfId, react, addComment, deleteComment } =
    useMemoryInteractions(memoryId);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const body = draft.trim();

    if (!body || sending) return;

    setSending(true);
    await addComment(body);
    setDraft("");
    setSending(false);
  };

  return (
    <div className="space-y-4 border-t border-line pt-4">
      {/* Reaction bar */}
      <div className="flex flex-wrap gap-2">
        {REACTION_EMOJIS.map((emoji) => {
          const count = reactions.counts[emoji] ?? 0;
          const active = reactions.mine === emoji;

          return (
            <button
              key={emoji}
              aria-label={`React ${emoji}`}
              aria-pressed={active}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-accent bg-accent/15 text-ink"
                  : "border-line bg-surface-raised text-ink-muted hover:bg-white/10"
              }`}
              type="button"
              onClick={() => react(emoji)}
            >
              <span className="text-base leading-none">{emoji}</span>
              {count > 0 && (
                <span className="text-xs font-medium tabular-nums">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Comments */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-ink-faint">
            No comments yet — be the first to say something.
          </p>
        ) : (
          comments.map((c) => {
            const canDelete = c.userId === selfId || selfId === ownerId;

            return (
              <div key={c.id} className="flex items-start gap-2.5">
                <Avatar
                  className="ring-1 ring-line"
                  size={32}
                  src={c.authorPhotoUrl}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-sm font-medium text-ink">
                      {c.authorUsername}
                    </span>
                    <span className="shrink-0 text-xs text-ink-faint">
                      {timeAgo(c.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm text-ink-muted">
                    {c.body}
                  </p>
                </div>
                {canDelete && (
                  <button
                    aria-label="Delete comment"
                    className="shrink-0 text-ink-faint transition-colors hover:text-red-400"
                    type="button"
                    onClick={() => deleteComment(c.id)}
                  >
                    <HiTrash className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="flex items-center gap-2">
        <input
          className="flex-1 rounded-full border border-line bg-surface-raised px-4 py-2.5 text-sm text-ink placeholder-ink-faint outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent"
          maxLength={500}
          placeholder="Add a comment…"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          aria-label="Send comment"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-black transition-colors hover:bg-accent-soft disabled:opacity-50"
          disabled={!draft.trim() || sending}
          type="button"
          onClick={submit}
        >
          <FiSend className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default MemoryInteractions;
