// src/types/index.ts
export interface Location {
  latitude: number;
  longitude: number;
}

// src/types/index.ts
export interface UserProfile {
  uid: string;
  email: string;
  username?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  imageUrls: string[];
  videoUrls: string[];
  notes: string;
  createdBy: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface Marker {
  id: string;
  location: Location;
  memoryId: string;
}
