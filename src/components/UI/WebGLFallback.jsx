import RenderError from './RenderError';

/** Shown instead of the canvas when the browser cannot create a WebGL context. */
export default function WebGLFallback() {
  return (
    <RenderError
      title="3D graphics are not available"
      message="OrbitLab needs WebGL to draw the solar system, but your browser or device could not start it."
    >
      <ul className="render-error__tips">
        <li>Make sure hardware acceleration is enabled in your browser settings.</li>
        <li>Update your browser and graphics drivers.</li>
        <li>Try a recent version of Chrome, Edge, Firefox or Safari.</li>
      </ul>
    </RenderError>
  );
}
