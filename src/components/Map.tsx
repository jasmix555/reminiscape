import React, { useEffect, useState, useRef } from "react";
import Map, { Marker, NavigationControl, GeolocateControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { HiLocationMarker, HiPlus, HiLockClosed } from "react-icons/hi";
import Image from "next/image";
import toast from "react-hot-toast";
import { getDistance } from "geolib"; // Install: npm install geolib

import MapImageUpload from "./MapImageUpload";
import MarkerModal from "./MarkerModal";

import { Memory } from "@/types";
import { useAuth, useMemories } from "@/hooks";
// Import memoryService

const mapStyles = {
  touchAction: "none",
  width: "100%",
  height: "100%",
};

const MapComponent: React.FC = () => {
  const RADIUS = 100; // Define proximity radius in meters
  const { user, profile } = useAuth();
  const { memories, loading, addMemory, refreshMemories } = useMemories();
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 1,
    pitch: 45,
    bearing: 0,
  });
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [userLocation, setUserLocation] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const mapRef = useRef<any>(null);
  const geolocateControlRef = useRef<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      const newLocation = {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
      };

      setUserLocation(newLocation);
      setIsFollowingUser(true);

      if (mapRef.current) {
        mapRef.current.getMap().flyTo({
          center: [newLocation.longitude, newLocation.latitude],
          zoom: 16.45,
          pitch: 45,
          bearing: 0,
          essential: true,
          duration: 2000,
        });
      }

      setViewState((prev) => ({
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

  const handleMapMove = (evt: any) => {
    setViewState(evt.viewState);

    if (userLocation) {
      const threshold = 0.0001;
      const isNearUser =
        Math.abs(evt.viewState.longitude - userLocation.longitude) <
          threshold &&
        Math.abs(evt.viewState.latitude - userLocation.latitude) < threshold;

      setIsFollowingUser(isNearUser);
    }
  };

  const handleLocateClick = () => {
    if (userLocation) {
      setIsFollowingUser(true);
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

  const handleCreateMemory = () => {
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

  const handleMemoryCreation = async (
    memory: Omit<Memory, "id" | "createdBy" | "createdAt" | "updatedAt">,
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

  const unlockMemory = (memory: Memory | null) => {
    if (memory) {
      memory.isUnlocked = true; // Update the memory state to unlocked
      setSelectedMemory(memory); // Refresh modal
      toast.success("Memory unlocked successfully!");
    }
  };

  const handleMarkerClick = (memory: Memory) => {
    if (
      memory.location &&
      memory.location.latitude &&
      memory.location.longitude
    ) {
      if (!memory.isUnlocked) {
        if (userLocation) {
          const distance = getDistance(
            {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            },
            {
              latitude: memory.location.latitude,
              longitude: memory.location.longitude,
            },
          );

          if (distance <= RADIUS) {
            setSelectedMemory(memory);
            setIsModalOpen(true); // Show the modal to unlock
          } else {
            toast.error("You must be closer to unlock this memory!");
          }
        } else {
          toast.error("Enable location services to access locked memories.");
        }

        return;
      }

      // For unlocked memories, show the memory modal
      setSelectedMemory(memory);
      setIsModalOpen(true);

      if (mapRef.current) {
        mapRef.current.getMap().flyTo({
          center: [memory.location.longitude, memory.location.latitude],
          zoom: 16.45,
          pitch: 45,
          bearing: 0,
          essential: true,
          duration: 2000,
        });
      }
    } else {
      toast.error("This memory doesn't have location data.");
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full">
      <Map
        ref={mapRef}
        attributionControl={false}
        {...viewState}
        antialias={true}
        mapStyle={process.env.NEXT_PUBLIC_MAPBOX_STYLE}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        maxPitch={85}
        style={mapStyles}
        onLoad={(event) => {
          const map = event.target;

          const style = map.getStyle();
          const layers = style?.layers;

          if (layers) {
            const labelLayerId = layers.find(
              (layer) =>
                layer.type === "symbol" && layer.layout?.["text-field"],
            )?.id;

            if (labelLayerId) {
              map.addLayer(
                {
                  id: "add-3d-buildings",
                  source: "composite",
                  "source-layer": "building",
                  filter: ["==", "extrude", "true"],
                  type: "fill-extrusion",
                  minzoom: 15,
                  paint: {
                    "fill-extrusion-color": "#aaa",
                    "fill-extrusion-height": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      15,
                      0,
                      15.05,
                      ["get", "height"],
                    ],
                    "fill-extrusion-base": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      15,
                      0,
                      15.05,
                      ["get", "min_height"],
                    ],
                    "fill-extrusion-opacity": 0.6,
                  },
                },
                labelLayerId,
              );
            }
          }
        }}
        onMove={handleMapMove}
      >
        <div className="absolute right-4 bottom-4 z-10 flex flex-col gap-2">
          <button
            className={`p-2 rounded-full shadow-lg transition-all duration-300 ${
              isFollowingUser
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700"
            }`}
            onClick={handleLocateClick}
          >
            <HiLocationMarker className="w-5 h-5" />
          </button>

          <div className="bg-white rounded-lg shadow-lg">
            <NavigationControl
              showCompass={true}
              showZoom={true}
              style={{ margin: 0, padding: "6px" }}
            />
          </div>
        </div>

        <div className="hidden">
          <GeolocateControl
            ref={geolocateControlRef}
            positionOptions={{
              enableHighAccuracy: true,
              timeout: 6000,
              maximumAge: 0,
            }}
            trackUserLocation={true}
            onGeolocate={handleGeolocate}
          />
        </div>

        {userLocation && (
          <Marker
            anchor="center"
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
          >
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg pulse-animation" />
          </Marker>
        )}

        {memories.map((memory) => (
          <Marker
            key={memory.id}
            anchor="bottom"
            latitude={memory.location.latitude}
            longitude={memory.location.longitude}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(memory);
            }}
          >
            <div className="cursor-pointer transform hover:scale-110 transition-transform z-50">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 ${
                  memory.isUnlocked ? "bg-white border-gray-200" : "bg-gray-400"
                }`}
              >
                {memory.isUnlocked ? (
                  memory.imageUrls?.[0] ? (
                    <Image
                      alt="Memory thumbnail"
                      className="w-8 h-8 rounded-full object-cover"
                      height={32}
                      src={memory.imageUrls[0]}
                      width={32}
                    />
                  ) : (
                    <HiLocationMarker className="w-6 h-6 text-blue-500" />
                  )
                ) : (
                  <HiLockClosed className="w-6 h-6 text-white" />
                )}
              </div>
            </div>
          </Marker>
        ))}

        <MarkerModal
          isOpen={isModalOpen}
          memory={selectedMemory}
          onClose={() => setIsModalOpen(false)}
          onUnlock={() => unlockMemory(selectedMemory)}
        />
      </Map>

      <button
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 
                  bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg 
                  hover:bg-blue-600 transition-colors duration-200 
                  flex items-center gap-2"
        onClick={handleCreateMemory}
      >
        <HiPlus className="w-5 h-5" />
        Create Memory
      </button>

      {showUploadModal && userLocation && (
        <MapImageUpload
          isOpen={showUploadModal}
          location={userLocation!}
          profile={profile}
          user={user}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleMemoryCreation}
        />
      )}
    </div>
  );
};

export default MapComponent;
