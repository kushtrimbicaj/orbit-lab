import { useState } from 'react';
import { PLANETS } from '../../data/planets';
import { useSimulationContext } from '../../context/SimulationContext';
import { DAYS_PER_SECOND_AT_1X, ROTATION_TIME_SCALE, formatNumber } from '../../utils/astronomy';
import Icon from './Icon';

const TOPICS = [
  {
    id: 'composition',
    title: 'What planets are made of',
    body: (
      <>
        <p>
          The four inner planets — Mercury, Venus, Earth and Mars — are made mostly of rock and metal, with dense iron-rich
          cores. Jupiter and Saturn are made mostly of hydrogen and helium. Uranus and Neptune contain large amounts of
          water, ammonia and methane, which planetary scientists call “ices”.
        </p>
        <p>
          The difference goes back to the Sun’s birth: close to the young Sun it was too hot for ices to condense, so only
          rock and metal could clump together into planets.
        </p>
      </>
    ),
  },
  {
    id: 'types',
    title: 'Terrestrial planets vs. giants',
    body: (
      <>
        <p>
          <strong>Terrestrial planets</strong> are small, dense and rocky, with solid surfaces and few or no moons.
          <strong> Gas giants</strong> (Jupiter, Saturn) and <strong>ice giants</strong> (Uranus, Neptune) are far larger,
          have no solid surface to stand on, rotate quickly, and all four have ring systems and many moons.
        </p>
        <p>Jupiter alone is about 318 times as massive as Earth.</p>
      </>
    ),
  },
  {
    id: 'mechanics',
    title: 'Orbital mechanics',
    body: (
      <>
        <p>
          Planets move on ellipses with the Sun at one focus (Kepler’s first law). A planet moves fastest at perihelion,
          its closest point to the Sun, and slowest at aphelion (Kepler’s second law).
        </p>
        <p>
          OrbitLab computes each position by solving Kepler’s equation, <em>M = E − e·sin E</em>, every frame using real
          J2000 orbital elements — so Mercury’s eccentric orbit visibly speeds up near the Sun.
        </p>
      </>
    ),
  },
  {
    id: 'rotation',
    title: 'Rotation vs. revolution',
    body: (
      <>
        <p>
          <strong>Rotation</strong> is a planet spinning on its own axis; one rotation sets the length of its day.
          <strong> Revolution</strong> is a planet travelling around the Sun; one revolution is its year.
        </p>
        <p>
          Venus and Uranus rotate in the opposite direction to most planets (retrograde rotation). Toggle “Planet
          rotation” and “Orbital motion” in the layers menu to see the two motions separately.
        </p>
      </>
    ),
  },
  {
    id: 'belt',
    title: 'The asteroid belt',
    body: (
      <>
        <p>
          Between Mars and Jupiter, roughly 2.2 to 3.2 AU from the Sun, lies the main asteroid belt: rocky and metallic
          remnants from the formation of the solar system. Its largest object, Ceres (about 940 km across), is classified
          as a dwarf planet.
        </p>
        <p>
          Although it contains a very large number of bodies, its total mass is far less than that of Earth’s Moon, and the
          asteroids are typically separated by huge distances — spacecraft cross the belt without difficulty.
        </p>
      </>
    ),
  },
  {
    id: 'kepler',
    title: 'Distance and orbital period',
    body: <KeplerTable />,
  },
  {
    id: 'scale',
    title: 'How this model is scaled',
    body: (
      <>
        <p>
          At true scale, if the Sun were drawn 20 cm across, Earth would be a speck under 2 mm wide about 21.5 metres away,
          and Neptune would be roughly 650 metres away. No screen can show that, so OrbitLab compresses distances and sizes
          with power laws. Order is preserved, but ratios are not to scale.
        </p>
        <p>
          Time is accelerated too: at 1× speed, one second equals {DAYS_PER_SECOND_AT_1X} Earth days of orbital motion.
          Planetary spin is shown {Math.round(1 / ROTATION_TIME_SCALE)}× slower than that so fast rotators stay readable.
          All values in the information panels are real.
        </p>
      </>
    ),
  },
];

/** Kepler's third law computed live from the planet data: P² / a³ ≈ 1. */
function KeplerTable() {
  return (
    <>
      <p>
        Kepler’s third law says that the square of a planet’s orbital period (in years) equals the cube of its average
        distance from the Sun (in AU): <em>P² = a³</em>. Farther planets travel a longer path <em>and</em> move more slowly.
      </p>
      <table className="kepler-table">
        <thead>
          <tr><th scope="col">Planet</th><th scope="col">a (AU)</th><th scope="col">P (years)</th><th scope="col">P² / a³</th></tr>
        </thead>
        <tbody>
          {PLANETS.map((p) => {
            const years = p.orbitalPeriodDays / 365.25;
            const ratio = (years * years) / p.semiMajorAxisAU ** 3;
            return (
              <tr key={p.id}>
                <th scope="row" style={{ color: p.accent }}>{p.name}</th>
                <td>{formatNumber(p.semiMajorAxisAU, 3)}</td>
                <td>{formatNumber(years, 2)}</td>
                <td>{formatNumber(ratio, 3)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

/** Educational mode content, shown when no body is selected. */
export default function EducationalPanel() {
  const { updateSetting, selectBody } = useSimulationContext();
  const [openId, setOpenId] = useState('composition');

  return (
    <article className="learn-panel" aria-labelledby="learn-title">
      <header className="info-panel__header">
        <div>
          <h2 id="learn-title" className="info-panel__title info-panel__title--small">Learn</h2>
          <p className="info-panel__type">A short guide to the solar system</p>
        </div>
        <button type="button" className="icon-btn" onClick={() => updateSetting('educationalMode', false)} aria-label="Close Learn mode" title="Close">
          <Icon name="close" size={18} />
        </button>
      </header>

      <div className="accordion">
        {TOPICS.map((topic) => {
          const open = openId === topic.id;
          return (
            <section key={topic.id} className={`accordion__item${open ? ' is-open' : ''}`}>
              <h3>
                <button
                  type="button"
                  className="accordion__trigger"
                  aria-expanded={open}
                  aria-controls={`topic-${topic.id}`}
                  onClick={() => setOpenId(open ? null : topic.id)}
                >
                  {topic.title}
                  <Icon name={open ? 'chevronUp' : 'chevronDown'} size={16} />
                </button>
              </h3>
              {open && <div id={`topic-${topic.id}`} className="accordion__content">{topic.body}</div>}
            </section>
          );
        })}
      </div>

      <section className="info-panel__section">
        <h3 className="eyebrow">One fact per planet</h3>
        <ul className="planet-facts">
          {PLANETS.map((p) => (
            <li key={p.id}>
              <button type="button" className="planet-facts__name" style={{ color: p.accent }} onClick={() => selectBody(p.id)}>
                <span className="symbol">{p.symbol}</span> {p.name}
              </button>
              <span>{p.facts[0]}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
