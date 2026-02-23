import { motion } from "framer-motion";

/**
 * Animated "E" stroke-reveal loader.
 * Lines of the E fill in sequentially with neon glow, then pulse softly.
 */
export function EvoLoader({ size = 64 }: { size?: number }) {
  // Each segment of the E drawn as a rect for stroke-reveal
  const bars = [
    { x: 22, y: 10, w: 56, h: 13, delay: 0 },     // top bar
    { x: 22, y: 10, w: 16, h: 80, delay: 0.15 },   // vertical spine
    { x: 38, y: 43, w: 32, h: 13, delay: 0.3 },    // middle bar
    { x: 22, y: 77, w: 56, h: 13, delay: 0.45 },   // bottom bar
  ];

  return (
    <div className="flex items-center justify-center">
      <motion.div
        style={{ rotate: -33 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <defs>
            <linearGradient id="loader-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(186 100% 55%)" />
              <stop offset="100%" stopColor="hsl(270 80% 75%)" />
            </linearGradient>
            <filter id="loader-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="g" />
              <feColorMatrix in="g" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0" result="d" />
              <feMerge>
                <feMergeNode in="d" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {bars.map((b, i) => (
            <motion.rect
              key={i}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx={2}
              fill="url(#loader-grad)"
              filter="url(#loader-glow)"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{
                opacity: [0, 1, 1, 0.7, 1],
                scaleX: [0, 1, 1, 1, 1],
              }}
              transition={{
                delay: b.delay,
                duration: 1.8,
                repeat: Infinity,
                repeatDelay: 0.5,
                ease: "easeOut",
                times: [0, 0.3, 0.6, 0.8, 1],
              }}
              style={{ transformOrigin: `${b.x}px ${b.y + b.h / 2}px` }}
            />
          ))}
        </svg>
      </motion.div>
    </div>
  );
}
