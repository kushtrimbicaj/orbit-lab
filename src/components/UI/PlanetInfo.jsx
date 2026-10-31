import { MOON_COUNT_NOTE, getBody } from '../../data/planets';
import { useSimulationContext } from '../../context/SimulationContext';
import { ROTATION_TIME_SCALE, describeOrbitalPeriod, describeRotationPeriod, formatNumber } from '../../utils/astronomy';
import Icon from './Icon';
import NasaGallery from './NasaGallery';
import IssPanel from './IssPanel';

function Stat({ value, unit, label, note }) {
  return (
    <div className="stat">
      <div className="stat__value">
        <span className="stat__number">{value}</span>
        {unit && <span className="stat__unit">{unit}</span>}
      </div>
      <div className="stat__label">{label}</div>
      {note && <div className="stat__note">{note}</div>}
    </div>
  );
}

/** Builds the list of stats shown for a body (all values are real data). */
function buildStats(body) {
  if (body.stats) return body.stats; // the ISS has its own hand-picked figures
  const stats = [];
  stats.push({ label: 'Diameter', value: formatNumber(body.diameterKm), unit: 'km', note: body.id === 'earth' ? null : `${formatNumber(body.diameterKm / 12756, 2)} × Earth` });
  stats.push({ label: 'Mass', value: formatNumber(body.massE24Kg, body.massE24Kg < 10 ? 3 : 0), unit: '× 10²⁴ kg', note: body.id === 'earth' ? null : `${formatNumber(body.massE24Kg / 5.97, body.massE24Kg / 5.97 < 10 ? 3 : 0)} × Earth` });
  if (body.id === 'sun') {
    stats.push({ label: 'Distance from Earth', value: '149.6', unit: 'million km', note: '1 AU' });
    stats.push({ label: 'Galactic orbit', value: '≈ 230', unit: 'million yr', note: 'Around the Milky Way’s centre' });
  } else if (body.orbitsParent) {
    stats.push({ label: 'Distance from Earth', value: formatNumber(body.distanceFromEarthKm), unit: 'km', note: 'Average; light takes about 1.3 s' });
    stats.push({ label: 'Orbital period', value: formatNumber(body.orbitalPeriodDays, 1), unit: 'Earth days', note: 'One orbit around Earth (sidereal month)' });
  } else {
    stats.push({ label: 'Distance from Sun', value: formatNumber(body.distanceMillionKm, 1), unit: 'million km', note: `${formatNumber(body.semiMajorAxisAU, 3)} AU` });
    const orbit = describeOrbitalPeriod(body.orbitalPeriodDays);
    stats.push({ label: 'Orbital period', value: orbit.value, unit: orbit.unit, note: orbit.secondary });
  }
  const rotation = describeRotationPeriod(body.rotationPeriodHours);
  let rotationNote = rotation.secondary;
  if (body.id === 'sun') rotationNote = 'At the equator';
  else if (body.orbitsParent) rotationNote = 'Same as its orbit — tidally locked';
  stats.push({ label: 'Rotation period', value: rotation.value, unit: rotation.unit, note: rotationNote });
  stats.push({ label: 'Average temperature', value: formatNumber(body.meanTemperatureC), unit: '°C', note: body.temperatureNote });
  let moonsNote = body.moons > 2 ? 'Confirmed, March 2026' : null;
  if (body.moons === null) moonsNote = body.moonsNote ?? 'Stars do not have moons';
  stats.push({ label: 'Known moons', value: body.moons === null ? '—' : formatNumber(body.moons), unit: null, note: moonsNote });
  return stats;
}

/** Right-hand contextual panel for the selected body. */
export default function PlanetInfo({ bodyId }) {
  const { clearSelection, settings, updateSetting } = useSimulationContext();
  const body = getBody(bodyId);
  if (!body) return null;
  const stats = buildStats(body);

  return (
    <article className="info-panel" style={{ '--accent': body.accent }} aria-labelledby="info-title">
      <header className="info-panel__header">
        <div>
          <h2 id="info-title" className="info-panel__title">{body.name}</h2>
          <p className="info-panel__type">
            <span className="info-panel__symbol" aria-label={`Symbol of ${body.fullName ?? body.name}`}>{body.symbol}</span>
            {body.fullName ? `${body.fullName} · ${body.type}` : body.type}
          </p>
        </div>
        <button type="button" className="icon-btn" onClick={clearSelection} aria-label="Close and return to the solar system" title="Close (Esc)">
          <Icon name="close" size={18} />
        </button>
      </header>

      <p className="info-panel__description">{body.description}</p>

      {body.id === 'iss' && <IssPanel variant="details" />}

      <div className="stats-grid">
        {stats.map((stat) => <Stat key={stat.label} {...stat} />)}
      </div>

      {body.id === 'earth' && <IssPanel variant="summary" />}

      <NasaGallery bodyId={body.id} bodyName={body.fullName ?? body.name} />

      <section className="info-panel__section">
        <h3 className="eyebrow">Did you know?</h3>
        <ul className="fact-list">
          {(settings.educationalMode ? body.facts : body.facts.slice(0, 2)).map((fact) => <li key={fact}>{fact}</li>)}
        </ul>
        {!settings.educationalMode && (
          <button type="button" className="link-btn" onClick={() => updateSetting('educationalMode', true)}>
            <Icon name="learn" size={15} /> Show more in Learn mode
          </button>
        )}
      </section>

      {settings.educationalMode && (
        <>
          {body.composition && (
            <section className="info-panel__section">
              <h3 className="eyebrow">Composition</h3>
              <p>{body.composition}</p>
            </section>
          )}
          {body.rotationNote && (
            <section className="info-panel__section">
              <h3 className="eyebrow">Rotation</h3>
              <p>{body.rotationNote}</p>
            </section>
          )}
          {body.lengthOfDayHours && Math.abs(body.lengthOfDayHours - Math.abs(body.rotationPeriodHours)) > 1 && (
            <section className="info-panel__section">
              <h3 className="eyebrow">Day vs. rotation</h3>
              <p>
                {body.name} completes one rotation relative to the stars every {formatNumber(Math.abs(body.rotationPeriodHours), 1)} hours,
                but a full solar day — sunrise to sunrise — lasts {formatNumber(body.lengthOfDayHours, 1)} hours
                ({formatNumber(body.lengthOfDayHours / 24, 1)} Earth days), because the planet also moves along its orbit.
              </p>
            </section>
          )}
          <section className="info-panel__section info-panel__scale">
            <h3 className="eyebrow">About the 3D model</h3>
            {body.id === 'iss' ? (
              <p>
                The station is drawn far larger than scale, and its height above Earth is exaggerated so it clears the
                clouds. Its position is real time, while the globe beneath it spins on accelerated simulation time.
              </p>
            ) : (
              <p>
                Sizes and distances in the scene are compressed so every body stays visible. The numbers above are the
                real values. Rotation is shown {Math.round(1 / ROTATION_TIME_SCALE)}× slower than orbital time; relative rates are preserved.
              </p>
            )}
          </section>
        </>
      )}

      {body.moons > 2 && <p className="info-panel__footnote">{MOON_COUNT_NOTE}</p>}

      <button type="button" className="btn btn--ghost info-panel__back" onClick={clearSelection}>
        <Icon name="back" size={16} /> Back to the solar system
      </button>
    </article>
  );
}
