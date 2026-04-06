import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * InitialLoader – a simple dark overlay that fades out after a delay,
 * revealing the hero "E" already animating underneath on the Index page.
 */
export function InitialLoader({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    // Hold dark screen, then fade out — timed so the hero E has mostly settled
    const delay = reducedMotion ? 600 : 1800;
    const t = setTimeout(() => setVisible(false), delay);
    return () => clearTimeout(t);
  }, [reducedMotion]);

  useEffect(() => {
    if (!visible) {
      // Small delay for the fade-out animation to finish
      const t = setTimeout(onComplete, 600);
      return () => clearTimeout(t);
    }
  }, [visible, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="initial-overlay"
          className="fixed inset-0 z-[99999]"
          style={{ background: "hsl(240 20% 4%)" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
      )}
    </AnimatePresence>
  );
}
