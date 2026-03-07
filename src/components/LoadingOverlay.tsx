import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLoading } from "@/contexts/LoadingContext";

const MIN_DISPLAY_MS = 2000;

const E_SEGMENTS = [
  "M22 10 L78 10 L78 23 L22 23 Z",
  "M22 10 L38 10 L38 90 L22 90 Z",
  "M38 43 L70 43 L70 56 L38 56 Z",
  "M22 77 L78 77 L78 90 L22 90 Z",
];

const E_PATH = "M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z";

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
                width: 220, height: 220,
                background: "radial-gradient(circle, hsla(186 100% 50% / 0.08) 0%, transparent 70%)",
              }}
            />

            <motion.div
              style={{ willChange: "transform, opacity, filter" }}
              initial={{ rotate: 90, scale: 0.9, opacity: 0 }}
              animate={{
                rotate: -33,
                scale: 1,
                opacity: 1,
                filter: [
                  "drop-shadow(0 0 0px hsla(186,100%,50%,0))",
                  "drop-shadow(0 0 12px hsla(186,100%,50%,0.6)) drop-shadow(0 0 24px hsla(270,80%,75%,0.3))",
                  "drop-shadow(0 0 8px hsla(186,100%,50%,0.5)) drop-shadow(0 0 16px hsla(270,80%,75%,0.2))",
                ],
              }}
              transition={{
                rotate: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 },
                scale: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.3 },
                filter: { duration: 1.6, ease: "easeOut", times: [0, 0.6, 1] },
              }}
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
                    {E_SEGMENTS.map((seg, i) => (
                      <motion.path
                        key={i}
                        d={seg}
                        fill="url(#lo-grad)"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: 0.1 + i * 0.15,
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        style={{ transformOrigin: "center", willChange: "opacity, transform" }}
                      />
                    ))}
                    <motion.path
                      d={E_PATH}
                      fill="url(#lo-rim)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7, duration: 0.4 }}
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
