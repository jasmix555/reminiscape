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
  if (!position.coords) {
    toast.error("Unable to retrieve location.");

    return;
  }

  const newLocation = {
    longitude: position.coords.longitude,
    latitude: position.coords.latitude,
  };

  setUserLocation(newLocation);
  setIsFollowingUser(true);

  setViewState((prev: any) => ({
    ...prev,
    longitude: newLocation.longitude,
    latitude: newLocation.latitude,
  }));

  setTimeout(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();

      if (map) {
        const currentZoom = map.getZoom();

        map.flyTo({
          center: [newLocation.longitude, newLocation.latitude],
          zoom: Math.min(currentZoom + 2, 16.45), // ✅ Prevent excessive zoom-in
          pitch: 45,
          bearing: 0,
          essential: true,
          duration: 1500,
        });
      }
    }
  }, 1000);
};

export const handleMapMove = (
  evt: any,
  setViewState: (prev: any) => void,
  userLocation: { longitude: number; latitude: number } | null,
  setIsFollowingUser: (isFollowing: boolean) => void,
) => {
  setViewState(evt.viewState);

  if (!userLocation) return;

  const threshold = 0.0005;
  const isNearUser =
    Math.abs(evt.viewState.longitude - userLocation.longitude) < threshold &&
    Math.abs(evt.viewState.latitude - userLocation.latitude) < threshold;

  if (!isNearUser) {
    setIsFollowingUser(false);
  }
};

export const handleLocateClick = (
  userLocation: { longitude: number; latitude: number } | null,
  setIsFollowingUser: (isFollowing: boolean) => void,
  mapRef: any,
  setHasMovedToUser: (moved: boolean) => void,
) => {
  if (userLocation && mapRef.current) {
    const map = mapRef.current.getMap();

    if (map) {
      const currentZoom = map.getZoom();

      setIsFollowingUser(true);
      setHasMovedToUser(false);

      map.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: Math.min(currentZoom + 2, 16.45), // ✅ Prevent excessive zoom-in
        pitch: 45,
        bearing: 0,
        essential: true,
        duration: 2000,
      });
    }
  } else {
    toast.error("Location services are not available");
  }
};

export const handleMarkerClick = (
  memory: Memory,
  userLocation: { longitude: number; latitude: number } | null,
  setSelectedMemory: (
    memory: (Memory & { isNearMarker: boolean }) | null,
  ) => void,
  setIsModalOpen: (open: boolean) => void,
  mapRef: React.RefObject<MapRef | null>,
  geolocateControlRef: React.RefObject<any>,
) => {
  if (!mapRef.current) return;

  const map = mapRef.current.getMap();
  const distance = userLocation
    ? getDistance(userLocation, memory.location)
    : Infinity;
  const isNearMarker = distance <= RADIUS;

  setSelectedMemory({ ...memory, isNearMarker });
  setIsModalOpen(true);

  if (geolocateControlRef.current) {
    geolocateControlRef.current.trigger();
  }

  const currentZoom = map.getZoom();

  map.flyTo({
    center: [memory.location.longitude, memory.location.latitude],
    zoom: Math.min(currentZoom + 2, 19), // ✅ Prevent excessive zoom-in
    pitch: 45,
    bearing: 0,
    essential: true,
    duration: 1500,
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
    // Get the bounding box of the cluster (West, South, East, North)
    const expansionZoom = cluster.getClusterExpansionZoom(clusterId);
    const currentZoom = map.getZoom();
    const clusterChildren = cluster.getLeaves(clusterId, Infinity);

    if (clusterChildren.length > 1) {
      const lats = clusterChildren.map((c) => c.geometry.coordinates[1]);
      const lngs = clusterChildren.map((c) => c.geometry.coordinates[0]);

      const west = Math.min(...lngs);
      const south = Math.min(...lats);
      const east = Math.max(...lngs);
      const north = Math.max(...lats);

      map.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        {
          padding: 100, // Add padding to prevent markers from being at the edge
          maxZoom: Math.min(expansionZoom + 3, 17), // Prevent excessive zoom-in
          duration: 1000,
          pitch: 45,
          bearing: 0,
        },
      );
    } else {
      map.flyTo({
        center: [longitude, latitude],
        zoom: Math.min(currentZoom + 3, expansionZoom + 3, 18), // Prevent excessive zoom-in,
        essential: true,
        duration: 1000,
        pitch: 45,
        bearing: 0,
      });
    }
  } catch (error) {
    console.error("Failed to expand cluster:", error);
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
