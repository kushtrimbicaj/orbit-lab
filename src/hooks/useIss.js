import { useEffect, useSyncExternalStore } from 'react';
import { getIssSnapshot, startIssTracking, subscribeIss } from '../services/issTracker';

/** Live ISS state. Polling runs only while at least one enabled consumer is mounted. */
export function useIss(enabled = true) {
  useEffect(() => (enabled ? startIssTracking() : undefined), [enabled]);
  return useSyncExternalStore(subscribeIss, getIssSnapshot);
}

/**
 * Convert latitude/longitude (degrees) to a point on a Three.js SphereGeometry of
 * the given radius, matching the equirectangular texture mapping (u = 0 at
 * longitude −180°). Writes into `out` ({ set(x, y, z) }).
 */
export function latLonToSphere(latitude, longitude, radius, out) {
  const lat = (latitude * Math.PI) / 180;
  const phi = ((longitude + 180) / 360) * Math.PI * 2;
  return out.set(-Math.cos(phi) * Math.cos(lat) * radius, Math.sin(lat) * radius, Math.sin(phi) * Math.cos(lat) * radius);
}
