import { useEffect, useState } from "react";
import "./InitialLoader.css";
import { SphereLoader } from "@/components/SphereLoader";

/**
 * Full-page initial loader. The hexagonal sphere animation runs on its own;
 * the overlay only fades, so nothing here recomputes per frame.
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
      <SphereLoader size={140} />
    </div>
  );
}
