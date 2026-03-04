import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const E_PATH = "M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z";
const L_PATH = "M22 10 L38 10 L38 10 L38 10 L38 10 L38 10 L38 10 L38 10 L38 77 L78 77 L78 90 L22 90 Z";

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
      <motion.div
        key="initial-loader"
        className="fixed inset-0 z-[99999] flex items-center justify-center"
        style={{ background: "hsl(240 20% 4%)", willChange: "opacity" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="relative flex items-center justify-center" style={{ willChange: "transform, opacity" }}>
          <div
            className="absolute rounded-full"
            style={{
              width: 280, height: 280,
              background: "radial-gradient(circle, hsla(186 100% 50% / 0.12) 0%, transparent 70%)",
            }}
          />
          <motion.div
            style={{ rotate: -33, willChange: "transform, opacity" }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
              {reducedMotion ? (
                <path d={E_PATH} fill="url(#il-grad)" />
              ) : (
                <>
                  <motion.path
                    fill="url(#il-grad)"
                    initial={{ d: E_PATH, opacity: 0 }}
                    animate={{ d: [E_PATH, L_PATH, E_PATH], opacity: 1 }}
                    transition={{
                      d: { duration: 1.8, ease: "easeInOut", times: [0, 0.45, 1] },
                      opacity: { duration: 0.4 },
                    }}
                  />
                  <motion.path
                    fill="url(#il-rim)"
                    initial={{ d: E_PATH, opacity: 0 }}
                    animate={{ d: [E_PATH, L_PATH, E_PATH], opacity: 1 }}
                    transition={{
                      d: { duration: 1.8, ease: "easeInOut", times: [0, 0.45, 1] },
                      opacity: { delay: 0.3, duration: 0.6 },
                    }}
                  />
                </>
              )}
            </svg>
            {!reducedMotion && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0.25] }}
                transition={{ duration: 2, ease: "easeInOut" }}
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
    </AnimatePresence>
  );
}
