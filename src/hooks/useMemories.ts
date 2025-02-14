import { useState, useCallback, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import toast from "react-hot-toast";

import { useAuth } from "./useAuth";

import { UserProfile } from "@/types";
import { db, storage } from "@/libs"; // Ensure storage is imported
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
      console.error("Error loading memories:", error.message);
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
      console.error("Error adding memory:", error.message);
      toast.error(error.message || "Failed to create memory.");
      throw error;
    }
  };

  const updateMemory = async (memoryId: string, updates: Partial<Memory>) => {
    if (!user) {
      toast.error("You must be logged in to update memories.");

      return;
    }

    try {
      const memoryRef = doc(db, "memories", memoryId);

      await updateDoc(memoryRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      await loadMemories(); // Refresh data after update
      toast.success("Memory updated successfully!");
    } catch (error: any) {
      console.error("Error updating memory:", error.message);
      toast.error("Failed to update memory.");
    }
  };

  const deleteMemory = async (
    memoryId: string,
    memoryData: Partial<Memory & { createdBy: Partial<UserProfile> }>,
  ) => {
    if (!user) {
      toast.error("You must be logged in to delete memories.");

      return;
    }

    try {
      const memoryRef = doc(db, "memories", memoryId);
      const memorySnap = await getDocs(
        query(collection(db, "memories"), where("id", "==", memoryId)),
      );

      if (memorySnap.empty) {
        toast.error("Memory does not exist.");

        return;
      }

      // Delete associated images
      if (memoryData.imageUrls && memoryData.imageUrls.length > 0) {
        await Promise.all(
          memoryData.imageUrls.map(async (imageUrl) => {
            try {
              const imageRef = ref(storage, imageUrl);

              await deleteObject(imageRef);
            } catch (error) {
              console.warn(`Failed to delete image: ${imageUrl}`, error);
            }
          }),
        );
      }

      // Delete associated videos
      if (memoryData.videoUrls && memoryData.videoUrls.length > 0) {
        await Promise.all(
          memoryData.videoUrls.map(async (videoUrl) => {
            try {
              const videoRef = ref(storage, videoUrl);

              await deleteObject(videoRef);
            } catch (error) {
              console.warn(`Failed to delete video: ${videoUrl}`, error);
            }
          }),
        );
      }

      // Delete associated voice message
      if (
        memoryData.voiceMessageUrl &&
        memoryData.voiceMessageUrl.trim() !== ""
      ) {
        try {
          const voiceRef = ref(storage, memoryData.voiceMessageUrl);

          await deleteObject(voiceRef);
        } catch (error) {
          console.warn(
            `Failed to delete voice message: ${memoryData.voiceMessageUrl}`,
            error,
          );
        }
      }

      // Delete memory from Firestore
      await deleteDoc(memoryRef);

      toast.success("Memory deleted successfully!");
      await loadMemories(); // Refresh memory list after deletion
    } catch (error) {
      console.error("Error deleting memory:", error);
      toast.error("Failed to delete memory.");
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
    updateMemory,
    deleteMemory,
    refreshMemories,
  };
};
