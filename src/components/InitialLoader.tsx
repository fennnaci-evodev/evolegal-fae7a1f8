import { useEffect, useState } from "react";
import "./InitialLoader.css";

const E_PATH = "M22 10 L78 10 L78 23 L38 23 L38 43 L70 43 L70 56 L38 56 L38 77 L78 77 L78 90 L22 90 Z";

/**
 * Pure CSS, GPU-accelerated initial loader.
 * Rotation 0deg -> -33deg on a hardware-accelerated layer.
 */
export function InitialLoader({ onComplete }: { onComplete: () => void }) {
  const [exiting, setExiting] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t1 = setTimeout(() => setExiting(true), reduced ? 500 : 1200);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const t = setTimeout(() => {
      setHidden(true);
      onComplete();
    }, 400);
    return () => clearTimeout(t);
  }, [exiting, onComplete]);

  if (hidden) return null;

  return (
    <div className={`initial-loader ${exiting ? "initial-loader-exit" : ""}`}>
      <div className="initial-loader-icon">
        <svg width={140} height={140} viewBox="0 0 100 100" fill="none">
          <defs>
            <linearGradient id="il-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(186 100% 58%)" />
              <stop offset="100%" stopColor="hsl(195 100% 55%)" />
            </linearGradient>
          </defs>
          <path d={E_PATH} fill="url(#il-grad)" />
        </svg>
      </div>
    </div>
  );
}
