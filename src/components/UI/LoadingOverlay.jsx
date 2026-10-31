import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';

/** Texture loading progress, faded out once everything has arrived. */
export default function LoadingOverlay() {
  const { active, progress } = useProgress();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!active && progress >= 100) {
      const id = window.setTimeout(() => setVisible(false), 450);
      return () => window.clearTimeout(id);
    }
    setVisible(true);
    return undefined;
  }, [active, progress]);

  if (!visible) return null;
  return (
    <div className={`loading-overlay${!active && progress >= 100 ? ' is-done' : ''}`} aria-live="polite">
      <div className="loading-overlay__orbit" aria-hidden="true"><span /></div>
      <p className="loading-overlay__title">OrbitLab</p>
      <p className="loading-overlay__text">Loading planetary textures · {Math.round(progress)}%</p>
    </div>
  );
}
