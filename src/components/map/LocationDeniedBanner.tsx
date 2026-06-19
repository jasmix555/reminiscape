import { useState } from "react";
import { MdLocationOff } from "react-icons/md";

const LocationDeniedBanner = ({ hidden }: { hidden?: boolean }) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className={`absolute left-4 top-20 z-20 flex flex-col items-start gap-2 transition-all duration-300 ${
        hidden ? "pointer-events-none -translate-x-24 opacity-0" : "opacity-100"
      }`}
    >
      <button
        aria-label="Location not connected"
        className="ctrl-btn h-10 w-10 ring-1 ring-red-500/50"
        type="button"
        onClick={() => setShow((prev) => !prev)}
      >
        <MdLocationOff className="h-5 w-5 text-red-400" />
      </button>

      {show && (
        <div className="glass max-w-[16rem] rounded-2xl p-3 text-sm text-ink-muted shadow-glass">
          You&apos;re not connected to location. Enable location access to
          create and unlock memories near you.
        </div>
      )}
    </div>
  );
};

export default LocationDeniedBanner;
