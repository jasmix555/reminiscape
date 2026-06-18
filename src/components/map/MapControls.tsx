import { HiPlus, HiMinus, HiLocationMarker } from "react-icons/hi";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
}

const MapControls = ({ onZoomIn, onZoomOut, onLocate }: MapControlsProps) => (
  <div className="absolute right-4 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex flex-col gap-2">
    <button
      aria-label="Zoom in"
      className="ctrl-btn h-10 w-10"
      type="button"
      onClick={onZoomIn}
    >
      <HiPlus className="w-5 h-5 text-ink" />
    </button>
    <button
      aria-label="Zoom out"
      className="ctrl-btn h-10 w-10"
      type="button"
      onClick={onZoomOut}
    >
      <HiMinus className="w-5 h-5 text-ink" />
    </button>
    <button
      aria-label="Center on my location"
      className="ctrl-btn h-10 w-10"
      type="button"
      onClick={onLocate}
    >
      <HiLocationMarker className="w-5 h-5 text-accent" />
    </button>
  </div>
);

export default MapControls;
