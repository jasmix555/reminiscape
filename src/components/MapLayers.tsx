import { useEffect } from "react";
import { MapRef } from "react-map-gl";

interface MapLayersProps {
  mapRef: React.RefObject<MapRef>;
}

const MapLayers: React.FC<MapLayersProps> = ({ mapRef }) => {
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();

    if (map.getLayer("add-3d-buildings")) {
      console.warn(
        "Layer 'add-3d-buildings' already exists. Skipping addition.",
      );

      return;
    }

    const style = map.getStyle();
    const layers = style?.layers;

    if (!layers) return;

    const labelLayerId = layers.find(
      (layer) => layer.type === "symbol" && layer.layout?.["text-field"],
    )?.id;

    if (labelLayerId) {
      map.addLayer(
        {
          id: "add-3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
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
          },
        },
        labelLayerId,
      );
    }

    return () => {
      if (map.getLayer("add-3d-buildings")) {
        map.removeLayer("add-3d-buildings");
      }
    };
  }, [mapRef]);

  return null;
};

export default MapLayers;
