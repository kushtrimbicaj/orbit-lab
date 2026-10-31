import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { DoubleSide, RingGeometry } from 'three';
import { planetPosition, spinAngle } from '../../utils/astronomy';
import { prepareColorTexture, textureUrl } from '../../utils/textures';
import Atmosphere from './Atmosphere';
import Moon from './Moon';
import SelectionRing from './SelectionRing';
import IssMarker from './IssMarker';
import { hasVisiblePriorityTarget } from '../../utils/picking';

/** Ring geometry whose UVs run radially (u = 0 inner edge → 1 outer edge). */
function useRadialRingGeometry(inner, outer) {
  const geometry = useMemo(() => {
    const ring = new RingGeometry(inner, outer, 160, 1);
    const position = ring.attributes.position;
    const uv = ring.attributes.uv;
    for (let i = 0; i < position.count; i += 1) {
      const radius = Math.hypot(position.getX(i), position.getY(i));
      uv.setXY(i, (radius - inner) / (outer - inner), 0.5);
    }
    uv.needsUpdate = true;
    return ring;
  }, [inner, outer]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

function SaturnRings({ radius, rings, ringUrl }) {
  const ringTexture = useTexture(ringUrl);
  useMemo(() => prepareColorTexture(ringTexture), [ringTexture]);
  const geometry = useRadialRingGeometry(radius * rings.innerRadiusRatio, radius * rings.outerRadiusRatio);
  return (
    // RingGeometry lies in the XY plane; rotate it into the equatorial plane.
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <meshStandardMaterial
        map={ringTexture}
        side={DoubleSide}
        transparent
        depthWrite={false}
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  );
}

/** Surface material: Phong (with a specular map) for Earth, PBR for the rest. */
function PlanetSurface({ textures, data }) {
  const urls = useMemo(() => {
    const list = { map: textureUrl(textures.map) };
    if (textures.bump) list.bumpMap = textureUrl(textures.bump);
    if (textures.specular) list.specularMap = textureUrl(textures.specular);
    return list;
  }, [textures]);
  const loaded = useTexture(urls);
  useMemo(() => prepareColorTexture(loaded.map), [loaded.map]);

  if (loaded.specularMap) {
    return (
      <meshPhongMaterial
        map={loaded.map}
        bumpMap={loaded.bumpMap}
        bumpScale={2}
        specularMap={loaded.specularMap}
        specular="#4a6a8c"
        shininess={22}
      />
    );
  }
  return (
    <meshStandardMaterial
      map={loaded.map}
      bumpMap={loaded.bumpMap ?? null}
      bumpScale={data.category === 'terrestrial' ? 2 : 0}
      roughness={data.category === 'terrestrial' ? 0.95 : 0.8}
      metalness={0}
    />
  );
}

function CloudLayer({ url, radius, clockRef, rotationPeriodHours }) {
  const clouds = useTexture(url);
  const ref = useRef();
  useFrame(() => {
    // Clouds drift slightly faster than the surface rotates.
    if (ref.current) ref.current.rotation.y = spinAngle(clockRef.current.spinDays, rotationPeriodHours) * 1.08;
  });
  return (
    <mesh ref={ref} scale={radius * 1.012} raycast={() => null}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial color="#ffffff" alphaMap={clouds} transparent depthWrite={false} roughness={1} metalness={0} opacity={0.9} />
    </mesh>
  );
}

/**
 * A planet: Keplerian orbital motion, axial tilt, spin, optional clouds,
 * rings, atmosphere and Moon, plus an enlarged invisible hit-sphere so small
 * planets are easy to click or tap.
 */
function Planet({ data, orbit, radius, selected, onSelect, onHover, clockRef, bodiesRef, registerLabel, showLabel, showIss = false, satelliteSelectedId = null }) {
  const orbitGroupRef = useRef();
  const spinRef = useRef();
  const labelRef = useRef();
  const tilt = (data.obliquityDeg * Math.PI) / 180;

  // Place the planet before the first paint, then register it for the camera rig.
  useLayoutEffect(() => {
    if (orbitGroupRef.current) planetPosition(orbit, clockRef.current.orbitDays, orbitGroupRef.current.position);
    const registry = bodiesRef.current;
    registry.set(data.id, { object: orbitGroupRef.current, radius });
    // The ISS view frames Earth and the station's orbit, following Earth's motion
    // (following the station itself would whip around the fast-spinning globe).
    if (data.id === 'earth') registry.set('iss', { object: orbitGroupRef.current, radius: radius * 1.35 });
    return () => {
      registry.delete(data.id);
      if (data.id === 'earth') registry.delete('iss');
    };
  }, [data.id, orbit, radius, bodiesRef, clockRef]);

  useEffect(() => registerLabel(data.id, { anchor: orbitGroupRef, element: labelRef, radius }), [data.id, radius, registerLabel]);

  useFrame(() => {
    const clock = clockRef.current;
    if (orbitGroupRef.current) planetPosition(orbit, clock.orbitDays, orbitGroupRef.current.position);
    // The tilt group fixes the spin axis in space; spin is about the local Y axis.
    // Retrograde rotators (Venus, Uranus) spin "backwards" because their tilt exceeds 90°.
    if (spinRef.current) spinRef.current.rotation.y = spinAngle(clock.spinDays, data.rotationPeriodHours);
  });

  // Defer to a satellite (Moon, ISS) under the pointer: don't stop propagation,
  // so the event reaches its handler next.
  const defersToSatellite = (event) => hasVisiblePriorityTarget(event, orbitGroupRef.current, radius);

  const handleClick = (event) => {
    if (event.delta > 6) return; // a drag, not a click
    if (defersToSatellite(event)) return;
    event.stopPropagation();
    onSelect(data.id);
  };
  const handleOver = (event) => {
    if (defersToSatellite(event)) return;
    event.stopPropagation();
    onHover(data.id);
    document.body.style.cursor = 'pointer';
  };
  const handleOut = () => {
    onHover(null);
    document.body.style.cursor = '';
  };

  return (
    <group ref={orbitGroupRef}>
      <group rotation={[0, 0, -tilt]}>
        <mesh ref={spinRef}>
          <sphereGeometry args={[radius, 64, 64]} />
          <PlanetSurface textures={data.textures} data={data} />
          {/* Child of the spinning surface: stays above its real ground position */}
          {showIss && (
            <IssMarker
              earthRadius={radius}
              earthRef={orbitGroupRef}
              selected={satelliteSelectedId === 'iss'}
              onSelect={onSelect}
              onHover={onHover}
              showLabel={showLabel}
            />
          )}
        </mesh>
        {data.textures.clouds && (
          <CloudLayer url={textureUrl(data.textures.clouds)} radius={radius} clockRef={clockRef} rotationPeriodHours={data.rotationPeriodHours} />
        )}
        {data.rings && <SaturnRings radius={radius} rings={data.rings} ringUrl={textureUrl(data.textures.ring)} />}
      </group>

      {data.atmosphere && <Atmosphere radius={radius} color={data.atmosphere.color} strength={data.atmosphere.strength} />}
      {data.hasMoon && (
        <Moon
          clockRef={clockRef}
          bodiesRef={bodiesRef}
          earthRef={orbitGroupRef}
          earthRadius={radius}
          selected={satelliteSelectedId === 'moon'}
          onSelect={onSelect}
          onHover={onHover}
          registerLabel={registerLabel}
          showLabel={showLabel}
        />
      )}

      {/* Generous invisible hit area for picking */}
      <mesh onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
        {/* Tighter for Earth so it doesn't overlap the Moon's hit area */}
        <sphereGeometry args={[data.hasMoon ? radius * 1.45 : Math.max(radius * 1.6, radius + 1.4), 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      {selected && <SelectionRing radius={data.rings ? radius * 1.75 : radius} color={data.accent} />}

      {showLabel && (
        <Html position={[0, radius + 0.9, 0]} center zIndexRange={[30, 10]} style={{ pointerEvents: 'none' }}>
          <button
            type="button"
            ref={labelRef}
            className={`planet-label${selected ? ' is-selected' : ''}`}
            style={{ '--accent': data.accent }}
            onClick={() => onSelect(data.id)}
            onPointerEnter={() => onHover(data.id)}
            onPointerLeave={() => onHover(null)}
            aria-label={`Focus ${data.name}`}
          >
            <span className="planet-label__dot" aria-hidden="true" />
            {data.name}
          </button>
        </Html>
      )}
    </group>
  );
}

export default memo(Planet);
