import { motion } from "framer-motion";

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

const reducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function EvoLogo({ size = "md", animate = true, showText = true }: EvoLogoProps) {
  const s = sizes[size];
  const isHero = size === "hero";
  const uid = `evo-${size}`;

  // Hero plays the full loading animation (90° → -33°) so it matches the loader reveal
  const heroAnimate = isHero && animate;

  return (
    <div className={`flex flex-col items-center ${s.gap}`}>
      <motion.div
        className="relative"
        style={{ willChange: "transform, opacity" }}
        initial={
          heroAnimate
            ? { rotate: 90, opacity: 0, scale: 0.95 }
            : animate
              ? { rotate: 0, opacity: 0, scale: 0.92 }
              : { rotate: -33 }
        }
        animate={{
          rotate: -33,
          opacity: 1,
          scale: 1,
          filter: heroAnimate
            ? [
                "drop-shadow(0 0 0px hsla(186,100%,50%,0))",
                "drop-shadow(0 0 10px hsla(186,100%,50%,0.5)) drop-shadow(0 0 20px hsla(186,100%,50%,0.2)) drop-shadow(0 0 4px hsla(270,80%,75%,0.2))",
                "drop-shadow(0 0 8px hsla(186,100%,50%,0.45)) drop-shadow(0 0 16px hsla(186,100%,50%,0.18)) drop-shadow(0 0 3px hsla(270,80%,75%,0.15))",
              ]
            : undefined,
        }}
        transition={
          heroAnimate
            ? {
                rotate: { duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 },
                scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.5, ease: "easeOut" },
                filter: { duration: 1.6, ease: "easeOut", times: [0, 0.5, 1] },
              }
            : { duration: 1.2, ease: [0.22, 1, 0.36, 1] }
        }
      >
        <svg
          width={s.svg}
          height={s.svg}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
          style={
            heroAnimate
              ? undefined
              : {
                  filter:
                    "drop-shadow(0 0 8px hsla(186, 100%, 50%, 0.45)) drop-shadow(0 0 16px hsla(186, 100%, 50%, 0.18)) drop-shadow(0 0 3px hsla(270, 80%, 75%, 0.15))",
                }
          }
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

          <motion.path
            d={E_PATH}
            fill={`url(#${uid}-main)`}
            initial={heroAnimate ? { opacity: 0 } : undefined}
            animate={heroAnimate ? { opacity: 1 } : undefined}
            transition={heroAnimate ? { duration: 0.5, ease: "easeOut" } : undefined}
          />
          {(!reducedMotion || !heroAnimate) && (
            <motion.path
              d={E_PATH}
              fill={`url(#${uid}-rim)`}
              initial={heroAnimate ? { opacity: 0 } : undefined}
              animate={heroAnimate ? { opacity: 1 } : undefined}
              transition={heroAnimate ? { delay: 0.3, duration: 0.6 } : undefined}
            />
          )}
        </svg>

        {/* Breathing glow — hero idle animation (starts after entrance completes) */}
        {isHero && !reducedMotion && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 0.6, 0.35] }}
            transition={{ duration: 2.5, ease: "easeInOut", times: [0, 0.7, 0.9, 1] }}
            style={{
              background:
                "radial-gradient(circle, hsla(186 100% 50% / 0.15) 0%, hsla(186 100% 50% / 0.03) 45%, transparent 70%)",
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
          transition={{ delay: isHero ? 1.4 : 0.5, duration: 0.8 }}
          className={`${s.text} font-display font-semibold tracking-wide`}
        >
          <span className="text-gradient">Evo</span>
          <span
            className="text-gradient"
            style={{
              backgroundImage:
                "linear-gradient(135deg, hsl(210 40% 85%), hsl(270 80% 75%))",
            }}
          >
            Legal
          </span>
        </motion.div>
      )}
    </div>
  );
}
