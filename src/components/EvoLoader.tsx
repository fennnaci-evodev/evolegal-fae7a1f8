import { motion } from "framer-motion";

/**
 * Animated "E" stroke-reveal loader.
 * Lines fill in sequentially then settle — NO looping / flickering.
 */
export function EvoLoader({ size = 64 }: { size?: number }) {
  const bars = [
    { x: 22, y: 10, w: 56, h: 13, delay: 0 },
    { x: 22, y: 10, w: 16, h: 80, delay: 0.15 },
    { x: 38, y: 43, w: 32, h: 13, delay: 0.3 },
    { x: 22, y: 77, w: 56, h: 13, delay: 0.45 },
  ];

  return (
    <div className="flex items-center justify-center will-animate">
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
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="g" />
              <feColorMatrix in="g" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.4 0" result="d" />
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
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{
                delay: b.delay,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ transformOrigin: `${b.x}px ${b.y + b.h / 2}px` }}
            />
          ))}
        </svg>
      </motion.div>
    </div>
  );
}
