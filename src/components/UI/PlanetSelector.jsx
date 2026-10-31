import { NAV_ITEMS } from '../../data/planets';
import { useSimulationContext } from '../../context/SimulationContext';

/**
 * List of all bodies, with the Moon and the ISS nested under Earth. Used as the vertical sidebar list on desktop and as a
 * horizontally scrolling strip on mobile (`variant="strip"`).
 */
export default function PlanetSelector({ variant = 'list' }) {
  const { selectedId, selectBody, clearSelection, setHoveredId } = useSimulationContext();
  return (
    <ul className={`planet-selector planet-selector--${variant}`} role="listbox" aria-label="Celestial bodies">
      {NAV_ITEMS.map((body) => {
        const active = selectedId === body.id;
        return (
          <li key={body.id} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={active}
              className={`planet-selector__item${active ? ' is-active' : ''}${body.nested ? ' is-nested' : ''}`}
              style={{ '--accent': body.accent }}
              onClick={() => (active ? clearSelection() : selectBody(body.id))}
              onPointerEnter={() => setHoveredId(body.id)}
              onPointerLeave={() => setHoveredId(null)}
              title={active ? `Deselect ${body.fullName ?? body.name}` : `Focus ${body.fullName ?? body.name}`}
            >
              <span className="planet-selector__swatch" aria-hidden="true" />
              <span className="planet-selector__symbol" aria-hidden="true">{body.symbol}</span>
              <span className="planet-selector__name">{body.name}</span>
              <span className="planet-selector__indicator" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
