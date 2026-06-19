import React from "react";
import { Marker } from "react-map-gl";
import Image from "next/image";
import { HiLocationMarker } from "react-icons/hi";
import { getDistance } from "geolib";

import { RADIUS } from "./mapActions";

import { Memory, MemoryFeature } from "@/types";

interface MapMarkersProps {
  clusters: MemoryFeature[];
  memories: Memory[];
  userLocation: { longitude: number; latitude: number } | null;
  onClusterClick: (
    clusterId: number,
    longitude: number,
    latitude: number,
  ) => void;
  onMemoryClick: (memory: Memory, isNearMarker: boolean) => void;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  clusters,
  memories,
  userLocation,
  onClusterClick,
  onMemoryClick,
}) => {
  return (
    <>
      {clusters.map((feature) => {
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
                onClick={() => onClusterClick(clusterId, longitude, latitude)}
              >
                {point_count} {point_count === 1 ? "Memory" : "Memories"}
              </div>
            </Marker>
          );
        }

        const memory = memories.find((m) => m.id === memoryId);

        if (!memory) return null;

        const isNearMarker =
          !!userLocation &&
          getDistance(userLocation, memory.location) <= RADIUS;

        return (
          <Marker key={memoryId} latitude={latitude} longitude={longitude}>
            <div
              className="cursor-pointer transform hover:scale-110 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                onMemoryClick(memory, isNearMarker);
              }}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-glass border-2 ${
                  isUnlocked
                    ? "border-accent bg-surface"
                    : "glass border-accent/40"
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
                  <span className="text-lg font-bold text-accent">?</span>
                )}
              </div>
            </div>
          </Marker>
        );
      })}
    </>
  );
};

export default MapMarkers;
