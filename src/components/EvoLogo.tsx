import { motion } from "framer-motion";

interface EvoLogoProps {
  size?: "sm" | "md" | "lg" | "hero";
  animate?: boolean;
  showText?: boolean;
}

const sizes = {
  sm: { svg: 32, text: "text-sm", gap: "gap-1", glow: 8 },
  md: { svg: 52, text: "text-lg", gap: "gap-2", glow: 16 },
  lg: { svg: 80, text: "text-2xl", gap: "gap-3", glow: 24 },
  hero: { svg: 160, text: "text-3xl md:text-4xl", gap: "gap-4", glow: 40 },
};

export function EvoLogo({ size = "md", animate = true, showText = true }: EvoLogoProps) {
  const s = sizes[size];
  const isHero = size === "hero";

  return (
    <div className={`flex flex-col items-center ${s.gap}`}>
      {/* SVG E with 33° slant */}
      <motion.div
        className="relative"
        initial={animate ? { rotate: 0, opacity: 0, scale: 0.9 } : false}
        animate={animate ? { rotate: -33, opacity: 1, scale: 1 } : false}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ rotate: animate ? undefined : -33 }}
      >
        <svg
          width={s.svg}
          height={s.svg}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          <defs>
            <linearGradient id={`eGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(186 100% 55%)" />
              <stop offset="60%" stopColor="hsl(186 100% 50%)" />
              <stop offset="100%" stopColor="hsl(200 100% 60%)" />
            </linearGradient>
            <linearGradient id={`eRim-${size}`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsla(270, 80%, 75%, 0.4)" />
              <stop offset="100%" stopColor="hsla(270, 80%, 75%, 0)" />
            </linearGradient>
            <filter id={`eGlow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={s.glow} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Main E shape — bold geometric */}
          <path
            d="M20 12 L80 12 L80 24 L36 24 L36 43 L72 43 L72 55 L36 55 L36 76 L80 76 L80 88 L20 88 Z"
            fill={`url(#eGrad-${size})`}
            filter={`url(#eGlow-${size})`}
          />
          {/* Purple rim light overlay */}
          <path
            d="M20 12 L80 12 L80 24 L36 24 L36 43 L72 43 L72 55 L36 55 L36 76 L80 76 L80 88 L20 88 Z"
            fill={`url(#eRim-${size})`}
          />
          {/* Edge highlight — sharp right side */}
          <path
            d="M78 12 L80 12 L80 88 L78 88 L78 76 L80 76 L80 55 L72 55 L72 43 L80 43 L80 24 L78 24 Z"
            fill="hsla(186, 100%, 70%, 0.3)"
          />
        </svg>

        {/* Radiating glow behind */}
        {isHero && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1.2 }}
            style={{
              background: "radial-gradient(circle, hsla(186, 100%, 50%, 0.2) 0%, hsla(186, 100%, 50%, 0.05) 40%, transparent 70%)",
              transform: "scale(3)",
            }}
          />
        )}
      </motion.div>

      {/* Text */}
      {showText && (
        <motion.div
          initial={animate ? { opacity: 0, y: 10 } : false}
          animate={animate ? { opacity: 1, y: 0 } : false}
          transition={{ delay: 0.6, duration: 0.8 }}
          className={`${s.text} font-display font-semibold tracking-wide`}
        >
          <span className="text-gradient">Evo</span>
          <span className="text-gradient" style={{ backgroundImage: "linear-gradient(135deg, hsl(210 40% 85%), hsl(270 80% 75%))" }}>Legal</span>
        </motion.div>
      )}

      {/* Radial glow behind hero */}
      {isHero && (
        <div
          className="absolute pointer-events-none"
          style={{
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, hsla(186, 100%, 50%, 0.06) 0%, transparent 60%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </div>
  );
}
