import { Hand } from "lucide-react";

/**
 * Interactive waving hand icon. Smooth CSS-only wave on hover.
 * Replaces the raw 👋 emoji on the dashboard welcome header.
 */
export function WavingHand({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center align-middle group ${className}`}
      style={{ transformOrigin: "70% 80%" }}
    >
      <Hand
        className="h-6 w-6 md:h-7 md:w-7 text-primary transition-transform"
        style={{
          animation: "wave-hand 2.4s ease-in-out infinite",
          transformOrigin: "70% 80%",
        }}
      />
    </span>
  );
}
