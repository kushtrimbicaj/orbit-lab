import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { visualOrbitRadius } from '../utils/astronomy';

/** Camera limits, in scene units. */
export const CAMERA_LIMITS = {
  minDistance: 3,
  maxDistance: 1400,
  maxTargetDistance: 260, // how far the orbit target may be panned from the Sun
  minPolarAngle: 0.04,
  maxPolarAngle: Math.PI - 0.04,
};

/** Radius that must fit on screen for the "entire solar system" view. */
const SYSTEM_RADIUS = visualOrbitRadius(30.5) + 6;

/** Distance needed to fit a sphere of `radius` given the camera fov and aspect. */
function fitDistance(radius, camera) {
  const vHalf = (camera.fov * Math.PI) / 360;
  const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
  return (radius / Math.sin(Math.min(vHalf, hHalf))) * 1.02;
}

/** Writes the camera position for a named overview into `out`. */
function overviewPosition(type, camera, out) {
  if (type === 'system') {
    // Bird's-eye view, 62° above the ecliptic, fitted to Neptune's orbit
    const d = fitDistance(SYSTEM_RADIUS, camera);
    const elevation = (62 * Math.PI) / 180;
    return out.set(0, d * Math.sin(elevation), d * Math.cos(elevation));
  }
  // Default "home" view: a lower, cinematic angle framing the inner system
  // and the gas giants. Pulls back on narrow (portrait) screens.
  const d = Math.min(CAMERA_LIMITS.maxDistance * 0.9, 250 * Math.max(1, 1.45 / camera.aspect));
  const elevation = (24 * Math.PI) / 180;
  return out.set(d * 0.18, d * Math.sin(elevation), d * Math.cos(elevation));
}

/**
 * Smooth camera transitions and body following for drei's OrbitControls.
 *
 * Modes
 *  - transition: camera and orbit target ease towards a goal each frame
 *                (exponential smoothing, frame-rate independent).
 *  - follow:     the target body keeps moving along its orbit; the camera is
 *                translated by the body's per-frame displacement, so users can
 *                still rotate/zoom freely around it.
 *  - idle:       OrbitControls is fully in charge.
 *
 * As soon as the user grabs the controls during a transition, the transition
 * is abandoned so manual navigation never fights the animation.
 */
export function useCameraRig({ controlsRef, bodiesRef, command }) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);

  const rig = useRef({
    mode: 'idle',
    followId: null,
    goalTarget: new Vector3(),
    goalCamera: new Vector3(),
    offset: new Vector3(),
    lastBodyPosition: new Vector3(),
    hasLastBodyPosition: false,
  });
  const tmp = useRef(new Vector3());

  // React to a new camera command.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const state = rig.current;
    state.hasLastBodyPosition = false;

    if (command.type === 'focus' && command.id) {
      const body = bodiesRef.current.get(command.id);
      if (!body) return;
      const bodyPosition = body.object.getWorldPosition(tmp.current);
      const distance = Math.max(body.radius * (command.id === 'sun' ? 5 : 6.5), 6);

      // Approach from the current viewing direction, but keep some elevation
      // so the planet is seen at a pleasant three-quarter angle.
      state.offset.copy(camera.position).sub(bodyPosition);
      if (state.offset.lengthSq() < 1e-6) state.offset.set(0, 1, 1);
      state.offset.normalize();
      state.offset.y = Math.max(state.offset.y, 0.3);
      state.offset.normalize().multiplyScalar(distance);

      state.followId = command.id;
      state.mode = 'transition';
      controls.minDistance = Math.max(body.radius * 1.6, 1.5);
    } else {
      state.followId = null;
      state.mode = 'transition';
      state.goalTarget.set(0, 0, 0);
      overviewPosition(command.type === 'system' ? 'system' : 'reset', camera, state.goalCamera);
      controls.minDistance = CAMERA_LIMITS.minDistance + 7; // stay outside the Sun
    }
    invalidate();
  }, [command, controlsRef, bodiesRef, camera, invalidate]);

  // Abandon an in-flight transition when the user starts interacting.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return undefined;
    const onStart = () => {
      const state = rig.current;
      if (state.mode === 'transition') state.mode = state.followId ? 'follow' : 'idle';
    };
    controls.addEventListener('start', onStart);
    return () => controls.removeEventListener('start', onStart);
  }, [controlsRef]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const state = rig.current;
    let moved = false;

    if (state.followId) {
      const body = bodiesRef.current.get(state.followId);
      if (body) {
        const bodyPosition = body.object.getWorldPosition(tmp.current);
        if (state.mode === 'transition') {
          state.goalTarget.copy(bodyPosition);
          state.goalCamera.copy(bodyPosition).add(state.offset);
        } else if (state.mode === 'follow' && state.hasLastBodyPosition) {
          // Carry the camera along with the orbiting body.
          const dx = bodyPosition.x - state.lastBodyPosition.x;
          const dy = bodyPosition.y - state.lastBodyPosition.y;
          const dz = bodyPosition.z - state.lastBodyPosition.z;
          if (dx !== 0 || dy !== 0 || dz !== 0) {
            camera.position.x += dx; camera.position.y += dy; camera.position.z += dz;
            controls.target.x += dx; controls.target.y += dy; controls.target.z += dz;
            moved = true;
          }
        }
        state.lastBodyPosition.copy(bodyPosition);
        state.hasLastBodyPosition = true;
      }
    }

    if (state.mode === 'transition') {
      // Exponential smoothing: identical feel at any frame rate.
      const t = 1 - Math.exp(-Math.min(delta, 0.1) * 3.2);
      camera.position.lerp(state.goalCamera, t);
      controls.target.lerp(state.goalTarget, t);
      moved = true;
      const settleDistance = Math.max(0.02, state.goalCamera.distanceTo(state.goalTarget) * 0.004);
      if (camera.position.distanceTo(state.goalCamera) < settleDistance && controls.target.distanceTo(state.goalTarget) < settleDistance) {
        state.mode = state.followId ? 'follow' : 'idle';
      }
    }

    // Keep panning within a sensible region around the Sun.
    if (!state.followId && controls.target.length() > CAMERA_LIMITS.maxTargetDistance) {
      controls.target.setLength(CAMERA_LIMITS.maxTargetDistance);
      moved = true;
    }

    if (moved) camera.lookAt(controls.target);
  });
}
