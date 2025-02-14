import React, { useMemo } from "react";
import { Marker } from "react-map-gl";
import Image from "next/image";
import { HiLocationMarker, HiLockClosed } from "react-icons/hi";
import { getDistance } from "geolib";

import { Memory, MemoryFeature } from "@/types";

interface MapMarkersProps {
  clusters: MemoryFeature[];
  memories: Memory[];
  userLocation: { longitude: number; latitude: number } | null;
  handleMarkerClick: (
    memory: Memory & { isNearMarker?: boolean },
    userLocation: { longitude: number; latitude: number } | null,
    setSelectedMemory: (memory: Memory | null) => void,
    setIsModalOpen: (open: boolean) => void,
  ) => void;
  setSelectedMemory: (memory: Memory | null) => void;
  setIsModalOpen: (open: boolean) => void;
  handleClusterClick: (
    longitude: number,
    latitude: number,
    clusterId: number,
  ) => void;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  clusters,
  memories,
  userLocation,
  handleMarkerClick,
  setSelectedMemory,
  setIsModalOpen,
  handleClusterClick,
}) => {
  const renderedMarkers = useMemo(() => {
    return clusters.map((feature) => {
      const [longitude, latitude] = feature.geometry.coordinates;
      const { cluster, memoryId, isUnlocked, imageUrl, point_count } =
        feature.properties;

      if (cluster) {
        return (
          <Marker
            key={`cluster-${memoryId ?? `cluster-${longitude}-${latitude}`}`}
            latitude={latitude}
            longitude={longitude}
          >
            <div
              className="bg-blue-600 text-white text-sm font-bold w-10 h-10 flex items-center justify-center rounded-full shadow-md cursor-pointer"
              onClick={() => {
                if (typeof point_count === "number") {
                  handleClusterClick(longitude, latitude, point_count);
                }
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
        userLocation && getDistance(userLocation, memory.location) <= 100;

      return (
        <Marker key={memoryId} latitude={latitude} longitude={longitude}>
          <div
            className="cursor-pointer transform hover:scale-110 transition-transform z-50"
            onClick={(e) => {
              e.stopPropagation();
              handleMarkerClick(
                { ...memory, isNearMarker: isNearMarker ?? undefined },
                userLocation,
                setSelectedMemory,
                setIsModalOpen,
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

  return <>{renderedMarkers}</>;
};

export default MapMarkers;
