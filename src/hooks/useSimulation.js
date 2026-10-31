import { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { DAYS_PER_SECOND_AT_1X, MAX_FRAME_DELTA } from '../utils/astronomy';

/**
 * Advances the simulation clock. Must be used inside the R3F <Canvas>.
 *
 * The clock lives in a mutable ref rather than React state: it changes every
 * frame, and routing that through React would re-render the whole tree 60
 * times a second. Three separate accumulators let orbital motion and spin be
 * paused independently while the global elapsed time keeps counting.
 *
 * Integration uses the real frame delta, so the simulated rate is identical
 * at 30, 60 or 144 frames per second.
 */
export function useSimulationClock(clockRef, runtimeRef) {
  useFrame((_, delta) => {
    const runtime = runtimeRef.current;
    if (!runtime.playing) return;
    const dt = Math.min(delta, MAX_FRAME_DELTA);
    const simDays = dt * DAYS_PER_SECOND_AT_1X * runtime.speed;
    const clock = clockRef.current;
    clock.elapsedDays += simDays;
    if (runtime.orbitEnabled) clock.orbitDays += simDays;
    if (runtime.rotationEnabled) clock.spinDays += simDays;
  });
}

/**
 * Low-frequency snapshot of the clock for UI display (timeline). Polling a few
 * times per second keeps React renders cheap while still feeling live.
 */
export function useSimulationTime(clockRef, intervalMs = 200) {
  const [snapshot, setSnapshot] = useState(() => ({ ...clockRef.current }));
  useEffect(() => {
    const id = window.setInterval(() => {
      const { elapsedDays, orbitDays } = clockRef.current;
      setSnapshot((prev) =>
        prev.elapsedDays === elapsedDays && prev.orbitDays === orbitDays ? prev : { elapsedDays, orbitDays },
      );
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [clockRef, intervalMs]);
  return snapshot;
}
