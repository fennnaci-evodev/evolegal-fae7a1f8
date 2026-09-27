import { useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";

type NeuralNode = {
  anchorX: number;
  anchorY: number;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  radius: number;
  depth: number;
  phase: number;
  cluster: number;
  accent: boolean;
};

type NeuralLink = { from: number; to: number; strength: number; phase: number; bend: number };
type Signal = { linkIndex: number; progress: number; speed: number; delay: number };

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
    let lastDrawTime = 0;
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
      const targetCount = isMobile
        ? Math.max(24, Math.min(32, Math.floor(width / 13)))
        : Math.min(72, Math.floor(width / 21));
      const clusterCount = isMobile ? 5 : 8;
      const centers = Array.from({ length: clusterCount }, (_, index) => ({
        x: width * (0.12 + (((index * 47) % 89) / 89) * 0.76),
        y: height * (0.08 + (((index * 67 + 13) % 97) / 97) * 0.84),
      }));

      nodes = Array.from({ length: targetCount }, (_, index) => {
        const cluster = index % clusterCount;
        const center = centers[cluster];
        const seed = ((index * 47) % 101) / 101;
        const depth = 0.5 + (((index * 29) % 53) / 53) * 0.5;
        const ring = Math.floor(index / clusterCount) + 1;
        const angle = index * 2.399963 + cluster * 0.57;
        const radiusX = Math.min(width * 0.2, 24 + ring * (isMobile ? 28 : 38));
        const radiusY = Math.min(height * 0.14, 28 + ring * (isMobile ? 36 : 45));
        const anchorX = Math.max(12, Math.min(width - 12, center.x + Math.cos(angle) * radiusX * (0.55 + seed * 0.45)));
        const anchorY = Math.max(12, Math.min(height - 12, center.y + Math.sin(angle) * radiusY * (0.55 + seed * 0.45)));
        return {
          anchorX,
          anchorY,
          x: anchorX,
          y: anchorY,
          offsetX: 0,
          offsetY: 0,
          radius: 0.7 + depth * 1.05,
          depth,
          phase: seed * Math.PI * 2,
          cluster,
          accent: index % 5 === 1,
        };
      });
    };

    const buildStableLinks = () => {
      const isMobile = width < 768;
      const neighborCount = isMobile ? 2 : 3;
      const edgeKeys = new Set<string>();
      const nextLinks: NeuralLink[] = [];

      nodes.forEach((node, from) => {
        const nearest = nodes
          .map((candidate, to) => ({
            to,
            distance: Math.hypot(node.anchorX - candidate.anchorX, node.anchorY - candidate.anchorY),
          }))
          .filter(({ to }) => to !== from)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, neighborCount);

        nearest.forEach(({ to, distance }) => {
          const low = Math.min(from, to);
          const high = Math.max(from, to);
          const key = `${low}:${high}`;
          if (edgeKeys.has(key)) return;
          edgeKeys.add(key);
          const expectedSpacing = Math.sqrt((width * height) / nodes.length);
          nextLinks.push({
            from: low,
            to: high,
            strength: Math.max(0.28, 1 - distance / (expectedSpacing * 1.8)),
            phase: ((low * 17 + high * 31) % 23) / 23 * Math.PI * 2,
            bend: ((((low * 43 + high * 19) % 17) / 16) - 0.5) * (isMobile ? 32 : 48),
          });
        });
      });

      links = nextLinks;
      const signalCount = isMobile ? 4 : 8;
      signals = Array.from({ length: signalCount }, (_, index) => ({
        linkIndex: links.length ? (index * 7) % links.length : 0,
        progress: (index / signalCount) * 0.9,
        speed: 0.075 + (index % 4) * 0.009,
        delay: index * 0.35,
      }));
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
      buildStableLinks();
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

    const positionNodes = (time: number, moving: boolean) => {
      const seconds = time / 1000;
      nodes.forEach((node, index) => {
        const localPhase = node.phase + index * 0.11;
        const sharedX = Math.sin(seconds * 0.115) * 5.5;
        const sharedY = Math.cos(seconds * 0.09) * 4;
        const clusterPhase = node.cluster * 1.37;
        const clusterX = moving ? Math.sin(seconds * 0.105 + clusterPhase) * 7 : 0;
        const clusterY = moving ? Math.cos(seconds * 0.085 + clusterPhase) * 6 : 0;
        const localX = moving ? Math.sin(seconds * (0.16 + node.depth * 0.035) + localPhase) * (3 + node.depth * 3) : 0;
        const localY = moving ? Math.cos(seconds * (0.13 + node.depth * 0.03) + localPhase * 0.83) * (3 + node.depth * 2) : 0;
        let targetOffsetX = 0;
        let targetOffsetY = 0;

        if (moving && pointer.active) {
          const naturalX = node.anchorX + sharedX + clusterX + localX;
          const naturalY = node.anchorY + sharedY + clusterY + localY;
          const dx = naturalX - pointer.x;
          const dy = naturalY - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < 140) {
            const force = (1 - distance / 140) * 15;
            targetOffsetX = (dx / distance) * force;
            targetOffsetY = (dy / distance) * force;
          }
        }

        node.offsetX += (targetOffsetX - node.offsetX) * 0.075;
        node.offsetY += (targetOffsetY - node.offsetY) * 0.075;
        node.x = node.anchorX + (moving ? sharedX + clusterX + localX : 0) + node.offsetX;
        node.y = node.anchorY + (moving ? sharedY + clusterY + localY : 0) + node.offsetY;
      });
    };

    const draw = (time: number, moving: boolean, deltaSeconds = 0) => {
      ctx.clearRect(0, 0, width, height);
      const isLight = themeRef.current === "light";
      const isMobile = width < 768;
      positionNodes(time, moving);

      links.forEach((link) => {
        const from = nodes[link.from];
        const to = nodes[link.to];
        if (!from || !to) return;
        const currentDistance = Math.hypot(from.x - to.x, from.y - to.y);
        const distanceFade = Math.max(0.55, 1 - currentDistance / (isMobile ? 230 : 320));
        const breath = moving ? 0.82 + Math.sin(time * 0.00055 + link.phase) * 0.08 : 0.82;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.max(1, Math.hypot(dx, dy));
        const curveX = (from.x + to.x) / 2 - (dy / length) * link.bend;
        const curveY = (from.y + to.y) / 2 + (dx / length) * link.bend;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(curveX, curveY, to.x, to.y);
        ctx.strokeStyle = color("--primary", link.strength * distanceFade * breath * (isLight ? 0.15 : isMobile ? 0.24 : 0.2));
        ctx.lineWidth = 0.55 + link.strength * 0.45;
        ctx.stroke();
      });

      signals.forEach((signal) => {
        if (!moving || !links.length) return;
        signal.delay -= deltaSeconds;
        if (signal.delay > 0) return;
        const link = links[signal.linkIndex];
        if (!link) return;
        const from = nodes[link.from];
        const to = nodes[link.to];
        signal.progress += signal.speed * deltaSeconds;
        if (signal.progress >= 1) {
          signal.progress = 0;
          signal.delay = 0.35 + ((signal.linkIndex * 13) % 8) * 0.08;
          signal.linkIndex = (signal.linkIndex + 7) % links.length;
          return;
        }
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.max(1, Math.hypot(dx, dy));
        const controlX = (from.x + to.x) / 2 - (dy / length) * link.bend;
        const controlY = (from.y + to.y) / 2 + (dx / length) * link.bend;
        const inverse = 1 - signal.progress;
        const x = inverse * inverse * from.x + 2 * inverse * signal.progress * controlX + signal.progress * signal.progress * to.x;
        const y = inverse * inverse * from.y + 2 * inverse * signal.progress * controlY + signal.progress * signal.progress * to.y;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, isMobile ? 7 : 9);
        glow.addColorStop(0, color("--primary", isLight ? 0.7 : 0.95));
        glow.addColorStop(0.35, color("--accent", isLight ? 0.24 : 0.42));
        glow.addColorStop(1, color("--primary", 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, isMobile ? 7 : 9, 0, Math.PI * 2);
        ctx.fill();
      });

      nodes.forEach((node) => {
        const pulse = moving ? (Math.sin(time * 0.00065 + node.phase) + 1) * 0.5 : 0.45;
        const alpha = (isLight ? 0.28 : 0.44) * node.depth + pulse * 0.1;
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
      const targetInterval = width < 768 ? 1000 / 40 : 1000 / 60;
      if (time - lastDrawTime >= targetInterval) {
        const deltaSeconds = lastDrawTime ? Math.min((time - lastDrawTime) / 1000, 0.04) : targetInterval / 1000;
        lastDrawTime = time;
        draw(time, true, deltaSeconds);
      }
      animationId = requestAnimationFrame(animate);
    };

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) draw(0, false);
    else animationId = requestAnimationFrame(animate);

    const onVisibilityChange = () => {
      if (prefersReduced) return;
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        lastDrawTime = 0;
        animationId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
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