import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLoading } from "@/contexts/LoadingContext";
import { SphereLoader } from "@/components/SphereLoader";

const MIN_DISPLAY_MS = 2000;

export function LoadingOverlay() {
  const { isLoading } = useLoading();
  const [visible, setVisible] = useState(false);
  const showTime = useRef(0);

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
                width: 260, height: 260,
                background: "radial-gradient(circle, hsla(200 90% 55% / 0.10) 0%, transparent 70%)",
              }}
            />
            <motion.div
              style={{ willChange: "transform, opacity" }}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                scale: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.3 },
              }}
            >
              <SphereLoader size={140} />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
