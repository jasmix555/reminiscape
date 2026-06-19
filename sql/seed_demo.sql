-- ============================================================================
-- Reminiscape — DEMO SEED  (dummy friends + worldwide capsules + interactions)
-- ----------------------------------------------------------------------------
-- Run once in Supabase → SQL Editor. Idempotent (fixed UUIDs + ON CONFLICT),
-- so re-running won't duplicate. Remove everything later with
-- sql/seed_demo_teardown.sql.
--
-- It creates 16 dummy users, befriends them to the owner account below
-- (14 mutual friends + 2 pending friend requests), scatters ~70 capsules
-- across Japan (dense around Osaka & Kobe) with placeholder photos, adds a few
-- of the owner's own
-- capsules (incl. "On this day"), and seeds reactions + comments. Unlock state
-- is mixed: most pre-unlocked for the owner, some proximity-locked, a few
-- time-sealed.
--
-- NOTE: inserting into auth.users can vary slightly by Supabase version. If a
-- column error appears, add/remove the offending column in section 1.
-- ============================================================================

-- Owner account these dummies revolve around. It is hardcoded as
-- 'ng-j@dentsupromotion.co.jp' in the blocks below — find/replace it if you
-- want to seed for a different signed-up account.
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1) Dummy users (auth.users) + profiles
-- ----------------------------------------------------------------------------
do $$
declare
  rec record;
  dummies jsonb := '[
    {"id":"d0000000-0000-4000-8000-000000000001","email":"demo+aoi@reminiscape.app","username":"aoi_tanaka","photo":"https://i.pravatar.cc/150?img=1","bio":"Chasing sunsets and ramen."},
    {"id":"d0000000-0000-4000-8000-000000000002","email":"demo+haruto@reminiscape.app","username":"haruto_sato","photo":"https://i.pravatar.cc/150?img=12","bio":"Trains, trails, and film cameras."},
    {"id":"d0000000-0000-4000-8000-000000000003","email":"demo+mei@reminiscape.app","username":"mei_suzuki","photo":"https://i.pravatar.cc/150?img=5","bio":"Coffee first, then the world."},
    {"id":"d0000000-0000-4000-8000-000000000004","email":"demo+ren@reminiscape.app","username":"ren_takahashi","photo":"https://i.pravatar.cc/150?img=15","bio":"Always one more mountain."},
    {"id":"d0000000-0000-4000-8000-000000000005","email":"demo+yuna@reminiscape.app","username":"yuna_kim","photo":"https://i.pravatar.cc/150?img=9","bio":"Seoul to everywhere."},
    {"id":"d0000000-0000-4000-8000-000000000006","email":"demo+liam@reminiscape.app","username":"liam_walker","photo":"https://i.pravatar.cc/150?img=33","bio":"Surf, repeat."},
    {"id":"d0000000-0000-4000-8000-000000000007","email":"demo+olivia@reminiscape.app","username":"olivia_brown","photo":"https://i.pravatar.cc/150?img=20","bio":"Museums and tiny cafes."},
    {"id":"d0000000-0000-4000-8000-000000000008","email":"demo+noah@reminiscape.app","username":"noah_martin","photo":"https://i.pravatar.cc/150?img=52","bio":"Maps nerd."},
    {"id":"d0000000-0000-4000-8000-000000000009","email":"demo+emma@reminiscape.app","username":"emma_dubois","photo":"https://i.pravatar.cc/150?img=24","bio":"Paris-based, always packing."},
    {"id":"d0000000-0000-4000-8000-000000000010","email":"demo+lucas@reminiscape.app","username":"lucas_rossi","photo":"https://i.pravatar.cc/150?img=53","bio":"Pasta, piazzas, Vespas."},
    {"id":"d0000000-0000-4000-8000-000000000011","email":"demo+sofia@reminiscape.app","username":"sofia_garcia","photo":"https://i.pravatar.cc/150?img=16","bio":"Dancing through cities."},
    {"id":"d0000000-0000-4000-8000-000000000012","email":"demo+mateo@reminiscape.app","username":"mateo_fernandez","photo":"https://i.pravatar.cc/150?img=60","bio":"Football and street food."},
    {"id":"d0000000-0000-4000-8000-000000000013","email":"demo+chloe@reminiscape.app","username":"chloe_nguyen","photo":"https://i.pravatar.cc/150?img=44","bio":"Collecting skylines."},
    {"id":"d0000000-0000-4000-8000-000000000014","email":"demo+arjun@reminiscape.app","username":"arjun_patel","photo":"https://i.pravatar.cc/150?img=68","bio":"Trains, temples, tea."},
    {"id":"d0000000-0000-4000-8000-000000000015","email":"demo+hana@reminiscape.app","username":"hana_park","photo":"https://i.pravatar.cc/150?img=47","bio":"New here, say hi!"},
    {"id":"d0000000-0000-4000-8000-000000000016","email":"demo+ethan@reminiscape.app","username":"ethan_clark","photo":"https://i.pravatar.cc/150?img=59","bio":"Long walks, longer flights."}
  ]';
