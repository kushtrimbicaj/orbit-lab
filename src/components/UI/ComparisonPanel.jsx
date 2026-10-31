import { COMPARABLE_BODIES, getBody } from '../../data/planets';
import { useSimulationContext } from '../../context/SimulationContext';
import { celsiusToKelvin, describeOrbitalPeriod, describeRotationPeriod, formatNumber } from '../../utils/astronomy';
import Icon from './Icon';

/**
 * Each metric defines how to read the raw value (for bar lengths), how to
 * display it, and an optional note. Bars are relative to the larger of the two
 * values; temperature bars use the Kelvin scale so negative °C values compare
 * correctly.
 */
const METRICS = [
  {
    key: 'diameter', label: 'Diameter', more: 'larger',
    raw: (b) => b.diameterKm,
    show: (b) => `${formatNumber(b.diameterKm)} km`,
  },
  {
    key: 'mass', label: 'Mass', more: 'more massive',
    raw: (b) => b.massE24Kg,
    show: (b) => `${formatNumber(b.massE24Kg, b.massE24Kg < 10 ? 3 : 0)} × 10²⁴ kg`,
    log: true,
  },
  {
    key: 'distance', label: 'Distance from Sun', more: 'farther out',
    raw: (b) => b.distanceMillionKm,
    show: (b) => {
      if (b.id === 'sun') return '—';
      return `${formatNumber(b.distanceMillionKm, 1)} million km${b.orbitsParent ? ' (with Earth)' : ''}`;
    },
  },
  {
    key: 'orbit', label: 'Orbital period', more: 'longer year',
    raw: (b) => b.orbitalPeriodDays ?? 0,
    show: (b) => {
      const d = describeOrbitalPeriod(b.orbitalPeriodDays);
      if (!d) return '≈ 230 million yr (galactic)';
      return `${d.value} ${d.unit}${b.orbitsParent ? ' (around Earth)' : ''}`;
    },
    log: true,
  },
  {
    key: 'rotation', label: 'Rotation period', more: 'slower spin',
    raw: (b) => Math.abs(b.rotationPeriodHours),
    show: (b) => {
      const d = describeRotationPeriod(b.rotationPeriodHours);
      return `${d.value} ${d.unit}${d.retrograde ? ' (retrograde)' : ''}`;
    },
    log: true,
  },
  {
    key: 'temperature', label: 'Average temperature',
    raw: (b) => celsiusToKelvin(b.meanTemperatureC),
    show: (b) => `${formatNumber(b.meanTemperatureC)} °C`,
  },
  {
    key: 'moons', label: 'Known moons',
    raw: (b) => b.moons ?? 0,
    show: (b) => (b.moons === null ? '—' : formatNumber(b.moons)),
  },
];

function barWidth(value, other, log) {
  const max = Math.max(value, other);
  if (max <= 0) return 0;
  if (!log) return (value / max) * 100;
  // Log bars keep huge ratios (e.g. Sun vs Mercury mass) readable.
  const scaled = (v) => Math.log10(1 + v);
  return (scaled(value) / scaled(max)) * 100;
}

function ratioText(metric, a, b) {
  const va = metric.raw(a);
  const vb = metric.raw(b);
  if (!va || !vb || metric.key === 'temperature' || metric.key === 'moons') return null;
  if (metric.key === 'distance' && (a.id === 'sun' || b.id === 'sun')) return null;
  if (metric.key === 'orbit' && (!a.orbitalPeriodDays || !b.orbitalPeriodDays)) return null;
  // The Moon orbits Earth, so its distance/period aren't comparable with the planets'.
  if ((metric.key === 'orbit' || metric.key === 'distance') && (a.orbitsParent || b.orbitsParent)) return null;
  const ratio = va / vb;
  if (Math.abs(ratio - 1) < 0.01) return 'About equal';
  const factor = ratio > 1 ? ratio : 1 / ratio;
  const leader = ratio > 1 ? a : b;
  return `${leader.name}: ${formatNumber(factor, factor < 10 ? 2 : factor < 100 ? 1 : 0)}× ${metric.more}`;
}

function BodySelect({ id, slot, onChange, otherId }) {
  return (
    <label className="compare-select" style={{ '--accent': getBody(id).accent }}>
      <span className="visually-hidden">{slot === 0 ? 'First body' : 'Second body'}</span>
      <select value={id} onChange={(e) => onChange(slot, e.target.value)}>
        {COMPARABLE_BODIES.map((body) => (
          <option key={body.id} value={body.id} disabled={body.id === otherId}>{body.name}</option>
        ))}
      </select>
    </label>
  );
}

/** Side-by-side comparison of two bodies. */
export default function ComparisonPanel() {
  const { compareIds, setCompareSlot, setCompareOpen } = useSimulationContext();
  const [idA, idB] = compareIds;
  const a = getBody(idA);
  const b = getBody(idB);

  return (
    <article className="compare-panel" aria-labelledby="compare-title">
      <header className="info-panel__header">
        <div>
          <h2 id="compare-title" className="info-panel__title info-panel__title--small">Compare</h2>
          <p className="info-panel__type">Real astronomical values, side by side</p>
        </div>
        <button type="button" className="icon-btn" onClick={() => setCompareOpen(false)} aria-label="Close comparison" title="Close (Esc)">
          <Icon name="close" size={18} />
        </button>
      </header>

      <div className="compare-panel__pickers">
        <BodySelect id={idA} slot={0} onChange={setCompareSlot} otherId={idB} />
        <button
          type="button"
          className="icon-btn"
          aria-label="Swap bodies"
          title="Swap"
          onClick={() => { setCompareSlot(0, idB); setCompareSlot(1, idA); }}
        >
          <Icon name="swap" size={16} />
        </button>
        <BodySelect id={idB} slot={1} onChange={setCompareSlot} otherId={idA} />
      </div>

      <div className="compare-panel__headings" aria-hidden="true">
        <span style={{ color: a.accent }}><span className="symbol">{a.symbol}</span> {a.name}</span>
        <span style={{ color: b.accent }}><span className="symbol">{b.symbol}</span> {b.name}</span>
      </div>

      <dl className="compare-rows">
        {METRICS.map((metric) => {
          const va = metric.raw(a);
          const vb = metric.raw(b);
          const ratio = ratioText(metric, a, b);
          return (
            <div className="compare-row" key={metric.key}>
              <dt className="compare-row__label">
                {metric.label}
                {metric.log && <span className="compare-row__scale" title="Bars use a logarithmic scale">log</span>}
                {metric.key === 'temperature' && <span className="compare-row__scale" title="Bars use the Kelvin scale">K</span>}
              </dt>
              <dd className="compare-row__values">
                <div className="compare-cell">
                  <span className="compare-cell__value">{metric.show(a)}</span>
                  <span className="compare-bar"><span style={{ width: `${barWidth(va, vb, metric.log)}%`, background: a.accent }} /></span>
                </div>
                <div className="compare-cell">
                  <span className="compare-cell__value">{metric.show(b)}</span>
                  <span className="compare-bar"><span style={{ width: `${barWidth(vb, va, metric.log)}%`, background: b.accent }} /></span>
                </div>
              </dd>
              {ratio && <dd className="compare-row__ratio">{ratio}</dd>}
            </div>
          );
        })}
      </dl>
      <p className="info-panel__footnote">
        Moon counts are confirmed moons as of March 2026. Temperatures for the giant planets are at the 1-bar pressure level.
      </p>
    </article>
  );
}
