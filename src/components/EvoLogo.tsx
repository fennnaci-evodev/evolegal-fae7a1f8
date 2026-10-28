import "./EvoLogo.css";

interface EvoLogoProps {
  size?: "sm" | "md" | "lg" | "hero";
  animate?: boolean;
  showText?: boolean;
}

const sizes = {
  sm: { svg: 38, text: "text-sm", gap: "gap-1.5" },
  md: { svg: 52, text: "text-lg", gap: "gap-2" },
  lg: { svg: 80, text: "text-2xl", gap: "gap-3" },
  hero: { svg: 160, text: "text-3xl md:text-4xl", gap: "gap-4" },
};

const E_PATH = "M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z";

/**
 * Pure CSS, GPU-accelerated logo. Rotation on load 0deg -> -33deg.
 * No JS animation loops, no Framer Motion, no dynamic SVG filters.
 */
export function EvoLogo({ size = "md", animate = true, showText = true }: EvoLogoProps) {
  const s = sizes[size];
  const uid = `evo-${size}`;

  return (
    <div className={`flex flex-col items-center ${s.gap}`}>
      <div
        className={`evo-logo-icon ${animate ? "evo-logo-animate" : "evo-logo-static"}`}
        style={{ width: s.svg, height: s.svg }}
      >
        <svg
          width={s.svg}
          height={s.svg}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`${uid}-main`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(188 100% 66%)" />
              <stop offset="55%" stopColor="hsl(186 95% 50%)" />
              <stop offset="100%" stopColor="hsl(194 100% 40%)" />
            </linearGradient>
            <linearGradient id={`${uid}-rim`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(270 85% 72%)" stopOpacity="0.45" />
              <stop offset="45%" stopColor="hsl(270 85% 72%)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={E_PATH} fill={`url(#${uid}-main)`} shapeRendering="geometricPrecision" />
          <path d={E_PATH} fill={`url(#${uid}-rim)`} shapeRendering="geometricPrecision" />
        </svg>
      </div>

      {showText && (
        <div className={`${s.text} font-display font-semibold tracking-wide ${animate ? "evo-logo-text-in" : ""}`}>
          <span className="text-gradient">Evo</span>
          <span
            className="text-gradient"
            style={{ backgroundImage: "linear-gradient(135deg, hsl(210 40% 85%), hsl(270 80% 75%))" }}
          >
            Legal
          </span>
        </div>
      )}
    </div>
  );
}
