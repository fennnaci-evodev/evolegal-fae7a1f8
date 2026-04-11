import { motion } from "framer-motion";
import hugoPhoto from "@/assets/hugo-avatar.png";

interface HugoAvatarProps {
  size?: number;
  animate?: boolean;
  talking?: boolean;
}

/**
 * Hugo — Expert Manager avatar.
 * Professional photo with a glassmorphic neon cyan ring.
 * When `talking` is true, a subtle head-bob animation plays.
 */
export function HugoAvatar({ size = 40, animate = true, talking = false }: HugoAvatarProps) {
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
      {/* Photo with talking animation */}
      <motion.img
        src={hugoPhoto}
        alt="Hugo · Expert Manager"
        className="absolute inset-[2px] rounded-full object-cover"
        style={{ width: size - 4, height: size - 4, transformOrigin: "50% 60%" }}
        draggable={false}
        animate={
          talking
            ? {
                rotate: [0, 0.8, -0.5, 0.6, -0.3, 0],
                scale: [1, 1.008, 0.997, 1.005, 1],
              }
            : { rotate: 0, scale: 1 }
        }
        transition={
          talking
            ? {
                duration: 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : { duration: 0.3 }
        }
      />
    </motion.div>
  );
}
