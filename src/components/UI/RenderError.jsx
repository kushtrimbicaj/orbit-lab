/** Full-screen, readable error / fallback message. */
export default function RenderError({ title, message, children }) {
  return (
    <div className="render-error" role="alert">
      <div className="render-error__card glass">
        <div className="render-error__icon" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><ellipse cx="24" cy="24" rx="21" ry="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".6" transform="rotate(-20 24 24)" /></svg>
        </div>
        <h2>{title}</h2>
        <p>{message}</p>
        {children}
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>Reload OrbitLab</button>
      </div>
    </div>
  );
}
