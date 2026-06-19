"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FaArrowLeft, FaLock, FaRegClock } from "react-icons/fa6";
import { HiLocationMarker, HiX, HiTrash, HiChevronRight } from "react-icons/hi";

import { supabase } from "@/libs/supabaseClient";
import { deleteMediaByUrl } from "@/libs/supabaseStorage";
import { Loading, Avatar } from "@/components";
import MediaPopup from "@/components/ui/MediaPopup";

interface Row {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  image_urls: string[] | null;
  video_urls: string[] | null;
  voice_message_url: string | null;
  created_at: string;
  unlock_at: string | null;
  created_by_username: string | null;
  created_by_photo_url: string | null;
}

interface FriendGroup {
  uid: string;
  name: string;
  photo: string;
  items: Row[];
}

const SELECT =
  "id, user_id, title, notes, image_urls, video_urls, voice_message_url, created_at, unlock_at, created_by_username, created_by_photo_url";

const countdown = (d: Date): string => {
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);

  if (days <= 0) return "Unlocking now";
  if (days === 1) return "Unlocks tomorrow";
  if (days < 31) return `Unlocks in ${days} days`;

  return `Unlocks in ~${Math.round(days / 30)} month(s)`;
};

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const isSealed = (r: Row) =>
  !!r.unlock_at && new Date(r.unlock_at) > new Date();

