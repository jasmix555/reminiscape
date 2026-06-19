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

-- 1) Remove dummy users (cascades through profiles and all their content).
delete from auth.users where email like 'demo+%@reminiscape.app';

-- 2) Remove the owner's seeded demo capsules (fixed 2000... id prefix).
delete from public.memories
where id::text like '20000000-0000-0000-0000-%';

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
