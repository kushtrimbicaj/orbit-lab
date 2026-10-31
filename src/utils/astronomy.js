/**
 * Orbital mechanics, visual scaling and formatting helpers.
 *
 * This module has no dependency on React or Three.js so it can be unit-tested in
 * plain Node. Functions that produce positions write into an `out` object with
 * a `set(x, y, z)` method (a THREE.Vector3 in the app) to avoid allocating new
 * objects inside the animation loop.
 */

const TWO_PI = Math.PI * 2;
const DEG = Math.PI / 180;

/* ------------------------------------------------------------------------ */
/* Simulation time                                                           */
/* ------------------------------------------------------------------------ */

/** At 1× speed, one real second advances the simulation by this many days. */
export const DAYS_PER_SECOND_AT_1X = 10;

/**
 * Planetary spin is shown slower than orbital time so fast rotators (Jupiter
 * spins in under 10 hours) do not strobe. All bodies use the same factor, so
 * their relative rotation rates stay correct.
 */
export const ROTATION_TIME_SCALE = 1 / 50;

/** Largest frame delta (s) we integrate, so a backgrounded tab doesn't jump. */
export const MAX_FRAME_DELTA = 0.1;

export const SPEED_PRESETS = [0.25, 0.5, 1, 2, 5, 10];
export const MIN_SPEED = 0.1;
export const MAX_SPEED = 10;

/** J2000.0 epoch (2000-01-01 12:00 TT) — the reference time of the orbital elements. */
export const J2000_EPOCH_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
const MS_PER_DAY = 86400000;

/** Days elapsed between the J2000 epoch and `date` (fractional). */
export function daysSinceJ2000(date = new Date()) {
  return (date.getTime() - J2000_EPOCH_MS) / MS_PER_DAY;
}

/* ------------------------------------------------------------------------ */
/* Visual scaling                                                            */
/* ------------------------------------------------------------------------ */

/*
 * The real solar system cannot be drawn at one scale: Neptune is ~30 AU away
 * while Earth is only ~1/11,700 AU across. OrbitLab therefore compresses both
 * distances and sizes with power laws. Ordering is preserved (a farther planet
 * is always drawn farther away, a bigger planet is always drawn bigger) but the
 * ratios are not to scale. Every number shown in the UI is the real value.
 */
export const SUN_VISUAL_RADIUS = 7;
const ORBIT_BASE = 14;
const ORBIT_SCALE = 22;
const ORBIT_EXPONENT = 0.55;

/** Heliocentric distance (AU) -> scene units. */
export function visualOrbitRadius(distanceAU) {
  return ORBIT_BASE + ORBIT_SCALE * Math.pow(Math.max(distanceAU, 0), ORBIT_EXPONENT);
}

/** Planet diameter (km) -> sphere radius in scene units. */
export function visualBodyRadius(diameterKm) {
  const earthRelative = diameterKm / 12756;
  return 0.5 + 0.9 * Math.pow(earthRelative, 0.55);
}

/** Distance of Earth's Moon from Earth in scene units (not to scale). */
export const MOON_VISUAL_DISTANCE = 3.4;

/* ------------------------------------------------------------------------ */
/* Keplerian orbits                                                          */
/* ------------------------------------------------------------------------ */

/**
 * Solve Kepler's equation  M = E − e·sin(E)  for the eccentric anomaly E using
 * Newton–Raphson iteration. For planetary eccentricities (< 0.21) this
 * converges to machine precision in a handful of steps.
 */
export function solveKepler(meanAnomaly, eccentricity) {
  let E = eccentricity < 0.8 ? meanAnomaly : Math.PI;
  for (let i = 0; i < 8; i += 1) {
    const f = E - eccentricity * Math.sin(E) - meanAnomaly;
    const fPrime = 1 - eccentricity * Math.cos(E);
    const step = f / fPrime;
    E -= step;
    if (Math.abs(step) < 1e-10) break;
  }
  return E;
}

/**
 * Pre-compute everything about an orbit that does not change over time, so the
 * per-frame position update is just a Kepler solve and a 3×2 matrix multiply.
 *
 * elements: a (AU), e, I (inclination, deg), L (mean longitude at J2000, deg),
 *           varpi (longitude of perihelion, deg), node (longitude of ascending node, deg)
 */
export function prepareOrbit(elements, orbitalPeriodDays) {
  const { a, e, I, L, varpi, node } = elements;
  const argPerihelion = (varpi - node) * DEG; // ω = ϖ − Ω
  const inc = I * DEG;
  const om = node * DEG;
  const cosW = Math.cos(argPerihelion);
  const sinW = Math.sin(argPerihelion);
  const cosO = Math.cos(om);
  const sinO = Math.sin(om);
  const cosI = Math.cos(inc);
  const sinI = Math.sin(inc);

  return {
    a,
    e,
    semiMinorFactor: Math.sqrt(1 - e * e),
    meanAnomalyAtEpoch: (L - varpi) * DEG, // M₀ = L − ϖ
    meanMotion: TWO_PI / orbitalPeriodDays, // n = 2π / P  (radians per day)
    // Rotation from the orbital plane (perihelion on +x) to ecliptic coordinates.
    m11: cosW * cosO - sinW * sinO * cosI,
    m12: -sinW * cosO - cosW * sinO * cosI,
    m21: cosW * sinO + sinW * cosO * cosI,
    m22: -sinW * sinO + cosW * cosO * cosI,
    m31: sinW * sinI,
    m32: cosW * sinI,
  };
}

