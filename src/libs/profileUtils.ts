// src/libs/profileUtils.ts
import type { UserProfile } from "@/types";

import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { db, storage } from "./firebaseConfig";

/**
 * Creates a new user profile in Firestore.
 * @param uid - User ID
 * @param data - Partial user profile data
 * @returns The created user profile
 */
export const createUserProfile = async (
  uid: string,
  data: Partial<UserProfile>,
) => {
  try {
    const userRef = doc(db, "users", uid);
    const newProfile: UserProfile = {
      uid,
      email: data.email || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };

    await setDoc(userRef, newProfile);

    return newProfile;
  } catch (error) {
    console.error(
      "Error creating user profile:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
};

/**
 * Fetches a user profile from Firestore.
 * @param uid - User ID
 * @returns The user profile or null if not found
 */
export const getUserProfile = async (uid: string) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }

    return null;
  } catch (error) {
    console.error(
      "Error fetching user profile:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
};

/**
 * Updates an existing user profile in Firestore.
 * @param uid - User ID
 * @param data - Partial user profile data to update
 */
export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>,
) => {
  try {
    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error(
      "Error updating user profile:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
};

/**
 * Uploads a new profile image to Firebase Storage and updates the user's profile.
 * @param uid - User ID
 * @param file - The image file to upload
 * @returns The download URL of the uploaded image
 */
export const uploadProfileImage = async (uid: string, file: File) => {
  try {
    // Fetch the current user profile to check for existing photoURL
    const oldProfile = await getUserProfile(uid);
    const oldPhotoURL = oldProfile?.photoURL;

    // Delete old image if it exists
    if (oldPhotoURL) {
      try {
        const oldImageRef = ref(storage, oldPhotoURL);

        await deleteObject(oldImageRef);
      } catch (error) {
        console.warn(
          "Warning: Error deleting old profile image:",
          error instanceof Error ? error.message : error,
        );
      }
    }

    // Upload new image
    const storageRef = ref(
      storage,
      `profileImages/${uid}/${Date.now()}-${file.name}`,
    );

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    // Update the user's profile with the new photoURL
    await updateUserProfile(uid, { photoURL: downloadURL });

    return downloadURL;
  } catch (error) {
    console.error(
      "Error uploading profile image:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
};
