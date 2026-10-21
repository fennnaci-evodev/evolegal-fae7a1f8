import { useEffect, useState } from "react";
import sphereAnim from "@/assets/sphere-loader.webp.asset.json";
import sphereStatic from "@/assets/sphere-loader-frame.png.asset.json";

interface SphereLoaderProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Hexagonal-globe loader (animated WebP, transparent background).
 * A subtle dark disc sits behind the sphere so it reads as a solid body
 * on both dark and light themes. Reduced motion shows a static frame.
 */
export function SphereLoader({ size = 48, className = "", style }: SphereLoaderProps) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      <span
        aria-hidden="true"
        className="absolute rounded-full"
        style={{
          inset: "7%",
          background:
            "radial-gradient(circle, hsl(228 28% 11%) 0%, hsl(228 30% 8%) 60%, transparent 72%)",
        }}
      />
      <img
        src={reduced ? sphereStatic.url : sphereAnim.url}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="relative h-full w-full object-contain"
      />
    </span>
  );
}
