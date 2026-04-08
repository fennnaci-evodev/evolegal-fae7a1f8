import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Cookie } from "lucide-react";

const COOKIE_KEY = "evolegal-cookie-consent";

export type ConsentLevel = "all" | "necessary" | null;

export function getConsentLevel(): ConsentLevel {
  try {
    const val = localStorage.getItem(COOKIE_KEY);
    if (val === "all" || val === "necessary") return val;
    return null;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getConsentLevel()) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (level: ConsentLevel) => {
    try {
      localStorage.setItem(COOKIE_KEY, level!);
    } catch {}
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[100]"
        >
          <div className="glass-card p-5 space-y-3 border border-border/30 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm mb-1 flex items-center gap-1.5">
                  <Cookie className="h-3.5 w-3.5 text-muted-foreground" />
                  Cookie & Data Security
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We use secure cookies to keep your conversations, documents, and memories safe and organized. 
                  This helps us provide better support and prevents data loss. Accept cookies to continue?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => accept("necessary")}
              >
                Necessary Only
              </Button>
              <Button
                variant="hero"
                size="sm"
                className="text-xs"
                onClick={() => accept("all")}
              >
                Accept All
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
