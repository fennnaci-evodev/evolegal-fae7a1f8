import hugoPhoto from "@/assets/hugo-avatar.png";

interface HugoAvatarProps {
  size?: number;
  animate?: boolean;
  talking?: boolean;
}

/**
 * Hugo — Expert Manager avatar.
 * Crisp photo with an animated rotating neon cyan/purple gradient ring.
 */
export function HugoAvatar({ size = 40 }: HugoAvatarProps) {
  const ringSize = Math.max(2, Math.round(size * 0.05));
  const imgSize = size - ringSize * 2;
  const id = `hugo-ring-${size}`;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
      }}
    >
      {/* Rotating gradient ring */}
      <svg
        className="absolute inset-0 animate-[hugo-spin_6s_linear_infinite]"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "translateZ(0)" }}
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

      {/* Photo */}
      <div
        className="overflow-hidden rounded-full"
        style={{
          width: imgSize,
          height: imgSize,
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }}
      >
        <img
          src={hugoPhoto}
          alt="Hugo · Expert Manager"
          className="block h-full w-full rounded-full object-cover select-none"
          style={{
            imageRendering: "crisp-edges",
            objectPosition: "center 22%",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
            filter: "contrast(1.04) saturate(1.02)",
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}