const MemoryCard = ({
  row,
  onOpen,
}: {
  row: Row;
  onOpen: (r: Row) => void;
}) => {
  const sealed = isSealed(row);

  return (
    <button
      className="glass flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-white/5"
      type="button"
      onClick={() => onOpen(row)}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-raised">
        {sealed ? (
          <FaLock className="text-accent" />
        ) : row.image_urls && row.image_urls[0] ? (
          <img
            alt=""
            className="h-full w-full object-cover"
            src={row.image_urls[0]}
          />
        ) : (
          <HiLocationMarker className="h-5 w-5 text-ink-faint" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{row.title}</p>
        <p className="text-xs text-ink-faint">
          {sealed && row.unlock_at
            ? countdown(new Date(row.unlock_at))
            : fmtDate(row.created_at)}
        </p>
      </div>
    </button>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-2">
    <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
      {title}
    </h2>
    {children}
  </section>
);

export default function MemoriesPage() {
  const [loading, setLoading] = useState(true);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [discovered, setDiscovered] = useState<Row[]>([]);
  const [openFriend, setOpenFriend] = useState<FriendGroup | null>(null);
  const [selected, setSelected] = useState<Row | null>(null);
  const [popup, setPopup] = useState<{
    url: string;
    type: "image" | "video";
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);

        return;
      }
      setSelfId(user.id);

      const { data: own } = await supabase
        .from("memories")
        .select(SELECT)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setRows((own as Row[]) ?? []);

      const { data: unlocks } = await supabase
        .from("memory_unlocks")
        .select("memory_id")
        .eq("user_id", user.id);
      const ids = (unlocks ?? []).map(
        (u: { memory_id: string }) => u.memory_id,
      );

      if (ids.length) {
        const { data: disc } = await supabase
          .from("memories")
          .select(SELECT)
          .in("id", ids)
          .neq("user_id", user.id);

        setDiscovered((disc as Row[]) ?? []);
      }

      setLoading(false);
    };

    load();
  }, []);

  const handleDelete = async (row: Row) => {
    if (!window.confirm("Delete this capsule? This cannot be undone.")) return;

    setDeleting(true);
    try {
      const urls = [...(row.image_urls || []), ...(row.video_urls || [])];

      if (row.voice_message_url) urls.push(row.voice_message_url);
      await Promise.allSettled(urls.map((u) => deleteMediaByUrl(u)));

      const { error } = await supabase
        .from("memories")
        .delete()
        .eq("id", row.id);

      if (error) throw error;

      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setSelected(null);
      toast.success("Capsule deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete capsule.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loading />;

  const now = new Date();
  const onThisDay = rows.filter((r) => {
    const d = new Date(r.created_at);

    return (
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate() &&
      d.getFullYear() < now.getFullYear()
    );
  });

  const friendMap: Record<string, FriendGroup> = {};

  discovered.forEach((r) => {
    if (!friendMap[r.user_id]) {
      friendMap[r.user_id] = {
        uid: r.user_id,
        name: r.created_by_username || "Someone",
        photo: r.created_by_photo_url || "",
        items: [],
      };
    }
    friendMap[r.user_id].items.push(r);
  });
  const friends = Object.values(friendMap);

  const sealedSelected = selected ? isSealed(selected) : false;
  const ownSelected = selected ? selected.user_id === selfId : false;
  const empty = rows.length === 0 && discovered.length === 0;

  return (
    <div className="min-h-screen bg-background text-ink">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <Link aria-label="Back" className="ctrl-btn h-10 w-10" href="/">
            <FaArrowLeft className="h-4 w-4 text-ink" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Memories</h1>
        </div>

        {empty ? (
          <div className="glass mt-6 flex flex-col items-center gap-2 rounded-3xl p-8 text-center">
            <FaRegClock className="h-8 w-8 text-ink-faint" />
            <p className="font-medium text-ink">No capsules yet</p>
            <p className="text-sm text-ink-faint">
              Create your first time capsule on the map, or unlock a
              friend&apos;s when you&apos;re near it — they&apos;ll all show up
              here.
            </p>
          </div>
        ) : (
          <>
            {onThisDay.length > 0 && (
              <Section title="On this day">
                <div className="space-y-2">
                  {onThisDay.map((r) => (
                    <MemoryCard key={r.id} row={r} onOpen={setSelected} />
                  ))}
                </div>
              </Section>
            )}

            {friends.length > 0 && (
              <Section title="Discovered from friends">
                <div className="space-y-2">
                  {friends.map((f) => (
                    <button
                      key={f.uid}
                      className="glass flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-white/5"
                      type="button"
                      onClick={() => setOpenFriend(f)}
                    >
                      <Avatar
                        className="ring-1 ring-line"
                        size={48}
                        src={f.photo}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">
                          {f.name}
                        </p>
                        <p className="text-xs text-ink-faint">
                          {f.items.length} unlocked{" "}
                          {f.items.length === 1 ? "memory" : "memories"}
                        </p>
                      </div>
                      <HiChevronRight className="h-5 w-5 text-ink-faint" />
                    </button>
                  ))}
                </div>
              </Section>
            )}

            {rows.length > 0 && (
              <Section title="Your capsules">
                <div className="space-y-2">
                  {rows.map((r) => (
                    <MemoryCard key={r.id} row={r} onOpen={setSelected} />
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </div>

      {/* Friend drill-in */}
      {openFriend && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
          onClick={() => setOpenFriend(null)}
        >
          <div
            className="glass-strong thin-scroll max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto rounded-t-3xl p-6 text-ink shadow-glass-lg sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <button
                aria-label="Back"
                className="ctrl-btn h-9 w-9"
                onClick={() => setOpenFriend(null)}
              >
                <FaArrowLeft className="h-4 w-4 text-ink" />
              </button>
              <Avatar
                className="ring-1 ring-line"
                size={40}
                src={openFriend.photo}
              />
              <div>
                <p className="font-semibold text-ink">{openFriend.name}</p>
                <p className="text-xs text-ink-faint">
                  {openFriend.items.length} unlocked
                </p>
              </div>
            </div>
            <div className="space-y-2 pt-1">
              {openFriend.items.map((r) => (
                <MemoryCard key={r.id} row={r} onOpen={setSelected} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Capsule detail */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelected(null)}
        >
          <div
            className="glass-strong thin-scroll relative max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-3xl p-6 text-ink shadow-glass-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close"
              className="ctrl-btn absolute right-4 top-4 h-9 w-9"
              onClick={() => setSelected(null)}
            >
              <HiX className="h-5 w-5 text-ink" />
            </button>

            <h3 className="pr-10 text-lg font-bold">{selected.title}</h3>
            <p className="text-xs text-ink-faint">
              {ownSelected
                ? fmtDate(selected.created_at)
                : `by ${selected.created_by_username || "a friend"} · ${fmtDate(selected.created_at)}`}
            </p>

            {sealedSelected ? (
              <div className="flex w-full flex-col items-center gap-1 rounded-xl border border-accent/30 bg-accent/10 p-4 text-center">
                <FaLock className="text-accent" />
                <p className="font-semibold text-ink">
                  Sealed until{" "}
                  {selected.unlock_at
                    ? new Date(selected.unlock_at).toLocaleDateString()
                    : ""}
                </p>
                <p className="text-sm text-ink-muted">
                  {selected.unlock_at
                    ? countdown(new Date(selected.unlock_at))
                    : ""}
                </p>
              </div>
            ) : (
              <>
                {selected.notes && (
                  <p className="text-sm text-ink-muted">{selected.notes}</p>
                )}
                {(selected.image_urls || []).map((url, i) => (
                  <div
                    key={`img-${i}`}
                    className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg"
                    onClick={() => setPopup({ url, type: "image" })}
                  >
                    <img
                      alt=""
                      className="h-full w-full object-cover"
                      src={url}
                    />
                  </div>
                ))}
                {(selected.video_urls || []).map((url, i) => (
                  <video
                    key={`vid-${i}`}
                    controls
                    className="aspect-video w-full rounded-lg object-cover"
                  >
                    <source src={url} type="video/mp4" />
                  </video>
                ))}
                {selected.voice_message_url && (
                  <audio
                    controls
                    className="w-full"
                    src={selected.voice_message_url}
                  />
                )}
              </>
            )}

            {ownSelected && (
              <button
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-500/40 px-4 py-2.5 font-medium text-red-400 transition-colors hover:bg-red-500/15 disabled:opacity-50"
                disabled={deleting}
                type="button"
                onClick={() => handleDelete(selected)}
              >
                <HiTrash className="inline h-5 w-5" />
                {deleting ? "Deleting..." : "Delete capsule"}
              </button>
            )}
          </div>
        </div>
      )}

      {popup && (
        <MediaPopup
          mediaType={popup.type}
          mediaUrl={popup.url}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}
