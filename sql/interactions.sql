-- Reminiscape — reactions & comments
-- Run this once in Supabase → SQL Editor. Safe to re-run (idempotent).
--
-- Model:
--   * Reactions  : one emoji per person per memory (tap again to change/remove).
--   * Comments   : flat list, max 500 chars.
--   * Visibility : the memory's creator + anyone who has unlocked the capsule
--                  (by proximity or time) can read and post. Sealed (time-locked,
--                  not yet open) capsules accept no reactions/comments.

-- ---------- Prerequisites used by the policies below ----------
-- These exist in the running app but were added after the original setup doc,
-- so we (re)ensure them here to keep this migration self-contained.

alter table public.memories
  add column if not exists unlock_at timestamptz;

create table if not exists public.memory_unlocks (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  memory_id  uuid not null references public.memories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, memory_id)
);

alter table public.memory_unlocks enable row level security;

drop policy if exists "read own unlocks" on public.memory_unlocks;
create policy "read own unlocks"
  on public.memory_unlocks for select
  using (auth.uid() = user_id);

drop policy if exists "create own unlocks" on public.memory_unlocks;
create policy "create own unlocks"
  on public.memory_unlocks for insert
  with check (auth.uid() = user_id);

-- ---------- Eligibility helper ----------
-- True when the signed-in user may interact with a given memory: it is open
-- (not sealed in the future) AND they either own it or have unlocked it.
create or replace function public.can_interact_with_memory(mid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.memories m
    where m.id = mid
      and (m.unlock_at is null or m.unlock_at <= now())
      and (
        m.user_id = auth.uid()
        or exists (
          select 1 from public.memory_unlocks u
          where u.memory_id = m.id and u.user_id = auth.uid()
        )
      )
  );
$$;

-- ---------- REACTIONS ----------
create table if not exists public.memory_reactions (
  memory_id  uuid not null references public.memories(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  primary key (memory_id, user_id)               -- one reaction per person
);

alter table public.memory_reactions enable row level security;

drop policy if exists "read reactions on visible memories" on public.memory_reactions;
create policy "read reactions on visible memories"
  on public.memory_reactions for select
  using (public.can_interact_with_memory(memory_id));

drop policy if exists "add own reaction" on public.memory_reactions;
create policy "add own reaction"
  on public.memory_reactions for insert
  with check (user_id = auth.uid() and public.can_interact_with_memory(memory_id));

drop policy if exists "change own reaction" on public.memory_reactions;
create policy "change own reaction"
  on public.memory_reactions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "remove own reaction" on public.memory_reactions;
create policy "remove own reaction"
  on public.memory_reactions for delete
  using (user_id = auth.uid());

-- ---------- COMMENTS ----------
create table if not exists public.memory_comments (
  id                uuid primary key default gen_random_uuid(),
  memory_id         uuid not null references public.memories(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  body              text not null check (char_length(body) between 1 and 500),
  author_username   text,
  author_photo_url  text,
  created_at        timestamptz not null default now()
);

create index if not exists memory_comments_memory_id_idx
  on public.memory_comments (memory_id, created_at);

alter table public.memory_comments enable row level security;

drop policy if exists "read comments on visible memories" on public.memory_comments;
create policy "read comments on visible memories"
  on public.memory_comments for select
  using (public.can_interact_with_memory(memory_id));

drop policy if exists "add own comment" on public.memory_comments;
create policy "add own comment"
  on public.memory_comments for insert
  with check (user_id = auth.uid() and public.can_interact_with_memory(memory_id));

-- A comment can be removed by its author OR by the memory's owner (moderation).
drop policy if exists "delete own or owned-memory comment" on public.memory_comments;
create policy "delete own or owned-memory comment"
  on public.memory_comments for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.memories m
      where m.id = memory_comments.memory_id and m.user_id = auth.uid()
    )
  );
