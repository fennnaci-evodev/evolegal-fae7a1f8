import { motion } from "framer-motion";
import { useRef, useState, useCallback, useEffect } from "react";

interface EvoLogoProps {
  size?: "sm" | "md" | "lg" | "hero";
  animate?: boolean;
  showText?: boolean;
}

const sizes = {
  sm: { svg: 38, text: "text-sm", gap: "gap-1.5" },
  md: { svg: 52, text: "text-lg", gap: "gap-2" },
  lg: { svg: 80, text: "text-2xl", gap: "gap-3" },
  hero: { svg: 160, text: "text-3xl md:text-4xl", gap: "gap-4" },
};

const E_PATH = "M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z";

const MAX_TILT = 30;
const RETURN_DURATION = 600;

export function EvoLogo({ size = "md", animate = true, showText = true }: EvoLogoProps) {
  const s = sizes[size];
  const isHero = size === "hero";
  const uid = `evo-${size}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rafRef = useRef<number>(0);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const animatingRef = useRef(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const animateToTarget = useCallback(() => {
    const dx = targetRef.current.x - currentRef.current.x;
    const dy = targetRef.current.y - currentRef.current.y;
    if (Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) {
      currentRef.current = { ...targetRef.current };
      setTilt({ ...targetRef.current });
      animatingRef.current = false;
      return;
    }
    const ease = interacting ? 0.15 : 0.08;
    currentRef.current.x = lerp(currentRef.current.x, targetRef.current.x, ease);
    currentRef.current.y = lerp(currentRef.current.y, targetRef.current.y, ease);
    setTilt({ x: currentRef.current.x, y: currentRef.current.y });
    rafRef.current = requestAnimationFrame(animateToTarget);
  }, [interacting]);

  const startAnim = useCallback(() => {
    if (!animatingRef.current) {
      animatingRef.current = true;
      rafRef.current = requestAnimationFrame(animateToTarget);
    }
  }, [animateToTarget]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const calcTilt = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el || reducedMotion) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const px = (clientX - cx) / (rect.width / 2);
    const py = (clientY - cy) / (rect.height / 2);
    targetRef.current = {
      x: -py * MAX_TILT,
      y: px * MAX_TILT,
    };
    startAnim();
  }, [reducedMotion, startAnim]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setInteracting(true);
    calcTilt(e.clientX, e.clientY);
  }, [calcTilt]);

  const handleMouseLeave = useCallback(() => {
    setInteracting(false);
    targetRef.current = { x: 0, y: 0 };
    startAnim();
  }, [startAnim]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setInteracting(true);
      calcTilt(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [calcTilt]);

  const handleTouchEnd = useCallback(() => {
    setInteracting(false);
    targetRef.current = { x: 0, y: 0 };
    startAnim();
  }, [startAnim]);

  const glowIntensity = Math.min(1, (Math.abs(tilt.x) + Math.abs(tilt.y)) / 40);
  const baseGlow = 0.45 + glowIntensity * 0.35;
  const outerGlow = 0.18 + glowIntensity * 0.25;

  return (
    <div className={`flex flex-col items-center ${s.gap}`}>
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ perspective: isHero ? 600 : 400, cursor: "grab" }}
      >
        <motion.div
          className="relative"
          style={{
            willChange: "transform",
            transformStyle: "preserve-3d",
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotateZ(-33deg)`,
            transition: reducedMotion ? "none" : undefined,
          }}
          initial={animate ? { opacity: 0, scale: 0.92 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <svg
            width={s.svg}
            height={s.svg}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10"
            style={{
              filter: `drop-shadow(0 0 8px hsla(186, 100%, 50%, ${baseGlow})) drop-shadow(0 0 16px hsla(186, 100%, 50%, ${outerGlow})) drop-shadow(0 0 3px hsla(270, 80%, 75%, ${0.15 + glowIntensity * 0.15}))`,
              transition: "filter 0.3s ease-out",
            }}
          >
            <defs>
              <linearGradient id={`${uid}-main`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(186 100% 58%)" />
                <stop offset="50%" stopColor="hsl(186 100% 50%)" />
                <stop offset="100%" stopColor="hsl(195 100% 55%)" />
              </linearGradient>
              <linearGradient id={`${uid}-rim`} x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsla(270 80% 75% / 0.35)" />
                <stop offset="100%" stopColor="hsla(270 80% 75% / 0)" />
              </linearGradient>
            </defs>

            <path d={E_PATH} fill={`url(#${uid}-main)`} />
            <path d={E_PATH} fill={`url(#${uid}-rim)`} />
          </svg>

          {isHero && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ delay: 1.2, duration: 3, ease: "easeInOut", repeat: Infinity }}
              style={{
                background: "radial-gradient(circle, hsla(186 100% 50% / 0.15) 0%, hsla(186 100% 50% / 0.03) 45%, transparent 70%)",
                transform: "scale(3.5)",
                willChange: "opacity",
              }}
            />
          )}
        </motion.div>
      </div>

      {showText && (
        <motion.div
          initial={animate ? { opacity: 0, y: 8 } : false}
          animate={animate ? { opacity: 1, y: 0 } : false}
          transition={{ delay: 0.5, duration: 0.8 }}
          className={`${s.text} font-display font-semibold tracking-wide`}
        >
          <span className="text-gradient">Evo</span>
          <span className="text-gradient" style={{ backgroundImage: "linear-gradient(135deg, hsl(210 40% 85%), hsl(270 80% 75%))" }}>Legal</span>
        </motion.div>
      )}
    </div>
  );
}
