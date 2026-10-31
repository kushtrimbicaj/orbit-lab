import { useEffect, useState } from 'react';
import { useSimulationContext } from '../../context/SimulationContext';
import { useIss } from '../../hooks/useIss';
import { retryIssTracking } from '../../services/issTracker';
import { formatNumber } from '../../utils/astronomy';
import Icon from './Icon';

function formatCoordinate(value, positive, negative) {
  return `${formatNumber(Math.abs(value), 2)}° ${value >= 0 ? positive : negative}`;
}

/** "12 s ago", refreshed every second. */
function useSecondsAgo(timestamp) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return timestamp ? Math.max(0, Math.round((now - timestamp) / 1000)) : null;
}

/**
 * Live ISS readout. `summary` appears in Earth's panel (with a link to the full
 * ISS panel); `details` is the live section of the ISS's own panel.
 */
export default function IssPanel({ variant = 'summary' }) {
  const { settings, updateSetting, selectBody } = useSimulationContext();
  const enabled = settings.showIss;
  const { status, position, error, updatedAt } = useIss(enabled);
  const secondsAgo = useSecondsAgo(updatedAt);

  return (
    <section className="info-panel__section iss-panel" aria-labelledby="iss-title">
      <div className="iss-panel__head">
        <h3 id="iss-title" className="eyebrow">{variant === 'details' ? 'Live position' : 'International Space Station'}</h3>
        {enabled && status === 'live' && <span className="live-badge"><span aria-hidden="true" />Live</span>}
        {enabled && status === 'stale' && <span className="live-badge is-stale"><span aria-hidden="true" />Reconnecting</span>}
      </div>

      {!enabled && (
        <div className="iss-panel__off">
          <p>Track the ISS in real time above the globe.</p>
          <button type="button" className="link-btn" onClick={() => updateSetting('showIss', true)}>
            Show live ISS
          </button>
        </div>
      )}

      {enabled && status === 'loading' && !position && <p className="iss-panel__status">Locating the ISS…</p>}

      {enabled && status === 'error' && !position && (
        <div className="iss-panel__off">
          <p>Couldn’t reach the ISS tracking service. {error}</p>
          <button type="button" className="link-btn" onClick={retryIssTracking}><Icon name="reset" size={14} /> Try again</button>
        </div>
      )}

      {enabled && position && (
        <>
          <dl className="iss-grid">
            <div><dt>Latitude</dt><dd>{formatCoordinate(position.latitude, 'N', 'S')}</dd></div>
            <div><dt>Longitude</dt><dd>{formatCoordinate(position.longitude, 'E', 'W')}</dd></div>
            <div><dt>Altitude</dt><dd>{formatNumber(position.altitudeKm, 0)} km</dd></div>
            <div><dt>Speed</dt><dd>{position.velocityKmh ? `${formatNumber(position.velocityKmh, 0)} km/h` : '—'}</dd></div>
          </dl>
          <p className="iss-panel__status">
            {position.visibility === 'daylight' && 'In sunlight · '}
            {position.visibility === 'eclipsed' && 'In Earth’s shadow · '}
            Updated {secondsAgo === null ? '—' : `${secondsAgo} s ago`}
          </p>
          <p className="iss-panel__note">
            Real-time position from wheretheiss.at, independent of the simulation clock. On the globe the ISS is drawn above
            its latitude and longitude with its altitude exaggerated.
          </p>
          <div className="iss-panel__actions">
            {variant === 'summary' && (
              <button type="button" className="link-btn" onClick={() => selectBody('iss')}>
                Open ISS details →
              </button>
            )}
            <button type="button" className="link-btn link-btn--muted" onClick={() => updateSetting('showIss', false)}>
              Hide ISS
            </button>
          </div>
        </>
      )}
    </section>
  );
}
