import { Suspense, useCallback, useMemo, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useSimulationContext } from '../../context/SimulationContext';
import { PLANETS } from '../../data/planets';
import { prepareOrbit, visualBodyRadius } from '../../utils/astronomy';
import { useSimulationClock } from '../../hooks/useSimulation';
import { CAMERA_LIMITS, useCameraRig } from '../../hooks/useCamera';
import Sun from './Sun';
import Planet from './Planet';
import OrbitPath from './OrbitPath';
import AsteroidBelt from './AsteroidBelt';
import StarField from './StarField';
import LabelLayout from './LabelLayout';

/** Orbits and visual radii are static — compute them once at module load. */
const PLANET_MODELS = PLANETS.map((data) => ({
  data,
  orbit: prepareOrbit(data.elements, data.orbitalPeriodDays),
  radius: visualBodyRadius(data.diameterKm),
}));

function SimulationClock() {
  const { clockRef, runtimeRef } = useSimulationContext();
  useSimulationClock(clockRef, runtimeRef);
  return null;
}

function CameraRig({ controlsRef }) {
  const { bodiesRef, cameraCommand } = useSimulationContext();
  useCameraRig({ controlsRef, bodiesRef, command: cameraCommand });
  return null;
}

/** Everything inside the R3F <Canvas>. */
export default function SolarSystem() {
  const { settings, selectedId, hoveredId, selectBody, setHoveredId, clockRef, bodiesRef } = useSimulationContext();
  const controlsRef = useRef();
  const labelsRef = useRef(new Map());

  const registerLabel = useCallback((id, entry) => {
    labelsRef.current.set(id, entry);
    return () => labelsRef.current.delete(id);
  }, []);

  const orbitPaths = useMemo(
    () => PLANET_MODELS.map(({ data, orbit }) => (
      <OrbitPath key={data.id} orbit={orbit} color={data.accent} active={selectedId === data.id} hovered={hoveredId === data.id} />
    )),
    [selectedId, hoveredId],
  );

  return (
    <>
      {/* Advances the clock first, so every body reads the same time this frame */}
      <SimulationClock />

      <color attach="background" args={['#02030a']} />
      <ambientLight intensity={0.25} color="#9fb4ff" />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        zoomSpeed={0.9}
        panSpeed={0.7}
        screenSpacePanning
        minDistance={CAMERA_LIMITS.minDistance}
        maxDistance={CAMERA_LIMITS.maxDistance}
        minPolarAngle={CAMERA_LIMITS.minPolarAngle}
        maxPolarAngle={CAMERA_LIMITS.maxPolarAngle}
      />
      <CameraRig controlsRef={controlsRef} />

      {/* Separate boundary: toggling the sky never blanks out the planets */}
      <Suspense fallback={null}>{settings.showStars && <StarField />}</Suspense>

      <Suspense fallback={null}>
        <Sun />
        {PLANET_MODELS.map(({ data, orbit, radius }) => (
          <Planet
            key={data.id}
            data={data}
            orbit={orbit}
            radius={radius}
            selected={selectedId === data.id}
            onSelect={selectBody}
            onHover={setHoveredId}
            clockRef={clockRef}
            bodiesRef={bodiesRef}
            registerLabel={registerLabel}
            showLabel={settings.showLabels}
            showIss={data.id === 'earth' && settings.showIss}
            satelliteSelectedId={data.id === 'earth' && (selectedId === 'moon' || selectedId === 'iss') ? selectedId : null}
          />
        ))}
        {settings.showAsteroids && <AsteroidBelt clockRef={clockRef} />}
      </Suspense>

      {settings.showOrbits && orbitPaths}
      {settings.showLabels && <LabelLayout labelsRef={labelsRef} selectedId={selectedId} hoveredId={hoveredId} />}
    </>
  );
}
