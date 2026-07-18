import { Scale } from "lucide-react";

/**
 * Permanent UPL (Unauthorized Practice of Law) protection notice.
 * Sticky, low-contrast footer — always visible inside the chat so Hugo's
 * bubbles never need to output legal disclaimers themselves.
 */
export function HugoUPLNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="note"
      aria-label="Legal notice"
      className="flex items-start gap-2 px-3 py-2 border-t border-border/15"
      style={{
        background: "hsla(222, 47%, 6%, 0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <Scale
        className="shrink-0 mt-[1px] opacity-50"
        style={{ height: compact ? 10 : 11, width: compact ? 10 : 11, color: "hsl(186 100% 60%)" }}
        aria-hidden="true"
      />
      <p
        className="leading-snug text-muted-foreground/70 select-text"
        style={{ fontSize: compact ? 9.5 : 10.5, letterSpacing: "0.005em" }}
      >
        EvoLegal provides automated legal information and frameworks for human review. Hugo does not provide individual legal advice. Fully verified cases require human lawyer QA.
      </p>
    </div>
  );
}
