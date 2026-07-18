import { useState, useEffect, useRef } from "react";
import { Zap, Brain, Sparkles, ChevronDown } from "lucide-react";

export type HugoMode = "auto" | "blitz" | "consilium";

const STORAGE_KEY = "hugo_mode_pref";

export function getHugoModePref(): HugoMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "blitz" || v === "consilium" || v === "auto") return v;
  } catch { /* ignore */ }
  return "auto";
}

export function setHugoModePref(m: HugoMode) {
  try { localStorage.setItem(STORAGE_KEY, m); } catch { /* ignore */ }
}

interface HugoModeBadgeProps {
  /** Whether this specific message was produced in Consilium mode */
  consilium?: boolean;
  /** Called when user changes preferred mode for future messages */
  onChange?: (mode: HugoMode) => void;
}

const OPTIONS: { key: HugoMode; label: string; icon: React.ComponentType<any>; hint: string; color: string }[] = [
  { key: "auto", label: "Auto", icon: Sparkles, hint: "Hugo decides", color: "hsl(186 100% 60%)" },
  { key: "blitz", label: "Blitz", icon: Zap, hint: "Fast circuit", color: "hsl(48 100% 65%)" },
  { key: "consilium", label: "Consilium", icon: Brain, hint: "Deep deliberation", color: "hsl(270 95% 75%)" },
];

/**
 * Compact chooser badge for Hugo's thinking mode. Sits inline with feedback/copy.
 * Shows the mode the current message was produced in (when known) plus a menu
 * to steer the next reply.
 */
export function HugoModeBadge({ consilium, onChange }: HugoModeBadgeProps) {
  const [pref, setPref] = useState<HugoMode>(() => getHugoModePref());
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const activeKey: HugoMode = consilium ? "consilium" : (pref === "consilium" ? "consilium" : "blitz");
  const active = OPTIONS.find((o) => o.key === activeKey) ?? OPTIONS[0];
  const ActiveIcon = active.icon;

  const pick = (m: HugoMode) => {
    setPref(m);
    setHugoModePref(m);
    onChange?.(m);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-label={`Thinking mode: ${active.label}. Click to change.`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium leading-none transition-colors duration-150 border backdrop-blur-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
        style={{
          borderColor: `${active.color.replace("hsl", "hsla").replace(")", " / 0.3)")}`,
          background: `${active.color.replace("hsl", "hsla").replace(")", " / 0.06)")}`,
          color: active.color,
          minWidth: 74,
        }}
      >
        <ActiveIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span>{active.label}</span>
        <ChevronDown className="h-2.5 w-2.5 opacity-70" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute z-30 bottom-full mb-1.5 right-0 min-w-[168px] rounded-xl p-1 glass-strong shadow-lg"
          style={{ border: "1px solid hsl(var(--border) / 0.4)" }}
        >
          {OPTIONS.map((o) => {
            const Icon = o.icon;
            const selected = pref === o.key;
            return (
              <button
                key={o.key}
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => pick(o.key)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                  selected ? "bg-primary/10" : "hover:bg-muted/30"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: o.color }} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold leading-tight" style={{ color: selected ? o.color : "hsl(var(--foreground))" }}>{o.label}</div>
                  <div className="text-[9px] text-muted-foreground leading-tight">{o.hint}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
