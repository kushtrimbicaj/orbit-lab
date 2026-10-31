/**
 * NASA Image and Video Library client (https://images.nasa.gov).
 *
 * Free, keyless, and CORS-enabled, so it can be called directly from the
 * browser on a static GitHub Pages site. Results are cached in memory and in
 * sessionStorage so reopening a planet doesn't refetch.
 */

const API_URL = 'https://images-api.nasa.gov/search';
const DETAILS_URL = 'https://images.nasa.gov/details/';
const CACHE_PREFIX = 'orbitlab.nasa-images.v1.';
const MAX_IMAGES = 8;

/**
 * Per-body search terms (mission names steer results towards real planetary
 * imagery) and title words a result must contain.
 */
const QUERIES = {
  sun: { q: 'sun solar dynamics observatory', titleMatch: /\b(sun|solar)\b/i },
  mercury: { q: 'mercury messenger', titleMatch: /\bmercury\b/i },
  venus: { q: 'venus planet', titleMatch: /\bvenus\b/i },
  earth: { q: 'earth blue marble', titleMatch: /\bearth\b/i },
  moon: { q: 'moon lunar surface', titleMatch: /\b(moon|lunar)\b/i },
  iss: { q: 'international space station', titleMatch: /space station|\biss\b/i },
  mars: { q: 'mars planet', titleMatch: /\bmars\b/i },
  jupiter: { q: 'jupiter juno', titleMatch: /\bjupiter\b/i },
  saturn: { q: 'saturn cassini', titleMatch: /\bsaturn\b/i },
  uranus: { q: 'uranus voyager', titleMatch: /\buranus\b/i },
  neptune: { q: 'neptune voyager', titleMatch: /\bneptune\b/i },
};

/** Results that are about rockets, people or artwork rather than the body itself. */
const EXCLUDE = /saturn (v|ib|1b)\b|rocket|launch|artist|illustration|concept|model|mock-?up|poster|logo|patch|team|meeting|briefing|press|award|ceremony|employee|workshop|exhibit/i;

const memoryCache = new Map();

function stripHtml(text = '') {
  return text.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function toImage(item) {
  const data = item?.data?.[0];
  const preview = item?.links?.find((link) => link.render === 'image' || link.rel === 'preview');
  if (!data || !preview?.href || data.media_type !== 'image') return null;
  const thumb = preview.href.replace(/^http:/, 'https:');
  return {
    id: data.nasa_id,
    title: stripHtml(data.title),
    description: stripHtml(data.description || data.description_508 || ''),
    date: data.date_created || null,
    credit: stripHtml(data.photographer || data.secondary_creator || '') || (data.center ? `NASA ${data.center}` : 'NASA'),
    thumb,
    // "~medium" exists for most assets; the viewer falls back to the thumbnail if not.
    large: thumb.replace('~thumb.', '~medium.'),
    detailsUrl: DETAILS_URL + encodeURIComponent(data.nasa_id),
  };
}

/** Pick relevant, de-duplicated images from a search response. */
export function selectImages(json, bodyId) {
  const { titleMatch } = QUERIES[bodyId] ?? {};
  const items = json?.collection?.items ?? [];
  const all = items.map(toImage).filter(Boolean);
  const seen = new Set();
  const unique = (list) => list.filter((img) => {
    const key = img.title.toLowerCase();
    if (seen.has(key) || seen.has(img.id)) return false;
    seen.add(key);
    seen.add(img.id);
    return true;
  });
  const relevant = unique(all.filter((img) => (!titleMatch || titleMatch.test(img.title)) && !EXCLUDE.test(img.title)));
  // If strict filtering leaves too little, top up with the remaining non-excluded results.
  const extra = relevant.length < 4 ? unique(all.filter((img) => !EXCLUDE.test(img.title))) : [];
  return [...relevant, ...extra].slice(0, MAX_IMAGES);
}

function readSessionCache(bodyId) {
  try {
    const raw = window.sessionStorage.getItem(CACHE_PREFIX + bodyId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSessionCache(bodyId, images) {
  try {
    window.sessionStorage.setItem(CACHE_PREFIX + bodyId, JSON.stringify(images));
  } catch {
    /* storage full or unavailable — memory cache still works */
  }
}

export function getCachedImages(bodyId) {
  if (memoryCache.has(bodyId)) return memoryCache.get(bodyId);
  const stored = readSessionCache(bodyId);
  if (stored) memoryCache.set(bodyId, stored);
  return stored;
}

/** Fetch up to eight NASA images for a body. Throws on network/HTTP errors. */
export async function fetchBodyImages(bodyId, { signal } = {}) {
  const cached = getCachedImages(bodyId);
  if (cached) return cached;
  const query = QUERIES[bodyId];
  if (!query) return [];
  const params = new URLSearchParams({ q: query.q, media_type: 'image', page_size: '60' });
  const response = await fetch(`${API_URL}?${params}`, { signal });
  if (!response.ok) throw new Error(`NASA image search failed (HTTP ${response.status})`);
  const images = selectImages(await response.json(), bodyId);
  memoryCache.set(bodyId, images);
  writeSessionCache(bodyId, images);
  return images;
}
