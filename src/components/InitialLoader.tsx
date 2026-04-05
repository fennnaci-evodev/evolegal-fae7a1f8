import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const E_PATH = "M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z";

// Individual segments of the E for stroke-by-stroke reveal
const E_SEGMENTS = [
  "M22 10 L78 10 L78 23 L22 23 Z",       // top bar
  "M22 10 L38 10 L38 90 L22 90 Z",        // vertical spine
  "M38 43 L70 43 L70 56 L38 56 Z",        // middle bar
  "M22 77 L78 77 L78 90 L22 90 Z",        // bottom bar
];

export function InitialLoader({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), reducedMotion ? 800 : 2200);
    return () => clearTimeout(t1);
  }, [reducedMotion]);

  useEffect(() => {
    if (exiting) {
      const t = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 600);
      return () => clearTimeout(t);
    }
  }, [exiting, onComplete]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="initial-loader"
          className="fixed inset-0 z-[99999] flex items-center justify-center"
          style={{ background: "hsl(240 20% 4%)", willChange: "opacity" }}
          initial={{ opacity: 1 }}
          animate={{ opacity: exiting ? 0 : 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="relative flex items-center justify-center" style={{ willChange: "transform, opacity" }}>
            {/* Ambient glow */}
            <div
              className="absolute rounded-full"
              style={{
                width: 280, height: 280,
                background: "radial-gradient(circle, hsla(186 100% 50% / 0.08) 0%, transparent 70%)",
              }}
            />

            {/* Main E: rotates from 90° (upright) → -33° (slanted left) */}
            <motion.div
              style={{ willChange: "transform, opacity, filter" }}
              initial={{ rotate: 90, scale: 0.95, opacity: 0 }}
              animate={{
                rotate: -33,
                scale: 1,
                opacity: 1,
                filter: [
                  "drop-shadow(0 0 0px hsla(186,100%,50%,0))",
                  "drop-shadow(0 0 10px hsla(186,100%,50%,0.5)) drop-shadow(0 0 20px hsla(270,80%,75%,0.25))",
                  "drop-shadow(0 0 8px hsla(186,100%,50%,0.4)) drop-shadow(0 0 14px hsla(270,80%,75%,0.15))",
                ],
              }}
              transition={{
                rotate: { duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 },
                scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.5, ease: "easeOut" },
                filter: { duration: 1.6, ease: "easeOut", times: [0, 0.5, 1] },
              }}
            >
              <svg width={140} height={140} viewBox="0 0 100 100" fill="none">
                <defs>
                  <linearGradient id="il-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(186 100% 58%)" />
                    <stop offset="100%" stopColor="hsl(195 100% 55%)" />
                  </linearGradient>
                  <linearGradient id="il-rim" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsla(270 80% 75% / 0.3)" />
                    <stop offset="100%" stopColor="hsla(270 80% 75% / 0)" />
                  </linearGradient>
                </defs>

                {/* Solid E letter */}
                <motion.path
                  d={E_PATH}
                  fill="url(#il-grad)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
                {!reducedMotion && (
                  <motion.path
                    d={E_PATH}
                    fill="url(#il-rim)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                  />
                )}
              </svg>

              {/* Breathing glow after settle */}
              {!reducedMotion && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 0.6, 0.35] }}
                  transition={{ duration: 2.2, ease: "easeInOut", times: [0, 0.75, 0.9, 1] }}
                  style={{
                    background: "radial-gradient(circle, hsla(186 100% 50% / 0.18) 0%, transparent 60%)",
                    transform: "scale(3)",
                    willChange: "opacity",
                  }}
                />
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
