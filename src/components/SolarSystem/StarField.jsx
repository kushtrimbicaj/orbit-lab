import { useMemo } from 'react';
import { Stars, useTexture } from '@react-three/drei';
import { BackSide } from 'three';
import { prepareColorTexture, textureUrl } from '../../utils/textures';

/**
 * Background sky: a faint Milky Way / distant-galaxy sky sphere plus a
 * twinkle-free point star field from drei. Both sit far beyond Neptune and
 * ignore depth so they never occlude the system.
 */
export default function StarField() {
  const sky = useTexture(textureUrl('milky_way.jpg'));
  useMemo(() => prepareColorTexture(sky, 4), [sky]);
  return (
    <group>
      <mesh raycast={() => null} renderOrder={-10}>
        <sphereGeometry args={[2600, 48, 32]} />
        <meshBasicMaterial map={sky} side={BackSide} depthWrite={false} toneMapped={false} />
      </mesh>
      <Stars radius={1500} depth={600} count={5000} factor={45} saturation={0.15} fade speed={0} />
    </group>
  );
}
