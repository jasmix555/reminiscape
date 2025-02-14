import { useEffect } from "react";
import { MapRef } from "react-map-gl";

interface MapLayersProps {
  map: MapRef | null;
}

const MapLayers: React.FC<MapLayersProps> = ({ map }) => {
  useEffect(() => {
    if (!map) return;

    const mapInstance = map.getMap();
    const style = mapInstance.getStyle();
    const layers = style?.layers;

    if (!layers) return;

    const labelLayerId = layers.find(
      (layer) => layer.type === "symbol" && layer.layout?.["text-field"],
    )?.id;

    if (labelLayerId) {
      mapInstance.addLayer(
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
  }, [map]);

  return null;
};

export default MapLayers;
