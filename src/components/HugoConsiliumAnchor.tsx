import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { CONSILIUM_DIRECTIVE_BODY, CONSILIUM_DIRECTIVE_TITLE } from "./HugoConsiliumGate";

/**
 * Stage 2 — permanent low-contrast anchor above the composer while
 * Consilium mode is active. "Read Full Directive" opens a premium popover
 * with the full three-line directive.
 */
export function HugoConsiliumAnchor({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative flex items-center gap-2 px-3 py-1.5 border-t border-b"
      style={{
        background: "linear-gradient(90deg, hsla(222, 38%, 9%, 0.75), hsla(232, 40%, 10%, 0.75))",
        borderColor: "hsla(270, 40%, 60%, 0.14)",
        borderRadius: compact ? 0 : 10,
      }}
      role="note"
      aria-label="Consilium user directive"
    >
      <div
        className="flex items-center justify-center h-5 w-5 rounded-full shrink-0"
        style={{
          background: "hsla(270, 95%, 75%, 0.10)",
          border: "1px solid hsla(270, 95%, 75%, 0.28)",
        }}
      >
        <ShieldCheck className="h-2.5 w-2.5" style={{ color: "hsl(270, 95%, 80%)" }} aria-hidden />
      </div>
      <p
        className="flex-1 min-w-0 leading-snug text-muted-foreground/80 truncate"
        style={{ fontSize: compact ? 10 : 10.5, letterSpacing: "0.01em" }}
      >
        <span className="text-muted-foreground/70">Notice:</span>{" "}
        Objectivity relies entirely on the completeness of your data.{" "}
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          onFocus={() => setOpen(true)}
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="font-medium underline-offset-2 hover:underline focus:underline focus:outline-none transition-colors"
          style={{ color: "hsl(270, 95%, 82%)" }}
        >
          [Read Full Directive]
        </button>
      </p>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-40 right-2 left-2 sm:left-auto sm:right-3 bottom-full mb-2 sm:max-w-[380px] rounded-xl p-4 space-y-2"
            role="dialog"
            aria-label="Full user directive"
            style={{
              background: "linear-gradient(180deg, hsla(222, 32%, 9%, 0.98), hsla(222, 36%, 6%, 0.98))",
              border: "1px solid hsla(270, 60%, 70%, 0.22)",
              boxShadow: "0 18px 48px -14px hsla(270, 95%, 45%, 0.35)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-3 w-3" style={{ color: "hsl(270, 95%, 78%)" }} aria-hidden />
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 leading-none">
                Consilium Directive
              </p>
            </div>
            <p className="text-[12px] font-display font-semibold text-foreground leading-tight">
              {CONSILIUM_DIRECTIVE_TITLE}
            </p>
            {CONSILIUM_DIRECTIVE_BODY.map((line, i) => (
              <p key={i} className="text-[11.5px] leading-relaxed text-foreground/80">
                {line}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
