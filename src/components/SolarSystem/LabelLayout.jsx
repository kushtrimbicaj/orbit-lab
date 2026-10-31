import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

const MIN_LABEL_SPACING_PX = 34; // labels closer than this on screen collide
const MAX_LABEL_DISTANCE = 900; // hide labels when the camera is very far away

const worldPosition = new Vector3();
const projected = new Vector3();

/**
 * Screen-space label layout, run once per frame for all labels.
 *
 * Labels are projected to screen coordinates and placed greedily in priority
 * order (selected > hovered > larger planets). A label that would land within
 * MIN_LABEL_SPACING_PX of an already placed label is hidden, which keeps the
 * crowded inner system readable when zoomed out. Visibility is applied by
 * toggling a CSS class directly on the DOM node — no React re-render.
 */
export default function LabelLayout({ labelsRef, selectedId, hoveredId }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const placed = [];
  const order = [];

  useFrame(() => {
    const labels = labelsRef.current;
    order.length = 0;
    labels.forEach((entry, id) => {
      if (entry.element.current && entry.anchor.current) order.push(id);
    });
    order.sort((a, b) => priority(b, labels, selectedId, hoveredId) - priority(a, labels, selectedId, hoveredId));

    placed.length = 0;
    for (let i = 0; i < order.length; i += 1) {
      const id = order[i];
      const entry = labels.get(id);
      const element = entry.element.current;
      entry.anchor.current.getWorldPosition(worldPosition);
      const distance = worldPosition.distanceTo(camera.position);
      projected.copy(worldPosition).project(camera);

      const onScreen = projected.z < 1 && Math.abs(projected.x) < 1.1 && Math.abs(projected.y) < 1.1;
      const x = ((projected.x + 1) / 2) * size.width;
      const y = ((1 - projected.y) / 2) * size.height;
      const important = id === selectedId || id === hoveredId;

      let visible = onScreen && (important || distance < MAX_LABEL_DISTANCE);
      if (visible && !important) {
        for (let j = 0; j < placed.length; j += 2) {
          const dx = placed[j] - x;
          const dy = placed[j + 1] - y;
          if (dx * dx + dy * dy < MIN_LABEL_SPACING_PX * MIN_LABEL_SPACING_PX) {
            visible = false;
            break;
          }
        }
      }
      if (visible) placed.push(x, y);
      if (element.classList.contains('is-hidden') === visible) element.classList.toggle('is-hidden', !visible);
    }
  });

  return null;
}

function priority(id, labels, selectedId, hoveredId) {
  if (id === selectedId) return 1000;
  if (id === hoveredId) return 500;
  return labels.get(id).radius;
}
