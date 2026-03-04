import { motion } from "framer-motion";

const E_PATH = "M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z";
const L_PATH = "M22 10 L38 10 L38 10 L38 10 L38 10 L38 10 L38 10 L38 10 L38 77 L78 77 L78 90 L22 90 Z";

/**
 * Inline E→L→E morph loader for smaller contexts (buttons, cards).
 */
export function EvoLoader({ size = 64 }: { size?: number }) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="flex items-center justify-center" style={{ willChange: "transform" }}>
      <motion.div
        style={{ rotate: -33 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
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
            <motion.path
              fill="url(#el-grad)"
              initial={{ d: E_PATH }}
              animate={{ d: [E_PATH, L_PATH, E_PATH] }}
              transition={{ duration: 1.4, ease: "easeInOut", times: [0, 0.45, 1], repeat: Infinity, repeatDelay: 0.3 }}
            />
          )}
        </svg>
      </motion.div>
    </div>
  );
}
