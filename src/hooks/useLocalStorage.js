import { useCallback, useEffect, useRef, useState } from 'react';

/** Read a JSON value from localStorage without ever throwing. */
function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    // Merge plain objects with their defaults so newly added settings get a value.
    if (fallback && typeof fallback === 'object' && !Array.isArray(fallback) && parsed && typeof parsed === 'object') {
      return { ...fallback, ...parsed };
    }
    return parsed;
  } catch {
    return fallback;
  }
}

/**
 * useState that persists to localStorage. Storage can be unavailable (private
 * browsing, disabled cookies, quota) — in that case the hook silently behaves
 * like ordinary in-memory state.
 */
export function useLocalStorage(key, defaultValue, validate) {
  const defaultRef = useRef(defaultValue);
  const [value, setValue] = useState(() => {
    const stored = readStorage(key, defaultRef.current);
    return validate && !validate(stored) ? defaultRef.current : stored;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable — keep working in memory */
    }
  }, [key, value]);

  const reset = useCallback(() => setValue(defaultRef.current), []);

  return [value, setValue, reset];
}
