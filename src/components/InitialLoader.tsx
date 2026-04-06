import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const E_PATH = "M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z";

/**
 * Ghost-merge loader (1.75s total):
 * Phase 1 "reveal"  (0–0.85s):  E fades in, rotates 90°→-33°
 * Phase 2 "ghost"   (0.85–1.3s): E drifts to hero position as ghost
 * Phase 3 "settle"  (1.3–1.5s):  subtle scale pulse + glow flash = clear "landing"
 * Phase 4 "exit"    (1.5–1.75s): overlay fades out
 */
export function InitialLoader({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<"reveal" | "ghost" | "settle" | "exit">("reveal");
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  useEffect(() => {
    if (reducedMotion) {
      const t = setTimeout(() => { setVisible(false); onComplete(); }, 600);
      return () => clearTimeout(t);
    }

    const d = isMobile ? 0.85 : 1; // timing multiplier for mobile
    const t1 = setTimeout(() => setPhase("ghost"),  850 * d);
    const t2 = setTimeout(() => setPhase("settle"), 1300 * d);
    const t3 = setTimeout(() => setPhase("exit"),   1500 * d);
    const t4 = setTimeout(() => { setVisible(false); onComplete(); }, 1750 * d);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [reducedMotion, isMobile, onComplete]);

  if (!visible) return null;

  if (reducedMotion) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center" style={{ background: "hsl(240 20% 4%)" }}>
        <svg width={160} height={160} viewBox="0 0 100 100" fill="none">
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

  // Drift distance: center of screen → hero logo center
  const ghostDriftY = isMobile ? -60 : -100;

  // Phase-based animation values
  const getContainerAnim = () => {
    switch (phase) {
      case "reveal":
        return { y: 0, scale: 1, opacity: 1 };
      case "ghost":
        return { y: ghostDriftY, scale: 1, opacity: 0.5 };
      case "settle":
        // Brief scale pulse on landing — "clicks into place"
        return { y: ghostDriftY, scale: 1.06, opacity: 1 };
      case "exit":
        return { y: ghostDriftY, scale: 1, opacity: 0 };
    }
  };

  const getContainerTransition = () => {
    switch (phase) {
      case "reveal":
        return { duration: 0.2 };
      case "ghost":
        return { duration: 0.45, ease: [0.4, 0, 0.15, 1] };
      case "settle":
        // Snap into place with a quick spring-like ease
        return { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] };
      case "exit":
        return { duration: 0.25, ease: "easeOut" };
    }
  };

  // Glow intensifies on settle to visually "stamp" the landing
  const getGlowFilter = () => {
    if (phase === "settle") {
      return "drop-shadow(0 0 14px hsla(186,100%,50%,0.7)) drop-shadow(0 0 28px hsla(186,100%,50%,0.35)) drop-shadow(0 0 6px hsla(270,80%,75%,0.3))";
    }
    return "drop-shadow(0 0 8px hsla(186,100%,50%,0.45)) drop-shadow(0 0 16px hsla(186,100%,50%,0.18)) drop-shadow(0 0 3px hsla(270,80%,75%,0.15))";
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="initial-loader"
          className="fixed inset-0 z-[99999] flex items-center justify-center"
          style={{ background: "hsl(240 20% 4%)", willChange: "opacity" }}
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === "exit" ? 0 : 1 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.div
            className="relative flex items-center justify-center"
            style={{ willChange: "transform, opacity" }}
            animate={getContainerAnim()}
            transition={getContainerTransition()}
          >
            {/* Ambient glow */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 280, height: 280,
                background: "radial-gradient(circle, hsla(186 100% 50% / 0.08) 0%, transparent 70%)",
              }}
              animate={{ opacity: phase === "settle" ? 1.5 : 1, scale: phase === "settle" ? 1.3 : 1 }}
              transition={{ duration: 0.2 }}
            />

            {/* Main E */}
            <motion.div
              style={{ willChange: "transform, opacity, filter" }}
              initial={{ rotate: 90, scale: 0.95, opacity: 0 }}
              animate={{
                rotate: -33,
                scale: 1,
                opacity: 1,
                filter: getGlowFilter(),
              }}
              transition={{
                rotate: { duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 },
                scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.3, ease: "easeOut" },
                filter: { duration: 0.2 },
              }}
            >
              <svg width={160} height={160} viewBox="0 0 100 100" fill="none">
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
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
                <motion.path
                  d={E_PATH}
                  fill="url(#il-rim)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                />
              </svg>

              {/* Breathing glow */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: phase === "settle" ? 0.8 : [0, 0, 0.5, 0.3] }}
                transition={phase === "settle" ? { duration: 0.15 } : { duration: 1.2, ease: "easeInOut", times: [0, 0.6, 0.85, 1] }}
                style={{
                  background: "radial-gradient(circle, hsla(186 100% 50% / 0.18) 0%, transparent 60%)",
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
