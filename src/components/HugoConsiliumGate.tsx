import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";

const SESSION_KEY = "hugo_consilium_confirmed";

export function hasConfirmedConsilium(): boolean {
  try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; }
}

export function confirmConsilium() {
  try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
  try { window.dispatchEvent(new Event("hugo-consilium-confirmed")); } catch { /* ignore */ }
}

export function useConsiliumConfirmed(): boolean {
  const [ok, setOk] = useState<boolean>(() => hasConfirmedConsilium());
  useEffect(() => {
    const h = () => setOk(hasConfirmedConsilium());
    window.addEventListener("hugo-consilium-confirmed", h);
    return () => window.removeEventListener("hugo-consilium-confirmed", h);
  }, []);
  return ok;
}

export const CONSILIUM_DIRECTIVE_TITLE = "Attention.";
export const CONSILIUM_DIRECTIVE_BODY = [
  "During your interaction with Hugo, you are required to provide complete, accurate, and truthful information.",
  "The concealment, distortion, or omission of material facts or circumstances is unacceptable and may result in an inaccurate assessment.",
  "The objectivity of the analysis depends entirely upon the completeness of the information provided.",
];

interface Props {
  open: boolean;
  onConfirm: () => void;
  /** When embedded inside a bordered chat window (e.g. bubble), scope backdrop to parent. */
  scope?: "fixed" | "absolute";
  radius?: string;
}

/**
 * Stage 1 gatekeeper — a premium, high-contrast pre-flight modal that
 * enforces user responsibility before any Consilium query is dispatched.
 */
export function HugoConsiliumGate({ open, onConfirm, scope = "fixed", radius }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={`${scope === "fixed" ? "fixed inset-0 z-[100]" : "absolute inset-0 z-[60]"} flex items-center justify-center p-4`}
          style={{
            background: "hsla(222, 45%, 4%, 0.72)",
            backdropFilter: "blur(14px) saturate(120%)",
            WebkitBackdropFilter: "blur(14px) saturate(120%)",
            borderRadius: radius,
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="consilium-gate-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="w-full max-w-[440px] rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(180deg, hsla(222, 30%, 10%, 0.98), hsla(222, 32%, 7%, 0.98))",
              border: "1px solid hsla(270, 60%, 70%, 0.22)",
              boxShadow: "0 24px 80px -20px hsla(270, 95%, 45%, 0.35), 0 0 0 1px hsla(0,0%,100%,0.03) inset",
            }}
          >
            {/* Header band */}
            <div
              className="flex items-center gap-2.5 px-5 py-3 border-b"
              style={{
                borderColor: "hsla(0,0%,100%,0.06)",
                background: "linear-gradient(90deg, hsla(270,95%,60%,0.10), hsla(186,100%,50%,0.06))",
              }}
            >
              <div
                className="flex items-center justify-center h-7 w-7 rounded-full shrink-0"
                style={{
                  background: "hsla(270, 95%, 75%, 0.14)",
                  border: "1px solid hsla(270, 95%, 75%, 0.35)",
                }}
              >
                <ShieldCheck className="h-3.5 w-3.5" style={{ color: "hsl(270, 95%, 78%)" }} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 leading-none mb-1">
                  Hugo Consilium · User Directive
                </p>
                <p id="consilium-gate-title" className="text-[13px] font-display font-semibold text-foreground leading-none">
                  {CONSILIUM_DIRECTIVE_TITLE}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-3">
              {CONSILIUM_DIRECTIVE_BODY.map((line, i) => (
                <p
                  key={i}
                  className="text-[13px] leading-relaxed text-foreground/85"
                  style={{ letterSpacing: "0.005em" }}
                >
                  {line}
                </p>
              ))}
            </div>

            {/* Action */}
            <div
              className="px-5 pb-5 pt-1 flex flex-col gap-2"
            >
              <Button
                onClick={onConfirm}
                className="w-full h-11 rounded-xl font-display font-semibold text-[13px] tracking-[0.01em] text-white border-0"
                style={{
                  background: "linear-gradient(135deg, hsl(270, 85%, 58%) 0%, hsl(255, 90%, 62%) 100%)",
                  boxShadow: "0 8px 24px -8px hsla(270, 95%, 55%, 0.55), 0 0 0 1px hsla(270, 95%, 75%, 0.35) inset",
                }}
              >
                <ScrollText className="h-4 w-4 mr-2 opacity-90" />
                I Confirm Completeness & Accuracy
              </Button>
              <p className="text-[10px] text-center text-muted-foreground/55 leading-relaxed">
                This confirmation is stored for the current session only.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
