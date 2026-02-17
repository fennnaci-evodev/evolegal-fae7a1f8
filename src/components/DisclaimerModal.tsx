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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-strong rounded-xl max-w-lg w-full p-8 space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-xl">⚖</span>
              </div>
              <h2 className="text-xl font-bold text-foreground">Important Disclaimer</h2>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">EvoLegal</strong> provides{" "}
                <strong className="text-primary">GENERAL INFORMATIONAL & EDUCATIONAL RESOURCES ONLY</strong>.
              </p>
              <ul className="space-y-2 list-disc pl-5">
                <li>This is <strong className="text-foreground">NOT</strong> legal advice, representation, or a law firm.</li>
                <li>We and our Experts are <strong className="text-foreground">NOT</strong> licensed attorneys.</li>
                <li>No attorney-client relationship is created.</li>
                <li>Always consult a licensed professional for your specific situation.</li>
              </ul>
            </div>

            <div className="neon-line w-full" />

            <Button onClick={handleAccept} className="w-full" size="lg">
              I Understand & Accept
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
