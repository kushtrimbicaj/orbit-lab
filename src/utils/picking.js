import { Sphere, Vector3 } from 'three';

/*
 * Picking helpers for small objects near a planet (the Moon, the ISS).
 *
 * R3F delivers pointer events nearest-first, and each planet has an enlarged
 * invisible hit-sphere so it is easy to click. That sphere would swallow
 * clicks on a nearby satellite, so planets defer to "priority" targets, and a
 * satellite hidden behind the planet's actual surface ignores the click.
 */

const sphere = new Sphere();
const hitPoint = new Vector3();
const center = new Vector3();

/** True if the event's ray hits the given sphere before `distance`. */
export function isBehindSphere(ray, distance, sphereCenter, radius) {
  sphere.center.copy(sphereCenter);
  sphere.radius = radius;
  const hit = ray.intersectSphere(sphere, hitPoint);
  return hit !== null && ray.origin.distanceTo(hitPoint) < distance - 1e-4;
}

/** True if a visible priority target (userData.pickPriority) is under the pointer. */
export function hasVisiblePriorityTarget(event, planetObject, planetRadius) {
  planetObject.getWorldPosition(center);
  return event.intersections.some(
    (hit) => hit.object.userData?.pickPriority && !isBehindSphere(event.ray, hit.distance, center, planetRadius),
  );
}

/** True if the current intersection is hidden behind the planet's surface. */
export function isHiddenByPlanet(event, planetObject, planetRadius) {
  if (!planetObject) return false;
  planetObject.getWorldPosition(center);
  return isBehindSphere(event.ray, event.distance, center, planetRadius);
}
