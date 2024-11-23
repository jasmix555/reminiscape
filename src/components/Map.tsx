// src/components/Map.tsx
import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api"; // Use Marker
import useMarkers from "../hooks/useMarkers";
import MapImageUpload from "./MapImageUpload";
import { Memory, UserProfile } from "../types"; // Import the Memory and UserProfile types

const containerStyle = {
  width: "100%",
  height: "80vh",
};

const Map: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]); // Store memories
  const [mapLoaded, setMapLoaded] = useState(false); // State to track if the map has loaded

  // Get user's current location
  useEffect(() => {
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });
          },
          (error) => {
            console.error("Error getting location: ", error);
            setCurrentLocation({ lat: -3.745, lng: -38.523 }); // Default coordinates
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
        setCurrentLocation({ lat: -3.745, lng: -38.523 }); // Default coordinates
      }
    };

    getCurrentLocation();
  }, []);

  const handleMarkerClick = (memory: Memory) => {
    // Display memory details (image/video and notes)
    alert(
      `Title: ${memory.title}\nNotes: ${memory.notes}\nImage/Video URLs: ${memory.imageUrls.join(", ")}`
    );
  };

  const handleUploadButtonClick = () => {
    setShowUploadModal(true);
  };

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    throw new Error(
      "Google Maps API key is not defined in the environment variables."
    );
  }

  if (!currentLocation) {
    return <div>Loading...</div>;
  }

  return (
    <LoadScript googleMapsApiKey={googleMapsApiKey}>
      <div className='relative'>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={currentLocation}
          zoom={15}
          onLoad={() => setMapLoaded(true)} // Set mapLoaded to true when the map is loaded
        >
          {/* Marker for the user's current location */}
          {currentLocation && mapLoaded && (
            <Marker
              position={currentLocation}
              title='You are here'
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png", // Custom icon for current location
                scaledSize: new window.google.maps.Size(30, 30), // Adjust size as needed
              }}
            />
          )}

          {memories.map((memory) => (
            <Marker
              key={memory.id}
              position={{
                lat: memory.location.latitude,
                lng: memory.location.longitude,
              }}
              onClick={() => handleMarkerClick(memory)}
            />
          ))}
        </GoogleMap>
        <button
          className='absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition'
          onClick={handleUploadButtonClick}
        >
          Upload Image/Video
        </button>
      </div>
      {showUploadModal && (
        <MapImageUpload
          onUpload={(urls: string[], notes: string, title: string) => {
            const newMemory: Memory = {
              id: Date.now().toString(), // Generate a unique ID
              title,
              description: "", // You can add a description field if needed
              location: {
                latitude: currentLocation.lat,
                longitude: currentLocation.lng,
              },
              imageUrls: urls,
              videoUrls: [], // Add video URLs if needed
              notes,
              createdBy: {
                uid: "user-id", // Replace with actual user ID
                email: "user@example.com", // Replace with actual user email
                createdAt: new Date(), // Set createdAt to current date
                updatedAt: new Date(), // Set updatedAt to current date
              } as UserProfile, // Cast to UserProfile
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            setMemories((prev) => [...prev, newMemory]); // Add new memory to the state
            setShowUploadModal(false);
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </LoadScript>
  );
};

export default Map;