begin
  for rec in
    select * from jsonb_to_recordset(dummies)
      as x(id uuid, email text, username text, photo text, bio text)
  loop
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    )
    values (
      rec.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      rec.email, crypt('demo-password-123', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb
    )
    on conflict (id) do nothing;

    -- The on_auth_user_created trigger creates a bare profile; enrich it here.
    insert into public.profiles (id, email, username, photo_url, bio)
    values (rec.id, rec.email, rec.username, rec.photo, rec.bio)
    on conflict (id) do update
      set username = excluded.username,
          photo_url = excluded.photo_url,
          bio = excluded.bio;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 2) Friendships
--    - all 16 dummies are mutual friends with each other (rich social world)
--    - 14 are mutual friends with the owner; the last 2 send the owner a
--      pending friend request instead (to populate the Requests tab)
-- ----------------------------------------------------------------------------
do $$
declare
  me uuid;
  all_ids uuid[];
  friend_ids uuid[];
  pending_ids uuid[];
  n int;
begin
  select id into me from auth.users where email = 'ng-j@dentsupromotion.co.jp';
  if me is null then
    raise notice 'Owner account not found — skipping friend links. Sign up first, then re-run.';
    return;
  end if;

  all_ids := array(
    select id from public.profiles
    where email like 'demo+%@reminiscape.app'
    order by email
  );
  n := array_length(all_ids, 1);
  if n is null then return; end if;

  friend_ids  := all_ids[1 : greatest(n - 2, 0)];
  pending_ids := all_ids[greatest(n - 1, 1) : n];

  -- full mesh among dummies
  update public.profiles p
    set friends = array(
      select distinct unnest(coalesce(p.friends, '{}') || array_remove(all_ids, p.id))
    )
  where p.id = any(all_ids);

  -- mutual friends with owner
  update public.profiles
    set friends = array(select distinct unnest(coalesce(friends, '{}') || friend_ids))
  where id = me;

  update public.profiles p
    set friends = array(select distinct unnest(coalesce(p.friends, '{}') || array[me]))
  where p.id = any(friend_ids);

  -- pending requests TO the owner from the last 2 dummies
  update public.profiles
    set friend_requests = array(select distinct unnest(coalesce(friend_requests, '{}') || pending_ids))
  where id = me;
end $$;