/**
 * Position for a given eccentric anomaly, in scene coordinates (visual scale).
 * Ecliptic (x, y, z) maps to Three.js as (x, z, −y) so the ecliptic plane is
 * the XZ plane and ecliptic north points up the +Y axis.
 */
export function positionFromEccentricAnomaly(orbit, E, out) {
  // Position in the orbital plane, Sun at the focus (AU)
  const xp = orbit.a * (Math.cos(E) - orbit.e);
  const yp = orbit.a * orbit.semiMinorFactor * Math.sin(E);

  const x = orbit.m11 * xp + orbit.m12 * yp;
  const y = orbit.m21 * xp + orbit.m22 * yp;
  const z = orbit.m31 * xp + orbit.m32 * yp;

  // Radially compress the true distance into scene units; direction is kept.
  const r = Math.sqrt(x * x + y * y + z * z);
  const scale = r > 0 ? visualOrbitRadius(r) / r : 0;
  out.set(x * scale, z * scale, -y * scale);
  return out;
}

/** Mean anomaly (radians) `days` after J2000. */
export function meanAnomalyAt(orbit, days) {
  return orbit.meanAnomalyAtEpoch + orbit.meanMotion * days;
}

/** Scene-space position of a planet `days` after J2000. */
export function planetPosition(orbit, days, out) {
  const E = solveKepler(normaliseAngle(meanAnomalyAt(orbit, days)), orbit.e);
  return positionFromEccentricAnomaly(orbit, E, out);
}

/** Sample the full orbital ellipse as a flat [x,y,z] list (closed loop). */
export function orbitPathPoints(orbit, segments = 256) {
  const points = [];
  const v = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } };
  for (let i = 0; i <= segments; i += 1) {
    positionFromEccentricAnomaly(orbit, (i / segments) * TWO_PI, v);
    points.push([v.x, v.y, v.z]);
  }
  return points;
}

/** Wrap an angle into [−π, π). */
export function normaliseAngle(angle) {
  return ((((angle + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI) - Math.PI;
}

/** Spin angle (radians) after `days`, for a rotation period in hours. */
export function spinAngle(days, rotationPeriodHours) {
  const periodDays = Math.abs(rotationPeriodHours) / 24;
  return (TWO_PI * days * ROTATION_TIME_SCALE) / periodDays;
}

/**
 * Kepler's third law for bodies orbiting the Sun: P² = a³ (P in years, a in AU).
 * Returns the period in Earth days.
 */
export function keplerPeriodDays(semiMajorAxisAU) {
  return Math.pow(semiMajorAxisAU, 1.5) * 365.25;
}

/* ------------------------------------------------------------------------ */
/* Formatting                                                                */
/* ------------------------------------------------------------------------ */

const numberFormatters = new Map();
export function formatNumber(value, maximumFractionDigits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (!numberFormatters.has(maximumFractionDigits)) {
    numberFormatters.set(
      maximumFractionDigits,
      new Intl.NumberFormat('en-US', { maximumFractionDigits, minimumFractionDigits: 0 }),
    );
  }
  return numberFormatters.get(maximumFractionDigits).format(value);
}

/** Orbital period in days, with years for long periods. */
export function describeOrbitalPeriod(days) {
  if (!days) return null;
  const years = days / 365.25;
  if (years >= 1.5) return { value: formatNumber(years, years < 20 ? 2 : 1), unit: 'Earth years', secondary: `${formatNumber(days)} days` };
  const yearsText = formatNumber(years, 2);
  return { value: formatNumber(days, 1), unit: 'Earth days', secondary: `${yearsText} ${yearsText === '1' ? 'year' : 'years'}` };
}

/** Rotation period in hours or days, flagging retrograde rotation. */
export function describeRotationPeriod(hours) {
  if (hours === null || hours === undefined) return null;
  const abs = Math.abs(hours);
  const retrograde = hours < 0;
  if (abs >= 72) {
    return { value: formatNumber(abs / 24, 1), unit: 'Earth days', secondary: retrograde ? 'Retrograde' : `${formatNumber(abs, 1)} hours`, retrograde };
  }
  return { value: formatNumber(abs, 1), unit: 'hours', secondary: retrograde ? 'Retrograde' : null, retrograde };
}

/** Elapsed simulation time as years + days. */
export function formatElapsed(days) {
  const total = Math.max(0, days);
  const years = Math.floor(total / 365.25);
  const remainder = Math.floor(total - years * 365.25);
  if (years === 0) return `${remainder} d`;
  return `${formatNumber(years)} y ${remainder} d`;
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
/** Model calendar date `days` after J2000. */
export function formatModelDate(days) {
  const date = new Date(J2000_EPOCH_MS + days * MS_PER_DAY);
  if (Number.isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
}

export function celsiusToKelvin(celsius) {
  return celsius + 273.15;
}
