import { useMemo } from 'react';
import { AdditiveBlending, BackSide, Color } from 'three';

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Rendered on the back faces of a slightly larger shell: the glow is strongest
// just outside the planet's limb and fades to nothing at the shell's edge.
const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float facing = max(-dot(normalize(vNormal), normalize(vViewDir)), 0.0);
    float glow = pow(facing, 1.6) * uStrength;
    gl_FragColor = vec4(uColor * glow, glow);
  }
`;

/** Soft fresnel-style atmospheric halo. */
export default function Atmosphere({ radius, color, strength = 1 }) {
  const uniforms = useMemo(
    () => ({ uColor: { value: new Color(color) }, uStrength: { value: strength } }),
    [color, strength],
  );
  return (
    <mesh scale={radius * 1.14} raycast={() => null}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={BackSide}
        blending={AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
