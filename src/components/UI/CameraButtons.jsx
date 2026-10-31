import { useSimulationContext } from '../../context/SimulationContext';
import Icon from './Icon';

/** Focus Sun / Entire solar system / Reset view. */
export default function CameraButtons({ compact = false }) {
  const { focusSun, showEntireSystem, resetCamera } = useSimulationContext();
  const buttons = [
    { label: 'Focus Sun', icon: 'sun', onClick: focusSun },
    { label: 'Entire solar system', short: 'Overview', icon: 'system', onClick: showEntireSystem },
    { label: 'Reset camera', short: 'Reset view', icon: 'home', onClick: resetCamera },
  ];
  return (
    <div className={`camera-buttons${compact ? ' camera-buttons--compact' : ''}`} role="group" aria-label="Camera">
      {buttons.map((b) => (
        <button key={b.label} type="button" className="camera-buttons__btn" onClick={b.onClick} title={b.label} aria-label={b.label}>
          <Icon name={b.icon} size={16} />
          <span>{compact ? b.short ?? b.label : b.label}</span>
        </button>
      ))}
    </div>
  );
}
