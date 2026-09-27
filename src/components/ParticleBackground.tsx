import { useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";

type NeuralNode = {
  x: number; y: number; vx: number; vy: number; radius: number;
  depth: number; phase: number; accent: boolean;
};

type NeuralLink = { from: number; to: number; strength: number };
type Signal = { linkIndex: number; progress: number; speed: number };

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

    let animationId = 0;
    let lastFrame = 0;
    let frame = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let nodes: NeuralNode[] = [];
    let links: NeuralLink[] = [];
    let signals: Signal[] = [];
    const pointer = { x: -1000, y: -1000, active: false };

    const color = (token: "--primary" | "--accent" | "--foreground", alpha: number) => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
      return `hsl(${value} / ${alpha})`;
    };

    const createNodes = () => {
      const isMobile = width < 768;
      const count = isMobile ? Math.max(24, Math.min(34, Math.floor(width / 12))) : Math.min(76, Math.floor(width / 20));
      nodes = Array.from({ length: count }, (_, index) => {
        const depth = 0.45 + Math.random() * 0.55;
        const edgeBias = isMobile && index % 3 !== 0;
        const x = edgeBias
          ? (Math.random() < 0.5 ? Math.random() * width * 0.28 : width * (0.72 + Math.random() * 0.28))
          : Math.random() * width;
        return {
          x,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * (isMobile ? 0.09 : 0.16) * depth,
          vy: (Math.random() - 0.5) * (isMobile ? 0.07 : 0.12) * depth,
          radius: 0.65 + depth * 1.15,
          depth,
          phase: Math.random() * Math.PI * 2,
          accent: Math.random() > 0.76,
        };
      });
    };

    const buildLinks = () => {
      const isMobile = width < 768;
      const reach = isMobile ? 118 : 170;
      const nextLinks: NeuralLink[] = [];
      nodes.forEach((node, from) => {
        nodes
          .map((candidate, to) => ({ to, distance: Math.hypot(node.x - candidate.x, node.y - candidate.y) }))
          .filter(({ to, distance }) => to > from && distance < reach)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, isMobile ? 2 : 3)
          .forEach(({ to, distance }) => nextLinks.push({ from, to, strength: 1 - distance / reach }));
      });
      links = nextLinks;
      signals = signals.filter(({ linkIndex }) => linkIndex < links.length);
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createNodes();
      buildLinks();
    };
    resize();
    window.addEventListener("resize", resize);

    const onPointerMove = (event: PointerEvent) => {
      if (width < 768) return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };
    const onPointerLeave = () => { pointer.active = false; };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);

    const draw = (time: number, moving: boolean) => {
      ctx.clearRect(0, 0, width, height);
      const isLight = themeRef.current === "light";
      const isMobile = width < 768;

      if (moving) nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < -8) node.x = width + 8;
        if (node.x > width + 8) node.x = -8;
        if (node.y < -8) node.y = height + 8;
        if (node.y > height + 8) node.y = -8;
        if (pointer.active) {
          const dx = node.x - pointer.x;
          const dy = node.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < 130) {
            node.x += (dx / distance) * 0.18;
            node.y += (dy / distance) * 0.18;
          }
        }
      });

      links.forEach((link) => {
        const from = nodes[link.from];
        const to = nodes[link.to];
        if (!from || !to) return;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = color("--primary", link.strength * (isLight ? 0.11 : isMobile ? 0.16 : 0.13));
        ctx.lineWidth = 0.55 + link.strength * 0.45;
        ctx.stroke();
      });

      if (moving && links.length && signals.length < (isMobile ? 2 : 5) && Math.random() < 0.012) {
        signals.push({ linkIndex: Math.floor(Math.random() * links.length), progress: 0, speed: 0.0035 + Math.random() * 0.0025 });
      }

      signals = signals.filter((signal) => {
        const link = links[signal.linkIndex];
        if (!link) return false;
        const from = nodes[link.from];
        const to = nodes[link.to];
        signal.progress += signal.speed * (isMobile ? 0.7 : 1);
        const x = from.x + (to.x - from.x) * signal.progress;
        const y = from.y + (to.y - from.y) * signal.progress;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, isMobile ? 7 : 9);
        glow.addColorStop(0, color("--primary", isLight ? 0.7 : 0.95));
        glow.addColorStop(0.35, color("--accent", isLight ? 0.24 : 0.42));
        glow.addColorStop(1, color("--primary", 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, isMobile ? 7 : 9, 0, Math.PI * 2);
        ctx.fill();
        return signal.progress < 1;
      });

      nodes.forEach((node) => {
        const pulse = moving ? (Math.sin(time * 0.00075 + node.phase) + 1) * 0.5 : 0.45;
        const alpha = (isLight ? 0.28 : 0.44) * node.depth + pulse * 0.12;
        if (node.depth > 0.78) {
          const glowRadius = node.radius * 5.5;
          const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius);
          glow.addColorStop(0, color(node.accent ? "--accent" : "--primary", alpha * 0.42));
          glow.addColorStop(1, color("--primary", 0));
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = color(node.accent ? "--accent" : isLight ? "--foreground" : "--primary", alpha);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const animate = (time: number) => {
      const targetInterval = width < 768 ? 1000 / 30 : 1000 / 50;
      if (time - lastFrame >= targetInterval) {
        lastFrame = time;
        frame += 1;
        if (frame % 18 === 0) buildLinks();
        draw(time, true);
      }
      animationId = requestAnimationFrame(animate);
    };

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) draw(0, false);
    else animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 opacity-70 transition-opacity duration-500 dark:opacity-80"
    />
  );
}
