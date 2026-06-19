-- Reminiscape — enable Realtime for reactions & comments
-- Run once in Supabase → SQL Editor. Safe to re-run (idempotent).
--
-- This lets clients receive live INSERT/UPDATE/DELETE events for the capsule
-- they're viewing. RLS still applies: a user only receives events for rows they
-- are allowed to read (see sql/interactions.sql).

-- 1) Add the tables to the Realtime publication (guarded so re-runs don't error).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'memory_reactions'
  ) then
    alter publication supabase_realtime add table public.memory_reactions;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'memory_comments'
  ) then
    alter publication supabase_realtime add table public.memory_comments;
  end if;
end $$;

-- 2) REPLICA IDENTITY FULL so DELETE/UPDATE events include the full old row.
--    The client filters live events by `memory_id`; without this, a comment
--    DELETE would only carry its primary key (id) and the filter wouldn't match.
alter table public.memory_reactions replica identity full;
alter table public.memory_comments  replica identity full;
