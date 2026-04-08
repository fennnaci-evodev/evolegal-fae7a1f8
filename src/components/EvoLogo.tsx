import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";

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

export function EvoLogo({ size = "md", animate = true, showText = true }: EvoLogoProps) {
  const s = sizes[size];
  const isHero = size === "hero";
  const uid = `evo-${size}-${Math.random().toString(36).slice(2, 6)}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const interactingRef = useRef(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    let running = false;

    function tick() {
      const tx = targetRef.current.x;
      const ty = targetRef.current.y;
      const cx = currentRef.current.x;
      const cy = currentRef.current.y;
      const ease = interactingRef.current ? 0.15 : 0.08;
      const nx = cx + (tx - cx) * ease;
      const ny = cy + (ty - cy) * ease;
      currentRef.current.x = nx;
      currentRef.current.y = ny;

      if (innerRef.current) {
        const gi = Math.min(1, (Math.abs(nx) + Math.abs(ny)) / 40);
        const bg = 0.45 + gi * 0.35;
        const og = 0.18 + gi * 0.25;
        const pg = 0.15 + gi * 0.15;
        innerRef.current.style.transform = `rotateX(${nx}deg) rotateY(${ny}deg) rotateZ(-33deg)`;
        const svg = innerRef.current.querySelector("svg");
        if (svg) {
          (svg as HTMLElement).style.filter =
            `drop-shadow(0 0 8px hsla(186,100%,50%,${bg})) drop-shadow(0 0 16px hsla(186,100%,50%,${og})) drop-shadow(0 0 3px hsla(270,80%,75%,${pg}))`;
        }
      }

      if (Math.abs(tx - nx) > 0.2 || Math.abs(ty - ny) > 0.2) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        currentRef.current = { x: tx, y: ty };
        if (innerRef.current) {
          innerRef.current.style.transform = `rotateX(${tx}deg) rotateY(${ty}deg) rotateZ(-33deg)`;
        }
        running = false;
      }
    }

    function startLoop() {
      if (!running) {
        running = true;
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    function onMove(clientX: number, clientY: number) {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const py = (clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      targetRef.current = { x: -py * MAX_TILT, y: px * MAX_TILT };
      interactingRef.current = true;
      startLoop();
    }

    function onLeave() {
      targetRef.current = { x: 0, y: 0 };
      interactingRef.current = false;
      startLoop();
    }

    function handleMouseMove(e: MouseEvent) { onMove(e.clientX, e.clientY); }
    function handleMouseLeave() { onLeave(); }
    function handleTouchMove(e: TouchEvent) {
      if (e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY);
    }
    function handleTouchEnd() { onLeave(); }

    const el = containerRef.current;
    if (el) {
      el.addEventListener("mousemove", handleMouseMove);
      el.addEventListener("mouseleave", handleMouseLeave);
      el.addEventListener("touchmove", handleTouchMove, { passive: true });
      el.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (el) {
        el.removeEventListener("mousemove", handleMouseMove);
        el.removeEventListener("mouseleave", handleMouseLeave);
        el.removeEventListener("touchmove", handleTouchMove);
        el.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [reducedMotion]);

  return (
    <div className={`flex flex-col items-center ${s.gap}`}>
      <div
        ref={containerRef}
        style={{ perspective: isHero ? 600 : 400, cursor: "grab" }}
      >
        <motion.div
          className="relative"
          initial={animate ? { opacity: 0, scale: 0.92 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            ref={innerRef}
            className="relative"
            style={{
              willChange: "transform",
              transformStyle: "preserve-3d",
              transform: "rotateX(0deg) rotateY(0deg) rotateZ(-33deg)",
            }}
          >
            <svg
              width={s.svg}
              height={s.svg}
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="relative z-10"
              style={{
                filter: "drop-shadow(0 0 8px hsla(186,100%,50%,0.45)) drop-shadow(0 0 16px hsla(186,100%,50%,0.18)) drop-shadow(0 0 3px hsla(270,80%,75%,0.15))",
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
          </div>
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
