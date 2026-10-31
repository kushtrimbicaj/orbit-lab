/** Returns true if the browser can create a WebGL (1 or 2) context. */
export function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const ok = Boolean(window.WebGLRenderingContext && context);
    // Release the probe context immediately.
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch {
    return false;
  }
}
