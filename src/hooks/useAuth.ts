// hooks/useAuth.ts
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import Cookies from "js-cookie";

import { auth, db } from "@/libs";
import { UserProfile } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const router = useRouter();

  const checkProfileCompletion = (profile: UserProfile | null): boolean => {
    if (!profile) return false;

    return Boolean(profile.username && profile.photoURL);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setUser(user);

          // Make sure the account still exists and isn't disabled. A forced
          // token refresh fails for deleted/disabled accounts, so we sign out
          // and clear the stale cookie — otherwise a "zombie" session keeps
          // the user stuck (e.g. unable to load /welcome). Transient network
          // failures are ignored so a briefly-offline user isn't logged out.
          try {
            await user.getIdToken(true);
          } catch (refreshError) {
            const code = (refreshError as { code?: string })?.code ?? "";

            if (code !== "auth/network-request-failed") {
              await signOut(auth).catch(() => {});
              Cookies.remove("auth_token", { path: "/" });
              router.push("/welcome");

              return;
            }
          }

          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userData = userDoc.exists()
            ? (userDoc.data() as UserProfile)
            : null;

          setProfile(userData);
          setIsProfileIncomplete(!checkProfileCompletion(userData));

          // Email/password sign-ups must verify their email before entering
          // the app (Google accounts are already verified). Until then we keep
          // them where they are and withhold the session cookie that
          // middleware uses to gate protected routes.
          if (!user.emailVerified) {
            Cookies.remove("auth_token", { path: "/" });

            return;
          }

          const token = await user.getIdToken();

          Cookies.set("auth_token", token, {
            path: "/",
            expires: 7,
            sameSite: "strict",
          });

          const currentPath = window.location.pathname;

          if (["/welcome", "/login", "/register"].includes(currentPath)) {
            router.push(
              checkProfileCompletion(userData) ? "/" : "/setup-profile",
            );
          }
        } else {
          setUser(null);
          setProfile(null);
          setIsProfileIncomplete(false);
          Cookies.remove("auth_token", { path: "/" });

          const currentPath = window.location.pathname;

          if (!["/welcome", "/login", "/register"].includes(currentPath)) {
            router.push("/welcome");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // The session is unusable — clear it fully so we don't get stuck with
        // a stale cookie that keeps redirecting away from public pages.
        await signOut(auth).catch(() => {});
        Cookies.remove("auth_token", { path: "/" });

        if (
          !["/welcome", "/login", "/register"].includes(
            window.location.pathname,
          )
        ) {
          router.push("/welcome");
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const getDisplayName = () => {
    if (!user) return null;
    if (profile?.username) return profile.username;

    return user.email;
  };

  return {
    user,
    profile,
    loading,
    isProfileIncomplete,
    getDisplayName,
  };
}
