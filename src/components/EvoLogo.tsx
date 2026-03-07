import { motion } from "framer-motion";

interface EvoLogoProps {
  size?: "sm" | "md" | "lg" | "hero";
  animate?: boolean;
  showText?: boolean;
}

const sizes = {
  sm: { svg: 32, text: "text-sm", gap: "gap-1" },
  md: { svg: 52, text: "text-lg", gap: "gap-2" },
  lg: { svg: 80, text: "text-2xl", gap: "gap-3" },
  hero: { svg: 160, text: "text-3xl md:text-4xl", gap: "gap-4" },
};

const E_PATH = "M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z";

export function EvoLogo({ size = "md", animate = true, showText = true }: EvoLogoProps) {
  const s = sizes[size];
  const isHero = size === "hero";
  const uid = `evo-${size}`;

  return (
    <div className={`flex flex-col items-center ${s.gap}`}>
      <motion.div
        className="relative"
        style={{ willChange: "transform, opacity" }}
        initial={animate ? { rotate: 0, opacity: 0, scale: 0.92 } : { rotate: -33 }}
        animate={{ rotate: -33, opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <svg
          width={s.svg}
          height={s.svg}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
          style={{
            filter: "drop-shadow(0 0 6px hsla(186, 100%, 50%, 0.4)) drop-shadow(0 0 14px hsla(186, 100%, 50%, 0.15))",
          }}
        >
          <defs>
            <linearGradient id={`${uid}-main`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(186 100% 58%)" />
              <stop offset="50%" stopColor="hsl(186 100% 50%)" />
              <stop offset="100%" stopColor="hsl(195 100% 55%)" />
            </linearGradient>
            <linearGradient id={`${uid}-rim`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsla(270 80% 75% / 0.35)" />
              <stop offset="100%" stopColor="hsla(270 80% 75% / 0)" />
            </linearGradient>
          </defs>

          <path d={E_PATH} fill={`url(#${uid}-main)`} />
          <path d={E_PATH} fill={`url(#${uid}-rim)`} />
        </svg>

        {/* Breathing glow — hero idle animation */}
        {isHero && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ delay: 1.2, duration: 3, ease: "easeInOut", repeat: Infinity }}
            style={{
              background: "radial-gradient(circle, hsla(186 100% 50% / 0.15) 0%, hsla(186 100% 50% / 0.03) 45%, transparent 70%)",
              transform: "scale(3.5)",
              willChange: "opacity",
            }}
          />
        )}
      </motion.div>

      {showText && (
        <motion.div
          initial={animate ? { opacity: 0, y: 8 } : false}
          animate={animate ? { opacity: 1, y: 0 } : false}
          transition={{ delay: 0.5, duration: 0.8 }}
          className={`${s.text} font-display font-semibold tracking-wide`}
        >
          <span className="text-gradient">Evo</span>
          <span className="text-gradient" style={{ backgroundImage: "linear-gradient(135deg, hsl(210 40% 85%), hsl(270 80% 75%))" }}>Legal</span>
        </motion.div>
      )}
    </div>
  );
}
