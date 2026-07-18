import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

const STEPS = [
  { key: "triage", label: "Triage & Fact Mapping" },
  { key: "risks", label: "Analyzing Legal Risks" },
  { key: "synth", label: "Synthesizing Consilium Framework" },
] as const;

function usePrefersReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(mq.matches);
    const h = (e: MediaQueryListEvent) => setR(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return r;
}

/**
 * Consilium deep-analysis stepper. Cycles through the three council stages
 * while Hugo Consilium composes its response. Auto-advances on a gentle,
 * professional pace; respects prefers-reduced-motion.
 */
export function HugoConsiliumLoader({ compact = false }: { compact?: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduced) return;
    // Advance ~ every 1600ms, hold on the last step
    const id = setInterval(() => {
      setActive((a) => (a < STEPS.length - 1 ? a + 1 : a));
    }, 1600);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Hugo Consilium is preparing a deep analysis"
      className="glass rounded-2xl px-4 py-3 space-y-2"
      style={{
        border: "1px solid hsla(270,95%,75%,0.22)",
        boxShadow: "0 0 24px hsla(270,95%,75%,0.08)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: "hsl(270 95% 75%)", boxShadow: "0 0 8px hsla(270,95%,75%,0.8)" }}
          aria-hidden="true"
        />
        <span className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: "hsl(270 95% 75%)" }}>
          Hugo Consilium
        </span>
      </div>
      <ul className="space-y-1.5">
        {STEPS.map((step, i) => {
          const state: "done" | "active" | "pending" =
            i < active ? "done" : i === active ? "active" : "pending";
          return (
            <li key={step.key} className="flex items-center gap-2.5">
              <span
                className="flex items-center justify-center rounded-full shrink-0"
                style={{
                  height: 16,
                  width: 16,
                  background:
                    state === "done"
                      ? "hsla(150,80%,55%,0.15)"
                      : state === "active"
                        ? "hsla(270,95%,75%,0.18)"
                        : "hsla(0,0%,100%,0.04)",
                  border:
                    state === "pending"
                      ? "1px solid hsla(0,0%,100%,0.1)"
                      : state === "active"
                        ? "1px solid hsla(270,95%,75%,0.5)"
                        : "1px solid hsla(150,80%,55%,0.4)",
                }}
                aria-hidden="true"
              >
                {state === "done" ? (
                  <Check className="h-2.5 w-2.5" style={{ color: "hsl(150 80% 60%)" }} />
                ) : state === "active" ? (
                  reduced ? (
                    <span className="h-1 w-1 rounded-full" style={{ background: "hsl(270 95% 75%)" }} />
                  ) : (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" style={{ color: "hsl(270 95% 75%)" }} />
                  )
                ) : (
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                )}
              </span>
              <motion.span
                initial={false}
                animate={{
                  opacity: state === "pending" ? 0.45 : 1,
                }}
                transition={{ duration: reduced ? 0 : 0.3 }}
                className={`text-[${compact ? "10.5px" : "11.5px"}] leading-snug`}
                style={{
                  color:
                    state === "active"
                      ? "hsl(var(--foreground))"
                      : state === "done"
                        ? "hsl(var(--muted-foreground))"
                        : "hsl(var(--muted-foreground) / 0.6)",
                  fontWeight: state === "active" ? 600 : 500,
                  fontSize: compact ? 10.5 : 11.5,
                }}
              >
                {step.label}
                {state === "active" && !reduced && (
                  <span className="ml-0.5 inline-block hugo-consilium-dots">…</span>
                )}
              </motion.span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
