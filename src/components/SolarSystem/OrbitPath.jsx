import { memo, useMemo } from 'react';
import { Line } from '@react-three/drei';
import { orbitPathPoints } from '../../utils/astronomy';

/**
 * A planet's orbital ellipse, drawn as two overlaid fat lines: a wide, faint
 * one for the glow and a thin, brighter core.
 */
function OrbitPath({ orbit, color, active, hovered }) {
  const points = useMemo(() => orbitPathPoints(orbit, 320), [orbit]);
  const emphasis = active ? 1 : hovered ? 0.7 : 0.35;
  return (
    <group>
      <Line
        points={points}
        color={color}
        lineWidth={active ? 6 : 4}
        transparent
        opacity={0.07 + emphasis * 0.12}
        depthWrite={false}
        toneMapped={false}
        raycast={() => null}
      />
      <Line
        points={points}
        color={color}
        lineWidth={active ? 1.6 : 1}
        transparent
        opacity={0.25 + emphasis * 0.55}
        depthWrite={false}
        toneMapped={false}
        raycast={() => null}
      />
    </group>
  );
}

export default memo(OrbitPath);
