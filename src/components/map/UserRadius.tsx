import { useMemo } from "react";
import { Source, Layer } from "react-map-gl";

import { RADIUS } from "./mapActions";

// Build a geographically-accurate circle polygon (in degrees) so the ring
// scales correctly with zoom — like the detection radius in Pokémon GO.
const buildCircle = (lng: number, lat: number, meters: number, points = 64) => {
  const coords: [number, number][] = [];
  const earth = 6378137; // metres
  const dLat = (meters / earth) * (180 / Math.PI);
  const dLng = dLat / Math.cos((lat * Math.PI) / 180);

  for (let i = 0; i <= points; i++) {
    const t = (i / points) * 2 * Math.PI;

    coords.push([lng + dLng * Math.cos(t), lat + dLat * Math.sin(t)]);
  }

  return coords;
};

const UserRadius = ({
  longitude,
  latitude,
}: {
  longitude: number;
  latitude: number;
}) => {
  const data = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "Polygon" as const,
            coordinates: [buildCircle(longitude, latitude, RADIUS)],
          },
        },
      ],
    }),
    [longitude, latitude],
  );

  return (
    <Source data={data as any} id="user-radius" type="geojson">
      <Layer
        id="user-radius-fill"
        paint={{ "fill-color": "#f5b942", "fill-opacity": 0.12 }}
        type="fill"
      />
      <Layer
        id="user-radius-line"
        paint={{
          "line-color": "#f5b942",
          "line-opacity": 0.6,
          "line-width": 2,
        }}
        type="line"
      />
    </Source>
  );
};

export default UserRadius;
