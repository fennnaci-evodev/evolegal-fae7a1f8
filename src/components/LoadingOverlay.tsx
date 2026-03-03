import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLoading } from "@/contexts/LoadingContext";

const MIN_DISPLAY_MS = 2000;

export function LoadingOverlay() {
  const { isLoading, loadingText } = useLoading();
  const [visible, setVisible] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const showTime = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (isLoading) {
      showTime.current = Date.now();
      setVisible(true);
      // Try playing video
      videoRef.current?.play().catch(() => {});
    } else if (visible) {
      const elapsed = Date.now() - showTime.current;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      const timer = setTimeout(() => setVisible(false), remaining);
      return () => clearTimeout(timer);
    }
  }, [isLoading, visible]);

  // E shape bars for stroke-by-stroke reveal
  const bars = [
    { d: "M22 10 L78 10 L78 23 L22 23 Z", delay: 0 },       // top
    { d: "M22 10 L38 10 L38 90 L22 90 Z", delay: 0.15 },     // spine
    { d: "M38 43 L70 43 L70 56 L38 56 Z", delay: 0.3 },      // middle
    { d: "M22 77 L78 77 L78 90 L22 90 Z", delay: 0.45 },     // bottom
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          style={{ background: "hsl(240 20% 4%)" }}
        >
          {/* Video background */}
          {!reducedMotion && (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: videoReady ? 0.55 : 0 , transition: "opacity 0.8s ease" }}
              src="/loading-video.mp4"
              muted
              loop
              playsInline
              autoPlay
              preload="auto"
              onCanPlayThrough={() => setVideoReady(true)}
            />
          )}

          {/* Overlay gradient for depth */}
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at center, hsla(240,20%,4%,0.3) 0%, hsla(240,20%,4%,0.75) 70%, hsl(240 20% 4%) 100%)",
            }}
          />

          {/* Animated E logo */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            <motion.div
              className="will-animate"
              style={{ rotate: -33 }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <svg
                width={120}
                height={120}
                viewBox="0 0 100 100"
                fill="none"
                className="drop-shadow-2xl"
              >
                <defs>
                  <linearGradient id="lo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(186 100% 58%)" />
                    <stop offset="50%" stopColor="hsl(186 100% 50%)" />
                    <stop offset="100%" stopColor="hsl(195 100% 55%)" />
                  </linearGradient>
                  <linearGradient id="lo-rim" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsla(270 80% 75% / 0.4)" />
                    <stop offset="100%" stopColor="hsla(270 80% 75% / 0)" />
                  </linearGradient>
                  <filter id="lo-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="soft" />
                    <feColorMatrix in="soft" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.7 0" result="dimmed" />
                    <feMerge>
                      <feMergeNode in="dimmed" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {bars.map((bar, i) => (
                  <motion.path
                    key={i}
                    d={bar.d}
                    fill="url(#lo-grad)"
                    filter="url(#lo-glow)"
                    initial={{ opacity: 0, pathLength: 0 }}
                    animate={{ opacity: 1, pathLength: 1 }}
                    transition={{
                      delay: bar.delay,
                      duration: 0.55,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                ))}

                {/* Purple rim overlay */}
                <motion.path
                  d="M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z"
                  fill="url(#lo-rim)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                />
              </svg>

              {/* Breathing glow */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  background: "radial-gradient(circle, hsla(186 100% 50% / 0.25) 0%, transparent 60%)",
                  transform: "scale(2.5)",
                }}
              />
            </motion.div>

            {/* Loading text */}
            {loadingText && (
              <motion.p
                className="text-sm font-sans tracking-wider text-muted-foreground/80"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                {loadingText}
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
