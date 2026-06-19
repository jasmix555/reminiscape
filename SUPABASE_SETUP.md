# Supabase setup (Reminiscape)

Reminiscape now runs entirely on Supabase: **Auth**, **Postgres** (profiles +
memories), and **Storage** (media). Do these four steps once.

## 1. Install the client package

```
npm install @supabase/supabase-js
```

(You can also remove Firebase: `npm remove firebase js-cookie`.)

## 2. Environment variables (.env.local)

From Supabase → Project Settings → API:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
# keep your existing Mapbox vars
NEXT_PUBLIC_MAPBOX_TOKEN=...
NEXT_PUBLIC_MAPBOX_STYLE=...
```

In Supabase → Authentication → URL Configuration, set **Site URL** to
`http://localhost:3000` (and your production URL) so email/OAuth redirects work.

## 3. Database schema + policies

Run this in Supabase → SQL Editor:

```sql
-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  bio text default '',
  photo_url text,
  friends uuid[] not null default '{}',
  friend_requests uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "users manage their own profile"
  on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "users insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- MEMORIES ----------
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  notes text default '',
  description text default '',
  latitude double precision not null,
  longitude double precision not null,
  image_urls text[] not null default '{}',
  video_urls text[] not null default '{}',
  voice_message_url text default '',
  is_unlocked boolean not null default false,
  created_by_username text,
  created_by_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.memories enable row level security;

-- You can see your own memories and those of your friends.
create policy "read own or friends' memories"
  on public.memories for select
  using (
    auth.uid() = user_id
    or user_id in (
      select unnest(friends) from public.profiles where id = auth.uid()
    )
  );

create policy "create own memories"
  on public.memories for insert
  with check (auth.uid() = user_id);

create policy "update own memories"
  on public.memories for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete own memories"
  on public.memories for delete
  using (auth.uid() = user_id);

-- ---------- FRIEND RPCs (security definer keeps array edits safe) ----------
create or replace function public.send_friend_request(target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if target = auth.uid() then return; end if;
  update public.profiles
    set friend_requests = (
      select array(select distinct unnest(friend_requests || array[auth.uid()]))
    )
  where id = target;
end; $$;

create or replace function public.accept_friend_request(sender uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
    set friends = (select array(select distinct unnest(friends || array[sender]))),
        friend_requests = array_remove(friend_requests, sender)
  where id = auth.uid();
  update public.profiles
    set friends = (select array(select distinct unnest(friends || array[auth.uid()])))
  where id = sender;
end; $$;

create or replace function public.decline_friend_request(sender uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set friend_requests = array_remove(friend_requests, sender)
  where id = auth.uid();
end; $$;

create or replace function public.remove_friend(friend uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set friends = array_remove(friends, friend) where id = auth.uid();
  update public.profiles set friends = array_remove(friends, auth.uid()) where id = friend;
end; $$;
```

## 4. Storage bucket

Supabase → Storage → New bucket: name **media**, **Public** = ON. Then add
policies (SQL Editor) so signed-in users can upload and anyone can read:

```sql
create policy "public read media"
  on storage.objects for select using (bucket_id = 'media');

create policy "authenticated upload media"
  on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated');

create policy "authenticated update media"
  on storage.objects for update
  using (bucket_id = 'media' and auth.role() = 'authenticated');

create policy "authenticated delete media"
  on storage.objects for delete
  using (bucket_id = 'media' and auth.role() = 'authenticated');
```

## 5. Google sign-in (optional)

Supabase → Authentication → Providers → Google: enable and paste your Google
OAuth client ID/secret. Add `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
as an authorized redirect URI in Google Cloud Console.

Done — `npm run dev` and s

## 6. Reactions & comments

Memories support Instagram-style interactions: one emoji reaction per person and
flat text comments, visible to the capsule's creator and everyone who has
unlocked it. Run the migration in `sql/interactions.sql` (Supabase → SQL Editor).
It is idempotent and also ensures the `memory_unlocks` table and `unlock_at`
column exist, since the reaction/comment policies depend on them.

## 7. Realtime interactions

Reactions and comments update live while a capsule is open. Run
`sql/realtime.sql` (Supabase → SQL Editor) to add the two tables to the
`supabase_realtime` publication and set `REPLICA IDENTITY FULL` so delete events
carry `memory_id` for client-side filtering. RLS still applies, so users only
receive events for rows they can read. (Realtime is enabled by default on
Supabase projects; no dashboard toggle needed.)
