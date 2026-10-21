import hugoPhoto from "@/assets/hugo-avatar.webp";

interface HugoAvatarProps {
  size?: number;
  animate?: boolean;
  talking?: boolean;
}

/**
 * Hugo — Analysis Co-Pilot avatar.
 * High-density bundled portrait (512px) with a rotating neon gradient ring.
 */
export function HugoAvatar({ size = 40 }: HugoAvatarProps) {
  const ringSize = Math.max(2, Math.round(size * 0.06));
  const imgSize = size - ringSize * 2;
  const id = `hugo-ring-${size}`;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size }}
    >
      <svg
        className="absolute inset-0 animate-[hugo-spin_6s_linear_infinite]"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.95)" />
            <stop offset="50%" stopColor="hsl(var(--accent) / 0.55)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.95)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - ringSize) / 2}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={ringSize}
        />
      </svg>

      <img
        src={hugoPhoto}
        alt="Hugo · Analysis Co-Pilot"
        width={imgSize}
        height={imgSize}
        decoding="async"
        className="relative block rounded-full object-cover select-none bg-muted"
        style={{ width: imgSize, height: imgSize, objectPosition: "center 18%" }}
        draggable={false}
      />
    </div>
  );
}
