import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, IcosahedronGeometry, Object3D } from 'three';
import { ASTEROID_BELT } from '../../data/planets';
import { keplerPeriodDays, visualOrbitRadius } from '../../utils/astronomy';

/** Deterministic PRNG (mulberry32) so the belt looks the same on every load. */
function createRandom(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Main asteroid belt rendered with a single InstancedMesh (one draw call).
 * Each asteroid gets its own semi-major axis between 2.2 and 3.2 AU and moves
 * with the angular velocity given by Kepler's third law (P² = a³), so inner
 * asteroids visibly overtake outer ones.
 */
export default function AsteroidBelt({ clockRef, count = 1400 }) {
  const meshRef = useRef();
  const geometry = useMemo(() => new IcosahedronGeometry(1, 0), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const asteroids = useMemo(() => {
    const random = createRandom(2024);
    const data = new Float32Array(count * 8);
    const { innerAU, outerAU } = ASTEROID_BELT;
    for (let i = 0; i < count; i += 1) {
      // Bias towards the middle of the belt
      const t = (random() + random() + random()) / 3;
      const a = innerAU + (outerAU - innerAU) * t;
      const o = i * 8;
      data[o] = visualOrbitRadius(a) + (random() - 0.5) * 0.8; // radius (scene units)
      data[o + 1] = random() * Math.PI * 2; // phase
      data[o + 2] = (2 * Math.PI) / keplerPeriodDays(a); // angular velocity (rad/day)
      data[o + 3] = (random() - 0.5) * 2.2; // vertical offset (inclination spread)
      data[o + 4] = 0.06 + Math.pow(random(), 4) * 0.32; // size: many small, few large
      data[o + 5] = random() * Math.PI; // tumble rotation x
      data[o + 6] = random() * Math.PI; // tumble rotation y
      data[o + 7] = 0.6 + random() * 0.8; // aspect squash
    }
    return data;
  }, [count]);

  // Per-instance colour variation (grey to brownish rock).
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const random = createRandom(77);
    const color = new Color();
    for (let i = 0; i < count; i += 1) {
      const shade = 0.35 + random() * 0.35;
      color.setRGB(shade * (1.05 + random() * 0.15), shade, shade * (0.85 + random() * 0.1));
      mesh.setColorAt(i, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count]);

  const dummy = useMemo(() => new Object3D(), []);
  const lastDays = useRef(Number.NaN);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const days = clockRef.current.orbitDays;
    if (days === lastDays.current) return; // nothing moved — skip the matrix upload
    lastDays.current = days;
    for (let i = 0; i < count; i += 1) {
      const o = i * 8;
      const angle = asteroids[o + 1] + asteroids[o + 2] * days;
      const r = asteroids[o];
      dummy.position.set(Math.cos(angle) * r, asteroids[o + 3], -Math.sin(angle) * r);
      dummy.rotation.set(asteroids[o + 5] + days * 0.01, asteroids[o + 6], 0);
      const s = asteroids[o + 4];
      dummy.scale.set(s, s * asteroids[o + 7], s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, count]} frustumCulled={false} raycast={() => null}>
      <meshStandardMaterial roughness={1} metalness={0} flatShading />
    </instancedMesh>
  );
}
