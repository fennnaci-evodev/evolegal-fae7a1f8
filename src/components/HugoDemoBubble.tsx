import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";
import { HugoAvatar } from "@/components/HugoAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

const DEMO_RESPONSES: Record<string, string> = {
  default: "Great question! I'd love to dig into that with you. Sign up for free to get my full, detailed insights on any legal topic — from tenant rights to crypto regulation.",
};

export function HugoDemoBubble() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [replied, setReplied] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    setReplied(true);
    setInput("");
  };

  return (
    <>
      {/* Floating trigger */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: 2, type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            style={{ boxShadow: "0 0 24px hsla(186, 100%, 50%, 0.3)" }}
            aria-label="Chat with Hugo"
          >
            <MessageCircle className="h-6 w-6 text-primary-foreground" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat preview */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-80 glass-strong overflow-hidden"
            style={{ borderRadius: "1.25rem" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/20">
              <div className="flex items-center gap-2">
                <HugoAvatar size={28} animate={false} />
                <span className="font-display font-semibold text-sm">Hugo</span>
              </div>
              <button onClick={() => { setOpen(false); setReplied(false); }} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Close chat">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
              <div className="glass rounded-xl px-4 py-3 text-sm text-foreground leading-relaxed">
                Hey there! I'm Hugo, your Expert Manager. Ask me anything about US or UK legal topics — I'm here to help.
              </div>

              {replied && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-xl px-4 py-3 text-sm text-foreground leading-relaxed"
                >
                  {DEMO_RESPONSES.default}
                  <Link to="/auth" className="block mt-3">
                    <Button variant="hero" size="sm" className="w-full text-xs">
                      Get Started Free
                    </Button>
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Input */}
            {!replied && (
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="p-3 border-t border-border/20 flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me a question..."
                  className="bg-transparent border-0 focus-visible:ring-0 text-sm"
                  aria-label="Demo message input"
                />
                <Button type="submit" size="icon" disabled={!input.trim()} className="shrink-0 h-8 w-8" aria-label="Send">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
