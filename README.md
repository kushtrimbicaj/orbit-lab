# OrbitLab — Interactive 3D Solar System Simulator

OrbitLab is a browser-based astronomy exploration tool. You can fly around a 3D model of the solar system, watch the planets move along their real elliptical orbits, change the simulation speed, inspect any body, compare two planets side by side and learn how the solar system works.

It is a fully static, client-side React application and deploys to GitHub Pages without a backend.

---

## Features

**3D solar system**
- The Sun (emissive surface, animated corona glow and a point light that illuminates the planets) and all eight planets.
- Textured planets with surface relief, Earth's specular oceans and cloud layer, and atmospheric halos on Venus, Earth, Mars, Uranus and Neptune.
- Real axial tilts: Uranus rolls on its side, and Venus and Uranus spin retrograde.
- Saturn's rings with the Cassini Division and Encke Gap, aligned to Saturn's equator.
- Earth's Moon on a 27.3-day, 5.1°-inclined orbit, tidally locked to Earth, with its phase correct for the model date. It is selectable, with its own panel (NASA Moon Fact Sheet data) and a place in Compare.
- An asteroid belt of 1,400 instanced rocks (one draw call) between 2.2 and 3.2 AU. Each rock moves at its own Kepler speed.
- Glowing orbital paths, a star field and a faint Milky Way sky with distant galaxies.

**Real orbital mechanics**
- Planet positions are computed every frame by solving Kepler's equation (*M = E − e·sin E*) with Newton–Raphson iteration from JPL's J2000 orbital elements (semi-major axis, eccentricity, inclination, longitudes of perihelion and ascending node). Mercury visibly speeds up near perihelion.
- The simulation starts at the J2000 epoch (1 January 2000), and the timeline shows the model's approximate calendar date.
- All motion uses frame delta time, so the simulated rate is identical at 30, 60 or 144 fps.

**Simulation controls**
- Play, pause and reset.
- A logarithmic speed slider (0.1×–10×) and presets: 0.25×, 0.5×, 1×, 2×, 5× and 10×.
- Layer toggles for orbital paths, labels, stars, the asteroid belt, planetary rotation and orbital motion.
- Preferences are saved in `localStorage`, and corrupted or blocked storage is handled safely.
- Keyboard shortcuts: **Space** plays or pauses, and **Esc** closes the open panel.

**Exploration**
- Select a body by clicking or tapping it in the scene, clicking its label, or using the navigation list. All three do the same thing. The Moon and the ISS are listed under Earth. Picking is occlusion-aware: Earth's enlarged hit area gives way to a satellite in front of it, and a satellite hidden behind the globe can't be clicked through it.
- The camera moves smoothly to the selected planet and then follows it along its orbit. You can still rotate and zoom freely. If you grab the controls mid-flight, the animation hands control back to you straight away.
- **Focus Sun**, **Entire solar system** and **Reset camera** buttons. Zoom, pan and polar angles are clamped to keep the camera in usable positions.
- Labels lay themselves out in screen space. Overlapping labels are hidden in priority order, and all labels hide at extreme zoom.

**Information and learning**
- An information panel for each body shows its astronomical symbol, diameter, mass, distance from the Sun, orbital period, rotation period, average temperature, number of moons, a description and facts.
- **Compare** shows any two bodies side by side, with comparison bars (logarithmic or Kelvin scales where needed) and ratios.
- **Learn** mode has short guides to composition, terrestrial vs. giant planets, orbital mechanics, rotation vs. revolution, the asteroid belt, and Kepler's third law. The law is shown as a live table computed from the data. Learn mode also adds composition and model-scale notes to every information panel.

**Live integrations (free, keyless, called straight from the browser)**
- **Now:** one click moves every planet, and the Moon's phase, to their real positions today using the same J2000 orbital elements. The simulation pauses so the real-sky layout stays on screen.
- **NASA imagery:** each information panel shows a gallery of real photographs from the [NASA Image and Video Library](https://images.nasa.gov). Searches are tuned per body (for example, Cassini for Saturn and Juno for Jupiter), with results about rockets, artwork and events filtered out. A full-screen viewer shows credits, dates and descriptions. Results are cached for the session.
- **Live ISS:** the International Space Station's real-time position from [wheretheiss.at](https://wheretheiss.at) is drawn above the matching latitude and longitude on the globe, with a short ground track (altitude exaggerated so it's visible). The ISS is selectable: its own panel combines the live readout with NASA facts and figures, and Earth's panel shows a live summary with a link to it. Updates arrive every 5 seconds, pause while the tab is hidden, back off after errors, and can be turned off in the layers menu.

