import React, { useEffect, useState, useRef } from "react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
  Source,
  Layer,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Memory, UserProfile } from "@/types";
import { format } from "date-fns";
import MapImageUpload from "./MapImageUpload";

const mapStyles = {
  touchAction: "none",
  width: "100%",
  height: "100%",
};

const MapComponent: React.FC = () => {
  const [viewState, setViewState] = useState({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 15,
    pitch: 45,
    bearing: 0,
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
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

    // Check if the map center is significantly different from user location
    if (userLocation) {
      const threshold = 0.0001; // Adjust this value based on your needs
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
    }
  };

  return (
    <div className='absolute inset-0 w-full h-full'>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMapMove}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        mapStyle='mapbox://styles/mapbox/dark-v11'
        style={mapStyles}
        maxPitch={85}
        antialias={true}
        attributionControl={false}
      >
        {/* Custom Locate Button */}
        <div className='absolute right-4 top-4 z-10 flex flex-col gap-2'>
          <button
            onClick={handleLocateClick}
            className={`p-2 rounded-full shadow-lg transition-all duration-300 ${
              isFollowingUser
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth={2}
              stroke='currentColor'
              className='w-6 h-6'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M15 10.5a3 3 0 11-6 0 3 3 0 016 0z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z'
              />
            </svg>
          </button>

          <div className='bg-white rounded-lg shadow-lg'>
            <NavigationControl
              showCompass={true}
              showZoom={true}
              style={{ margin: 0, padding: "6px" }}
            />
          </div>
        </div>

        {/* Hidden GeolocateControl for functionality */}
        <div className='hidden'>
          <GeolocateControl
            ref={geolocateControlRef}
            onGeolocate={handleGeolocate}
            positionOptions={{
              enableHighAccuracy: true,
              timeout: 6000,
              maximumAge: 0,
            }}
            trackUserLocation={true}
          />
        </div>

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
            anchor='center'
          >
            <div className='w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg pulse-animation' />
          </Marker>
        )}

        {/* 3D Buildings Layer */}
        <Source
          id='composite'
          type='vector'
          url='mapbox://mapbox.mapbox-streets-v8'
        >
          <Layer
            id='3d-buildings'
            source='composite'
            source-layer='building'
            type='fill-extrusion'
            minzoom={15}
            paint={{
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
            }}
          />
        </Source>

        {/* Memory markers */}
        {memories.map((memory) => (
          <Marker
            key={memory.id}
            longitude={memory.location.longitude}
            latitude={memory.location.latitude}
            anchor='bottom'
            onClick={() => setSelectedMemory(memory)}
          >
            <div className='cursor-pointer transform hover:scale-110 transition-transform'>
              <div className='w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg'>
                <img
                  src={memory.imageUrls[0]}
                  alt='Memory thumbnail'
                  className='w-6 h-6 rounded-full object-cover'
                />
              </div>
            </div>
          </Marker>
        ))}

        {/* Memory popup */}
        {selectedMemory && (
          <Popup
            longitude={selectedMemory.location.longitude}
            latitude={selectedMemory.location.latitude}
            anchor='bottom'
            onClose={() => setSelectedMemory(null)}
            closeButton={true}
            closeOnClick={false}
            className='memory-popup'
          >
            <div className='p-4 max-w-sm'>
              <h3 className='font-bold text-lg mb-2'>{selectedMemory.title}</h3>
              <p className='text-sm text-gray-600 mb-2'>
                {format(selectedMemory.createdAt, "PPP")}
              </p>
              <div className='memory-images mb-2'>
                {selectedMemory.imageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Memory ${index + 1}`}
                    className='w-full h-32 object-cover rounded-lg mb-2'
                  />
                ))}
              </div>
              <p className='text-sm'>{selectedMemory.notes}</p>
            </div>
          </Popup>
        )}
      </Map>

      {/* Create Memory Button */}
      <button
        className='absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 
      bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg 
      hover:bg-blue-600 transition-colors duration-200 flex items-center'
        onClick={() => setShowUploadModal(true)}
      >
        <svg
          className='w-5 h-5 mr-2'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 4v16m8-8H4'
          />
        </svg>
        Create Memory
      </button>

      {/* Upload Modal */}
      {showUploadModal && (
        <MapImageUpload
          onUpload={async (urls: string[], notes: string, title: string) => {
            const map = mapRef.current?.getMap();
            const center = map?.getCenter();

            if (center) {
              const newMemory: Memory = {
                id: Date.now().toString(),
                title,
                description: "",
                location: {
                  latitude: center.lat,
                  longitude: center.lng,
                },
                imageUrls: urls,
                videoUrls: [],
                notes,
                createdBy: {
                  uid: "user-id",
                  email: "user@example.com",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                } as UserProfile,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              setMemories((prev) => [...prev, newMemory]);
            }
            setShowUploadModal(false);
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      <style>{`
      .pulse-animation {
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
        }

        70% {
          transform: scale(1.1);
          box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
        }

        100% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
        }
      }
    `}</style>
    </div>
  );
};

export default MapComponent;
