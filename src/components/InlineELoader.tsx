import "./InlineELoader.css";

const E_PATH = "M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z";

/**
 * Tiny inline "E" loader with breathing glow + subtle wobble.
 * CSS-only animation, respects prefers-reduced-motion.
 */
export function InlineELoader({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-e-loader" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" fill="none" width={size} height={size}>
        <defs>
          <linearGradient id="iel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(186 100% 55%)" />
            <stop offset="100%" stopColor="hsl(270 80% 75%)" />
          </linearGradient>
        </defs>
        <path d={E_PATH} fill="url(#iel-grad)" />
      </svg>
    </span>
  );
}
