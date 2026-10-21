import { memo, useMemo } from "react";

/**
 * Ambient neural field — static SVG layers rasterized once, animated only as
 * whole layers via compositor-friendly CSS (transform / opacity). No per-element
 * or per-frame animation, so weak PCs and phones stay smooth.
 */

type Node = { x: number; y: number; r: number; accent: boolean };
type Link = { d: string; accent: boolean };

function rand(seed: number) {
  const s = Math.sin(seed * 9301 + 49297) * 233280;
  return s - Math.floor(s);
}

function buildField(layer: number, W: number, H: number, portrait: boolean) {
  const nodes: Node[] = [];
  const clusters = portrait ? (layer === 0 ? 5 : 4) : layer === 0 ? 7 : 5;
  const count = layer === 0 ? 7 : 5;
  const spread = portrait ? 0.75 : 1;
  for (let c = 0; c < clusters; c++) {
    // Portrait: distribute clusters down the screen in a zig-zag so they stay visible.
    const cx = portrait
      ? W * (c % 2 === 0 ? 0.3 : 0.7) + (rand(c + layer * 31) - 0.5) * 160
      : (W / clusters) * (c + 0.5) + (rand(c + layer * 31) - 0.5) * 160;
    const cy = portrait
      ? (H / clusters) * (c + 0.5) + (rand(c * 7 + layer * 13) - 0.5) * 120
      : H * (0.18 + rand(c * 7 + layer * 13) * 0.64);
    for (let i = 0; i < count; i++) {
      const angle = i * 2.399963 + rand(c * 17 + i) * 0.6;
      const dist = (26 + Math.sqrt(i + 1) * (layer === 0 ? 62 : 80)) * spread;
      nodes.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist * 0.8,
        r: layer === 0 ? 2 + rand(c * 3 + i) * 1.8 : 1.2 + rand(c + i) * 1,
        accent: rand(c * 11 + i * 5 + layer) > 0.72,
      });
    }
  }
  const links: Link[] = [];
  const seen = new Set<string>();
  nodes.forEach((a, i) => {
    nodes
      .map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 }))
      .filter((n) => n.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2)
      .forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(key)) return;
        seen.add(key);
        const b = nodes[j];
        const bend = (rand(i * 41 + j) - 0.5) * 0.45;
        const qx = (a.x + b.x) / 2 - (b.y - a.y) * bend;
        const qy = (a.y + b.y) / 2 + (b.x - a.x) * bend;
        links.push({
          d: `M${a.x.toFixed(0)} ${a.y.toFixed(0)}Q${qx.toFixed(0)} ${qy.toFixed(0)} ${b.x.toFixed(0)} ${b.y.toFixed(0)}`,
          accent: a.accent || b.accent,
        });
      });
  });
  return { nodes, links };
}

const P = "hsl(var(--neural-primary))";
const A = "hsl(var(--neural-accent))";

function LayerSvg({ layer, portrait }: { layer: number; portrait: boolean }) {
  const W = portrait ? 900 : 1600;
  const H = portrait ? 1600 : 1000;
  const { nodes, links } = useMemo(() => buildField(layer, W, H, portrait), [layer, W, H, portrait]);
  const primaryLinks = links.filter((l) => !l.accent).map((l) => l.d).join("");
  const accentLinks = links.filter((l) => l.accent).map((l) => l.d).join("");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <path d={primaryLinks} fill="none" stroke={P} strokeWidth={1} strokeOpacity={0.22} vectorEffect="non-scaling-stroke" />
      <path d={accentLinks} fill="none" stroke={A} strokeWidth={1} strokeOpacity={0.24} vectorEffect="non-scaling-stroke" />
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={n.r} fill={n.accent ? A : P} fillOpacity={0.8} />
      ))}
    </svg>
  );
}

export const ParticleBackground = memo(function ParticleBackground() {
  const portrait = typeof window !== "undefined" && window.innerHeight > window.innerWidth;
  return (
    <div aria-hidden="true" className="neural-field fixed inset-0 pointer-events-none z-0">
      <div className="neural-glow" />
      <div className="neural-layer neural-drift-b" style={{ opacity: 0.5 }}>
        <LayerSvg layer={1} portrait={portrait} />
      </div>
      <div className="neural-layer neural-drift-a">
        <LayerSvg layer={0} portrait={portrait} />
      </div>
    </div>
  );
});
