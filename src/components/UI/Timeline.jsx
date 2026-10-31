import { useSimulationContext } from '../../context/SimulationContext';
import { useSimulationTime } from '../../hooks/useSimulation';
import { DAYS_PER_SECOND_AT_1X, formatElapsed, formatModelDate, formatNumber } from '../../utils/astronomy';

/**
 * Elapsed simulated time, the model's calendar date and the current rate.
 * The clock is an accelerated visualisation, not a real-time astronomical clock.
 */
export default function Timeline() {
  const { clockRef, settings, playing, resetSimulation, jumpToNow } = useSimulationContext();
  const { elapsedDays, orbitDays } = useSimulationTime(clockRef);
  const daysPerSecond = DAYS_PER_SECOND_AT_1X * settings.speed;

  return (
    <div className="timeline" aria-label="Simulation timeline">
      <div className="timeline__main">
        <span className="timeline__label">Simulated time</span>
        <span className="timeline__value" aria-live="off">{formatElapsed(elapsedDays)}</span>
      </div>
      <div className="timeline__meta">
        <span title="Planet positions are computed from J2000 orbital elements. Reset starts on 1 January 2000; Now jumps to today.">
          Model date ≈ {formatModelDate(orbitDays)}
        </span>
        <span className={`timeline__rate${playing ? '' : ' is-paused'}`}>
          {playing ? `${formatNumber(settings.speed, 2)}× · ${formatNumber(daysPerSecond, daysPerSecond < 10 ? 1 : 0)} days/s` : 'Paused'}
        </span>
      </div>
      <div className="timeline__buttons">
        <button
          type="button"
          className="timeline__btn timeline__btn--now"
          onClick={jumpToNow}
          title="Move the planets to their real positions today (pauses the simulation)"
        >
          Now
        </button>
        <button type="button" className="timeline__btn" onClick={resetSimulation} title="Reset simulation time to 1 January 2000">
          Reset
        </button>
      </div>
      <span className="timeline__note">Accelerated visualisation — not a real-time clock</span>
    </div>
  );
}
