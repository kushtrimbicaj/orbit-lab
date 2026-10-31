/** Small inline SVG icon set (stroke icons, inherit currentColor). */
const PATHS = {
  play: <path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" />,
  pause: (<><rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /><rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /></>),
  reset: (<><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4v4.5h4.5" /></>),
  close: (<><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>),
  layers: (<><path d="M12 4l8 4.5-8 4.5-8-4.5z" /><path d="M4 12.5l8 4.5 8-4.5" /><path d="M4 16.5l8 4.5 8-4.5" opacity=".55" /></>),
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" /></>),
  system: (<><circle cx="12" cy="12" r="2.2" /><ellipse cx="12" cy="12" rx="9.5" ry="4" /><ellipse cx="12" cy="12" rx="6" ry="2.4" opacity=".6" /></>),
  home: (<><path d="M4 11l8-6.5 8 6.5" /><path d="M6.5 9.5V19h11V9.5" /></>),
  compare: (<><path d="M7 4v16M17 4v16" /><path d="M3 9h8M13 15h8" /></>),
  learn: (<><path d="M3 8.5L12 4l9 4.5-9 4.5z" /><path d="M7 10.5V15c0 1.6 2.2 3 5 3s5-1.4 5-3v-4.5" /><path d="M21 8.5V14" /></>),
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.6v.2" /></>),
  chevronUp: <path d="M6 15l6-6 6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  back: (<><path d="M10 6l-6 6 6 6" /><path d="M4 12h16" /></>),
  swap: (<><path d="M7 4L4 7l3 3" /><path d="M4 7h13" /><path d="M17 20l3-3-3-3" /><path d="M20 17H7" /></>),
};

export default function Icon({ name, size = 18, className = '', title }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  );
}
