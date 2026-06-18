import { useCallback, useEffect, useRef, useState } from "react";
import Supercluster from "supercluster";

import { Memory, MemoryFeature } from "@/types";

/**
 * Encapsulates Supercluster setup and recomputation for the map. Loads memory
 * points whenever `memories` change and recomputes the visible clusters for
 * the current viewport on demand (e.g. on map move).
 */
export const useClusters = (
  memories: Memory[],
  mapRef: React.RefObject<any>,
  zoom: number,
) => {
  const [clusters, setClusters] = useState<MemoryFeature[]>([]);
  const supercluster = useRef(
    new Supercluster<MemoryFeature["properties"], MemoryFeature["geometry"]>({
      radius: 50,
      maxZoom: 16,
    }),
  );

  const recompute = useCallback(() => {
    const map = mapRef.current?.getMap();

    if (!map) return;

    // getClusters() throws if load() was never called (no memories yet).
    if (!memories.length) {
      setClusters([]);

      return;
    }

    const bounds = map.getBounds();

    setClusters(
      supercluster.current.getClusters(
        [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ],
        Math.floor(zoom),
      ) as MemoryFeature[],
    );
  }, [memories, zoom, mapRef]);

  useEffect(() => {
    if (!memories.length) {
      setClusters([]);

      return;
    }

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

    supercluster.current.load(points);
    recompute();
  }, [memories, recompute]);

  return { clusters, recompute, supercluster };
};
