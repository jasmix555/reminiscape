import React, { useEffect, useState, useRef } from "react";
import Map, { GeolocateControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import MemoryUpload from "../memories/MemoryUpload";
import MarkerModal from "../memories/MarkerModal";

import {
  handleGeolocate,
  handleMapMove,
  handleLocateClick,
  handleCreateMemory,
  handleMemoryCreation,
  handleMarkerClick,
  handleClusterClick,
  unlockMemory,
} from "./mapActions";
import MapLayers from "./MapLayers";
import MapControls from "./MapControls";
import MapMarkers from "./MapMarkers";
import UserLocationMarker from "./UserLocationMarker";
import UserRadius from "./UserRadius";
import LocationDeniedBanner from "./LocationDeniedBanner";
import CreateMemoryButton from "./CreateMemoryButton";
import MapLoadingVeil from "./MapLoadingVeil";
import { useClusters } from "./useClusters";

import { setMapMoving, useMapMoving } from "@/libs/mapMotion";
import { Memory } from "@/types";
import { useAuth, useMemories } from "@/hooks";

const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE;
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const mapStyles = { touchAction: "none", width: "100%", height: "100%" };

const MapComponent: React.FC = () => {
  const { user, profile } = useAuth();
  const { memories, loading, addMemory, refreshMemories, recordUnlock } =
    useMemories();

  const [viewState, setViewState] = useState({
    longitude: 135.5023, // Osaka
    latitude: 34.6937,
    zoom: 2,
    pitch: 45,
    bearing: 0,
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<
    (Memory & { isNearMarker?: boolean }) | null
  >(null);
  const [userLocation, setUserLocation] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasMovedToUser, setHasMovedToUser] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const mapRef = useRef<any>(null);
  const geolocateControlRef = useRef<any>(null);

  const { clusters, recompute, supercluster } = useClusters(
    memories,
    mapRef,
    viewState.zoom,
  );
  const moving = useMapMoving();

  // Auto-center once on the first location fix.
  useEffect(() => {
    if (userLocation && !hasMovedToUser && isMapLoaded && mapRef.current) {
      const map = mapRef.current.getMap();

      if (map) {
        map.flyTo({
          center: [userLocation.longitude, userLocation.latitude],
          zoom: 16,
          pitch: 45,
          bearing: 0,
          essential: true,
          duration: 1500,
        });
        setHasMovedToUser(true);
      }
    }
  }, [userLocation, hasMovedToUser, isMapLoaded]);

  useEffect(() => {
    if (geolocateControlRef.current && !hasMovedToUser) {
      setTimeout(() => geolocateControlRef.current?.trigger(), 1000);
    }
  }, [hasMovedToUser]);

  useEffect(() => {
    if (!loading && user) refreshMemories();
  }, [user, loading, refreshMemories]);

  return (
    <div className="absolute inset-0 w-full h-full">
      {!isMapLoaded && <MapLoadingVeil />}

      <Map
        ref={mapRef}
        attributionControl={false}
        onLoad={() => {
          setIsMapLoaded(true);
          if (geolocateControlRef.current) {
            setTimeout(() => geolocateControlRef.current.trigger(), 500);
          }
        }}
        {...viewState}
        antialias={true}
        mapStyle={MAPBOX_STYLE}
        mapboxAccessToken={MAPBOX_TOKEN}
        maxPitch={85}
        style={mapStyles}
        onMove={(evt) => {
          handleMapMove(evt, setViewState, userLocation, () => {});
          recompute();
        }}
        onMoveEnd={() => setMapMoving(false)}
        onMoveStart={() => setMapMoving(true)}
      >
        {isMapLoaded && <MapLayers mapRef={mapRef} />}

        <MapControls
          hidden={moving}
          onLocate={() =>
            handleLocateClick(userLocation, () => {}, mapRef, setHasMovedToUser)
          }
          onZoomIn={() => mapRef.current?.getMap()?.zoomIn()}
          onZoomOut={() => mapRef.current?.getMap()?.zoomOut()}
        />

        {userLocation && viewState.zoom >= 11 && (
          <>
            <UserRadius
              latitude={userLocation.latitude}
              longitude={userLocation.longitude}
            />
            <UserLocationMarker
              latitude={userLocation.latitude}
              longitude={userLocation.longitude}
            />
          </>
        )}

        <GeolocateControl
          ref={geolocateControlRef}
          positionOptions={{ enableHighAccuracy: true }}
          showUserLocation={false}
          trackUserLocation={true}
          onError={(error) => {
            console.warn("Geolocation unavailable:", error?.message);
            setUserLocation(null);
          }}
          onGeolocate={(position) => handleGeolocate(position, setUserLocation)}
        />

        <MapMarkers
          clusters={clusters}
          memories={memories}
          userLocation={userLocation}
          onClusterClick={(clusterId, longitude, latitude) => {
            if (supercluster.current) {
              handleClusterClick(
                clusterId,
                longitude,
                latitude,
                mapRef,
                supercluster.current,
              );
            }
          }}
          onMemoryClick={(memory, isNearMarker) =>
            handleMarkerClick(
              { ...memory, isNearMarker },
              userLocation,
              setSelectedMemory as (memory: Memory | null) => void,
              setIsModalOpen,
              mapRef,
              geolocateControlRef,
            )
          }
        />

        <MarkerModal
          isNearMarker={selectedMemory?.isNearMarker ?? false}
          isOpen={isModalOpen}
          memory={selectedMemory}
          user={user ? { uid: user.uid } : undefined}
          onClose={() => setIsModalOpen(false)}
          onUnlock={() => {
            unlockMemory(selectedMemory, setSelectedMemory);
            if (selectedMemory) recordUnlock(selectedMemory.id);
          }}
        />
      </Map>

      {!userLocation && <LocationDeniedBanner hidden={moving} />}

      <CreateMemoryButton
        hidden={moving}
        onClick={() =>
          handleCreateMemory(user, profile, userLocation, setShowUploadModal)
        }
      />

      {showUploadModal && userLocation && (
        <MemoryUpload
          location={userLocation}
          onClose={() => setShowUploadModal(false)}
          onUpload={(memory) =>
            handleMemoryCreation(
              memory,
              async (mem) => {
                await addMemory(mem);
              },
              setShowUploadModal,
            )
          }
        />
      )}
    </div>
  );
};

export default MapComponent;
