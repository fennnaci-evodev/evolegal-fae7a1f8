import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const E_PATH = "M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z";

export function InitialLoader({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<"intro" | "settle" | "exit">("intro");
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Calculate where the navbar E logo lives (px-6 = 24px, py-2 = 8px, logo 38px)
  const getNavTarget = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Container is max-width with mx-auto; on smaller screens it's full width with px-6
    const containerMax = Math.min(vw, 1280);
    const containerLeft = (vw - containerMax) / 2;
    const logoLeft = containerLeft + 24 + 19; // px-6 + half of 38px logo
    const logoTop = 8 + 19; // py-2 + half of 38px logo
    // Translate from center of viewport
    const dx = logoLeft - vw / 2;
    const dy = logoTop - vh / 2;
    return { dx, dy };
  };

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("settle"), reducedMotion ? 600 : 1800);
    return () => clearTimeout(t1);
  }, [reducedMotion]);

  useEffect(() => {
    if (phase === "settle") {
      const t = setTimeout(() => setPhase("exit"), reducedMotion ? 200 : 600);
      return () => clearTimeout(t);
    }
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (phase === "exit") {
      const t = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 800);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  if (!visible) return null;

  const target = getNavTarget();
  const targetScale = 38 / 140; // shrink from 140px to 38px

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="initial-loader"
          className="fixed inset-0 z-[99999] flex items-center justify-center"
          style={{ background: "hsl(240 20% 4%)", willChange: "opacity" }}
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === "exit" ? 0 : 1 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="relative flex items-center justify-center" style={{ willChange: "transform, opacity" }}>
            {/* Ambient glow - fades during settle */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 280, height: 280,
                background: "radial-gradient(circle, hsla(186 100% 50% / 0.08) 0%, transparent 70%)",
              }}
              animate={{ opacity: phase === "settle" || phase === "exit" ? 0 : 1 }}
              transition={{ duration: 0.5 }}
            />

            {/* Main E */}
            <motion.div
              style={{ willChange: "transform, opacity, filter" }}
              initial={{ rotate: 90, scale: 0.95, opacity: 0 }}
              animate={
                phase === "exit"
                  ? {
                      rotate: -33,
                      scale: targetScale,
                      opacity: 1,
                      x: target.dx,
                      y: target.dy,
                      filter: "drop-shadow(0 0 8px hsla(186,100%,50%,0.45)) drop-shadow(0 0 16px hsla(186,100%,50%,0.18)) drop-shadow(0 0 3px hsla(270,80%,75%,0.15))",
                    }
                  : {
                      rotate: -33,
                      scale: 1,
                      opacity: 1,
                      x: 0,
                      y: 0,
                      filter: [
                        "drop-shadow(0 0 0px hsla(186,100%,50%,0))",
                        "drop-shadow(0 0 10px hsla(186,100%,50%,0.5)) drop-shadow(0 0 20px hsla(186,100%,50%,0.2)) drop-shadow(0 0 4px hsla(270,80%,75%,0.2))",
                        "drop-shadow(0 0 8px hsla(186,100%,50%,0.45)) drop-shadow(0 0 16px hsla(186,100%,50%,0.18)) drop-shadow(0 0 3px hsla(270,80%,75%,0.15))",
                      ],
                    }
              }
              transition={
                phase === "exit"
                  ? {
                      x: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                      y: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                      scale: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                      filter: { duration: 0.3 },
                      opacity: { duration: 0.3 },
                    }
                  : {
                      rotate: { duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 },
                      scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                      opacity: { duration: 0.5, ease: "easeOut" },
                      filter: { duration: 1.6, ease: "easeOut", times: [0, 0.5, 1] },
                    }
              }
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

              {/* Breathing glow - hidden during exit */}
              {!reducedMotion && phase !== "exit" && (
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
