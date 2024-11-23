// components/Map.tsx
import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import useMarkers from "../hooks/useMarkers";
import MapImageUpload from "./MapImageUpload";

const containerStyle = {
  width: "100%",
  height: "80vh",
};

const Map: React.FC = () => {
  const { markers, addMarker } = useMarkers();
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Get user's current location
  useEffect(() => {
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
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

  const handleMarkerClick = (marker: any) => {
    // Display marker details (image/video and notes)
    alert(
      `Notes: ${marker.notes}\nImage/Video URL: ${marker.imageUrls.join(", ")}`
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
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentLocation}
        zoom={15}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={{ lat: marker.lat, lng: marker.lng }}
            onClick={() => handleMarkerClick(marker)}
          />
        ))}
        <button
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 1,
            padding: "10px",
            backgroundColor: "white",
            border: "1px solid black",
            borderRadius: "5px",
          }}
          onClick={handleUploadButtonClick}
        >
          Upload Image/Video
        </button>
      </GoogleMap>
      {showUploadModal && selectedLocation && (
        <MapImageUpload
          onUpload={(urls: string[], notes: string) => {
            const newMarker = {
              lat: selectedLocation.lat,
              lng: selectedLocation.lng,
              imageUrls: urls,
              notes: notes,
            };
            addMarker(newMarker);
            setShowUploadModal(false);
            setSelectedLocation(null);
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </LoadScript>
  );
};

export default Map;