-- ----------------------------------------------------------------------------
-- 3) ~70 capsules across Japan (owned by the owner's dummy friends)
-- ----------------------------------------------------------------------------
with owners as (
  -- the 14 dummies that are mutual friends with the owner (exclude last 2)
  select id, username, photo_url,
         row_number() over (order by email) as rn,
         count(*) over () as total
  from public.profiles
  where email like 'demo+%@reminiscape.app'
),
owners14 as (
  select id, username, photo_url, row_number() over (order by rn) as rn
  from owners where rn <= total - 2
),
cities(idx, city, lat, lng) as (
  values
    -- Osaka (dense, for nearby proximity testing)
    (1,'Dotonbori',34.6687,135.5030),(2,'Namba',34.6659,135.5016),(3,'Umeda',34.7025,135.4959),
    (4,'Osaka Castle',34.6873,135.5259),(5,'Shinsekai',34.6524,135.5063),(6,'Tennoji',34.6464,135.5135),
    (7,'Tsutenkaku',34.6525,135.5065),(8,'Nakanoshima',34.6930,135.4920),(9,'Abeno Harukas',34.6458,135.5136),
    (10,'Universal Studios Japan',34.6654,135.4323),(11,'Sumiyoshi Taisha',34.6126,135.4933),(12,'Kuromon Market',34.6647,135.5066),
    (13,'Amerikamura',34.6717,135.4969),(14,'Shitennoji',34.6543,135.5166),(15,'Tempozan Ferris Wheel',34.6580,135.4310),
    -- Kobe (dense, for nearby proximity testing)
    (16,'Kobe Harborland',34.6790,135.1790),(17,'Meriken Park',34.6826,135.1880),(18,'Kitano Ijinkan',34.7010,135.1900),
    (19,'Sannomiya',34.6940,135.1930),(20,'Mount Rokko',34.7783,135.2622),(21,'Nunobiki Herb Garden',34.7060,135.1860),
    (22,'Akashi Kaikyo Bridge',34.6178,135.0210),(23,'Arima Onsen',34.7975,135.2480),(24,'Ikuta Shrine',34.6948,135.1899),
    (25,'Kobe Port Tower',34.6822,135.1860),(26,'Suma Beach',34.6420,135.1230),(27,'Maiko',34.6330,135.0360),
    -- Kyoto
    (28,'Kiyomizu-dera',34.9949,135.7850),(29,'Fushimi Inari',34.9671,135.7727),(30,'Arashiyama',35.0094,135.6669),
    (31,'Kinkaku-ji',35.0394,135.7292),(32,'Gion',35.0037,135.7752),(33,'Nijo Castle',35.0142,135.7481),
    (34,'Kyoto Station',34.9858,135.7588),(35,'Philosophers Path',35.0270,135.7949),
    -- Nara
    (36,'Nara Park',34.6851,135.8048),(37,'Todai-ji',34.6890,135.8398),(38,'Kasuga Taisha',34.6818,135.8483),
    (39,'Horyu-ji',34.6143,135.7345),
    -- Tokyo & Kanto
    (40,'Shibuya',35.6595,139.7005),(41,'Shinjuku',35.6896,139.6917),(42,'Asakusa',35.7148,139.7967),
    (43,'Tokyo Tower',35.6586,139.7454),(44,'Akihabara',35.7022,139.7745),(45,'Odaiba',35.6300,139.7800),
    (46,'Harajuku',35.6702,139.7027),(47,'Tokyo Skytree',35.7101,139.8107),(48,'Yokohama Minato Mirai',35.4550,139.6380),
    (49,'Kamakura Daibutsu',35.3168,139.5360),
    -- Central & western Honshu
    (50,'Mount Fuji 5th Station',35.3606,138.7274),(51,'Hakone',35.2329,139.1069),(52,'Nagoya Castle',35.1856,136.8997),
    (53,'Kenrokuen Kanazawa',36.5620,136.6626),(54,'Shirakawa-go',36.2580,136.9060),(55,'Hiroshima Peace Park',34.3955,132.4536),
    (56,'Miyajima',34.2960,132.3197),(57,'Himeji Castle',34.8394,134.6939),
    -- Shikoku & Kyushu
    (58,'Dogo Onsen',33.8520,132.7860),(59,'Naoshima',34.4610,133.9950),(60,'Fukuoka Tenjin',33.5900,130.3990),
    (61,'Beppu Onsen',33.2790,131.5000),(62,'Nagasaki Peace Park',32.7730,129.8640),(63,'Kumamoto Castle',32.8060,130.7060),
    -- Hokkaido, Tohoku & Okinawa
    (64,'Sapporo Odori',43.0590,141.3470),(65,'Otaru Canal',43.1980,140.9940),(66,'Hakodate',41.7687,140.7288),
    (67,'Matsushima',38.3680,141.0600),(68,'Aomori Nebuta',40.8246,140.7406),(69,'Okinawa Churaumi',26.6940,127.8780),
    (70,'Shurijo Naha',26.2170,127.7190)
),
caps as (
  select c.idx, c.city, c.lat, c.lng, o.id as owner_id, o.username, o.photo_url
  from cities c
  join owners14 o
    on o.rn = ((c.idx - 1) % (select count(*) from owners14)) + 1
)
insert into public.memories (
  id, user_id, title, notes, description, latitude, longitude,
  image_urls, video_urls, voice_message_url, is_unlocked,
  created_by_username, created_by_photo_url, unlock_at, created_at
)
select
  ('10000000-0000-0000-0000-0000000000' || lpad(idx::text, 2, '0'))::uuid,
  owner_id,
  (array['A day in ','Sunset over ','Lost in ','Coffee in ','Rainy night in ',
         'First time in ','Goodbye to ','Hidden corners of '])[1 + (idx % 8)] || city,
  (array['Wish you were here.','Never want to forget this place.','The light was perfect.',
         'We laughed for hours.','Found this little spot by accident.',
         'One of those days you keep forever.','Back here someday, promise.'])[1 + (idx % 7)],
  '',
  lat, lng,
  array['https://picsum.photos/seed/reminiscape' || idx || '/800/600'],
  '{}', '', false,
  username, photo_url,
  -- a handful are time-sealed into the future
  case when idx % 14 = 5 then now() + ((idx % 5 + 1) || ' months')::interval else null end,
  now() - ((idx * 3) || ' days')::interval
from caps
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 4) A few of the OWNER's own capsules (incl. two "On this day")
-- ----------------------------------------------------------------------------
insert into public.memories (
  id, user_id, title, notes, description, latitude, longitude,
  image_urls, video_urls, voice_message_url, is_unlocked,
  created_by_username, created_by_photo_url, unlock_at, created_at
)
select
  ('20000000-0000-0000-0000-0000000000' || lpad(v.idx::text, 2, '0'))::uuid,
  p.id, v.title, v.notes, '', v.lat, v.lng,
  array['https://picsum.photos/seed/reminiscape-me' || v.idx || '/800/600'],
  '{}', '', true,
  coalesce(p.username, 'me'), coalesce(p.photo_url, ''), v.unlock_at, v.created_at
