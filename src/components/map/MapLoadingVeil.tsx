// Branded loading veil shown until Mapbox is ready (avoids a white flash).
const MapLoadingVeil = () => (
  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-background">
    <div className="h-14 w-14 animate-spin rounded-full border-4 border-accent border-t-transparent" />
    <p className="text-sm text-ink-faint">Loading your map…</p>
  </div>
);

export default MapLoadingVeil;
