import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import Map, { Marker, GeolocateControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  HiLocationMarker,
  HiPlus,
  HiMinus,
  HiLockClosed,
} from "react-icons/hi";
import { MdLocationOff } from "react-icons/md";
import Image from "next/image";
import { getDistance } from "geolib";
import Supercluster from "supercluster";

import {
  handleGeolocate,
  handleMapMove,
  handleLocateClick,
  handleCreateMemory,
  handleMemoryCreation,
  handleMarkerClick,
  handleClusterClick,
  unlockMemory,
  RADIUS,
} from "./actions";
import MemoryUpload from "./MemoryUpload";
import MarkerModal from "./MarkerModal";
import MapLayers from "./MapLayers";

import { Memory, MemoryFeature } from "@/types";
import { useAuth, useMemories } from "@/hooks";

const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE;
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const mapStyles = {
  touchAction: "none",
  width: "100%",
  height: "100%",
};

const MapComponent: React.FC = () => {
  const { user, profile } = useAuth();
  const { memories, loading, addMemory, refreshMemories } = useMemories();
  const [viewState, setViewState] = useState({
    longitude: 135.5023, // Longitude of Osaka
    latitude: 34.6937, // Latitude of Osaka
    zoom: 2, // Adjusted zoom level for a closer view
    pitch: 45,
    bearing: 0,
  });

  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [selectedMemory, setSelectedMemory] = useState<
    (Memory & { isNearMarker?: boolean }) | null
  >(null);
  const [userLocation, setUserLocation] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clusters, setClusters] = useState<MemoryFeature[]>([]);
  const mapRef = useRef<any>(null);
  const [hasMovedToUser, setHasMovedToUser] = useState(false);
  const geolocateControlRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [showLocationInfo, setShowLocationInfo] = useState(false);

  const cluster = useRef(
    new Supercluster<MemoryFeature["properties"], MemoryFeature["geometry"]>({
      radius: 50,
      maxZoom: 16,
    }),
  );

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
        setHasMovedToUser(true); // Prevents repeated auto-centering
      }
    }
  }, [userLocation, hasMovedToUser, isMapLoaded]);

  const updateClusters = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();

    if (!map) return;

    // Supercluster.getClusters() throws if load() was never called, which is
    // the case when there are no memories yet. Just clear and bail so the map
    // still pans freely (e.g. with location disabled / a brand-new account).
    if (!memories.length) {
      setClusters([]);

      return;
    }

    const bounds = map.getBounds();
    const zoom = Math.floor(viewState.zoom);

    const clusteredData = cluster.current.getClusters(
      [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ],
      zoom,
    ) as MemoryFeature[];

    setClusters(clusteredData);
  }, [viewState.zoom, memories]); // Ensure updates when zoom or memories change

  useEffect(() => {
    if (!memories.length) return;
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();

    if (!map) return;

    const bounds = map.getBounds();
    const zoom = Math.floor(viewState.zoom);

    const points: MemoryFeature[] = memories.map((memory) => ({
      type: "Feature",
      properties: {
        cluster: false,
        memoryId: memory.id,
        isUnlocked: memory.isUnlocked,
        imageUrl: memory.imageUrls?.[0] || null,
      },
      geometry: {
        type: "Point",
        coordinates: [memory.location.longitude, memory.location.latitude],
      },
    }));

    cluster.current.load(points);

    const clusteredData = cluster.current.getClusters(
      [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ],
      zoom,
    ) as MemoryFeature[];

    setClusters(clusteredData);
  }, [memories, viewState.zoom]);

  useEffect(() => {
    if (geolocateControlRef.current && !hasMovedToUser) {
      setTimeout(() => {
        geolocateControlRef.current.trigger();
      }, 1000);
    }
  }, [hasMovedToUser]);

  useEffect(() => {
    if (!loading && user) {
      refreshMemories();
    }
  }, [user, loading, refreshMemories]);

  const renderedMarkers = useMemo(() => {
    return clusters.map((feature) => {
      const [longitude, latitude] = feature.geometry.coordinates;
      const {
        cluster: isCluster,
        point_count,
        memoryId,
        isUnlocked,
        imageUrl,
      } = feature.properties || {};

      const clusterId =
        isCluster && typeof feature.properties.cluster_id === "number"
          ? feature.properties.cluster_id
          : 0;

      if (isCluster) {
        return (
          <Marker
            key={`cluster-${clusterId}`}
            className="z-0"
            latitude={latitude}
            longitude={longitude}
          >
            <div
              className="glass text-ink text-sm font-semibold px-3 py-2 flex items-center justify-center rounded-full shadow-glass cursor-pointer z-10 transform hover:scale-110 transition-transform ring-1 ring-accent/40"
              onClick={() => {
                if (!cluster.current) return;
                handleClusterClick(
                  clusterId,
                  longitude,
                  latitude,
                  mapRef,
                  cluster.current,
                );
              }}
            >
              {point_count} {point_count === 1 ? "Memory" : "Memories"}
            </div>
          </Marker>
        );
      }

      const memory = memories.find((m) => m.id === memoryId);

      if (!memory) return null;

      const isNearMarker =
        userLocation && getDistance(userLocation, memory.location) <= RADIUS;

      return (
        <Marker key={memoryId} latitude={latitude} longitude={longitude}>
          <div
            className="cursor-pointer transform hover:scale-110 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              handleMarkerClick(
                { ...memory, isNearMarker: isNearMarker ?? undefined },
                userLocation,
                setSelectedMemory as (memory: Memory | null) => void,
                setIsModalOpen,
                mapRef,
                geolocateControlRef, // ✅ Pass GeolocateControl Ref
              );
            }}
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-glass border-2 ${
                isUnlocked
                  ? "border-accent bg-surface"
                  : "glass border-white/20"
              }`}
            >
              {isUnlocked ? (
                imageUrl ? (
                  <Image
                    alt="Memory thumbnail"
                    className="w-9 h-9 rounded-full object-cover"
                    height={36}
                    src={imageUrl}
                    width={36}
                  />
                ) : (
                  <HiLocationMarker className="w-6 h-6 text-accent" />
                )
              ) : (
                <HiLockClosed className="w-5 h-5 text-ink-muted" />
              )}
            </div>
          </div>
        </Marker>
      );
    });
  }, [clusters, userLocation, memories]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <Map
        ref={mapRef}
        attributionControl={false}
        onLoad={() => {
          setIsMapLoaded(true);
          if (geolocateControlRef.current) {
            setTimeout(() => {
              geolocateControlRef.current.trigger();
            }, 500);
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
          updateClusters();
        }}
      >
        {/* Only render MapLayers when the map is fully loaded */}
        {isMapLoaded && <MapLayers mapRef={mapRef} />}

        <div className="absolute right-4 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex flex-col gap-2">
          <button
            aria-label="Zoom in"
            className="ctrl-btn h-10 w-10"
            type="button"
            onClick={() => mapRef.current?.getMap()?.zoomIn()}
          >
            <HiPlus className="w-5 h-5 text-ink" />
          </button>
          <button
            aria-label="Zoom out"
            className="ctrl-btn h-10 w-10"
            type="button"
            onClick={() => mapRef.current?.getMap()?.zoomOut()}
          >
            <HiMinus className="w-5 h-5 text-ink" />
          </button>
          <button
            aria-label="Center on my location"
            className="ctrl-btn h-10 w-10"
            type="button"
            onClick={() =>
              handleLocateClick(
                userLocation,
                () => {},
                mapRef,
                setHasMovedToUser,
              )
            }
          >
            <HiLocationMarker className="w-5 h-5 text-accent" />
          </button>
        </div>

        {userLocation && (
          <Marker
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
          >
            <div className="relative pb-10 z-50">
              <HiLocationMarker className="w-8 h-8 text-accent drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] animate-bounce" />
            </div>
          </Marker>
        )}

        <GeolocateControl
          ref={geolocateControlRef}
          positionOptions={{ enableHighAccuracy: true }}
          showUserLocation={true} // ✅ Ensures the user dot stays visible
          trackUserLocation={true}
          onError={(error) => {
            // Location denied/unavailable — keep the map usable and let the
            // banner inform the user. Avoid noisy uncaught errors.
            console.warn("Geolocation unavailable:", error?.message);
            setUserLocation(null);
          }}
          onGeolocate={(position) => {
            handleGeolocate(
              position,
              setUserLocation,
              () => {},
              setViewState,
              mapRef,
            );
          }}
        />

        {renderedMarkers}

        <MarkerModal
          isNearMarker={selectedMemory?.isNearMarker ?? false}
          isOpen={isModalOpen}
          memory={selectedMemory}
          user={user ? { uid: user.uid } : undefined}
          onClose={() => setIsModalOpen(false)}
          onUnlock={() => unlockMemory(selectedMemory, setSelectedMemory)}
        />
      </Map>

      {/* Location-off indicator: a slashed red button below the menu.
          Tapping it toggles a small info box. Hidden once location connects. */}
      {!userLocation && (
        <div className="absolute left-4 top-20 z-20 flex flex-col items-start gap-2">
          <button
            aria-label="Location not connected"
            className="ctrl-btn h-10 w-10 ring-1 ring-red-500/50"
            type="button"
            onClick={() => setShowLocationInfo((prev) => !prev)}
          >
            <MdLocationOff className="h-5 w-5 text-red-400" />
          </button>

          {showLocationInfo && (
            <div className="glass max-w-[16rem] rounded-2xl p-3 text-sm text-ink-muted shadow-glass">
              You&apos;re not connected to location. Enable location access to
              create and unlock memories near you.
            </div>
          )}
        </div>
      )}

      <button
        className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-1/2 z-10 flex -translate-x-1/2 transform items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-semibold text-black shadow-glass-lg transition-all duration-200 hover:bg-accent-soft hover:scale-[1.03] active:scale-95"
        onClick={() =>
          handleCreateMemory(user, profile, userLocation, setShowUploadModal)
        }
      >
        <HiPlus className="w-5 h-5" /> Create Memory
      </button>

      {showUploadModal && userLocation && (
        <MemoryUpload
          isOpen={showUploadModal}
          location={userLocation}
          profile={profile}
          user={user}
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
