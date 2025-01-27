// hooks/useAuth.ts
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
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
          const token = await user.getIdToken();

          Cookies.set("auth_token", token, {
            path: "/",
            expires: 7,
            sameSite: "strict",
          });

          const userDoc = await getDoc(doc(db, "users", user.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;

            setProfile(userData);
            setIsProfileIncomplete(!checkProfileCompletion(userData));

            const currentPath = window.location.pathname;

            if (["/welcome", "/login", "/register"].includes(currentPath)) {
              if (!checkProfileCompletion(userData)) {
                router.push("/setup-profile");
              } else {
                router.push("/");
              }
            }
          } else {
            setIsProfileIncomplete(true);
            router.push("/setup-profile");
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
        Cookies.remove("auth_token", { path: "/" });
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
