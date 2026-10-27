import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Moon, Sun, Volume2, Sparkles, Zap, Brain, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { isSoundEnabled, playSwitch, setSoundEnabled } from "@/lib/sound";
import { setHugoModePref, useHugoMode, type HugoMode } from "@/components/HugoModeBadge";

const OPEN_EVENT = "evo-open-quick-prefs";

/** Open Quick Preferences from anywhere (buttons, shortcuts). */
export function openQuickPreferences() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

/** Header trigger with a 44px hit area. */
export function QuickPreferencesButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); openQuickPreferences(); }}
      aria-label="Open quick preferences"
      title="Quick preferences (Ctrl+,)"
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      <SlidersHorizontal className="h-[18px] w-[18px]" />
    </button>
  );
}

const MODES: { key: HugoMode; label: string; icon: typeof Sparkles }[] = [
  { key: "auto", label: "Auto", icon: Sparkles },
  { key: "blitz", label: "Blitz", icon: Zap },
  { key: "consilium", label: "Consilium", icon: Brain },
];

function PreferencesBody({ onNavigate }: { onNavigate: () => void }) {
  const { theme, setTheme } = useTheme();
  const mode = useHugoMode();
  const [sound, setSound] = useState(isSoundEnabled);
  const row = "flex min-h-[52px] items-center justify-between gap-4 px-1";

  return (
    <div className="space-y-1">
      <div className={row}>
        <span className="flex items-center gap-3 text-sm"><Volume2 className="h-4 w-4 text-muted-foreground" />Sound effects</span>
        <Switch
          checked={sound}
          aria-label="Sound effects"
          onCheckedChange={(v) => { setSoundEnabled(v); setSound(v); if (v) playSwitch(true); }}
        />
      </div>

      <div className={row}>
        <span className="flex items-center gap-3 text-sm">
          {theme === "dark" ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
          Appearance
        </span>
        <div role="radiogroup" aria-label="Appearance" className="flex rounded-full border border-border/40 p-0.5">
          {(["dark", "light"] as const).map((t) => (
            <button
              key={t}
              role="radio"
              aria-checked={theme === t}
              onClick={() => { setTheme(t); playSwitch(); }}
              className={`h-10 min-w-[64px] rounded-full px-3 text-xs capitalize transition-colors ${theme === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 px-1 pt-2">
        <span className="text-sm">Hugo mode</span>
        <div role="radiogroup" aria-label="Hugo mode" className="grid grid-cols-3 gap-1 rounded-full border border-border/40 p-0.5">
          {MODES.map((m) => (
            <button
              key={m.key}
              role="radio"
              aria-checked={mode === m.key}
              onClick={() => { setHugoModePref(m.key); playSwitch(); }}
              className={`flex h-10 items-center justify-center gap-1.5 rounded-full text-xs transition-colors ${mode === m.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <m.icon className="h-3.5 w-3.5" />{m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-border/30 pt-2">
        <Link
          to="/dashboard/settings?tab=privacy"
          onClick={onNavigate}
          className="flex min-h-[52px] items-center justify-between gap-3 rounded-xl px-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="flex items-center gap-3"><ShieldCheck className="h-4 w-4" />Privacy, consent and account</span>
          <ChevronRight className="h-4 w-4 opacity-60" />
        </Link>
      </div>
    </div>
  );
}

/** Single mounted instance (in DashboardLayout) + global Ctrl/Cmd+, and Ctrl/Cmd+K shortcuts. */
export function QuickPreferences() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      if (e.key === "," || e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener(OPEN_EVENT, onOpen); window.removeEventListener("keydown", onKey); };
  }, []);

  const close = () => setOpen(false);
  const desc = "Applies instantly. Full account settings are one tap away.";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="border-border/40 bg-background px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <DrawerHeader className="px-1 text-left">
            <DrawerTitle className="text-base">Quick preferences</DrawerTitle>
            <DrawerDescription className="text-xs">{desc}</DrawerDescription>
          </DrawerHeader>
          {open && <PreferencesBody onNavigate={close} />}
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm border-border/40 bg-background">
        <DialogHeader>
          <DialogTitle className="text-base">Quick preferences</DialogTitle>
          <DialogDescription className="text-xs">{desc} <kbd className="ml-1 rounded border border-border/50 px-1 text-[10px]">Ctrl ,</kbd></DialogDescription>
        </DialogHeader>
        {open && <PreferencesBody onNavigate={close} />}
      </DialogContent>
    </Dialog>
  );
}
