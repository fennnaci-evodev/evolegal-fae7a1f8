import { memo, useMemo } from "react";

/**
 * Ambient neural field — rendered once as static SVG and animated purely with
 * compositor-friendly CSS (transform / opacity). No per-frame JavaScript.
 * Deterministic clusters with curved links keep it organic yet calm.
 */

type Node = { x: number; y: number; r: number; accent: boolean; delay: number };
type Link = { d: string; accent: boolean; delay: number; signal: boolean };

const W = 1600;
const H = 1000;

function rand(seed: number) {
  const s = Math.sin(seed * 9301 + 49297) * 233280;
  return s - Math.floor(s);
}

function buildField(layer: number) {
  const nodes: Node[] = [];
  const clusters = layer === 0 ? 7 : 5;
  for (let c = 0; c < clusters; c++) {
    const cx = (W / clusters) * (c + 0.5) + (rand(c + layer * 31) - 0.5) * 160;
    const cy = H * (0.18 + rand(c * 7 + layer * 13) * 0.64);
    const count = layer === 0 ? 7 : 5;
    for (let i = 0; i < count; i++) {
      const angle = i * 2.399963 + rand(c * 17 + i) * 0.6;
      const dist = 26 + Math.sqrt(i + 1) * (layer === 0 ? 62 : 80);
      nodes.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist * 0.8,
        r: layer === 0 ? 1.6 + rand(c * 3 + i) * 1.6 : 1 + rand(c + i) * 0.9,
        accent: rand(c * 11 + i * 5 + layer) > 0.72,
        delay: rand(c * 23 + i * 3) * 8,
      });
    }
  }
  const links: Link[] = [];
  const seen = new Set<string>();
  nodes.forEach((a, i) => {
    const near = nodes
      .map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 }))
      .filter((n) => n.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2);
    near.forEach(({ j }) => {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) return;
      seen.add(key);
      const b = nodes[j];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const bend = (rand(i * 41 + j) - 0.5) * 0.45;
      const qx = mx - (b.y - a.y) * bend;
      const qy = my + (b.x - a.x) * bend;
      links.push({
        d: `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
        accent: a.accent || b.accent,
        delay: rand(i * 7 + j) * 10,
        signal: layer === 0 && rand(i * 13 + j * 3) > 0.82,
      });
    });
  });
  return { nodes, links };
}

function Layer({ layer }: { layer: number }) {
  const { nodes, links } = useMemo(() => buildField(layer), [layer]);
  return (
    <g className={layer === 0 ? "neural-drift-a" : "neural-drift-b"} opacity={layer === 0 ? 1 : 0.45}>
      {links.map((l, i) => (
        <path
          key={`l${i}`}
          d={l.d}
          className="neural-link"
          stroke={l.accent ? "hsl(var(--neural-accent))" : "hsl(var(--neural-primary))"}
          style={{ animationDelay: `-${l.delay}s` }}
        />
      ))}
      {links
        .filter((l) => l.signal)
        .map((l, i) => (
          <path
            key={`s${i}`}
            d={l.d}
            pathLength={100}
            className="neural-signal"
            stroke={l.accent ? "hsl(var(--neural-accent))" : "hsl(var(--neural-primary))"}
            style={{ animationDelay: `-${l.delay}s` }}
          />
        ))}
      {nodes.map((n, i) => (
        <circle
          key={`n${i}`}
          cx={n.x}
          cy={n.y}
          r={n.r}
          className="neural-node"
          fill={n.accent ? "hsl(var(--neural-accent))" : "hsl(var(--neural-primary))"}
          style={{ animationDelay: `-${n.delay}s` }}
        />
      ))}
    </g>
  );
}

export const ParticleBackground = memo(function ParticleBackground() {
  return (
    <div aria-hidden="true" className="neural-field fixed inset-0 pointer-events-none z-0">
      <div className="neural-glow" />
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <Layer layer={1} />
        <Layer layer={0} />
      </svg>
    </div>
  );
});
