import { MessageCircle } from "lucide-react";
import type { HugoChat } from "@/hooks/useHugoChat";

interface Props {
  chats: HugoChat[];
  onSelect: (id: string) => void;
  currentChatId: string | null;
}

export function HugoChatRecentTopics({ chats, onSelect, currentChatId }: Props) {
  if (chats.length === 0) return null;

  return (
    <div className="glass rounded-xl p-3">
      <h4 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">
        Recent Topics
      </h4>
      <div className="space-y-0.5 max-h-40 overflow-y-auto">
        {chats.slice(0, 8).map(chat => (
          <button
            key={chat.id}
            onClick={() => onSelect(chat.id)}
            className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-left transition-all hover:bg-muted/20 ${
              currentChatId === chat.id ? "text-primary bg-primary/5" : "text-muted-foreground"
            }`}
          >
            <MessageCircle className="h-3 w-3 shrink-0" />
            <span className="truncate">{chat.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
