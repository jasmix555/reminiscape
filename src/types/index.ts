// src/types/index.ts
export interface Location {
  latitude: number;
  longitude: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  username?: string;
  displayName?: string;
  bio?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  friends?: string[]; // Array of UIDs of the friends
  friendRequests?: string[]; // Array of UIDs of the users who sent a friend request
  requestSent?: boolean;
}

// App-normalized auth user (decoupled from any auth provider's user shape so
// the rest of the app can keep using `user.uid`).
export interface AppUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
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
  voiceMessageUrl: string;
  notes: string;
  createdBy: UserProfile;
  createdAt: Date;
  updatedAt: Date;
  isUnlocked: boolean;
  isNearMarker?: boolean;
}

export interface MemoryFeature {
  type: "Feature";
  properties: {
    cluster: boolean;
    memoryId?: string;
    isUnlocked?: boolean;
    imageUrl?: string | null;
    point_count?: number;
    cluster_id?: number;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}
