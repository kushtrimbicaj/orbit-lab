/**
 * Live International Space Station position from the free, keyless
 * "Where the ISS at?" API (https://wheretheiss.at). NORAD catalogue id 25544.
 *
 * A tiny external store (subscribe / getSnapshot) shared by the 3D marker and
 * the Earth info panel, so there is only ever one polling loop. Polling pauses
 * while the tab is hidden and backs off after errors.
 */

const ISS_URL = 'https://api.wheretheiss.at/v1/satellites/25544';
const POLL_MS = 5000;
const MAX_BACKOFF_MS = 60000;
const TRAIL_LENGTH = 72; // ~6 minutes of samples at 5 s

let state = { status: 'idle', position: null, trail: [], error: null, updatedAt: null };
const listeners = new Set();
let consumers = 0;
let timer = null;
let controller = null;
let failures = 0;

function setState(patch) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

/** Validate and normalise an API response. Exported for tests. */
export function parseIssResponse(json) {
  const latitude = Number(json?.latitude);
  const longitude = Number(json?.longitude);
  const altitude = Number(json?.altitude);
  const velocity = Number(json?.velocity);
  if (![latitude, longitude, altitude].every(Number.isFinite)) throw new Error('Unexpected ISS data');
  return {
    latitude,
    longitude,
    altitudeKm: altitude,
    velocityKmh: Number.isFinite(velocity) ? velocity : null,
    visibility: json.visibility === 'daylight' || json.visibility === 'eclipsed' ? json.visibility : null,
    timestamp: Number.isFinite(Number(json.timestamp)) ? Number(json.timestamp) * 1000 : Date.now(),
  };
}

async function poll() {
  timer = null;
  if (consumers === 0) return;
  if (document.hidden) return; // resumes on visibilitychange
  controller = new AbortController();
  try {
    const response = await fetch(ISS_URL, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`ISS service unavailable (HTTP ${response.status})`);
    const position = parseIssResponse(await response.json());
    failures = 0;
    const trail = [...state.trail, { latitude: position.latitude, longitude: position.longitude }].slice(-TRAIL_LENGTH);
    setState({ status: 'live', position, trail, error: null, updatedAt: Date.now() });
  } catch (error) {
    if (error.name === 'AbortError') return;
    failures += 1;
    setState({
      status: state.position ? 'stale' : 'error',
      error: navigator.onLine === false ? 'You appear to be offline.' : error.message,
    });
  }
  schedule();
}

function schedule() {
  if (consumers === 0 || timer) return;
  const delay = failures === 0 ? POLL_MS : Math.min(MAX_BACKOFF_MS, POLL_MS * 2 ** failures);
  timer = window.setTimeout(poll, delay);
}

function onVisibilityChange() {
  if (!document.hidden && consumers > 0 && !timer) poll();
}

/** Start polling (reference counted). Returns a stop function. */
export function startIssTracking() {
  consumers += 1;
  if (consumers === 1) {
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (state.status === 'idle' || state.status === 'error') setState({ status: 'loading', error: null });
    poll();
  }
  return () => {
    consumers = Math.max(0, consumers - 1);
    if (consumers === 0) {
      window.clearTimeout(timer);
      timer = null;
      controller?.abort();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
  };
}

/** Retry immediately after an error. */
export function retryIssTracking() {
  failures = 0;
  window.clearTimeout(timer);
  timer = null;
  setState({ status: state.position ? state.status : 'loading', error: null });
  poll();
}

export function subscribeIss(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getIssSnapshot() {
  return state;
}
