import { motion } from "framer-motion";

const E_PATH = "M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z";

const E_SEGMENTS = [
  "M22 10 L78 10 L78 23 L22 23 Z",
  "M22 10 L38 10 L38 90 L22 90 Z",
  "M38 43 L70 43 L70 56 L38 56 Z",
  "M22 77 L78 77 L78 90 L22 90 Z",
];

/**
 * Inline stroke-reveal + rotate loader for smaller contexts (buttons, cards).
 */
export function EvoLoader({ size = 64 }: { size?: number }) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="flex items-center justify-center" style={{ willChange: "transform" }}>
      <motion.div
        initial={{ rotate: 90, opacity: 0 }}
        animate={{ rotate: -33, opacity: 1 }}
        transition={{
          rotate: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 },
          opacity: { duration: 0.3 },
        }}
        style={{
          willChange: "transform, opacity",
          filter: "drop-shadow(0 0 6px hsla(186,100%,50%,0.4))",
        }}
      >
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <defs>
            <linearGradient id="el-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(186 100% 55%)" />
              <stop offset="100%" stopColor="hsl(270 80% 75%)" />
            </linearGradient>
          </defs>

          {reducedMotion ? (
            <path d={E_PATH} fill="url(#el-grad)" />
          ) : (
            E_SEGMENTS.map((seg, i) => (
              <motion.path
                key={i}
                d={seg}
                fill="url(#el-grad)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.12, duration: 0.3 }}
              />
            ))
          )}
        </svg>
      </motion.div>
    </div>
  );
}
