/**
 * Astronomical reference data for OrbitLab.
 *
 * Physical values come from the NASA Goddard Space Flight Center "Planetary Fact
 * Sheet" (metric) and "Sun Fact Sheet" (nssdc.gsfc.nasa.gov/planetary/factsheet).
 * Orbital elements are the J2000 "Keplerian Elements for Approximate Positions of
 * the Major Planets" published by JPL Solar System Dynamics (E. M. Standish).
 * Neptune's orbital period uses the sidereal value from NASA's Neptune fact sheet.
 * Moon counts are confirmed moons as reported in March 2026 and change as new
 * discoveries are confirmed.
 *
 * Units
 *  diameterKm            equatorial diameter, kilometres
 *  massE24Kg             mass in units of 10^24 kg
 *  distanceMillionKm     mean distance from the Sun, millions of km
 *  semiMajorAxisAU       mean distance from the Sun, astronomical units
 *  orbitalPeriodDays     sidereal orbital period, Earth days
 *  rotationPeriodHours   sidereal rotation period, hours (negative = retrograde)
 *  lengthOfDayHours      solar day (sunrise to sunrise), hours
 *  meanTemperatureC      mean temperature, °C
 *  obliquityDeg          axial tilt relative to the orbit, degrees
 */

// Text-presentation selector so symbols such as ♀ and ♂ are not rendered as emoji.
const T = '︎';

export const MOON_COUNT_NOTE =
  'Confirmed moons as of March 2026. Counts change as new discoveries are confirmed.';

export const SUN = {
  id: 'sun',
  name: 'Sun',
  symbol: `☉${T}`,
  type: 'G-type main-sequence star',
  category: 'star',
  accent: '#ffb347',
  diameterKm: 1391400,
  massE24Kg: 1988500,
  distanceMillionKm: 0,
  semiMajorAxisAU: 0,
  orbitalPeriodDays: null,
  orbitalPeriodLabel: '≈ 230 million years around the Milky Way’s centre',
  rotationPeriodHours: 609.12,
  rotationNote: 'At the equator; the Sun rotates faster at its equator than near its poles.',
  meanTemperatureC: 5500,
  temperatureNote: 'Visible surface (photosphere), about 5,772 K. The core reaches about 15 million °C.',
  moons: null,
  obliquityDeg: 7.25,
  textures: { map: 'sun.jpg' },
  description:
    'The Sun is a nearly perfect sphere of hot plasma whose core fuses about 600 million tonnes of hydrogen into helium every second. Its gravity holds the solar system together and its light powers Earth’s climate and life.',
  facts: [
    'The Sun contains about 99.8% of all the mass in the solar system.',
    'Sunlight takes about 8 minutes and 20 seconds to travel to Earth.',
    'Roughly 109 Earths could be lined up across the Sun’s diameter.',
    'The Sun’s outer atmosphere, the corona, is hundreds of times hotter than its visible surface.',
  ],
  composition: 'About 73% hydrogen and 25% helium by mass, with small amounts of heavier elements.',
};

