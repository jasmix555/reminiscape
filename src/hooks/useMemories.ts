// hooks/useMemories.ts
import { useState, useCallback, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  addDoc,
  serverTimestamp,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/libs";
import { Memory } from "@/types";
import { useAuth } from "./useAuth";
import toast from "react-hot-toast";

export const useMemories = () => {
  const { user, profile } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMemories = useCallback(async () => {
    // Don't try to load memories if user is not authenticated
    if (!user) {
      setMemories([]);
      setLoading(false);
      return;
    }

    try {
      const memoriesRef = collection(db, "memories");
      // Create a query to get all memories or just user's memories
      const memoriesQuery = query(memoriesRef, orderBy("createdAt", "desc"));

      const memoriesSnapshot = await getDocs(memoriesQuery);

      if (!memoriesSnapshot.empty) {
        const fetchedMemories = memoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Memory[];

        setMemories(fetchedMemories);
        setError(null);
      } else {
        setMemories([]);
      }
    } catch (error: any) {
      console.error("Error loading memories:", error);
      setError(error.message || "Failed to load memories");
      toast.error("Failed to load memories. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addMemory = async (
    memoryData: Omit<Memory, "id" | "createdBy" | "createdAt" | "updatedAt">
  ) => {
    if (!user || !profile) {
      throw new Error("User must be authenticated to create memories");
    }

    try {
      const memoriesRef = collection(db, "memories");
      const newMemoryData = {
        ...memoryData,
        createdBy: {
          uid: user.uid,
          username: profile.username || user.email,
          photoURL: profile.photoURL || null,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(memoriesRef, newMemoryData);
      await loadMemories(); // Refresh memories after adding new one
      return docRef.id;
    } catch (error: any) {
      console.error("Error adding memory:", error);
      toast.error(error.message || "Failed to create memory");
      throw error;
    }
  };

  const refreshMemories = useCallback(() => {
    if (user) {
      setLoading(true);
      loadMemories();
    }
  }, [loadMemories, user]);

  // Load memories when user auth state changes
  useEffect(() => {
    if (user) {
      loadMemories();
    } else {
      setMemories([]);
      setLoading(false);
    }
  }, [user, loadMemories]);

  return {
    memories,
    loading,
    error,
    addMemory,
    refreshMemories,
  };
};
