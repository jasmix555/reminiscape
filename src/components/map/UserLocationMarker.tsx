import { Marker } from "react-map-gl";
import { HiLocationMarker } from "react-icons/hi";

const UserLocationMarker = ({
  longitude,
  latitude,
}: {
  longitude: number;
  latitude: number;
}) => (
  <Marker latitude={latitude} longitude={longitude}>
    <div className="relative pb-10 z-50">
      <HiLocationMarker className="w-8 h-8 text-accent drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] animate-bounce" />
    </div>
  </Marker>
);

export default UserLocationMarker;