export const PLANETS = [
  {
    id: 'mercury',
    name: 'Mercury',
    symbol: `☿${T}`,
    type: 'Terrestrial planet',
    category: 'terrestrial',
    accent: '#b9b2a8',
    diameterKm: 4879,
    massE24Kg: 0.33,
    distanceMillionKm: 57.9,
    semiMajorAxisAU: 0.387,
    orbitalPeriodDays: 88.0,
    rotationPeriodHours: 1407.6,
    lengthOfDayHours: 4222.6,
    meanTemperatureC: 167,
    temperatureNote: 'Surface swings from about 430 °C by day to −180 °C at night.',
    moons: 0,
    obliquityDeg: 0.034,
    elements: { a: 0.38709927, e: 0.20563593, I: 7.00497902, L: 252.2503235, varpi: 77.45779628, node: 48.33076593 },
    textures: { map: 'mercury.jpg', bump: 'mercury_bump.jpg' },
    description:
      'Mercury is the smallest planet and the closest to the Sun. It has almost no atmosphere to trap heat, so its heavily cratered surface experiences the most extreme temperature swings of any planet.',
    facts: [
      'Mercury rotates exactly three times for every two orbits around the Sun.',
      'One solar day on Mercury (sunrise to sunrise) lasts about 176 Earth days — two of its years.',
      'Mercury has the most eccentric orbit of the eight planets.',
      'Its large iron core makes up roughly 85% of the planet’s radius.',
    ],
    composition: 'A rocky planet with an unusually large metallic iron core and a thin rocky mantle and crust.',
  },
  {
    id: 'venus',
    name: 'Venus',
    symbol: `♀${T}`,
    type: 'Terrestrial planet',
    category: 'terrestrial',
    accent: '#e3bb76',
    diameterKm: 12104,
    massE24Kg: 4.87,
    distanceMillionKm: 108.2,
    semiMajorAxisAU: 0.723,
    orbitalPeriodDays: 224.7,
    rotationPeriodHours: -5832.5,
    lengthOfDayHours: 2802.0,
    meanTemperatureC: 464,
    temperatureNote: 'Hot enough to melt lead, day and night.',
    moons: 0,
    obliquityDeg: 177.4,
    elements: { a: 0.72333566, e: 0.00677672, I: 3.39467605, L: 181.9790995, varpi: 131.60246718, node: 76.67984255 },
    textures: { map: 'venus.jpg' },
    atmosphere: { color: '#ffd69a', strength: 0.9 },
    description:
      'Venus is similar in size to Earth but is wrapped in a dense carbon-dioxide atmosphere with clouds of sulfuric acid. A runaway greenhouse effect makes it the hottest planet in the solar system.',
    facts: [
      'Venus spins backwards (retrograde) compared with most planets.',
      'A sidereal day on Venus (243 Earth days) is longer than its year (225 Earth days).',
      'Surface pressure is about 92 times that at sea level on Earth.',
      'Venus is the brightest natural object in the night sky after the Moon.',
    ],
    composition: 'Rocky body with an iron core; atmosphere about 96.5% carbon dioxide.',
  },
  {
    id: 'earth',
    name: 'Earth',
    symbol: `⊕${T}`,
    type: 'Terrestrial planet',
    category: 'terrestrial',
    accent: '#5aa9ff',
    diameterKm: 12756,
    massE24Kg: 5.97,
    distanceMillionKm: 149.6,
    semiMajorAxisAU: 1.0,
    orbitalPeriodDays: 365.2,
    rotationPeriodHours: 23.9,
    lengthOfDayHours: 24.0,
    meanTemperatureC: 15,
    moons: 1,
    obliquityDeg: 23.4,
    elements: { a: 1.00000261, e: 0.01671123, I: -0.00001531, L: 100.46457166, varpi: 102.93768193, node: 0 },
    textures: { map: 'earth.jpg', bump: 'earth_bump.jpg', specular: 'earth_specular.jpg', clouds: 'earth_clouds.jpg' },
    atmosphere: { color: '#6cb6ff', strength: 1.2 },
    hasMoon: true,
    description:
      'Earth is the only world known to host life and the only planet with liquid water on its surface. Its nitrogen–oxygen atmosphere and magnetic field shield the surface from much of the Sun’s harmful radiation.',
    facts: [
      'About 71% of Earth’s surface is covered by water.',
      'Earth’s 23.4° axial tilt, not its distance from the Sun, causes the seasons.',
      'Earth is the densest planet in the solar system.',
      'The Moon’s diameter is a little over a quarter of Earth’s.',
    ],
    composition: 'Iron–nickel core, silicate mantle and crust; atmosphere 78% nitrogen and 21% oxygen.',
  },
  {
    id: 'mars',
    name: 'Mars',
    symbol: `♂${T}`,
    type: 'Terrestrial planet',
    category: 'terrestrial',
    accent: '#e2774a',
    diameterKm: 6792,
    massE24Kg: 0.642,
    distanceMillionKm: 228.0,
    semiMajorAxisAU: 1.524,
    orbitalPeriodDays: 687.0,
    rotationPeriodHours: 24.6,
    lengthOfDayHours: 24.7,
    meanTemperatureC: -65,
    moons: 2,
    obliquityDeg: 25.2,
    elements: { a: 1.52371034, e: 0.0933941, I: 1.84969142, L: -4.55343205, varpi: -23.94362959, node: 49.55953891 },
    textures: { map: 'mars.jpg', bump: 'mars_bump.jpg' },
    atmosphere: { color: '#ffb08a', strength: 0.45 },
    description:
      'Mars is a cold desert world with a thin carbon-dioxide atmosphere. Iron oxide in its dust gives the planet its red colour, and its surface preserves evidence of ancient rivers and lakes.',
    facts: [
      'Olympus Mons is the largest volcano known in the solar system, about 2.5 times the height of Mount Everest.',
      'Valles Marineris is a canyon system roughly 4,000 km long.',
      'Mars has two small moons, Phobos and Deimos.',
      'A Martian solar day (a “sol”) lasts about 24 hours 40 minutes.',
    ],
    composition: 'Rocky planet with an iron-rich core; thin atmosphere about 95% carbon dioxide.',
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    symbol: `♃${T}`,
    type: 'Gas giant',
    category: 'gas',
    accent: '#d8a27a',
    diameterKm: 142984,
    massE24Kg: 1898,
    distanceMillionKm: 778.5,
    semiMajorAxisAU: 5.203,
    orbitalPeriodDays: 4331,
    rotationPeriodHours: 9.9,
    lengthOfDayHours: 9.9,
    meanTemperatureC: -110,
    temperatureNote: 'Measured at the 1-bar pressure level in the atmosphere.',
    moons: 101,
    obliquityDeg: 3.1,
    elements: { a: 5.202887, e: 0.04838624, I: 1.30439695, L: 34.39644051, varpi: 14.72847983, node: 100.47390909 },
    textures: { map: 'jupiter.jpg' },
    description:
      'Jupiter is the largest planet, a gas giant made mostly of hydrogen and helium. Its colourful cloud bands are shaped by powerful jet streams, and the Great Red Spot is a storm larger than Earth.',
    facts: [
      'Jupiter is more than twice as massive as all the other planets combined.',
      'It has the shortest day of any planet — just under 10 hours.',
      'The Great Red Spot has been observed for well over a century.',
      'Ganymede, Jupiter’s largest moon, is bigger than the planet Mercury.',
    ],
    composition: 'Mostly hydrogen and helium; deep inside, hydrogen becomes an electrically conducting liquid metal.',
  },
  {
    id: 'saturn',
    name: 'Saturn',
    symbol: `♄${T}`,
    type: 'Gas giant',
    category: 'gas',
    accent: '#e6cf98',
    diameterKm: 120536,
    massE24Kg: 568,
    distanceMillionKm: 1432.0,
    semiMajorAxisAU: 9.537,
    orbitalPeriodDays: 10747,
    rotationPeriodHours: 10.7,
    lengthOfDayHours: 10.7,
    meanTemperatureC: -140,
    temperatureNote: 'Measured at the 1-bar pressure level in the atmosphere.',
    moons: 285,
    obliquityDeg: 26.7,
    elements: { a: 9.53667594, e: 0.05386179, I: 2.48599187, L: 49.95424423, varpi: 92.59887831, node: 113.66242448 },
    textures: { map: 'saturn.jpg', ring: 'saturn_ring.png' },
    rings: { innerRadiusRatio: 1.24, outerRadiusRatio: 2.27 },
    description:
      'Saturn is a gas giant famous for its spectacular ring system, made of countless pieces of ice and rock. It is the least dense planet — its average density is lower than that of water.',
    facts: [
      'Saturn’s main rings span hundreds of thousands of kilometres but are typically only about 10 metres thick.',
      'The rings are made mostly of water ice, from tiny grains to boulder-sized chunks.',
      'Titan, Saturn’s largest moon, has a thick nitrogen atmosphere and lakes of liquid methane.',
      'Saturn has more confirmed moons than any other planet.',
    ],
    composition: 'Mostly hydrogen and helium around a dense core of rock and ice.',
  },
  {
    id: 'uranus',
    name: 'Uranus',
    symbol: `♅${T}`,
    type: 'Ice giant',
    category: 'ice',
    accent: '#9fe3ea',
    diameterKm: 51118,
    massE24Kg: 86.8,
    distanceMillionKm: 2867.0,
    semiMajorAxisAU: 19.19,
    orbitalPeriodDays: 30589,
    rotationPeriodHours: -17.2,
    lengthOfDayHours: 17.2,
    meanTemperatureC: -195,
    temperatureNote: 'Measured at the 1-bar pressure level in the atmosphere.',
    moons: 28,
    obliquityDeg: 97.8,
    elements: { a: 19.18916464, e: 0.04725744, I: 0.77263783, L: 313.23810451, varpi: 170.9542763, node: 74.01692503 },
    textures: { map: 'uranus.jpg' },
    atmosphere: { color: '#a8f0ff', strength: 0.7 },
    description:
      'Uranus is an ice giant tipped on its side, with an axial tilt of about 98°. Methane in its atmosphere absorbs red light, giving the planet its pale blue-green colour.',
    facts: [
      'Because of its extreme tilt, each pole gets about 42 years of continuous sunlight followed by 42 years of darkness.',
      'Uranus was the first planet discovered with a telescope, by William Herschel in 1781.',
      'Like Venus, Uranus rotates in the opposite direction to most planets.',
      'Uranus has a faint system of 13 known rings.',
    ],
    composition: 'A small rocky core beneath a thick mantle of water, ammonia and methane “ices”, with a hydrogen–helium atmosphere.',
  },
  {
    id: 'neptune',
    name: 'Neptune',
    symbol: `♆${T}`,
    type: 'Ice giant',
    category: 'ice',
    accent: '#5b7dff',
    diameterKm: 49528,
    massE24Kg: 102,
    distanceMillionKm: 4515.0,
    semiMajorAxisAU: 30.07,
    orbitalPeriodDays: 60190,
    rotationPeriodHours: 16.1,
    lengthOfDayHours: 16.1,
    meanTemperatureC: -200,
    temperatureNote: 'Measured at the 1-bar pressure level in the atmosphere.',
    moons: 16,
    obliquityDeg: 28.3,
    elements: { a: 30.06992276, e: 0.00859048, I: 1.77004347, L: -55.12002969, varpi: 44.96476227, node: 131.78422574 },
    textures: { map: 'neptune.jpg' },
    atmosphere: { color: '#6f8cff', strength: 0.8 },
    description:
      'Neptune is the most distant planet, a dark, cold ice giant whipped by the fastest winds measured in the solar system. Its existence was predicted mathematically before it was ever seen.',
    facts: [
      'Neptune was discovered in 1846 after astronomers predicted its position from irregularities in Uranus’s orbit.',
      'Winds on Neptune have been measured at more than 2,000 km/h.',
      'One Neptunian year lasts about 165 Earth years.',
      'Its largest moon, Triton, orbits in the opposite direction to Neptune’s rotation.',
    ],
    composition: 'Rocky core surrounded by a mantle of water, ammonia and methane ices under a hydrogen–helium atmosphere.',
  },
];

