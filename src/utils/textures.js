import { CanvasTexture, SRGBColorSpace } from 'three';

/** URL of a file in /public/textures that works under any deployment base path. */
export function textureUrl(file) {
  return `${import.meta.env.BASE_URL}textures/${file}`;
}

/** Mark colour textures as sRGB and enable anisotropic filtering. */
export function prepareColorTexture(texture, anisotropy = 8) {
  if (!texture) return texture;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

/** Soft radial gradient used for the Sun's glow sprite. Caller must dispose. */
export function createGlowTexture(size = 256, stops = [
  [0, 'rgba(255, 236, 190, 1)'],
  [0.18, 'rgba(255, 196, 110, 0.75)'],
  [0.42, 'rgba(255, 140, 50, 0.22)'],
  [1, 'rgba(255, 110, 30, 0)'],
]) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
