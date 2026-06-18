// hooks/useAuth.ts
import { useEffect, useState } from "react";

import { supabase } from "@/libs/supabaseClient";
import { AppUser, UserProfile } from "@/types";

// Maps a Supabase `profiles` row -> the app's UserProfile shape.
const mapProfile = (row: Record<string, any>): UserProfile => ({
  uid: row.id,
  email: row.email ?? "",
  username: row.username ?? "",
  displayName: row.username ?? "",
  bio: row.bio ?? "",
  photoURL: row.photo_url ?? "",
  friends: row.friends ?? [],
  friendRequests: row.friend_requests ?? [],
  createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
});

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const hydrate = async (sessionUser: any) => {
      if (!sessionUser) {
        setUser(null);
        setProfile(null);

        return;
      }

      setUser({
        uid: sessionUser.id,
        email: sessionUser.email ?? null,
        emailVerified: Boolean(sessionUser.email_confirmed_at),
      });

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (active) setProfile(data ? mapProfile(data) : null);
    };

    supabase.auth.getSession().then(async ({ data: { session } }: any) => {
      if (!active) return;
      await hydrate(session?.user ?? null);
      if (active) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      hydrate(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}
