// src/types/index.ts
export interface Location {
  latitude: number;
  longitude: number;
}

export interface UserProfile {
  uid: string;
  username?: string;
  email: string;
  displayName?: string;
  bio?: string;
  photoURL?: string;
  birthday?: Date;
  createdAt: Date;
  updatedAt: Date;
}
