import { motion } from "framer-motion";

interface HugoAvatarProps {
  size?: number;
  animate?: boolean;
}

/**
 * Hugo — Expert Manager avatar.
 * Minimalist professional silhouette in a glassmorphic circle with neon cyan outline.
 */
export function HugoAvatar({ size = 40, animate = true }: HugoAvatarProps) {
  return (
    <motion.div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      initial={animate ? { scale: 0.9, opacity: 0 } : false}
      animate={animate ? { scale: 1, opacity: 1 } : false}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Glow ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 180deg, hsla(186 100% 50% / 0.5), hsla(270 80% 75% / 0.3), hsla(186 100% 50% / 0.5))",
          padding: "2px",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "xor",
          WebkitMaskComposite: "xor",
        }}
      />
      {/* Glass background */}
      <div
        className="absolute inset-[2px] rounded-full"
        style={{
          background: "hsla(186 100% 50% / 0.08)",
          backdropFilter: "blur(8px)",
        }}
      />
      {/* Silhouette icon */}
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="none"
        className="relative z-10"
      >
        <circle cx="12" cy="8" r="4" fill="hsl(186 100% 55%)" opacity="0.9" />
        <path
          d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
          stroke="hsl(186 100% 55%)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
      </svg>
    </motion.div>
  );
}
