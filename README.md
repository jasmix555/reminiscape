# Reminiscape

> Bury photos, videos and voice notes as **time capsules** pinned to real-world
> places — then rediscover them when you return to the spot or when the seal
> date arrives. Memories you can react to and talk about, not just scroll past.

Reminiscape is a full-stack, mobile-first web app built on **Next.js 15 (App
Router)**, **TypeScript (strict)** and **Supabase**, with an interactive 3D
**Mapbox** map at its core. It reimagines a photo feed as a spatial, social,
time-gated experience shared with close friends.

**Live demo:** _add your Vercel URL here_ · **Repo:** https://github.com/jasmix555/reminiscape

---

## Why it's interesting (for engineers)

A few problems here are more than CRUD, and the codebase solves them deliberately:

- **Content that unlocks by _place_ and _time_.** A friend's capsule stays
  locked until you're physically within 100 m of it (distance via `geolib`), or
  until its seal date passes. Unlocks are persisted in a ledger table so a
  capsule discovered once stays open.
- **Authorization lives in the database, not the client.** Every table is
  protected by Postgres **Row-Level Security**; the React app holds no secrets
  and cannot read a memory it isn't entitled to, even with a forged query.
- **Safe social-graph mutations.** Friend requests/accepts are `SECURITY
DEFINER` Postgres functions, so array edits on another user's profile happen
  atomically server-side instead of via client-trusted writes.
- **Snappy UX over an eventually-consistent backend.** Reactions and comments
  use optimistic updates with rollback on error.
- **A map that scales.** Markers are clustered with **Supercluster** and gated
  by zoom, keeping render cost flat as the dataset grows.

---

## Features

| Area                       | What it does                                                               |
| -------------------------- | -------------------------------------------------------------------------- |
| 🗺️ Spatial capsules        | Create memories pinned to GPS coordinates on a 3D Mapbox map               |
| 📦 Rich media              | Photos, videos and voice notes, uploaded to Supabase Storage with progress |
| 📍 Proximity unlock        | Friends' capsules open only when you're within 100 m of the marker         |
| ⏳ Time-lock               | Seal a capsule until a future date — not even the author can peek early    |
| ❤️ Reactions & 💬 comments | Instagram-style: one emoji per person + comments on unlocked capsules      |
| 👥 Friends                 | Username search, requests, accept/decline, remove — via secure RPCs        |
| 🕰️ "On this day"           | Resurfaces your capsules created on today's date in past years             |
| 🔎 Discovered feed         | Capsules you've unlocked, grouped by the friend who left them              |
| 🔐 Auth                    | Email/password and Google OAuth via Supabase Auth                          |

---

## Architecture

```
Next.js 15 App Router (client components, mobile-first)
        │
        ├─ Hooks layer ........ useAuth, useMemories, useMemoryInteractions
        │                       (data access + domain mapping, optimistic writes)
        │
        ├─ Map subsystem ...... Mapbox GL + react-map-gl, Supercluster clustering,
        │                       geolib proximity, Framer Motion camera transitions
        │
        └─ Supabase ........... Auth · Postgres (RLS) · Storage
                                + SECURITY DEFINER RPCs for the friend graph
```

**Layering.** UI components are thin; all data access and domain mapping live in
hooks (`src/hooks`) and lib helpers (`src/libs`). Postgres rows (`snake_case`)
are mapped to typed domain models (`camelCase`) at a single boundary, so the
rest of the app never touches raw DB shapes.

**Authorization model.** RLS is the source of truth. A reusable
`can_interact_with_memory()` SQL function expresses the rule _"the capsule is
open AND you own it or have unlocked it"_, and the reaction/comment policies
reuse it for both reads and writes — the authorization rule is defined once, in
the database.

**Unlock flow.**

1. User opens a marker → client computes distance to it (`geolib`).
2. If within radius (or it's the author), the **Unlock** action writes to the
   `memory_unlocks` ledger.
3. RLS now permits reading the capsule's media, reactions and comments.
4. Time-locked capsules short-circuit all of the above until `unlock_at` passes.

---

## Data model

| Table              | Purpose                     | Notable constraints                                                       |
| ------------------ | --------------------------- | ------------------------------------------------------------------------- |
| `profiles`         | User profile + social graph | `friends[]`, `friend_requests[]`; auto-created by an `auth.users` trigger |
| `memories`         | The capsules                | `latitude`/`longitude`, media URL arrays, optional `unlock_at`            |
| `memory_unlocks`   | Per-user unlock ledger      | PK `(user_id, memory_id)` — idempotent unlocks                            |
| `memory_reactions` | One emoji per person        | PK `(memory_id, user_id)` enforces a single reaction                      |
| `memory_comments`  | Flat comments               | `CHECK` body length 1–500; author-or-owner delete                         |

All tables have RLS enabled. Full schema and policies live in
[`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) and [`sql/`](./sql).

---

## Tech stack

**Frontend** — Next.js 15 (App Router), React 18, TypeScript (strict),
TailwindCSS, Framer Motion
**Geospatial** — mapbox-gl, react-map-gl, supercluster, geolib
**Backend** — Supabase (Auth · Postgres · Storage), Row-Level Security,
PL/pgSQL functions
**Tooling** — ESLint (Next + TS + jsx-a11y), Prettier, Husky, lint-staged,
Commitlint (Conventional Commits)

---

## Engineering practices

- **Strict TypeScript**, no uncontrolled `any`, explicit domain interfaces.
- **Enforced commit hygiene** — Husky runs `lint-staged` pre-commit and
  Commitlint validates Conventional Commit messages.
- **a11y-aware UI** — semantic controls, `aria-*` on interactive elements, and
  `jsx-a11y` lint rules.
- **Single-responsibility hooks** keep side effects and data access out of the
  view layer and make components trivial to read.

---

## Getting started

**Prerequisites:** Node 18+, a Supabase project, a Mapbox token.

```bash
git clone https://github.com/jasmix555/reminiscape
cd reminiscape
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
NEXT_PUBLIC_MAPBOX_TOKEN=YOUR-MAPBOX-TOKEN
NEXT_PUBLIC_MAPBOX_STYLE=YOUR-MAPBOX-STYLE-URL
```

Then run the SQL in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) (schema, RLS,
storage bucket) followed by [`sql/interactions.sql`](./sql/interactions.sql)
(reactions & comments) in the Supabase SQL editor.

---

## Project structure

```
src/
├─ app/                 # App Router routes (map, memories, friends, settings, auth)
├─ components/
│  ├─ map/              # Mapbox map, markers, clustering, controls
│  ├─ memories/         # Capsule create/view, reactions & comments
│  ├─ profile/ ui/      # Shared UI primitives
│  └─ layout/           # Header, auth gate
├─ hooks/               # useAuth, useMemories, useMemoryInteractions
├─ libs/                # Supabase client, storage, geo/motion helpers
└─ types/               # Domain models
sql/                    # Incremental SQL migrations
```

---

## Roadmap

- Push / email notifications when a sealed capsule unlocks or a friend reacts
- Collaborative capsules (multiple contributors per memory)
- Realtime reactions/comments via Supabase Realtime
- In-app voice recording
- Map filters (mine / friends' / locked / unlocked)

---

## Author

Built by **[@jasmix555](https://github.com/jasmix555)** — based in Osaka, Japan.
Feedback and questions welcome.
