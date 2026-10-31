import { useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import SolarSystem from './SolarSystem';
import ErrorBoundary from '../UI/ErrorBoundary';
import RenderError from '../UI/RenderError';

/**
 * The WebGL canvas. Rendering failures (shader errors, missing textures, a
 * lost GPU context) are caught and replaced with a readable message instead
 * of a blank screen.
 */
export default function SceneCanvas() {
  const [contextLost, setContextLost] = useState(false);

  const handleCreated = useCallback(({ gl }) => {
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      setContextLost(true);
    });
    canvas.addEventListener('webglcontextrestored', () => setContextLost(false));
  }, []);

  return (
    <ErrorBoundary
      fallback={(error) => (
        <RenderError
          title="The 3D scene could not be rendered"
          message={error?.message || 'An unexpected rendering error occurred.'}
        />
      )}
    >
      <Canvas
        className="scene-canvas"
        camera={{ position: [60, 520, 1150], fov: 45, near: 0.1, far: 6000 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        onCreated={handleCreated}
        aria-label="Interactive 3D model of the solar system"
      >
        <SolarSystem />
      </Canvas>
      {contextLost && (
        <RenderError
          title="Graphics context lost"
          message="Your browser temporarily lost access to the GPU. OrbitLab will resume automatically when it is restored — or reload the page."
        />
      )}
    </ErrorBoundary>
  );
}
