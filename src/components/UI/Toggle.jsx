/** Accessible switch. */
export default function Toggle({ label, checked, onChange, description }) {
  return (
    <label className="toggle">
      <span className="toggle__text">
        <span className="toggle__label">{label}</span>
        {description && <span className="toggle__description">{description}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle__track" aria-hidden="true"><span className="toggle__thumb" /></span>
    </label>
  );
}
