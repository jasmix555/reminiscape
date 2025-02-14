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
    longitude: 0,
    latitude: 0,
    zoom: 1,
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
  const geolocateControlRef = useRef<any>(null);

  const cluster = useRef(
    new Supercluster<MemoryFeature["properties"], MemoryFeature["geometry"]>({
      radius: 50,
      maxZoom: 16,
    }),
  );

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
    updateClusters();
  }, [memories, updateClusters]);

  useEffect(() => {
    if (geolocateControlRef.current) {
      geolocateControlRef.current.trigger();
    }
  }, []);

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
            latitude={latitude}
            longitude={longitude}
          >
            <div
              className="bg-blue-600 text-white text-sm font-bold w-10 h-10 flex items-center justify-center rounded-full shadow-md cursor-pointer"
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
              {point_count}
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
            className="cursor-pointer transform hover:scale-110 transition-transform z-50"
            onClick={(e) => {
              e.stopPropagation();
              handleMarkerClick(
                { ...memory, isNearMarker: isNearMarker ?? undefined },
                userLocation,
                setSelectedMemory as (memory: Memory | null) => void,
                setIsModalOpen,
                mapRef,
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
        <MapLayers map={mapRef.current} />
        <div className="absolute right-4 bottom-4 z-10 flex flex-col gap-2">
          <button
            className="p-2 rounded-full shadow-lg bg-white text-gray-700 hover:bg-gray-200"
            onClick={() => handleLocateClick(userLocation, () => {}, mapRef)}
          >
            <HiLocationMarker className="w-5 h-5" />
          </button>
          <div className="bg-white rounded-lg shadow-lg">
            <NavigationControl showCompass={true} showZoom={true} />
          </div>
        </div>

        <GeolocateControl
          ref={geolocateControlRef}
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
          onGeolocate={(position) =>
            handleGeolocate(
              position,
              setUserLocation,
              () => {},
              setViewState,
              mapRef,
            )
          }
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
