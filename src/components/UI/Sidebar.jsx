import PlanetSelector from './PlanetSelector';
import CameraButtons from './CameraButtons';

/** Compact left navigation (desktop / tablet). */
export default function Sidebar() {
  return (
    <aside className="sidebar glass" aria-label="Navigation">
      <p className="eyebrow">Bodies</p>
      <PlanetSelector variant="list" />
      <div className="sidebar__divider" />
      <p className="eyebrow">Camera</p>
      <CameraButtons />
    </aside>
  );
}
