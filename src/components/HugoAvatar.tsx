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
 * When `talking` is true, a smooth breathing + gentle nod animation plays.
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
        background: talking
          ? "conic-gradient(from 180deg, hsla(186, 100%, 50%, 0.8), hsla(270, 80%, 75%, 0.5), hsla(186, 100%, 50%, 0.8))"
          : "conic-gradient(from 180deg, hsla(186, 100%, 50%, 0.6), hsla(270, 80%, 75%, 0.35), hsla(186, 100%, 50%, 0.6))",
        padding: border,
        boxShadow: talking
          ? "0 0 18px hsla(186, 100%, 50%, 0.4), 0 0 6px hsla(270, 80%, 75%, 0.2)"
          : "0 0 12px hsla(186, 100%, 50%, 0.25)",
        transition: "box-shadow 0.4s ease, background 0.4s ease",
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
          transformOrigin: "50% 55%",
          willChange: talking ? "transform" : "auto",
        }}
        draggable={false}
        animate={
          talking
            ? {
                scale: [1, 1.02, 1, 1.015, 1],
                translateY: [0, -0.5, 0.3, -0.2, 0],
              }
            : { scale: 1, translateY: 0 }
        }
        transition={
          talking
            ? {
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : { duration: 0.4, ease: "easeOut" }
        }
      />
    </motion.div>
  );
}
