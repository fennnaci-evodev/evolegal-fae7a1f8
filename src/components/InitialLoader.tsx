import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Shown once on app first load. Plays video + animated E, then fades out.
 */
export function InitialLoader({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"loading" | "exiting" | "done">("loading");
  const [videoReady, setVideoReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    // Min display 2.2s then exit
    const timer = setTimeout(() => setPhase("exiting"), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase === "exiting") {
      const timer = setTimeout(() => {
        setPhase("done");
        onComplete();
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  const bars = [
    { d: "M22 10 L78 10 L78 23 L22 23 Z", delay: 0 },
    { d: "M22 10 L38 10 L38 90 L22 90 Z", delay: 0.15 },
    { d: "M38 43 L70 43 L70 56 L38 56 Z", delay: 0.3 },
    { d: "M22 77 L78 77 L78 90 L22 90 Z", delay: 0.45 },
  ];

  if (phase === "done") return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[99999] flex items-center justify-center"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "exiting" ? 0 : 1 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        style={{ background: "hsl(240 20% 4%)" }}
      >
        {!reducedMotion && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: videoReady ? 0.5 : 0, transition: "opacity 1s ease" }}
            src="/loading-video.mp4"
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            onCanPlayThrough={() => setVideoReady(true)}
          />
        )}

        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, hsla(240,20%,4%,0.25) 0%, hsla(240,20%,4%,0.7) 65%, hsl(240 20% 4%) 100%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <motion.div
            className="will-animate"
            style={{ rotate: -33 }}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <svg width={140} height={140} viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="il-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(186 100% 58%)" />
                  <stop offset="50%" stopColor="hsl(186 100% 50%)" />
                  <stop offset="100%" stopColor="hsl(195 100% 55%)" />
                </linearGradient>
                <linearGradient id="il-rim" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsla(270 80% 75% / 0.4)" />
                  <stop offset="100%" stopColor="hsla(270 80% 75% / 0)" />
                </linearGradient>
                <filter id="il-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="soft" />
                  <feColorMatrix in="soft" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.65 0" result="d" />
                  <feMerge>
                    <feMergeNode in="d" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {bars.map((bar, i) => (
                <motion.path
                  key={i}
                  d={bar.d}
                  fill="url(#il-grad)"
                  filter="url(#il-glow)"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{
                    delay: bar.delay,
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{ transformOrigin: "22px 50px" }}
                />
              ))}

              <motion.path
                d="M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z"
                fill="url(#il-rim)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              />
            </svg>

            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background: "radial-gradient(circle, hsla(186 100% 50% / 0.2) 0%, transparent 60%)",
                transform: "scale(3)",
              }}
            />
          </motion.div>

          <motion.p
            className="text-sm font-sans tracking-wider text-muted-foreground/70"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            Preparing your insights...
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
