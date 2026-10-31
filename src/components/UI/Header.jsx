import { useSimulationContext } from '../../context/SimulationContext';
import Icon from './Icon';
import Timeline from './Timeline';

/** Minimal top bar: brand, timeline and panel toggles. */
export default function Header() {
  const { settings, updateSetting, compareOpen, setCompareOpen } = useSimulationContext();
  return (
    <header className="header">
      <div className="brand">
        <svg className="brand__mark" viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
          <circle cx="16" cy="16" r="5" fill="url(#brandSun)" />
          <ellipse cx="16" cy="16" rx="13.5" ry="6" fill="none" stroke="currentColor" strokeOpacity=".55" strokeWidth="1.2" transform="rotate(-22 16 16)" />
          <circle cx="27.4" cy="11.2" r="2" fill="#8fd3ff" />
          <defs>
            <radialGradient id="brandSun"><stop offset="0" stopColor="#fff3c4" /><stop offset=".6" stopColor="#ffb347" /><stop offset="1" stopColor="#e8641c" /></radialGradient>
          </defs>
        </svg>
        <div>
          <h1 className="brand__name">OrbitLab</h1>
          <p className="brand__tag">Solar system simulator</p>
        </div>
      </div>

      <Timeline />

      <nav className="header__actions" aria-label="Panels">
        <button
          type="button"
          className={`chip${compareOpen ? ' is-active' : ''}`}
          aria-pressed={compareOpen}
          onClick={() => setCompareOpen(!compareOpen)}
        >
          <Icon name="compare" size={16} /> <span>Compare</span>
        </button>
        <button
          type="button"
          className={`chip${settings.educationalMode ? ' is-active' : ''}`}
          aria-pressed={settings.educationalMode}
          onClick={() => updateSetting('educationalMode', !settings.educationalMode)}
        >
          <Icon name="learn" size={16} /> <span>Learn</span>
        </button>
      </nav>
    </header>
  );
}