/**
 * Earth's Moon — rendered as a satellite of Earth.
 * Values from NASA's Moon Fact Sheet. Distances "from the Sun" are Earth's.
 */
export const MOON = {
  id: 'moon',
  name: 'Moon',
  symbol: `☾${T}`,
  type: 'Natural satellite of Earth',
  category: 'moon',
  parentId: 'earth',
  accent: '#cfd3dc',
  diameterKm: 3475,
  massE24Kg: 0.073,
  distanceFromEarthKm: 384400,
  distanceMillionKm: 149.6,
  semiMajorAxisAU: 1.0,
  orbitalPeriodDays: 27.3,
  orbitsParent: true,
  rotationPeriodHours: 655.7,
  rotationNote: 'Synchronous: one rotation per orbit, so the same side always faces Earth.',
  meanTemperatureC: -20,
  temperatureNote: 'Surface swings from about 120 °C in sunlight to −130 °C at night.',
  moons: null,
  moonsNote: 'A moon of Earth',
  obliquityDeg: 6.7,
  /** Precise sidereal period and J2000 mean longitude, used for the Moon's position (and so its phase). */
  siderealPeriodDays: 27.321661,
  meanLongitudeJ2000Deg: 218.316,
  inclinationDeg: 5.1,
  textures: { map: 'moon.jpg', bump: 'moon_bump.jpg' },
  description:
    'The Moon is Earth’s only natural satellite. Its gravity raises the ocean tides and helps stabilise the tilt of Earth’s axis, and its cratered surface preserves a record of the early solar system.',
  facts: [
    'The Moon is tidally locked: it rotates once per orbit, so the same side always faces Earth.',
    'Twelve astronauts walked on the Moon during NASA’s Apollo missions between 1969 and 1972.',
    'The Moon is slowly drifting away from Earth, by about 3.8 cm per year.',
    'The leading explanation for its origin is debris from a collision between the young Earth and a Mars-sized body.',
  ],
  composition:
    'A rocky body with a crust, mantle and small iron-rich core. The dark “seas” (maria) are ancient plains of solidified basaltic lava.',
};

