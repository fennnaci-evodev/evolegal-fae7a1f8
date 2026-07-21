import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("evolegal-disclaimer-accepted");
    if (!accepted) setOpen(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("evolegal-disclaimer-accepted", "true");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "hsla(240, 20%, 4%, 0.85)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="glass-strong max-w-md w-full p-8 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scale className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-display font-semibold text-foreground">Before You Begin</h2>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              EvoLegal provides <span className="text-foreground font-medium">general informational and educational resources</span>. Our team consists of experienced consultants, not licensed attorneys. No attorney-client relationship is formed through this platform.
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              For matters requiring legal representation, we always recommend consulting a licensed professional.
            </p>

            <Button onClick={handleAccept} className="w-full" variant="hero" size="lg">
              I Understand — Let's Go
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
