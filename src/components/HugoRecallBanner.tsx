import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { recoverLastChat } from "@/lib/hugoMemory";
import { supabase } from "@/integrations/supabase/client";

interface RecallData {
  chatId: string;
  title?: string;
  summary?: string;
  topics?: string[];
  updated_at?: string;
}

interface Props {
  onResume: (chatId: string) => void;
  /** Hide while a chat is already active */
  hidden?: boolean;
}

/**
 * Hugo Memory Recovery Banner.
 * Shown when the user returns and Hugo has prior context to offer
 * ("Last time we discussed your crypto holdings in the US — continue?").
 * Fails silently when the memory tables aren't reachable.
 */
export function HugoRecallBanner({ onResume, hidden }: Props) {
  const { user } = useAuth();
  const [data, setData] = useState<RecallData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || hidden) return;
    let cancelled = false;

    (async () => {
      try {
        const chatId = await recoverLastChat(user.id);
        if (!chatId || cancelled) return;

        const { data: chat } = await supabase
          .from("hugo_chats" as any)
          .select("id, title, updated_at")
          .eq("id", chatId)
          .maybeSingle();
        if (!chat || cancelled) return;

        const { data: artifact } = await supabase
          .from("hugo_chat_artifacts" as any)
          .select("summary, topics")
          .eq("chat_id", chatId)
          .maybeSingle();

        if (cancelled) return;
        setData({
          chatId,
          title: (chat as any).title,
          updated_at: (chat as any).updated_at,
          summary: (artifact as any)?.summary,
          topics: (artifact as any)?.topics,
        });
      } catch {
        /* memory tables may not exist yet — silent */
      }
    })();

    return () => { cancelled = true; };
  }, [user, hidden]);

  if (!data || dismissed || hidden) return null;

  const topicLine = data.topics?.length
    ? `we discussed ${data.topics.slice(0, 2).join(" and ")}`
    : data.title && data.title !== "New Chat"
      ? `we talked about "${data.title}"`
      : "we had a conversation in progress";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="relative mx-auto mb-4 max-w-3xl rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/8 via-primary/5 to-transparent backdrop-blur-sm px-4 py-3"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-primary/15 p-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground/90">
              Welcome back — last time {topicLine}.
              {data.summary ? <span className="block mt-0.5 text-xs text-muted-foreground line-clamp-2">{data.summary}</span> : null}
            </p>
            <button
              onClick={() => onResume(data.chatId)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Continue from there
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