**Robustness and responsiveness**
- WebGL detection with a helpful fallback screen, an error boundary for render or texture failures, and handling for a lost GPU context.
- Layouts for desktop (floating side panels), tablet (narrower panels) and mobile (horizontal planet strip, collapsible controls, bottom-sheet panels, touch camera controls).

---

## Screenshots

> Add screenshots to `docs/screenshots/` and reference them here.

| Overview | Planet details | Comparison | Mobile |
| --- | --- | --- | --- |
| `docs/screenshots/overview.png` | `docs/screenshots/planet.png` | `docs/screenshots/compare.png` | `docs/screenshots/mobile.png` |

---

## Technology stack

| Layer | Technology |
| --- | --- |
| UI | React 18 (functional components and hooks) |
| 3D | Three.js, React Three Fiber, @react-three/drei |
| Build | Vite 5 |
| Language | JavaScript (ES2020+), JSX |
| Styling | Hand-written CSS with design tokens (no Tailwind) |
| Persistence | `localStorage` |
| Hosting | GitHub Pages with GitHub Actions |

---

## Getting started

Requirements: **Node.js 18 or newer** and npm.

```bash
npm install       # install dependencies
npm run dev       # start the dev server at http://localhost:5173
```

### Production build

```bash
npm run build     # outputs a static site to dist/
npm run preview   # serves dist/ locally to check the build
```

The build uses a relative base path (`base: './'` in `vite.config.js`), so `dist/` works at a domain root, under any sub-path, or from a plain static file server.

---

## Deploying to GitHub Pages

1. Push the project to a GitHub repository, for example `github.com/<user>/OrbitLab`.
2. Run `npm install` once and commit the generated `package-lock.json` so CI builds are reproducible.
3. Copy the workflow into place: move `deploy/github-pages.yml` to `.github/workflows/deploy.yml` (GitHub only runs workflows from that folder).
4. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
5. Push to `main`. The workflow installs dependencies, runs `npm run build` and publishes `dist/`.
6. The site is published at `https://<user>.github.io/<repository>/`.

The app has a single page and no client-side router, so refreshing the deployed page always works. If you need an absolute base path instead of a relative one, build with `VITE_BASE=/<repository>/ npm run build`.

---

## Project structure

```
OrbitLab/
├── deploy/github-pages.yml        GitHub Pages workflow (move to .github/workflows/)
├── public/
│   ├── textures/                  Planet, ring and sky textures (generated)
│   ├── icons/                     App icon
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── SolarSystem/           Everything rendered inside the R3F <Canvas>
│   │   │   ├── SceneCanvas.jsx    Canvas, error boundary, GPU context-loss handling
│   │   │   ├── SolarSystem.jsx    Scene composition, controls, clock
│   │   │   ├── Sun.jsx · Planet.jsx · Moon.jsx · Atmosphere.jsx
│   │   │   ├── AsteroidBelt.jsx   InstancedMesh belt with Kepler motion
│   │   │   ├── OrbitPath.jsx · StarField.jsx · SelectionRing.jsx
│   │   │   └── LabelLayout.jsx    Screen-space label collision handling
│   │   ├── UI/                    HUD: header, timeline, sidebar, panels, controls
│   │   └── Layout/AppLayout.jsx   Arranges the HUD over the scene
│   ├── context/SimulationContext.jsx   Settings, selection, camera commands, clock ref
│   ├── hooks/
│   │   ├── useSimulation.js       Delta-time clock and throttled UI snapshot
│   │   ├── useCamera.js           Camera transitions and body following
│   │   ├── useNasaImages.js · useIss.js   Live-data hooks
│   │   └── useLocalStorage.js     Persisted state that never throws
│   ├── data/planets.js            Astronomical reference data
│   ├── services/                  nasaImages.js (search, filtering, cache) · issTracker.js (polling store)
│   ├── utils/
│   │   ├── astronomy.js           Kepler solver, scaling, formatting (framework-free)
│   │   ├── textures.js · webgl.js
│   ├── styles/                    global.css · layout.css · components.css
│   ├── App.jsx
│   └── main.jsx
├── tools/generate_textures.py     Reproducible procedural texture generator
├── index.html
├── vite.config.js
└── package.json
```

