import { useEffect, useRef, useState } from 'react';
import { useSimulationContext } from '../../context/SimulationContext';
import { MAX_SPEED, MIN_SPEED, SPEED_PRESETS, formatNumber } from '../../utils/astronomy';
import Icon from './Icon';
import Toggle from './Toggle';

// The slider is logarithmic so 0.1× … 10× gets equal travel per decade.
const LOG_MIN = Math.log10(MIN_SPEED);
const LOG_MAX = Math.log10(MAX_SPEED);
const toSlider = (speed) => Math.log10(speed);
const fromSlider = (value) => {
  const speed = 10 ** Number(value);
  // Snap to a preset when close, so presets are easy to hit by dragging.
  const preset = SPEED_PRESETS.find((p) => Math.abs(p - speed) / p < 0.04);
  return preset ?? Math.round(speed * 100) / 100;
};

const LAYERS = [
  { key: 'showOrbits', label: 'Orbital paths' },
  { key: 'showLabels', label: 'Planet labels' },
  { key: 'showStars', label: 'Stars & galaxy' },
  { key: 'showAsteroids', label: 'Asteroid belt' },
  { key: 'showIss', label: 'ISS (live)', description: 'Real-time position' },
  { key: 'rotationEnabled', label: 'Planet rotation', description: 'Spin on their axes' },
  { key: 'orbitEnabled', label: 'Orbital motion', description: 'Revolution around the Sun' },
];

/** Floating playback, speed and visualisation controls. */
export default function SimulationControls() {
  const { settings, updateSetting, playing, togglePlaying, resetSimulation } = useSimulationContext();
  const [layersOpen, setLayersOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const layersRef = useRef(null);

  // Close the layers popover on outside click.
  useEffect(() => {
    if (!layersOpen) return undefined;
    const onPointerDown = (event) => {
      if (layersRef.current && !layersRef.current.contains(event.target)) setLayersOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [layersOpen]);

  return (
    <section className={`sim-controls glass${collapsed ? ' is-collapsed' : ''}`} aria-label="Simulation controls">
      <button
        type="button"
        className="sim-controls__collapse"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Show simulation controls' : 'Hide simulation controls'}
      >
        <Icon name={collapsed ? 'chevronUp' : 'chevronDown'} size={16} />
        <span>{collapsed ? 'Controls' : 'Hide'}</span>
      </button>

      <div className="sim-controls__body">
        <div className="sim-controls__transport">
          <button
            type="button"
            className="icon-btn icon-btn--primary"
            onClick={togglePlaying}
            aria-label={playing ? 'Pause simulation' : 'Play simulation'}
            title={playing ? 'Pause (Space)' : 'Play (Space)'}
          >
            <Icon name={playing ? 'pause' : 'play'} size={20} />
          </button>
          <button type="button" className="icon-btn" onClick={resetSimulation} aria-label="Reset simulation" title="Reset simulation to 1 January 2000">
            <Icon name="reset" size={18} />
          </button>
        </div>

        <div className="sim-controls__speed">
          <div className="sim-controls__speed-head">
            <label htmlFor="speed-slider" className="eyebrow">Speed</label>
            <output htmlFor="speed-slider" className="sim-controls__speed-value">{formatNumber(settings.speed, 2)}×</output>
          </div>
          <input
            id="speed-slider"
            type="range"
            min={LOG_MIN}
            max={LOG_MAX}
            step={0.01}
            value={toSlider(settings.speed)}
            onChange={(e) => updateSetting('speed', fromSlider(e.target.value))}
            style={{ '--fill': `${((toSlider(settings.speed) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100}%` }}
            aria-valuetext={`${formatNumber(settings.speed, 2)} times`}
          />
          <div className="sim-controls__presets" role="group" aria-label="Speed presets">
            {SPEED_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`preset${settings.speed === preset ? ' is-active' : ''}`}
                aria-pressed={settings.speed === preset}
                onClick={() => updateSetting('speed', preset)}
              >
                {preset}×
              </button>
            ))}
          </div>
        </div>

        <div className="sim-controls__layers" ref={layersRef}>
          <button
            type="button"
            className={`icon-btn${layersOpen ? ' is-active' : ''}`}
            onClick={() => setLayersOpen((open) => !open)}
            aria-expanded={layersOpen}
            aria-controls="layers-popover"
            aria-label="Visualisation layers"
            title="Visualisation layers"
          >
            <Icon name="layers" size={18} />
          </button>
          {layersOpen && (
            <div id="layers-popover" className="layers-popover glass" role="group" aria-label="Visualisation layers">
              <p className="eyebrow">Display</p>
              {LAYERS.map((layer) => (
                <Toggle
                  key={layer.key}
                  label={layer.label}
                  description={layer.description}
                  checked={settings[layer.key]}
                  onChange={(value) => updateSetting(layer.key, value)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
