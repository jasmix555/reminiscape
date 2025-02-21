import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import Map, { Marker, NavigationControl, GeolocateControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { HiLocationMarker, HiPlus, HiLockClosed } from "react-icons/hi";
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
              className="bg-blue-600/75 hover:bg-blue-600 text-white text-sm font-bold p-2 flex items-center justify-center rounded-lg shadow-md cursor-pointer z-10 transform hover:scale-110 transition-transform"
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
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 ${
                isUnlocked ? "bg-white border-gray-200" : "bg-gray-400"
              }`}
            >
              {isUnlocked ? (
                imageUrl ? (
                  <Image
                    alt="Memory thumbnail"
                    className="w-8 h-8 rounded-full object-cover"
                    height={32}
                    src={imageUrl}
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

        <div className="absolute right-3  top-44  z-10 flex flex-col gap-2">
          <NavigationControl showZoom={true} />

          <button
            className="p-2 rounded-full border-gray-200 border-2 shadow-lg bg-white text-gray-700 hover:bg-gray-200"
            onClick={() =>
              handleLocateClick(
                userLocation,
                () => {},
                mapRef,
                setHasMovedToUser,
              )
            }
          >
            <HiLocationMarker className="w-5 h-5" />
          </button>
        </div>

        {userLocation && (
          <Marker
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
          >
            <div className="relative pb-10 z-50">
              <HiLocationMarker className="w-8 h-8 text-blue-500 animate-bounce" />
            </div>
          </Marker>
        )}

        <GeolocateControl
          ref={geolocateControlRef}
          positionOptions={{ enableHighAccuracy: true }}
          showUserLocation={true} // ✅ Ensures the user dot stays visible
          trackUserLocation={true}
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

      <button
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2"
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
