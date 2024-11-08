import {useEffect, useState} from "react";
import {onAuthStateChanged, User} from "firebase/auth";
import {useRouter} from "next/navigation";
import {doc, getDoc} from "firebase/firestore";

import {auth, db} from "@/libs/firebaseConfig";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasDisplayName, setHasDisplayName] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setUser(user);

          // Check if the user has a displayName
          if (user.displayName) {
            setHasDisplayName(true);
          } else {
            // If no displayName, check for a username in Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));

            if (userDoc.exists()) {
              const userData = userDoc.data();

              setHasDisplayName(!!userData.username);
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return {user, loading, hasDisplayName};
}
