import { useSimulationContext } from '../../context/SimulationContext';
import Header from '../UI/Header';
import Sidebar from '../UI/Sidebar';
import SimulationControls from '../UI/SimulationControls';
import PlanetInfo from '../UI/PlanetInfo';
import ComparisonPanel from '../UI/ComparisonPanel';
import EducationalPanel from '../UI/EducationalPanel';
import PlanetSelector from '../UI/PlanetSelector';
import CameraButtons from '../UI/CameraButtons';
import LoadingOverlay from '../UI/LoadingOverlay';

/**
 * HUD layer over the full-screen canvas. Only the panels themselves capture
 * pointer events, so the 3D scene stays interactive everywhere else.
 */
export default function AppLayout({ scene }) {
  const { selectedId, compareOpen, settings } = useSimulationContext();

  // Right-hand contextual panel: comparison > selected body > learn guide.
  let panel = null;
  let panelKey = 'none';
  if (compareOpen) { panel = <ComparisonPanel />; panelKey = 'compare'; }
  else if (selectedId) { panel = <PlanetInfo bodyId={selectedId} />; panelKey = `info-${selectedId}`; }
  else if (settings.educationalMode) { panel = <EducationalPanel />; panelKey = 'learn'; }

  return (
    <div className={`app${panel ? ' has-panel' : ''}`}>
      <div className="app__scene">{scene}</div>
      <div className="app__vignette" aria-hidden="true" />

      <div className="hud">
        <Header />
        <Sidebar />
        {panel && (
          <aside className="context-panel glass" key={panelKey} aria-live="polite">
            {panel}
          </aside>
        )}
        <div className="mobile-dock">
          <PlanetSelector variant="strip" />
          <CameraButtons compact />
        </div>
        <SimulationControls />
      </div>

      <p className="scale-note" aria-hidden={Boolean(panel)}>
        Sizes and distances not to scale · Drag to orbit · Scroll / pinch to zoom · Right-drag / two fingers to pan
      </p>
      <LoadingOverlay />
    </div>
  );
}
