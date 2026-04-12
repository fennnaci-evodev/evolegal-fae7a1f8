import hugoPhoto from "@/assets/hugo-avatar.png";

interface HugoAvatarProps {
  size?: number;
  animate?: boolean;
  talking?: boolean;
}

/**
 * Hugo — Expert Manager avatar.
 * Crisp photo with a clean neon cyan/purple gradient ring.
 * No outer glow to avoid clipping in scrollable containers.
 */
export function HugoAvatar({ size = 40 }: HugoAvatarProps) {
  const ringSize = Math.max(2, Math.round(size * 0.05));
  const imgSize = size - ringSize * 2;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background:
          "linear-gradient(hsl(var(--background)), hsl(var(--background))) padding-box, conic-gradient(from 190deg, hsl(var(--primary) / 0.95), hsl(var(--accent) / 0.52), hsl(var(--primary) / 0.95)) border-box",
        border: `${ringSize}px solid transparent`,
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
      }}
    >
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
