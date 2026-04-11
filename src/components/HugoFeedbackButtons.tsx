import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HugoFeedbackButtonsProps {
  messageId: string;
  chatId: string;
  userId: string;
  existingRating?: "positive" | "negative" | null;
}

export function HugoFeedbackButtons({ messageId, chatId, userId, existingRating }: HugoFeedbackButtonsProps) {
  const [rating, setRating] = useState<"positive" | "negative" | null>(existingRating ?? null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const submitFeedback = async (newRating: "positive" | "negative", feedbackComment?: string) => {
    setSaving(true);
    try {
      if (rating) {
        // Update existing
        await supabase
          .from("hugo_feedback" as any)
          .update({ rating: newRating, comment: feedbackComment || null } as any)
          .eq("message_id", messageId)
          .eq("user_id", userId);
      } else {
        // Insert new
        await supabase
          .from("hugo_feedback" as any)
          .insert({ message_id: messageId, chat_id: chatId, user_id: userId, rating: newRating, comment: feedbackComment || null } as any);
      }
      setRating(newRating);
      setShowComment(false);
      setComment("");
    } catch (e) {
      toast.error("Failed to save feedback");
    }
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      <button
        onClick={() => submitFeedback("positive")}
        disabled={saving}
        className={`p-1 rounded-md transition-all ${
          rating === "positive" ? "text-green-400 bg-green-400/10" : "text-muted-foreground/40 hover:text-green-400 hover:bg-green-400/5"
        }`}
      >
        <ThumbsUp className="h-3 w-3" />
      </button>
      <button
        onClick={() => { if (!showComment) setShowComment(true); else submitFeedback("negative"); }}
        disabled={saving}
        className={`p-1 rounded-md transition-all ${
          rating === "negative" ? "text-red-400 bg-red-400/10" : "text-muted-foreground/40 hover:text-red-400 hover:bg-red-400/5"
        }`}
      >
        <ThumbsDown className="h-3 w-3" />
      </button>

      <AnimatePresence>
        {showComment && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center gap-1 overflow-hidden"
          >
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What could be better?"
              className="bg-muted/30 text-xs rounded-md px-2 py-1 border-0 outline-none w-40 placeholder:text-muted-foreground/40"
              onKeyDown={(e) => { if (e.key === "Enter") submitFeedback("negative", comment); }}
              disabled={saving}
            />
            <button onClick={() => submitFeedback("negative", comment)} disabled={saving} className="p-1 text-muted-foreground hover:text-primary">
              <Send className="h-3 w-3" />
            </button>
            <button onClick={() => setShowComment(false)} className="p-1 text-muted-foreground hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
