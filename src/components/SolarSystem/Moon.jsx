import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { MOON } from '../../data/planets';
import { MOON_VISUAL_DISTANCE, visualBodyRadius } from '../../utils/astronomy';
import { prepareColorTexture, textureUrl } from '../../utils/textures';
import { isHiddenByPlanet } from '../../utils/picking';
import SelectionRing from './SelectionRing';

const MOON_RADIUS = visualBodyRadius(MOON.diameterKm);
const INCLINATION = (MOON.inclinationDeg * Math.PI) / 180;
const MOON_L0 = (MOON.meanLongitudeJ2000Deg * Math.PI) / 180;

/**
 * Earth's Moon. Rendered as a child of Earth's orbital group, so it follows
 * Earth around the Sun. Its orbit uses the real 27.3-day sidereal period, its
 * J2000 mean longitude (so lunar phases are right for the model date) and the
 * 5.1° inclination; the Moon is tidally locked, so the same face always points
 * at Earth. It is selectable like a planet.
 */
export default function Moon({ clockRef, bodiesRef, earthRef, earthRadius, selected, onSelect, onHover, registerLabel, showLabel }) {
  const textures = useTexture({ map: textureUrl(MOON.textures.map), bumpMap: textureUrl(MOON.textures.bump) });
  useMemo(() => prepareColorTexture(textures.map), [textures.map]);
  const pivotRef = useRef();
  const bodyRef = useRef();
  const labelRef = useRef();

  useEffect(() => {
    const registry = bodiesRef.current;
    registry.set('moon', { object: bodyRef.current, radius: MOON_RADIUS });
    return () => registry.delete('moon');
  }, [bodiesRef]);

  useEffect(() => registerLabel('moon', { anchor: bodyRef, element: labelRef, radius: MOON_RADIUS }), [registerLabel]);

  useFrame(() => {
    if (!pivotRef.current) return;
    // Ecliptic longitude = L₀ + 360° · t / P. In scene space a rotation of θ about +Y
    // carries +X to ecliptic longitude θ, so the Moon's phase relative to the Sun
    // matches the real sky at the model date.
    pivotRef.current.rotation.y = MOON_L0 + (2 * Math.PI * clockRef.current.orbitDays) / MOON.siderealPeriodDays;
  });

  const handleClick = (event) => {
    if (event.delta > 6 || isHiddenByPlanet(event, earthRef.current, earthRadius)) return;
    event.stopPropagation();
    onSelect('moon');
  };
  const handleOver = (event) => {
    if (isHiddenByPlanet(event, earthRef.current, earthRadius)) return;
    event.stopPropagation();
    onHover('moon');
    document.body.style.cursor = 'pointer';
  };
  const handleOut = () => {
    onHover(null);
    document.body.style.cursor = '';
  };

  return (
    <group rotation={[INCLINATION, 0, 0]}>
      <group ref={pivotRef}>
        <group ref={bodyRef} position={[MOON_VISUAL_DISTANCE, 0, 0]}>
          <mesh rotation={[0, Math.PI, 0]}>
            <sphereGeometry args={[MOON_RADIUS, 48, 48]} />
            <meshStandardMaterial map={textures.map} bumpMap={textures.bumpMap} bumpScale={1.5} roughness={1} metalness={0} />
          </mesh>
          {/* Enlarged hit area; flagged so Earth's own hit-sphere defers to it */}
          <mesh userData={{ pickPriority: true }} onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
            <sphereGeometry args={[MOON_RADIUS * 1.5, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
          </mesh>
          {selected && <SelectionRing radius={MOON_RADIUS} color={MOON.accent} />}
          {showLabel && (
            <Html position={[0, MOON_RADIUS + 0.6, 0]} center zIndexRange={[30, 10]} style={{ pointerEvents: 'none' }}>
              <button
                type="button"
                ref={labelRef}
                className={`planet-label planet-label--small${selected ? ' is-selected' : ''}`}
                style={{ '--accent': MOON.accent }}
                onClick={() => onSelect('moon')}
                onPointerEnter={() => onHover('moon')}
                onPointerLeave={() => onHover(null)}
                aria-label="Focus the Moon"
              >
                <span className="planet-label__dot" aria-hidden="true" />
                Moon
              </button>
            </Html>
          )}
        </group>
      </group>
    </group>
  );
}
