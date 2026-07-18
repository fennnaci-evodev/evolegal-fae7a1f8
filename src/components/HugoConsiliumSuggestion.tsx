import { Brain, Sparkles, X } from "lucide-react";
import { motion } from "framer-motion";

interface HugoConsiliumSuggestionProps {
  onAccept: () => void;
  onDismiss: () => void;
  loading?: boolean;
}

/**
 * Non-intrusive banner shown when Blitz mode detects a Consilium-level query.
 * One-click switch upgrades the mode and re-runs the last user turn through
 * the Consilium Turn-1 pipeline.
 */
export function HugoConsiliumSuggestion({ onAccept, onDismiss, loading }: HugoConsiliumSuggestionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative w-full max-w-full rounded-2xl border p-3 sm:p-3.5 flex items-start gap-3 backdrop-blur-md"
      style={{
        borderColor: "hsla(270, 95%, 75%, 0.28)",
        background:
          "linear-gradient(135deg, hsla(270, 95%, 75%, 0.08), hsla(186, 100%, 60%, 0.05))",
        boxShadow: "0 0 32px hsla(270, 95%, 75%, 0.08) inset",
      }}
      role="status"
      aria-live="polite"
    >
      <div
        className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center"
        style={{ background: "hsla(270, 95%, 75%, 0.14)" }}
        aria-hidden="true"
      >
        <Brain className="h-4 w-4" style={{ color: "hsl(270 95% 78%)" }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[12px] sm:text-[13px] leading-snug text-foreground/90">
          <Sparkles className="inline h-3 w-3 mr-1 -mt-0.5" style={{ color: "hsl(186 100% 65%)" }} aria-hidden="true" />
          Hugo suggests switching to <span className="font-semibold" style={{ color: "hsl(270 95% 78%)" }}>Consilium Mode</span> for a deep multi-perspective risk analysis on this case.
        </p>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onAccept}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, hsl(270 95% 68%), hsl(186 100% 55%))",
              color: "white",
              boxShadow: "0 4px 20px hsla(270, 95%, 65%, 0.35)",
            }}
          >
            <Brain className="h-3 w-3" />
            {loading ? "Switching…" : "Switch to Consilium"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            disabled={loading}
            className="text-[11px] px-2 py-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            Not now
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss suggestion"
        className="absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}
