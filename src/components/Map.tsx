// components/Map.tsx
import React, { useEffect, useState, useRef } from "react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Memory } from "@/types";
import { HiLocationMarker, HiPlus } from "react-icons/hi";
import { format } from "date-fns";
import { useAuth, useMemories } from "@/hooks/";

import MapImageUpload from "./MapImageUpload";
import Image from "next/image";
import toast from "react-hot-toast";

const mapStyles = {
  touchAction: "none",
  width: "100%",
  height: "100%",
};

const MapComponent: React.FC = () => {
  const { user, profile } = useAuth();
  const { memories, loading, addMemory, refreshMemories } = useMemories();
  const [viewState, setViewState] = useState({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 15,
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

  useEffect(() => {
    console.log("Modal state changed:", showUploadModal);
  }, [showUploadModal]);

  const handleGeolocate = (position: GeolocationPosition) => {
    const newLocation = {
      longitude: position.coords.longitude,
      latitude: position.coords.latitude,
    };

    setUserLocation(newLocation);
    setIsFollowingUser(true);

    if (mapRef.current) {
      mapRef.current.getMap().flyTo({
        center: [newLocation.longitude, newLocation.latitude],
        zoom: 15,
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
      zoom: 15,
      pitch: 45,
      bearing: 0,
    }));
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

  const handleCreateMemory = () => {
    console.log("Create memory clicked");

    if (!user || !profile) {
      toast.error("Please log in to create memories");
      return;
    }

    if (!userLocation) {
      toast.error("Please enable location services to create memories");
      return;
    }

    console.log("Showing upload modal");
    setShowUploadModal(true);
  };

  const handleMemoryCreation = async (
    memory: Omit<Memory, "id" | "createdBy" | "createdAt" | "updatedAt">
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

  return (
    <div className='absolute inset-0 w-full h-full'>
      <Map
        ref={mapRef}
        attributionControl={false}
        {...viewState}
        antialias={true}
        mapStyle='mapbox://styles/jasmix/cm4216fqz003w01rcgl998m2d'
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        maxPitch={85}
        style={mapStyles}
        onMove={handleMapMove}
      >
        {/* Custom Controls */}
        <div className='absolute right-4 top-4 z-10 flex flex-col gap-2'>
          <button
            className={`p-2 rounded-full shadow-lg transition-all duration-300 ${
              isFollowingUser
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700"
            }`}
            onClick={handleLocateClick}
          >
            <HiLocationMarker className='w-5 h-5' />
          </button>

          <div className='bg-white rounded-lg shadow-lg'>
            <NavigationControl
              showCompass={true}
              showZoom={true}
              style={{ margin: 0, padding: "6px" }}
            />
          </div>
        </div>

        {/* Hidden GeolocateControl */}
        <div className='hidden'>
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

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            anchor='center'
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
          >
            <div className='w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg pulse-animation' />
          </Marker>
        )}

        {/* Memory Markers */}
        {memories.map((memory) => (
          <Marker
            key={memory.id}
            anchor='bottom'
            latitude={memory.location.latitude}
            longitude={memory.location.longitude}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedMemory(memory);
            }}
          >
            <div className='cursor-pointer transform hover:scale-110 transition-transform'>
              <div className='w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-gray-200'>
                {memory.imageUrls[0] && (
                  <Image
                    alt='Memory thumbnail'
                    className='w-8 h-8 rounded-full object-cover'
                    src={memory.imageUrls[0]}
                    width={32}
                    height={32}
                  />
                )}
              </div>
            </div>
          </Marker>
        ))}

        {/* Memory Popup */}
        {selectedMemory && (
          <Popup
            anchor='bottom'
            latitude={selectedMemory.location.latitude}
            longitude={selectedMemory.location.longitude}
            onClose={() => setSelectedMemory(null)}
            closeButton={true}
            closeOnClick={false}
            className='memory-popup'
            maxWidth='300px'
          >
            <div className='p-4'>
              <h3 className='font-bold text-lg mb-2'>{selectedMemory.title}</h3>
              <p className='text-sm text-gray-600 mb-2'>
                {format(selectedMemory.createdAt, "PPP")}
              </p>
              <div className='memory-images mb-2 space-y-2'>
                {selectedMemory.imageUrls.map((url, index) => (
                  <Image
                    key={index}
                    alt={`Memory ${index + 1}`}
                    className='w-full h-32 object-cover rounded-lg'
                    src={url}
                    width={300}
                    height={128}
                  />
                ))}
              </div>
              <p className='text-sm'>{selectedMemory.notes}</p>
              <p className='text-xs text-gray-500 mt-2'>
                Created by {selectedMemory.createdBy.username}
              </p>
            </div>
          </Popup>
        )}
      </Map>

      {/* Create Memory Button */}
      <button
        className='absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 
                  bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg 
                  hover:bg-blue-600 transition-colors duration-200 
                  flex items-center gap-2'
        onClick={handleCreateMemory}
      >
        <HiPlus className='w-5 h-5' />
        Create Memory
      </button>

      {/* Upload Modal */}
      {showUploadModal && userLocation && (
        <MapImageUpload
          location={userLocation}
          onUpload={handleMemoryCreation}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
};

export default MapComponent;
