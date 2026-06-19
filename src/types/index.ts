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
  friends?: string[];
  friendRequests?: string[];
  requestSent?: boolean;
}

// App-normalized auth user (decoupled from any auth provider's user shape).
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
  unlockAt?: Date | null; // time-lock: contents hidden until this date
}

// Fixed reaction set. Written as Unicode escapes to keep the source ASCII-clean:
// heart, joy, surprise, cry, fire, thumbs-up. Keep in sync with the UI.
export const REACTION_EMOJIS = [
  "\u{2764}\u{FE0F}",
  "\u{1F602}",
  "\u{1F62E}",
  "\u{1F622}",
  "\u{1F525}",
  "\u{1F44D}",
] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export interface MemoryComment {
  id: string;
  memoryId: string;
  userId: string;
  body: string;
  authorUsername: string;
  authorPhotoUrl: string;
  createdAt: Date;
}

export interface ReactionSummary {
  counts: Record<string, number>; // emoji -> number of people
  total: number;
  mine: string | null; // the emoji the current user picked, if any
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
