import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import { AdditiveBlending } from 'three';

/** Camera-facing pulsing ring that highlights the selected body. */
export default function SelectionRing({ radius, color }) {
  const materialRef = useRef();
  const meshRef = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (materialRef.current) materialRef.current.opacity = 0.55 + Math.sin(t * 2.4) * 0.25;
    if (meshRef.current) meshRef.current.scale.setScalar(1 + Math.sin(t * 2.4) * 0.03);
  });
  return (
    <Billboard>
      <mesh ref={meshRef} raycast={() => null}>
        <ringGeometry args={[radius * 1.38, radius * 1.38 + Math.max(0.08, radius * 0.045), 96]} />
        <meshBasicMaterial
          ref={materialRef}
          color={color}
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </Billboard>
  );
}
