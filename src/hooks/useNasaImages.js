import { useCallback, useEffect, useState } from 'react';
import { fetchBodyImages, getCachedImages } from '../services/nasaImages';

/** Loads NASA imagery for a body: { status: 'loading' | 'ready' | 'error', images, error, retry }. */
export function useNasaImages(bodyId) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState(() => {
    const cached = getCachedImages(bodyId);
    return cached ? { status: 'ready', images: cached, error: null } : { status: 'loading', images: [], error: null };
  });

  useEffect(() => {
    const cached = getCachedImages(bodyId);
    if (cached) {
      setState({ status: 'ready', images: cached, error: null });
      return undefined;
    }
    const controller = new AbortController();
    setState({ status: 'loading', images: [], error: null });
    fetchBodyImages(bodyId, { signal: controller.signal })
      .then((images) => setState({ status: 'ready', images, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setState({ status: 'error', images: [], error: navigator.onLine === false ? 'You appear to be offline.' : error.message });
      });
    return () => controller.abort();
  }, [bodyId, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
