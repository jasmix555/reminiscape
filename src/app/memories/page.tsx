"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaArrowLeft, FaLock, FaRegClock } from "react-icons/fa6";
import { HiLocationMarker } from "react-icons/hi";

import { supabase } from "@/libs/supabaseClient";
import { Loading } from "@/components";

interface Row {
  id: string;
  title: string;
  notes: string | null;
  image_urls: string[] | null;
  created_at: string;
  unlock_at: string | null;
}

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

const MemoryCard = ({ row, sealed }: { row: Row; sealed?: boolean }) => (
  <div className="glass flex items-center gap-3 rounded-2xl p-3">
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
  </div>
);

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
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);

        return;
      }

      const { data } = await supabase
        .from("memories")
        .select("id, title, notes, image_urls, created_at, unlock_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setRows((data as Row[]) ?? []);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <Loading />;

  const now = new Date();
  const sealed = rows.filter((r) => r.unlock_at && new Date(r.unlock_at) > now);
  const justUnlocked = rows.filter(
    (r) =>
      r.unlock_at &&
      new Date(r.unlock_at) <= now &&
      now.getTime() - new Date(r.unlock_at).getTime() < 30 * 86400000,
  );
  const onThisDay = rows.filter((r) => {
    const d = new Date(r.created_at);

    return (
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate() &&
      d.getFullYear() < now.getFullYear()
    );
  });

  const empty =
    sealed.length === 0 && justUnlocked.length === 0 && onThisDay.length === 0;

  return (
    <div className="min-h-screen bg-background text-ink">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <Link aria-label="Back" className="ctrl-btn h-10 w-10" href="/">
            <FaArrowLeft className="h-4 w-4 text-ink" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Memories</h1>
        </div>

        {empty && (
          <div className="glass mt-6 flex flex-col items-center gap-2 rounded-3xl p-8 text-center">
            <FaRegClock className="h-8 w-8 text-ink-faint" />
            <p className="font-medium text-ink">Nothing resurfaced yet</p>
            <p className="text-sm text-ink-faint">
              Seal time capsules and revisit places — your memories will appear
              here on their anniversaries and when they unlock.
            </p>
          </div>
        )}

        {onThisDay.length > 0 && (
          <Section title="On this day">
            <div className="space-y-2">
              {onThisDay.map((r) => (
                <MemoryCard key={r.id} row={r} />
              ))}
            </div>
          </Section>
        )}

        {justUnlocked.length > 0 && (
          <Section title="Recently unlocked">
            <div className="space-y-2">
              {justUnlocked.map((r) => (
                <MemoryCard key={r.id} row={r} />
              ))}
            </div>
          </Section>
        )}

        {sealed.length > 0 && (
          <Section title="Sealed capsules">
            <div className="space-y-2">
              {sealed.map((r) => (
                <MemoryCard key={r.id} sealed row={r} />
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
