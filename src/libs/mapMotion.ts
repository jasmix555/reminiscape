import { useSyncExternalStore } from "react";

// Tiny shared store so chrome both inside the map (controls, FAB) and outside
// it (the layout-level Header) can hide while the map is being moved.
let moving = false;
const listeners = new Set<() => void>();

export const setMapMoving = (v: boolean) => {
  if (v === moving) return;
  moving = v;
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);

  return () => {
    listeners.delete(l);
  };
};

export const useMapMoving = () =>
  useSyncExternalStore(
    subscribe,
    () => moving,
    () => false,
  );
