// SVG icons from prototypes/v10.html.

export const Pin = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14.5s4.8-4.4 4.8-8.1a4.8 4.8 0 0 0-9.6 0c0 3.7 4.8 8.1 4.8 8.1Z" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="6.4" r="1.7" fill="currentColor" /></svg>
);

export const Close = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);

export const Locate = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="4.3" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="8" r="1.4" fill="currentColor" /><path d="M8 1v2.2M8 12.8V15M1 8h2.2M12.8 8H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
);

export const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.6V8l2.3 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const Chevron = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

// One drawing that morphs between moon and sun, driven by [data-theme] in
// TopBar.module.css. The moon is a circle with a second circle (the cut) sliding
// in to carve the crescent. Non-scaling strokes keep the line weight steady as the body scales.
export const ThemeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
    <defs>
      <mask id="ti-mask" maskUnits="userSpaceOnUse" x="-8" y="-8" width="32" height="32">
        <rect x="-8" y="-8" width="32" height="32" fill="#fff" />
        <circle className="ti-cut" cx="12" cy="3.8" r="4.4" fill="#000" />
      </mask>
      <clipPath id="ti-clip"><circle cx="8" cy="8" r="5.6" /></clipPath>
    </defs>
    <g className="ti-core" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="8" cy="8" r="5.6" mask="url(#ti-mask)" vectorEffect="non-scaling-stroke" />
      <g clipPath="url(#ti-clip)"><circle className="ti-cut" cx="12" cy="3.8" r="4.4" vectorEffect="non-scaling-stroke" /></g>
    </g>
    <path className="ti-rays" d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.1 1.1M11.9 11.9 13 13M3 13l1.1-1.1M11.9 4.1 13 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const Car = () => (
  <svg className="car" width="14" height="14" viewBox="0 0 16 16" role="img" aria-label="drive"><path d="M3 10.5V8.2l1.3-3.4A1.5 1.5 0 0 1 5.7 3.8h4.6a1.5 1.5 0 0 1 1.4 1l1.3 3.4v2.3M3 10.5h10M3 10.5V12.5M13 10.5V12.5M2.5 7.5h11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /><circle cx="5.2" cy="9" r=".8" fill="currentColor" /><circle cx="10.8" cy="9" r=".8" fill="currentColor" /></svg>
);

export const External = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" style={{ display: "inline", verticalAlign: "-1px", marginLeft: 4, opacity: 0.6 }}><path d="M6 3h7v7M13 3 4 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const Play = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7.5-4.5z" fill="currentColor" /></svg>
);

export const XLogo = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
);
