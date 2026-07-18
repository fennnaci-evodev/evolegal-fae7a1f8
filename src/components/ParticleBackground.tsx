import { useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: Array<{
      x: number; y: number; vx: number; vy: number; size: number; alpha: number; hue: string;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const count = Math.min(60, Math.floor(window.innerWidth / 25));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.3 + 0.05,
        hue: Math.random() > 0.6 ? "cyan" : "purple",
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isLight = themeRef.current === "light";

      // In light mode: subtle charcoal points; dark mode: cyan/purple neon
      const colorFor = (hue: string, alpha: number) => {
        if (isLight) {
          // Faint charcoal — invert of low-opacity white points
          const a = Math.min(0.35, alpha * 1.2);
          return `hsla(222, 30%, 15%, ${a})`;
        }
        return hue === "cyan"
          ? `hsla(186, 100%, 50%, ${alpha})`
          : `hsla(270, 80%, 75%, ${alpha})`;
      };
      const lineColor = (t: number) =>
        isLight
          ? `hsla(222, 30%, 20%, ${0.05 * t})`
          : `hsla(186, 100%, 50%, ${0.03 * t})`;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = colorFor(p.hue, p.alpha);
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = lineColor(1 - dist / 150);
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReduced) animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-500"
      style={{ opacity: 0.6 }}
    />
  );
}
