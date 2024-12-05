// src/libs/memoryService.ts
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

import { db, storage } from "./firebaseConfig";

import { Memory, UserProfile } from "@/types";

export const memoryService = {
  async uploadImages(files: File[], userId: string): Promise<string[]> {
    const uploadPromises = files.map(async (file) => {
      const fileId = uuidv4();
      const fileExtension = file.name.split(".").pop();
      const fileName = `userUploads/${userId}/${fileId}.${fileExtension}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, file);

      return getDownloadURL(storageRef);
    });

    return Promise.all(uploadPromises);
  },

  async createMemory(
    memoryData: Omit<Memory, "id">,
    userProfile: UserProfile,
  ): Promise<Memory> {
    const memoriesRef = collection(db, "memories");
    const docRef = await addDoc(memoriesRef, {
      ...memoryData,
      createdBy: userProfile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return {
      ...memoryData,
      id: docRef.id,
      createdBy: userProfile,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async getMemories(): Promise<Memory[]> {
    const memoriesRef = collection(db, "memories");
    const q = query(memoriesRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: new Date(doc.data().createdAt),
      updatedAt: new Date(doc.data().updatedAt),
    })) as Memory[];
  },

  async getUserMemories(userId: string): Promise<Memory[]> {
    const memoriesRef = collection(db, "memories");
    const q = query(
      memoriesRef,
      where("createdBy.uid", "==", userId),
      orderBy("createdAt", "desc"),
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: new Date(doc.data().createdAt),
      updatedAt: new Date(doc.data().updatedAt),
    })) as Memory[];
  },
};
