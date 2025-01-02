// hooks/useMap.ts
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

import { useAuth, useMemories } from "@/hooks/";
import { Memory } from "@/types";

interface UserLocation {
  longitude: number;
  latitude: number;
}

const useMap = () => {
  const { user, profile } = useAuth();
  const { memories, loading, addMemory, refreshMemories } = useMemories();
  const [viewState, setViewState] = useState<{
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
  }>({
    longitude: 0,
    latitude: 0,
    zoom: 1,
    pitch: 45,
    bearing: 0,
  });
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState<boolean>(false);
  const geolocateControlRef = useRef<any>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (geolocateControlRef.current) {
        geolocateControlRef.current.trigger();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      refreshMemories();
    }
  }, [user, loading, refreshMemories]);

  const handleGeolocate = (position: GeolocationPosition) => {
    if (position.coords) {
      const newLocation: UserLocation = {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
      };

      setUserLocation(newLocation);
      setIsFollowingUser(true);
      setViewState((prev) => ({
        ...prev,
        ...newLocation,
        zoom: 15,
      }));
    } else {
      toast.error("Unable to retrieve location.");
    }
  };

  const handleLocateClick = (mapRef: React.RefObject<any>) => {
    if (userLocation) {
      setIsFollowingUser(true);
      mapRef.current?.getMap().flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 15,
        pitch: 45,
        bearing: 0,
        essential: true,
        duration: 2000,
      });
    } else {
      toast.error("Location services are not available");
    }
  };

  const handleMarkerClick = (memory: Memory, mapRef: React.RefObject<any>) => {
    if (mapRef.current) {
      mapRef.current.getMap().flyTo({
        center: [memory.location.longitude, memory.location.latitude],
        zoom: 18,
        pitch: 45,
        bearing: 0,
        essential: true,
        duration: 2000,
      });
    }
  };

  return {
    viewState,
    userLocation,
    isFollowingUser,
    handleGeolocate,
    handleLocateClick,
    handleMarkerClick,
    memories,
    loading,
    addMemory,
    profile,
  };
};

export default useMap;