from public.profiles p,
  (values
    (1,'Morning in Osaka','Home. Dotonbori lights.',34.6687,135.5030, null::timestamptz, now() - interval '1 year'),
    (2,'Kyoto in autumn','That red-maple year.',35.0116,135.7681, null, now() - interval '3 years'),
    (3,'Okinawa blue','Bluest water I have ever seen.',26.3344,127.8056, null, now() - interval '40 days'),
    (4,'Note to future me','Open this next spring.',34.6937,135.5023, now() + interval '4 months', now() - interval '5 days'),
    (5,'Nara deer park','They bowed for crackers.',34.6851,135.8048, null, now() - interval '90 days')
  ) as v(idx, title, notes, lat, lng, unlock_at, created_at)
where p.email = 'ng-j@dentsupromotion.co.jp'
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 5) Unlock ledger — owner "discovers" ~75% of friends' (non-sealed) capsules
-- ----------------------------------------------------------------------------
insert into public.memory_unlocks (user_id, memory_id)
select me.id, m.id
from public.memories m
cross join (select id from auth.users where email = 'ng-j@dentsupromotion.co.jp') me
where m.user_id <> me.id
  and m.unlock_at is null                                            -- not sealed
  and (get_byte(decode(md5(m.id::text), 'hex'), 0) % 4) <> 0          -- ~75%
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 6) Reactions — one emoji per (memory, person), ~1/3 of viewers react
--    Emoji built from code points so they exactly match REACTION_EMOJIS in TS.
-- ----------------------------------------------------------------------------
insert into public.memory_reactions (memory_id, user_id, emoji)
select
  m.id, u.id,
  (array[
    chr(10084) || chr(65039),  -- ❤️
    chr(128514),               -- 😂
    chr(128558),               -- 😮
    chr(128546),               -- 😢
    chr(128293),               -- 🔥
    chr(128077)                -- 👍
  ])[1 + (get_byte(decode(md5(m.id::text || u.id::text), 'hex'), 0) % 6)]
from public.memories m
join public.profiles u on u.id <> m.user_id
where m.unlock_at is null                                             -- not sealed
  and (get_byte(decode(md5(m.id::text || u.id::text), 'hex'), 1) % 3) = 0
on conflict (memory_id, user_id) do nothing;

-- ----------------------------------------------------------------------------
-- 7) Comments — up to one per (memory, person), ~1/4 of viewers comment
-- ----------------------------------------------------------------------------
insert into public.memory_comments (id, memory_id, user_id, body, author_username, author_photo_url, created_at)
select
  md5(m.id::text || u.id::text)::uuid,
  m.id, u.id,
  (array['So jealous right now!','This is gorgeous.','Take me with you next time.',
         'I remember this spot!','Adding this to my list.','Best trip ever.',
         'The colors are unreal.','Miss this place so much.','Okay this is stunning.',
         'Need to go here.'])[1 + (get_byte(decode(md5(m.id::text || u.id::text), 'hex'), 2) % 10)],
  u.username, u.photo_url,
  m.created_at + interval '1 day'
from public.memories m
join public.profiles u on u.id <> m.user_id
where m.unlock_at is null                                             -- not sealed
  and (get_byte(decode(md5(m.id::text || u.id::text), 'hex'), 3) % 4) = 0
on conflict (id) do nothing;

-- Done. Reload the app: the map should fill with markers across Japan, the Friends
-- tab shows 14 friends + 2 requests, and unlocked capsules show reactions/comments.
