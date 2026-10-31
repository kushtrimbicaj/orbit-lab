import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import { AdditiveBlending, Vector3 } from 'three';
import { latLonToSphere, useIss } from '../../hooks/useIss';
import { createGlowTexture } from '../../utils/textures';
import { isHiddenByPlanet } from '../../utils/picking';
import SelectionRing from './SelectionRing';

/**
 * The ISS altitude (~420 km) is only ~3% of Earth's radius, which would sit
 * inside the cloud layer at this scale, so its height is exaggerated.
 */
const ALTITUDE_FACTOR = 1.28;

/**
 * Live ISS marker. Mounted inside Earth's spinning surface mesh, so it sits
 * above its real latitude/longitude on the globe and turns with the planet.
 * The position itself is real time and does not follow the simulation clock.
 */
export default function IssMarker({ earthRadius, earthRef, selected, onSelect, onHover, showLabel = true }) {
  const { position, trail, status } = useIss(true);
  const groupRef = useRef();
  const target = useRef(new Vector3());
  const hasPlaced = useRef(false);
  const orbitRadius = earthRadius * ALTITUDE_FACTOR;

  if (position) latLonToSphere(position.latitude, position.longitude, orbitRadius, target.current);

  const glow = useMemo(() => createGlowTexture(64, [[0, 'rgba(190, 240, 255, 1)'], [0.3, 'rgba(90, 210, 255, 0.45)'], [1, 'rgba(90, 210, 255, 0)']]), []);
  useEffect(() => () => glow.dispose(), [glow]);

  // Recent ground track (3D points, so crossing ±180° longitude needs no special case).
  const trailPoints = useMemo(() => {
    if (trail.length < 2) return null;
    const v = new Vector3();
    return trail.map((p) => latLonToSphere(p.latitude, p.longitude, orbitRadius, v).toArray());
  }, [trail, orbitRadius]);

  // Ease between the 5-second samples instead of jumping.
  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group || !position) return;
    if (!hasPlaced.current) {
      group.position.copy(target.current);
      hasPlaced.current = true;
    } else {
      group.position.lerp(target.current, 1 - Math.exp(-delta * 2));
      // Stay on the shell while interpolating along the chord.
      group.position.setLength(orbitRadius);
    }
  });

  if (!position) return null;
  const stale = status === 'stale';
  const markerSize = earthRadius * 0.045;

  const handleClick = (event) => {
    if (event.delta > 6 || isHiddenByPlanet(event, earthRef.current, earthRadius)) return;
    event.stopPropagation();
    onSelect('iss');
  };
  const handleOver = (event) => {
    if (isHiddenByPlanet(event, earthRef.current, earthRadius)) return;
    event.stopPropagation();
    onHover('iss');
    document.body.style.cursor = 'pointer';
  };
  const handleOut = () => {
    onHover(null);
    document.body.style.cursor = '';
  };

  return (
    <group>
      {trailPoints && (
        <Line points={trailPoints} color="#7fe0ff" lineWidth={1.4} transparent opacity={0.55} depthWrite={false} raycast={() => null} />
      )}
      <group ref={groupRef}>
        <mesh raycast={() => null}>
          <sphereGeometry args={[markerSize, 12, 12]} />
          <meshBasicMaterial color={stale ? '#9aa4b8' : '#bff3ff'} toneMapped={false} />
        </mesh>
        <sprite scale={earthRadius * 0.4} raycast={() => null}>
          <spriteMaterial map={glow} transparent opacity={stale ? 0.25 : 0.55} blending={AdditiveBlending} depthWrite={false} />
        </sprite>
        {/* Hit area several times the marker size; Earth's hit-sphere defers to it */}
        <mesh userData={{ pickPriority: true }} onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
          <sphereGeometry args={[markerSize * 4, 12, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
        {selected && <SelectionRing radius={markerSize * 2.2} color="#7fe0ff" />}
        {(showLabel || selected) && (
          <Html center zIndexRange={[35, 30]} style={{ pointerEvents: 'none' }} position={[0, earthRadius * 0.16, 0]}>
            <button
              type="button"
              className={`iss-label${stale ? ' is-stale' : ''}${selected ? ' is-selected' : ''}`}
              onClick={() => onSelect('iss')}
              onPointerEnter={() => onHover('iss')}
              onPointerLeave={() => onHover(null)}
              aria-label="International Space Station — show details"
            >
              <span className="iss-label__pulse" aria-hidden="true" />
              ISS
            </button>
          </Html>
        )}
      </group>
    </group>
  );
}
