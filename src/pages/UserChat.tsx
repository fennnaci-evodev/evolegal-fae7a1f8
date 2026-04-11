import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { HugoAvatar } from "@/components/HugoAvatar";
import { Button } from "@/components/ui/button";
import { Send, User, Info, ShieldCheck } from "lucide-react";
import { DocumentFactoryButton } from "@/components/DocumentFactoryButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender_role: string;
  sender_id: string;
  created_at: string;
}

// GDPR-safe pseudonyms for expert display
const EXPERT_PSEUDONYMS = [
  "Alexander M.", "Victoria S.", "Jonathan R.", "Catherine L.", "Nicholas W.",
  "Elizabeth K.", "Christopher D.", "Sophia T.", "Benjamin H.", "Isabelle F.",
  "Daniel P.", "Charlotte B.", "Sebastian G.", "Olivia N.", "Maximilian V.",
];

function getExpertPseudonym(requestId: string): string {
  let hash = 0;
  for (let i = 0; i < requestId.length; i++) {
    hash = ((hash << 5) - hash + requestId.charCodeAt(i)) | 0;
  }
  return EXPERT_PSEUDONYMS[Math.abs(hash) % EXPERT_PSEUDONYMS.length];
}

const UserChat = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [requestTitle, setRequestTitle] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const expertName = requestId ? getExpertPseudonym(requestId) : "Expert";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

  // Load request info + messages
  useEffect(() => {
    if (!requestId || !user) return;

    const loadData = async () => {
      const { data: req } = await supabase
        .from("legal_requests")
        .select("title, topic")
        .eq("id", requestId)
        .single();
      if (req) setRequestTitle((req as any).title || (req as any).topic || "Chat");

      const { data: msgs } = await supabase
        .from("request_messages")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });
      if (msgs) setMessages(msgs as any);
    };
    loadData();

    // Realtime subscription
    const channel = supabase
      .channel(`user-chat-${requestId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "request_messages", filter: `request_id=eq.${requestId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [requestId, user]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending || !user || !requestId) return;
    setSending(true);

    const { error } = await supabase.from("request_messages").insert({
      request_id: requestId,
      sender_id: user.id,
      sender_role: "user",
      content: input.trim(),
    } as any);

    if (error) {
      toast.error("Failed to send message");
    } else {
      setInput("");
    }
    setSending(false);
  }, [input, sending, user, requestId]);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
        {/* Header */}
        <div className="glass-card p-4 mb-4 flex items-center gap-3" style={{ borderRadius: "1rem" }}>
          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" style={{ color: "hsl(270, 95%, 75%)" }} />
          </div>
          <div>
            <h2 className="font-display font-semibold text-sm">
              {requestTitle || "Chat with EvoLegal Expert"}
              <span className="text-muted-foreground font-normal text-xs ml-2">· {expertName} · Your Personal Expert</span>
            </h2>
            <p className="text-xs text-muted-foreground">Your conversation is handled by {expertName} for precision</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4" style={{ overflowAnchor: "none" }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <ShieldCheck className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Waiting for expert response…</p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => {
              const isUser = msg.sender_role === "user";
              const isExpert = msg.sender_role === "admin" || msg.sender_role === "expert";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isUser ? "justify-end" : ""}`}
                >
                  {isExpert && (
                    <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1" style={{ background: "hsla(270, 95%, 75%, 0.15)" }}>
                      <ShieldCheck className="h-4 w-4" style={{ color: "hsl(270, 95%, 75%)" }} />
                    </div>
                  )}
                  {!isUser && !isExpert && <HugoAvatar size={32} animate={false} />}
                  <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm whitespace-pre-wrap leading-relaxed ${
                    isUser
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "glass rounded-bl-md"
                  }`}>
                    {!isUser && (
                      <span className="text-[10px] font-medium mb-1 block" style={{ color: isExpert ? "hsl(270, 95%, 75%)" : "hsl(var(--primary))" }}>
                        {isExpert ? "EvoLegal Expert" : "Hugo"}
                      </span>
                    )}
                    {msg.content}
                  </div>
                  {isUser && (
                    <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                      <User className="h-4 w-4 text-accent" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Document Factory + Disclaimer */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/20 mb-3">
          <div className="flex-1 flex items-center gap-2">
            <Info className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            <p className="text-[10px] text-muted-foreground/50">
              Your conversation is handled by an EvoLegal Expert. For complex personal matters, professional representation may be recommended.
            </p>
          </div>
          {messages.length >= 2 && requestId && (
            <DocumentFactoryButton
              topic={requestTitle || "Legal Topic"}
              requestId={requestId}
              conversationContext={messages.slice(-4).map(m => m.content).join("\n")}
            />
          )}
        </div>

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="glass-strong shimmer-chat-form p-3 flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type your message…"
            className="chat-input-plain flex-1 bg-transparent border-0 resize-none text-sm placeholder:text-muted-foreground focus:outline-none leading-relaxed"
            disabled={sending}
            rows={1}
            style={{ maxHeight: 120, minHeight: 36 }}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || sending} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default UserChat;
