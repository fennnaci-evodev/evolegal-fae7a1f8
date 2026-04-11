import { motion } from "framer-motion";
import hugoPhoto from "@/assets/hugo-avatar.png";

interface HugoAvatarProps {
  size?: number;
  animate?: boolean;
  talking?: boolean;
}

/**
 * Hugo — Expert Manager avatar.
 * Professional photo with a crisp neon cyan ring.
 * When `talking` is true, a subtle head-bob animation plays.
 */
export function HugoAvatar({ size = 40, animate = true, talking = false }: HugoAvatarProps) {
  const border = Math.max(2, Math.round(size * 0.045));
  const imgSize = size - border * 2;

  return (
    <motion.div
      className="relative flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "conic-gradient(from 180deg, hsla(186, 100%, 50%, 0.6), hsla(270, 80%, 75%, 0.35), hsla(186, 100%, 50%, 0.6))",
        padding: border,
        boxShadow: "0 0 12px hsla(186, 100%, 50%, 0.25)",
      }}
      initial={animate ? { scale: 0.9, opacity: 0 } : false}
      animate={animate ? { scale: 1, opacity: 1 } : false}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.img
        src={hugoPhoto}
        alt="Hugo · Expert Manager"
        className="block rounded-full object-cover"
        style={{
          width: imgSize,
          height: imgSize,
          imageRendering: "auto",
          transformOrigin: "50% 60%",
        }}
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
