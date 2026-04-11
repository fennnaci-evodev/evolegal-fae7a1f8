import hugoPhoto from "@/assets/hugo-avatar.png";

interface HugoAvatarProps {
  size?: number;
  animate?: boolean;
  talking?: boolean;
}

/**
 * Hugo — Expert Manager avatar.
 * Static, high-definition photo avatar with a crisp glassmorphic ring.
 */
export function HugoAvatar({ size = 40 }: HugoAvatarProps) {
  const frameSize = Math.round(size * 1.12);
  const ringSize = Math.max(3, Math.round(frameSize * 0.06));
  const imageSize = frameSize - ringSize * 2;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: frameSize,
        height: frameSize,
        padding: ringSize,
        border: "1px solid transparent",
        background:
          "linear-gradient(hsl(var(--background) / 0.88), hsl(var(--background) / 0.72)) padding-box, conic-gradient(from 190deg, hsl(var(--primary) / 0.95), hsl(var(--accent) / 0.52), hsl(var(--primary) / 0.95)) border-box",
        boxShadow:
          "0 0 0 1px hsl(var(--border) / 0.45) inset, 0 0 18px hsl(var(--primary) / 0.22), 0 0 28px hsl(var(--accent) / 0.12)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
      }}
    >
      <div
        className="overflow-hidden rounded-full"
        style={{
          width: imageSize,
          height: imageSize,
          boxShadow: "0 0 0 1px hsl(var(--border) / 0.35) inset",
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
