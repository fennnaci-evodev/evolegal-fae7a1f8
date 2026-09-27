import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HugoAvatar } from "@/components/HugoAvatar";
import { Send, SkipForward } from "lucide-react";

interface HugoClarificationModalProps {
  open: boolean;
  hugoMessage: string;
  onSubmitAnswer: (answer: string) => void;
  onSkip: () => void;
  loading?: boolean;
}

export const HugoClarificationModal = ({
  open,
  hugoMessage,
  onSubmitAnswer,
  onSkip,
  loading = false,
}: HugoClarificationModalProps) => {
  const [answer, setAnswer] = useState("");

  const handleSend = () => {
    if (!answer.trim()) return;
    onSubmitAnswer(answer.trim());
    setAnswer("");
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="glass-card sm:max-w-lg border-border/30 no-hover-scale" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <HugoAvatar size={39} />
            Validate the Input
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Add the requested context or continue with the current record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={hugoMessage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="glass rounded-xl p-4 text-sm text-foreground leading-relaxed"
            >
              {hugoMessage}
            </motion.div>
          </AnimatePresence>

          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
               placeholder="Add precise context…"
            rows={3}
            className="bg-muted/30 border-border/50 resize-none text-sm"
            disabled={loading}
          />

          <div className="flex gap-2">
            <Button
              variant="hero"
              size="default"
              className="flex-1"
              onClick={handleSend}
              disabled={loading || !answer.trim()}
            >
               {loading ? "Validating…" : <>Validate <Send className="ml-1.5 h-3.5 w-3.5" /></>}
            </Button>
            <Button
              variant="ghost"
              size="default"
              onClick={onSkip}
              disabled={loading}
              className="text-muted-foreground"
            >
               Continue As-Is <SkipForward className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
