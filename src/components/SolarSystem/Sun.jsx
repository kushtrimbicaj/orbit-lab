import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { AdditiveBlending } from 'three';
import { SUN } from '../../data/planets';
import { SUN_VISUAL_RADIUS, spinAngle } from '../../utils/astronomy';
import { createGlowTexture, prepareColorTexture, textureUrl } from '../../utils/textures';
import { useSimulationContext } from '../../context/SimulationContext';
import SelectionRing from './SelectionRing';

/**
 * The Sun: an unlit (emissive-looking) textured sphere, two additive glow
 * sprites for the corona, and the point light that illuminates the planets.
 */
export default function Sun() {
  const { clockRef, bodiesRef, selectBody, selectedId, setHoveredId } = useSimulationContext();
  const map = useTexture(textureUrl(SUN.textures.map));
  useMemo(() => prepareColorTexture(map), [map]);

  const groupRef = useRef();
  const surfaceRef = useRef();
  const innerGlowRef = useRef();
  const outerGlowRef = useRef();

  const glowTexture = useMemo(() => createGlowTexture(), []);
  const haloTexture = useMemo(
    () => createGlowTexture(256, [
      [0, 'rgba(255, 170, 80, 0.35)'],
      [0.35, 'rgba(255, 120, 40, 0.1)'],
      [1, 'rgba(255, 90, 20, 0)'],
    ]),
    [],
  );
  useEffect(() => () => {
    glowTexture.dispose();
    haloTexture.dispose();
  }, [glowTexture, haloTexture]);

  // Register for camera focusing.
  useEffect(() => {
    const registry = bodiesRef.current;
    registry.set('sun', { object: groupRef.current, radius: SUN_VISUAL_RADIUS });
    return () => registry.delete('sun');
  }, [bodiesRef]);

  useFrame(({ clock }) => {
    if (surfaceRef.current) surfaceRef.current.rotation.y = spinAngle(clockRef.current.spinDays, SUN.rotationPeriodHours);
    // Gentle "breathing" of the corona (real-time, independent of sim speed)
    const pulse = 1 + Math.sin(clock.elapsedTime * 0.8) * 0.025;
    if (innerGlowRef.current) innerGlowRef.current.scale.setScalar(SUN_VISUAL_RADIUS * 4.2 * pulse);
    if (outerGlowRef.current) outerGlowRef.current.scale.setScalar(SUN_VISUAL_RADIUS * 11 * (2 - pulse));
  });

  const onClick = (event) => {
    if (event.delta > 6) return; // ignore drags
    event.stopPropagation();
    selectBody('sun');
  };

  return (
    <group ref={groupRef}>
      <pointLight position={[0, 0, 0]} intensity={3.4} decay={0} distance={0} color="#fff3e0" />
      <group rotation={[0, 0, (-SUN.obliquityDeg * Math.PI) / 180]}>
      <mesh
        ref={surfaceRef}
        onClick={onClick}
        onPointerOver={(e) => { e.stopPropagation(); setHoveredId('sun'); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHoveredId(null); document.body.style.cursor = ''; }}
      >
        <sphereGeometry args={[SUN_VISUAL_RADIUS, 64, 64]} />
        <meshBasicMaterial map={map} color={[1.25, 1.12, 1]} toneMapped={false} />
      </mesh>
      </group>
      <sprite ref={innerGlowRef} scale={SUN_VISUAL_RADIUS * 4.2} raycast={() => null}>
        <spriteMaterial map={glowTexture} blending={AdditiveBlending} depthWrite={false} transparent toneMapped={false} />
      </sprite>
      <sprite ref={outerGlowRef} scale={SUN_VISUAL_RADIUS * 11} raycast={() => null}>
        <spriteMaterial map={haloTexture} blending={AdditiveBlending} depthWrite={false} transparent toneMapped={false} opacity={0.8} />
      </sprite>
      {selectedId === 'sun' && <SelectionRing radius={SUN_VISUAL_RADIUS} color={SUN.accent} />}
    </group>
  );
}