### Architecture notes

- **Simulation logic is separate from the UI.** `utils/astronomy.js` has no React or Three.js imports. The clock is a mutable ref advanced inside `useFrame`.
- **No per-frame React state.** Positions, spin, camera following and label visibility are applied directly to Three.js objects or DOM nodes through refs. The timeline reads the clock at about 5 Hz.
- **Static work is done once.** Orbits are pre-computed into rotation-matrix form at module load, so each frame only needs a Kepler solve and a small matrix multiply per planet.
- **Disposal.** R3F disposes declarative geometries and materials on unmount. Imperatively created resources (ring geometry, glow textures, asteroid geometry) are disposed in effect cleanups.

---

## Scientific scaling

The real solar system cannot be shown at one scale. If the Sun were 20 cm across, Earth would be under 2 mm wide and 21.5 m away, and Neptune would be about 650 m away. OrbitLab therefore uses deliberate, documented visual scaling:

| Quantity | Real | In OrbitLab |
| --- | --- | --- |
| Orbital distance | 0.39–30 AU | `r = 14 + 22 · d^0.55` scene units, applied radially to the true Keplerian position (orbit shape and the Sun-at-focus geometry are kept) |
| Planet size | 4,879–142,984 km | `R = 0.5 + 0.9 · (D / D_Earth)^0.55` |
| Orbital time | — | At 1×, 1 s = 10 Earth days; relative orbital periods are exact |
| Rotation | — | Shown 50× slower than orbital time so fast rotators don't strobe; relative rates are exact |
| Moon distance | 384,400 km | Fixed 3.4 units from Earth |

Ordering is always preserved, but ratios of sizes and distances are not to scale. **Every value in the information and comparison panels is the real value.**

---

## Data sources

- NASA Goddard Space Flight Center — *Planetary Fact Sheet* and *Sun Fact Sheet* (diameters, masses, distances, periods, temperatures, axial tilts): https://nssdc.gsfc.nasa.gov/planetary/factsheet/
- NASA Neptune fact sheet — sidereal orbital period (60,190 days).
- JPL Solar System Dynamics — *Keplerian Elements for Approximate Positions of the Major Planets* (J2000 elements, E. M. Standish): https://ssd.jpl.nasa.gov/planets/approx_pos.html
- Moon counts are confirmed moons as reported in March 2026 (Jupiter 101, Saturn 285, Uranus 28, Neptune 16). These numbers change as discoveries are confirmed. Update them in `src/data/planets.js`.
- Live data: [NASA Image and Video Library API](https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf) (`images-api.nasa.gov`) and the [Where the ISS at? API](https://wheretheiss.at) (`api.wheretheiss.at`). Neither needs a key. Photos remain credited to NASA and the photographers or centres listed with each image.
- The Moon's position uses its J2000 mean longitude (218.316°) and sidereal period (27.321661 days).
- Educational descriptions are based on NASA Science's planet pages: https://science.nasa.gov/solar-system/

Temperatures for the giant planets are given at the 1-bar pressure level. The Sun's temperature is for its visible surface (photosphere).

## Texture attribution

All textures in `public/textures/` are **original procedural artwork** created for OrbitLab by `tools/generate_textures.py`. The script samples seeded 3D fractal noise on the unit sphere, so the maps have no seams and no pole pinching. They are artistic approximations, not cartographic maps, and need no third-party licence.

To regenerate them (Python 3 with `numpy` and `Pillow`):

```bash
npm run textures      # or: python3 tools/generate_textures.py
```

For photographic realism, you can drop in the CC BY 4.0 maps from [Solar System Scope](https://www.solarsystemscope.com/textures/) using the same file names (and credit them here).

## Acknowledgments

- [Three.js](https://threejs.org/), [React Three Fiber and Drei](https://github.com/pmndrs) by Poimandres
- NASA and JPL for open planetary data
- Interface inspired by NASA's *Eyes on the Solar System*

## License

[MIT](LICENSE)
