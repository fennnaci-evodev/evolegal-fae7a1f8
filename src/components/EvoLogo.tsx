import { motion } from "framer-motion";

interface EvoLogoProps {
  size?: "sm" | "md" | "lg" | "hero";
  animate?: boolean;
  showText?: boolean;
}

const sizes = {
  sm: { e: "text-3xl", text: "text-sm", gap: "gap-1" },
  md: { e: "text-5xl", text: "text-lg", gap: "gap-2" },
  lg: { e: "text-7xl", text: "text-2xl", gap: "gap-3" },
  hero: { e: "text-[8rem] md:text-[12rem]", text: "text-3xl md:text-4xl", gap: "gap-4" },
};

export function EvoLogo({ size = "md", animate = true, showText = true }: EvoLogoProps) {
  const s = sizes[size];

  return (
    <div className={`flex flex-col items-center ${s.gap}`}>
      {/* The slanted E */}
      <motion.div
        className="relative"
        initial={animate ? { rotate: 0, opacity: 0 } : false}
        animate={animate ? { rotate: -33, opacity: 1 } : false}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ rotate: animate ? undefined : -33 }}
      >
        <span
          className={`${s.e} font-display font-bold inline-block text-primary select-none`}
          style={{
            textShadow: "0 0 30px hsla(186, 100%, 50%, 0.6), 0 0 60px hsla(186, 100%, 50%, 0.3), 0 0 100px hsla(186, 100%, 50%, 0.15)",
            WebkitTextStroke: size === "hero" ? "1px hsla(186, 100%, 70%, 0.3)" : undefined,
          }}
        >
          E
        </span>
        {/* Purple rim light */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 70% 30%, hsla(270, 80%, 75%, 0.15) 0%, transparent 60%)",
          }}
        />
      </motion.div>

      {/* Text */}
      {showText && (
        <motion.div
          initial={animate ? { opacity: 0, y: 10 } : false}
          animate={animate ? { opacity: 1, y: 0 } : false}
          transition={{ delay: 0.6, duration: 0.8 }}
          className={`${s.text} font-display font-semibold tracking-wide`}
        >
          <span className="text-gradient">Evo</span>
          <span className="text-gradient" style={{ backgroundImage: "linear-gradient(135deg, hsl(210 40% 85%), hsl(270 80% 75%))" }}>Legal</span>
        </motion.div>
      )}

      {/* Radial glow behind */}
      {size === "hero" && (
        <div
          className="absolute pointer-events-none"
          style={{
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, hsla(186, 100%, 50%, 0.06) 0%, transparent 60%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </div>
  );
}
