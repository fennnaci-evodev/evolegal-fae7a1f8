import { motion } from "framer-motion";

export function ScalesOfJustice({ animating = false }: { animating?: boolean }) {
  return (
    <div className="relative w-32 h-32 mx-auto will-animate">
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* Base pillar */}
        <motion.line
          x1="60" y1="25" x2="60" y2="100"
          stroke="hsl(186 100% 50%)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: animating ? [0.5, 1, 0.5] : 1 }}
          transition={{ duration: 2, repeat: animating ? Infinity : 0 }}
        />
        {/* Base */}
        <motion.path
          d="M40 100 L80 100"
          stroke="hsl(186 100% 50%)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Top beam */}
        <motion.line
          x1="20" y1="30" x2="100" y2="30"
          stroke="hsl(270 80% 75%)"
          strokeWidth="2"
          strokeLinecap="round"
          animate={animating ? {
            rotate: [-3, 3, -3],
          } : { rotate: 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "60px 30px" }}
        />
        {/* Top circle */}
        <motion.circle
          cx="60" cy="25" r="5"
          fill="hsl(186 100% 50%)"
          animate={animating ? { 
            filter: ["drop-shadow(0 0 4px hsl(186 100% 50%))", "drop-shadow(0 0 12px hsl(186 100% 50%))", "drop-shadow(0 0 4px hsl(186 100% 50%))"]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Left pan */}
        <motion.g
          animate={animating ? { y: [-3, 3, -3] } : { y: 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <line x1="20" y1="30" x2="20" y2="55" stroke="hsl(186 100% 50% / 0.6)" strokeWidth="1" />
          <path d="M8 55 Q20 65 32 55" stroke="hsl(186 100% 50%)" strokeWidth="1.5" fill="hsl(186 100% 50% / 0.1)" />
        </motion.g>
        {/* Right pan */}
        <motion.g
          animate={animating ? { y: [3, -3, 3] } : { y: 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <line x1="100" y1="30" x2="100" y2="55" stroke="hsl(270 80% 75% / 0.6)" strokeWidth="1" />
          <path d="M88 55 Q100 65 112 55" stroke="hsl(270 80% 75%)" strokeWidth="1.5" fill="hsl(270 80% 75% / 0.1)" />
        </motion.g>
      </svg>
      {/* Glow effect */}
      {animating && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            background: "radial-gradient(circle, hsl(186 100% 50% / 0.15) 0%, transparent 70%)",
          }}
        />
      )}
    </div>
  );
}
