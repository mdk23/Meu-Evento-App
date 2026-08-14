/** Fixed z-index-0 backdrop shared by both themes — see .backdrop/.mist/.marble/.grain in aurelia.css. */
export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="mist">
        <span />
        <span />
        <span />
      </div>
      <div className="marble">
        <svg className="grain" width="100%" height="100%">
          <filter id="aurelia-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#aurelia-grain)" />
        </svg>
      </div>
    </div>
  );
}