/**
 * The International Space Station. Static facts from NASA; live position,
 * altitude and speed come from the ISS tracker service.
 */
export const ISS = {
  id: 'iss',
  name: 'ISS',
  fullName: 'International Space Station',
  symbol: `✦${T}`,
  type: 'Crewed orbiting laboratory',
  category: 'spacecraft',
  parentId: 'earth',
  accent: '#7fe0ff',
  description:
    'The International Space Station is a crewed laboratory in low Earth orbit, built and operated by five space agencies. Astronauts live and work aboard it continuously, running experiments in microgravity while it circles Earth about every 90 minutes.',
  stats: [
    { label: 'First module launched', value: '1998', unit: null, note: 'Zarya, 20 November 1998' },
    { label: 'Crewed continuously since', value: '2000', unit: null, note: 'Expedition 1 arrived 2 November 2000' },
    { label: 'Mass', value: '≈ 420', unit: 'tonnes', note: 'About 420,000 kg' },
    { label: 'Length', value: '≈ 109', unit: 'm', note: 'End to end — about the size of a football field' },
    { label: 'Orbital period', value: '≈ 92', unit: 'minutes', note: 'About 15.5 orbits per day' },
    { label: 'Orbital inclination', value: '51.6', unit: '°', note: 'Passes over most of the populated world' },
  ],
  facts: [
    'Its partners are NASA, Roscosmos, the European Space Agency, JAXA (Japan) and the Canadian Space Agency.',
    'People have lived aboard the station continuously since November 2000.',
    'Moving at about 28,000 km/h, the crew sees around 16 sunrises and sunsets every day.',
    'The station is often easy to see with the naked eye as a bright, steady point of light crossing the sky.',
  ],
};

export const ALL_BODIES = [SUN, ...PLANETS];

/** Every selectable object (bodies plus the Moon and the ISS). */
export const BODY_BY_ID = Object.fromEntries([...ALL_BODIES, MOON, ISS].map((body) => [body.id, body]));

/** Navigation order: the Moon and the ISS are listed under Earth. */
export const NAV_ITEMS = [SUN, ...PLANETS].flatMap((body) =>
  body.id === 'earth' ? [body, { ...MOON, nested: true }, { ...ISS, nested: true }] : [body],
);

/** Bodies with comparable physical data (excludes the ISS). */
export const COMPARABLE_BODIES = NAV_ITEMS.filter((body) => body.id !== 'iss');
export const isComparable = (id) => COMPARABLE_BODIES.some((body) => body.id === id);

export function getBody(id) {
  return BODY_BY_ID[id] ?? null;
}

/** Inner and outer edge of the main asteroid belt, in AU. */
export const ASTEROID_BELT = { innerAU: 2.2, outerAU: 3.2 };
