import { useRef, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";

const E_PATH = "M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z";

const BASE_ROTATE_Z = -33;
const MAX_TILT = 30;

export function EvoLogo3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rafRef = useRef<number>(0);
  const targetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const updateTilt = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el || reducedMotion) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (clientX - cx) / (rect.width / 2);
    const dy = (clientY - cy) / (rect.height / 2);
    targetRef.current = {
      x: -dy * MAX_TILT,
      y: dx * MAX_TILT,
    };
  }, [reducedMotion]);

  // Smooth animation loop
  useEffect(() => {
    if (reducedMotion) return;
    let running = true;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const loop = () => {
      if (!running) return;
      setTilt(prev => {
        const tx = hovering ? targetRef.current.x : 0;
        const ty = hovering ? targetRef.current.y : 0;
        const ease = hovering ? 0.12 : 0.06;
        const nx = lerp(prev.x, tx, ease);
        const ny = lerp(prev.y, ty, ease);
        if (Math.abs(nx - tx) < 0.05 && Math.abs(ny - ty) < 0.05 && !hovering) {
          return { x: 0, y: 0 };
        }
        return { x: nx, y: ny };
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [hovering, reducedMotion]);

  const onMouseMove = useCallback((e: React.MouseEvent) => updateTilt(e.clientX, e.clientY), [updateTilt]);
  const onMouseEnter = useCallback(() => setHovering(true), []);
  const onMouseLeave = useCallback(() => { setHovering(false); targetRef.current = { x: 0, y: 0 }; }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      updateTilt(e.touches[0].clientX, e.touches[0].clientY);
      setHovering(true);
    }
  }, [updateTilt]);
  const onTouchEnd = useCallback(() => { setHovering(false); targetRef.current = { x: 0, y: 0 }; }, []);

  const glowIntensity = hovering ? 0.6 : 0.45;
  const svgSize = 160;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        onMouseMove={onMouseMove}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          perspective: "600px",
          cursor: "grab",
          touchAction: "none",
        }}
        className="relative"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotateZ(${BASE_ROTATE_Z}deg)`,
            transformStyle: "preserve-3d",
            willChange: "transform",
            transition: reducedMotion ? "none" : undefined,
          }}
        >
          <svg
            width={svgSize}
            height={svgSize}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10"
            style={{
              filter: `drop-shadow(0 0 ${hovering ? 12 : 8}px hsla(186, 100%, 50%, ${glowIntensity})) drop-shadow(0 0 ${hovering ? 24 : 16}px hsla(186, 100%, 50%, ${glowIntensity * 0.4})) drop-shadow(0 0 3px hsla(270, 80%, 75%, 0.15))`,
              transition: "filter 0.4s ease",
            }}
          >
            <defs>
              <linearGradient id="e3d-main" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(186 100% 58%)" />
                <stop offset="50%" stopColor="hsl(186 100% 50%)" />
                <stop offset="100%" stopColor="hsl(195 100% 55%)" />
              </linearGradient>
              <linearGradient id="e3d-rim" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsla(270 80% 75% / 0.35)" />
                <stop offset="100%" stopColor="hsla(270 80% 75% / 0)" />
              </linearGradient>
            </defs>
            <path d={E_PATH} fill="url(#e3d-main)" />
            <path d={E_PATH} fill="url(#e3d-rim)" />
          </svg>
        </motion.div>

        {/* Breathing glow */}
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
      </div>
    </div>
  );
}
