import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLoading } from "@/contexts/LoadingContext";

const MIN_DISPLAY_MS = 2000;

const E_PATH = "M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z";
const L_PATH = "M22 10 L38 10 L38 10 L38 10 L38 10 L38 10 L38 10 L38 10 L38 77 L78 77 L78 90 L22 90 Z";

export function LoadingOverlay() {
  const { isLoading } = useLoading();
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const showTime = useRef(0);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (isLoading) {
      showTime.current = Date.now();
      setVisible(true);
    } else if (visible) {
      const elapsed = Date.now() - showTime.current;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      const timer = setTimeout(() => setVisible(false), remaining);
      return () => clearTimeout(timer);
    }
  }, [isLoading, visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading-overlay"
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "hsl(240 20% 4%)", willChange: "opacity" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="relative flex items-center justify-center" style={{ willChange: "transform, opacity" }}>
            <div
              className="absolute rounded-full"
              style={{
                width: 220,
                height: 220,
                background: "radial-gradient(circle, hsla(186 100% 50% / 0.1) 0%, transparent 70%)",
              }}
            />

            <motion.div
              style={{ rotate: -33, willChange: "transform, opacity" }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <svg width={100} height={100} viewBox="0 0 100 100" fill="none">
                <defs>
                  <linearGradient id="lo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(186 100% 58%)" />
                    <stop offset="100%" stopColor="hsl(195 100% 55%)" />
                  </linearGradient>
                  <linearGradient id="lo-rim" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsla(270 80% 75% / 0.3)" />
                    <stop offset="100%" stopColor="hsla(270 80% 75% / 0)" />
                  </linearGradient>
                </defs>

                {reducedMotion ? (
                  <path d={E_PATH} fill="url(#lo-grad)" />
                ) : (
                  <>
                    <motion.path
                      fill="url(#lo-grad)"
                      initial={{ d: E_PATH }}
                      animate={{ d: [E_PATH, L_PATH, E_PATH] }}
                      transition={{ duration: 1.6, ease: [0.37, 0, 0.63, 1], times: [0, 0.5, 1], repeat: Infinity, repeatDelay: 0.4 }}
                    />
                    <motion.path
                      fill="url(#lo-rim)"
                      initial={{ d: E_PATH }}
                      animate={{ d: [E_PATH, L_PATH, E_PATH] }}
                      transition={{ duration: 1.6, ease: [0.37, 0, 0.63, 1], times: [0, 0.5, 1], repeat: Infinity, repeatDelay: 0.4 }}
                    />
                  </>
                )}
              </svg>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
