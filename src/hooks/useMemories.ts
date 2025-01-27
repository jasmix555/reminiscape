import { useState, useCallback, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  addDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";
import toast from "react-hot-toast";

import { useAuth } from "./useAuth";

import { db } from "@/libs";
import { Memory } from "@/types";

export const useMemories = () => {
  const { user, profile } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMemories = useCallback(async () => {
    if (!user || !profile) {
      setMemories([]);
      setLoading(false);

      return;
    }

    try {
      const memoriesRef = collection(db, "memories");

      const memoriesQuery = query(
        memoriesRef,
        where("createdBy.uid", "in", [user.uid, ...(profile.friends || [])]),
      );

      const snapshot = await getDocs(memoriesQuery);

      if (!snapshot.empty) {
        const fetchedMemories = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          isUnlocked: doc.data().createdBy.uid === user.uid, // Automatically unlock for the current user
        })) as Memory[];

        setMemories(fetchedMemories);
        setError(null);
      } else {
        setMemories([]);
      }
    } catch (error: any) {
      console.error("Error loading memories:", error.code, error.message);
      setError(error.message || "Failed to load memories.");
      toast.error("Failed to load memories. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  const addMemory = async (
    memoryData: Omit<Memory, "id" | "createdBy" | "createdAt" | "updatedAt">,
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

      await loadMemories();

      return docRef.id;
    } catch (error: any) {
      console.error("Error adding memory:", error.code, error.message);
      toast.error(error.message || "Failed to create memory.");
      throw error;
    }
  };

  const refreshMemories = useCallback(() => {
    if (user) {
      setLoading(true);
      loadMemories();
    }
  }, [user, loadMemories]);

  useEffect(() => {
    if (user && profile) {
      loadMemories();
    } else {
      setMemories([]);
      setLoading(false);
    }
  }, [user, profile, loadMemories]);

  return {
    memories,
    loading,
    error,
    addMemory,
    refreshMemories,
  };
};
