-- ============================================================================
-- Reminiscape — DEMO SEED TEARDOWN
-- ----------------------------------------------------------------------------
-- Removes everything created by sql/seed_demo.sql. Safe to re-run.
--
-- Deleting the dummy auth.users cascades to their profiles → memories →
-- reactions / comments / unlocks (all FKs are ON DELETE CASCADE). We then
-- delete the owner's seeded capsules and prune any dangling ids left in the
-- owner's friends / friend_requests arrays (arrays aren't foreign keys).
-- ============================================================================

-- 1) Remove dummy users AND the public demo account (cascades through their
--    profiles and all their content: capsules, reactions, comments, unlocks).
delete from auth.users
where email like 'demo+%@reminiscape.app'
   or email = 'demo@reminiscape.app';

-- 2) Remove the real owner's seeded "own" capsules (deterministic md5 ids).
--    Only these 5 are removed — the owner's genuine capsules are untouched.
delete from public.memories
where id in (
  select md5(o || 'me' || g::text)::uuid
  from unnest(array['8e562b39-9767-49bd-8450-8ea53358906b']) as o,
       generate_series(1, 5) as g
);

-- 3) Prune friend/request arrays that point at now-deleted profiles.
update public.profiles p set
  friends = array(
    select unnest(p.friends)
    intersect
    select id from public.profiles
  ),
  friend_requests = array(
    select unnest(p.friend_requests)
    intersect
    select id from public.profiles
  )
where p.friends <> '{}' or p.friend_requests <> '{}';

-- Done. The demo data is gone; real accounts and their data are untouched.
