// components/actions.ts
import { getDistance } from "geolib";
import toast from "react-hot-toast";
import Supercluster from "supercluster";
import { MapRef } from "react-map-gl";

import { Memory } from "@/types";

export const RADIUS = 100; // Define proximity radius in meters

export const handleGeolocate = (
  position: GeolocationPosition,
  setUserLocation: (location: { longitude: number; latitude: number }) => void,
  setIsFollowingUser: (isFollowing: boolean) => void,
  setViewState: (prev: any) => void,
  mapRef: any,
) => {
  if (position.coords) {
    const newLocation = {
      longitude: position.coords.longitude,
      latitude: position.coords.latitude,
    };

    setUserLocation(newLocation);
    setIsFollowingUser(true);

    setTimeout(() => {
      if (mapRef.current) {
        const map = mapRef.current.getMap();

        if (map) {
          map.flyTo({
            center: [newLocation.longitude, newLocation.latitude],
            zoom: 16.45,
            pitch: 45,
            bearing: 0,
            essential: true,
            duration: 1500,
          });
        }
      }
    }, 1000); // Add slight delay to ensure map is ready

    setViewState((prev: any) => ({
      ...prev,
      longitude: newLocation.longitude,
      latitude: newLocation.latitude,
      zoom: 16.45,
      pitch: 45,
      bearing: 0,
    }));
  } else {
    toast.error("Unable to retrieve location.");
  }
};

export const handleMapMove = (
  evt: any,
  setViewState: (prev: any) => void,
  userLocation: { longitude: number; latitude: number } | null,
  setIsFollowingUser: (isFollowing: boolean) => void,
) => {
  setViewState(evt.viewState);

  if (userLocation) {
    const threshold = 0.0001;
    const isNearUser =
      Math.abs(evt.viewState.longitude - userLocation.longitude) < threshold &&
      Math.abs(evt.viewState.latitude - userLocation.latitude) < threshold;

    setIsFollowingUser(isNearUser);
  }
};

export const handleLocateClick = (
  userLocation: { longitude: number; latitude: number } | null,
  setIsFollowingUser: (isFollowing: boolean) => void,
  mapRef: any,
  setHasMovedToUser: (moved: boolean) => void, // Pass state updater
) => {
  if (userLocation) {
    setIsFollowingUser(true);
    setHasMovedToUser(false); // Allow re-centering
    mapRef.current?.getMap().flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 16.45,
      pitch: 45,
      bearing: 0,
      essential: true,
      duration: 2000,
    });
  } else {
    toast.error("Location services are not available");
  }
};

export const handleCreateMemory = (
  user: any,
  profile: any,
  userLocation: { longitude: number; latitude: number } | null,
  setShowUploadModal: (show: boolean) => void,
) => {
  if (!user || !profile) {
    toast.error("Please log in to create memories");

    return;
  }

  if (!userLocation) {
    toast.error("Please enable location services to create memories");

    return;
  }

  setShowUploadModal(true);
};

export const handleMemoryCreation = async (
  memory: Omit<Memory, "id" | "createdBy" | "createdAt" | "updatedAt">,
  addMemory: (memory: any) => Promise<void>,
  setShowUploadModal: (show: boolean) => void,
) => {
  const loadingToast = toast.loading("Creating memory...");

  try {
    await addMemory(memory);
    toast.success("Memory created successfully!", { id: loadingToast });
    setShowUploadModal(false);
  } catch (error) {
    console.error("Error creating memory:", error);
    toast.error("Failed to create memory", { id: loadingToast });
  }
};

export const unlockMemory = (
  memory: Memory | null,
  setSelectedMemory: (memory: Memory | null) => void,
) => {
  if (memory) {
    memory.isUnlocked = true;
    setSelectedMemory(memory);
    toast.success("Memory unlocked successfully!");
  }
};

export const handleMarkerClick = (
  memory: Memory,
  userLocation: { longitude: number; latitude: number } | null,
  setSelectedMemory: (
    memory: (Memory & { isNearMarker: boolean }) | null,
  ) => void,
  setIsModalOpen: (open: boolean) => void,
  mapRef: React.RefObject<MapRef | null>, // Ensure map reference is passed
) => {
  if (!mapRef.current) return;

  const map = mapRef.current.getMap();
  const distance = userLocation
    ? getDistance(userLocation, memory.location)
    : Infinity;
  const isNearMarker = distance <= RADIUS;

  setSelectedMemory({ ...memory, isNearMarker });
  setIsModalOpen(true);

  // Fly to the marker smoothly
  const currentZoom = map.getZoom();

  map.flyTo({
    center: [memory.location.longitude, memory.location.latitude],
    zoom: Math.min(currentZoom + 2, 19), // Zoom in
    pitch: 45,
    bearing: 0,
    essential: true,
    duration: 1500, // Smooth transition
  });
};

export const handleClusterClick = (
  clusterId: number,
  longitude: number,
  latitude: number,
  mapRef: React.RefObject<MapRef | null>,
  cluster: Supercluster,
) => {
  if (!mapRef.current || !cluster) return;

  const map = mapRef.current.getMap();

  if (!map) return;

  try {
    const zoom = cluster.getClusterExpansionZoom(clusterId);

    if (typeof zoom === "number") {
      map.flyTo({
        center: [longitude, latitude],
        zoom: Math.min(zoom + 2, 18), // Prevent excessive zoom-in
        essential: true,
        duration: 1500,
      });
    }
  } catch (error) {
    console.error("Failed to expand cluster:", error);
  }
};
