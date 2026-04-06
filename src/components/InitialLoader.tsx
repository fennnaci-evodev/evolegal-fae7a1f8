import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const E_PATH = "M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z";

/**
 * Ghost-merge loader:
 * Phase 1 (0–1.2s): E appears at centre, rotates 90°→-33°, stroke reveal
 * Phase 2 (1.2–2.0s): E shrinks & drifts upward toward hero position as a ghost (semi-transparent)
 * Phase 3 (2.0–2.4s): overlay fades out, page reveals
 */
export function InitialLoader({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<"reveal" | "ghost" | "exit">("reveal");
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  useEffect(() => {
    if (reducedMotion) {
      const t = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 800);
      return () => clearTimeout(t);
    }

    // Phase 1 → Phase 2 (ghost drift)
    const t1 = setTimeout(() => setPhase("ghost"), isMobile ? 1000 : 1200);
    // Phase 2 → Phase 3 (exit)
    const t2 = setTimeout(() => setPhase("exit"), isMobile ? 1700 : 2000);
    // Done
    const t3 = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, isMobile ? 2200 : 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [reducedMotion, isMobile, onComplete]);

  if (!visible) return null;

  // Reduced motion: simple fade
  if (reducedMotion) {
    return (
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center"
        style={{ background: "hsl(240 20% 4%)" }}
      >
        <svg width={140} height={140} viewBox="0 0 100 100" fill="none">
          <defs>
            <linearGradient id="il-grad-rm" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(186 100% 58%)" />
              <stop offset="100%" stopColor="hsl(195 100% 55%)" />
            </linearGradient>
          </defs>
          <g transform="rotate(-33 50 50)">
            <path d={E_PATH} fill="url(#il-grad-rm)" />
          </g>
        </svg>
      </div>
    );
  }

  const ghostDriftY = isMobile ? -80 : -140; // px upward toward hero area
  const ghostScale = isMobile ? 0.35 : 0.28; // shrink toward header logo size

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="initial-loader"
          className="fixed inset-0 z-[99999] flex items-center justify-center"
          style={{ background: "hsl(240 20% 4%)", willChange: "opacity" }}
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === "exit" ? 0 : 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.div
            className="relative flex items-center justify-center"
            style={{ willChange: "transform, opacity" }}
            animate={
              phase === "reveal"
                ? { y: 0, scale: 1, opacity: 1 }
                : phase === "ghost"
                ? {
                    y: ghostDriftY,
                    scale: ghostScale,
                    opacity: 0.45,
                  }
                : {
                    y: ghostDriftY,
                    scale: ghostScale,
                    opacity: 0,
                  }
            }
            transition={
              phase === "ghost"
                ? {
                    duration: isMobile ? 0.7 : 0.8,
                    ease: [0.4, 0, 0.2, 1],
                  }
                : phase === "exit"
                ? { duration: 0.4, ease: "easeOut" }
                : { duration: 0.3 }
            }
          >
            {/* Ambient glow */}
            <div
              className="absolute rounded-full"
              style={{
                width: 280,
                height: 280,
                background:
                  "radial-gradient(circle, hsla(186 100% 50% / 0.08) 0%, transparent 70%)",
              }}
            />

            {/* Main E */}
            <motion.div
              style={{ willChange: "transform, opacity, filter" }}
              initial={{ rotate: 90, scale: 0.95, opacity: 0 }}
              animate={{
                rotate: -33,
                scale: 1,
                opacity: 1,
                filter: [
                  "drop-shadow(0 0 0px hsla(186,100%,50%,0))",
                  "drop-shadow(0 0 8px hsla(186,100%,50%,0.45)) drop-shadow(0 0 16px hsla(186,100%,50%,0.18)) drop-shadow(0 0 3px hsla(270,80%,75%,0.15))",
                  "drop-shadow(0 0 8px hsla(186,100%,50%,0.45)) drop-shadow(0 0 16px hsla(186,100%,50%,0.18)) drop-shadow(0 0 3px hsla(270,80%,75%,0.15))",
                ],
              }}
              transition={{
                rotate: {
                  duration: 1.0,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.15,
                },
                scale: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.4, ease: "easeOut" },
                filter: {
                  duration: 1.2,
                  ease: "easeOut",
                  times: [0, 0.5, 1],
                },
              }}
            >
              <svg
                width={160}
                height={160}
                viewBox="0 0 100 100"
                fill="none"
              >
                <defs>
                  <linearGradient
                    id="il-grad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="hsl(186 100% 58%)" />
                    <stop offset="100%" stopColor="hsl(195 100% 55%)" />
                  </linearGradient>
                  <linearGradient
                    id="il-rim"
                    x1="100%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      stopColor="hsla(270 80% 75% / 0.3)"
                    />
                    <stop
                      offset="100%"
                      stopColor="hsla(270 80% 75% / 0)"
                    />
                  </linearGradient>
                </defs>

                <motion.path
                  d={E_PATH}
                  fill="url(#il-grad)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
                <motion.path
                  d={E_PATH}
                  fill="url(#il-rim)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                />
              </svg>

              {/* Breathing glow */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 0.6, 0.35] }}
                transition={{
                  duration: 1.8,
                  ease: "easeInOut",
                  times: [0, 0.7, 0.85, 1],
                }}
                style={{
                  background:
                    "radial-gradient(circle, hsla(186 100% 50% / 0.18) 0%, transparent 60%)",
                  transform: "scale(3)",
                  willChange: "opacity",
                }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
