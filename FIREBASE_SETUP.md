# Firebase setup

You recreated your Firebase project, so you need to (1) wire up the new
credentials and (2) deploy the security rules in this repo.

## 1. Create / configure the Firebase project

In the [Firebase console](https://console.firebase.google.com/):

1. Create a project (or reuse the new one).
2. **Authentication** → Sign-in method → enable the providers the app uses
   (Email/Password and Google).
3. **Firestore Database** → create a database (production mode).
4. **Storage** → create the default bucket.
5. (Realtime Database is **not** used by the app — you can skip it. If you
   create one anyway, the included `database.rules.json` locks it down.)

## 2. Set environment variables

Project settings → _Your apps_ → Web app → SDK setup gives you the config
values. Copy `.env.example` to `.env.local` and fill them in:

```bash
cp .env.example .env.local
```

Then add the **same** variables in Vercel:
Project → Settings → Environment Variables (Production + Preview). Without
them the build fails at prerender with `Firebase: Error (auth/invalid-api-key)`.

## 3. Deploy the security rules

The rules live in this repo:

| File                     | Service                                  |
| ------------------------ | ---------------------------------------- |
| `firestore.rules`        | Cloud Firestore                          |
| `firestore.indexes.json` | Firestore composite indexes              |
| `storage.rules`          | Cloud Storage                            |
| `database.rules.json`    | Realtime Database (locked down — unused) |

### Option A — Firebase CLI (recommended)

```bash
npm i -g firebase-tools
firebase login
firebase use --add            # pick your new project, alias it "default"
firebase deploy --only firestore:rules,firestore:indexes,storage,database
```

### Option B — paste into the console

Copy the contents of `firestore.rules` into Firestore → Rules, and
`storage.rules` into Storage → Rules, then Publish.

## What the rules enforce

**Firestore**

- `users/{uid}` — any signed-in user can read profiles (needed for search and
  the friends list). You can only create/fully-edit your **own** profile. A
  third party may only add/remove **their own uid** to another user's `friends`
  / `friendRequests` arrays (this is what powers send/accept/decline/remove
  friend). Profiles can't be deleted from the client.
- `memories/{id}` — readable if you created it or its creator is in your
  friends list. Only the creator can create (attributed to themselves), edit
  (without reassigning ownership), or delete.

**Storage**

- `profileImages/{uid}/…` and `userUploads/{uid}/…` — only the owner can write;
  images only, ≤ 5 MB.
- `memories/images|videos|voice/…` — any signed-in user can manage (these paths
  carry no uid). Enforced on upload: images ≤ 5 MB, videos ≤ 50 MB, voice
  ≤ 15 MB, and the content type must match.

> Note: memory media paths don't include the owner's uid, so the rules can't
> restrict deletes to the creator at the storage layer. If you want stricter
> control, change the upload paths in `MemoryUpload.tsx` /
> `memoryService.ts` to `memories/{type}/{uid}/…` and tighten `storage.rules`
> to `isOwner(uid)`.

**Realtime Database** — denied entirely, because no code uses it. If you start
using RTDB, replace `database.rules.json` with authenticated, scoped rules,
e.g. a per-user node:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```
