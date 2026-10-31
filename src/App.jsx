import { useMemo } from 'react';
import { SimulationProvider } from './context/SimulationContext';
import AppLayout from './components/Layout/AppLayout';
import SceneCanvas from './components/SolarSystem/SceneCanvas';
import WebGLFallback from './components/UI/WebGLFallback';
import { isWebGLAvailable } from './utils/webgl';

export default function App() {
  const webgl = useMemo(() => isWebGLAvailable(), []);
  return (
    <SimulationProvider>
      <AppLayout scene={webgl ? <SceneCanvas /> : <WebGLFallback />} />
    </SimulationProvider>
  );
}
