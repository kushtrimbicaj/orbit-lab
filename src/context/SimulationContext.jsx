import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { MAX_SPEED, MIN_SPEED, daysSinceJ2000 } from '../utils/astronomy';
import { BODY_BY_ID, isComparable } from '../data/planets';

const SETTINGS_KEY = 'orbitlab.settings.v1';
const COMPARE_KEY = 'orbitlab.compare.v1';

export const DEFAULT_SETTINGS = {
  speed: 1,
  showOrbits: true,
  showLabels: true,
  showStars: true,
  showAsteroids: true,
  showIss: true,
  rotationEnabled: true,
  orbitEnabled: true,
  educationalMode: false,
};

const DEFAULT_COMPARE = ['earth', 'mars'];

const isValidCompare = (value) =>
  Array.isArray(value) && value.length === 2 && value.every((id) => typeof id === 'string' && isComparable(id));

const SimulationContext = createContext(null);

export function SimulationProvider({ children }) {
  const [storedSettings, setSettings, resetSettings] = useLocalStorage(SETTINGS_KEY, DEFAULT_SETTINGS);
  const [compareIds, setCompareIds] = useLocalStorage(COMPARE_KEY, DEFAULT_COMPARE, isValidCompare);

  // Guard against tampered or outdated stored values.
  const settings = useMemo(() => {
    const speed = Number(storedSettings.speed);
    return {
      ...DEFAULT_SETTINGS,
      ...storedSettings,
      speed: Number.isFinite(speed) ? Math.min(MAX_SPEED, Math.max(MIN_SPEED, speed)) : DEFAULT_SETTINGS.speed,
    };
  }, [storedSettings]);

  const [playing, setPlaying] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);
  // Camera commands carry a nonce so repeating the same command re-triggers it.
  const [cameraCommand, setCameraCommand] = useState({ type: 'intro', nonce: 0 });

  /** Mutable simulation clock, advanced in the render loop (days since J2000). */
  const clockRef = useRef({ elapsedDays: 0, orbitDays: 0, spinDays: 0 });
  /** Registry of rendered bodies: id -> { object: THREE.Object3D, radius }. */
  const bodiesRef = useRef(new Map());
  /** Latest settings for the render loop, readable without re-rendering 3D components. */
  const runtimeRef = useRef(null);
  runtimeRef.current = { ...settings, playing };

  const issueCamera = useCallback((type, id = null) => {
    setCameraCommand((prev) => ({ type, id, nonce: prev.nonce + 1 }));
  }, []);

  const updateSetting = useCallback(
    (key, value) => setSettings((prev) => ({ ...prev, [key]: value })),
    [setSettings],
  );

  const selectBody = useCallback(
    (id) => {
      if (!BODY_BY_ID[id]) return;
      // Selecting the ISS turns its live marker on if it was hidden.
      if (id === 'iss') setSettings((prev) => (prev.showIss ? prev : { ...prev, showIss: true }));
      setSelectedId(id);
      setCompareOpen(false);
      issueCamera('focus', id);
    },
    [issueCamera, setSettings],
  );

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    issueCamera('system');
  }, [issueCamera]);

  const showEntireSystem = useCallback(() => {
    setSelectedId(null);
    issueCamera('system');
  }, [issueCamera]);

  const resetCamera = useCallback(() => {
    setSelectedId(null);
    issueCamera('reset');
  }, [issueCamera]);

  const focusSun = useCallback(() => selectBody('sun'), [selectBody]);

  const resetSimulation = useCallback(() => {
    const clock = clockRef.current;
    clock.elapsedDays = 0;
    clock.orbitDays = 0;
    clock.spinDays = 0;
  }, []);

  /**
   * Jump to the real present: planets (and the Moon's phase) move to where they
   * are today. The simulation pauses so the real-sky arrangement stays on screen.
   */
  const jumpToNow = useCallback(() => {
    const clock = clockRef.current;
    const today = daysSinceJ2000(new Date());
    clock.orbitDays = today;
    clock.spinDays = today;
    clock.elapsedDays = 0;
    setPlaying(false);
  }, []);

  const togglePlaying = useCallback(() => setPlaying((p) => !p), []);

  const setCompareSlot = useCallback(
    (slot, id) => setCompareIds((prev) => {
      const next = [...prev];
      next[slot] = id;
      return next;
    }),
    [setCompareIds],
  );

  // Keyboard shortcuts: Space = play/pause, Esc = close panel / deselect.
  useEffect(() => {
    const onKey = (event) => {
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return;
      if (event.code === 'Space' && tag !== 'BUTTON') {
        event.preventDefault();
        togglePlaying();
      } else if (event.key === 'Escape') {
        if (compareOpen) setCompareOpen(false);
        else if (selectedId) clearSelection();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [compareOpen, selectedId, clearSelection, togglePlaying]);

  const value = useMemo(
    () => ({
      settings,
      updateSetting,
      resetSettings,
      playing,
      setPlaying,
      togglePlaying,
      selectedId,
      selectBody,
      clearSelection,
      hoveredId,
      setHoveredId,
      compareOpen,
      setCompareOpen,
      compareIds,
      setCompareSlot,
      cameraCommand,
      showEntireSystem,
      resetCamera,
      focusSun,
      resetSimulation,
      jumpToNow,
      clockRef,
      bodiesRef,
      runtimeRef,
    }),
    [
      settings, updateSetting, resetSettings, playing, togglePlaying, selectedId, selectBody, clearSelection,
      hoveredId, compareOpen, compareIds, setCompareSlot, cameraCommand, showEntireSystem, resetCamera,
      focusSun, resetSimulation, jumpToNow,
    ],
  );

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulationContext() {
  const context = useContext(SimulationContext);
  if (!context) throw new Error('useSimulationContext must be used inside <SimulationProvider>');
  return context;
}
