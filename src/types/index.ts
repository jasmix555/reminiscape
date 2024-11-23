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

export interface Memory {
  id: string;
  title: string; // Added title
  description?: string; // Optional description
  location: Location;
  imageUrls: string[];
  videoUrls: string[];
  notes: string;
  createdBy: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface Marker {
  id?: string; // Optional because it will be added after creation
  title: string;
  location: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  imageUrls?: string[];
  videoUrls?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
