import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { HugoAvatar } from "@/components/HugoAvatar";
import { Button } from "@/components/ui/button";
import { Send, User, Info, ShieldCheck, FileText, ChevronDown } from "lucide-react";
import { DocumentFactoryButton } from "@/components/DocumentFactoryButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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
  const [headerExpanded, setHeaderExpanded] = useState(false);
  const [showDocFactory, setShowDocFactory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const expertName = requestId ? getExpertPseudonym(requestId) : "Expert";
  const isMobile = useIsMobile();

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
        {/* Collapsible Header */}
        <button
          onClick={() => setHeaderExpanded(!headerExpanded)}
          className="glass-card px-4 py-2.5 mb-3 flex items-center gap-3 w-full text-left transition-all"
          style={{ borderRadius: "1rem" }}
        >
          <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4" style={{ color: "hsl(270, 95%, 75%)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-sm truncate">
              {requestTitle || "Chat with EvoLegal Expert"}
              <span className="text-muted-foreground font-normal text-xs ml-1.5">· {expertName}</span>
            </p>
            <AnimatePresence>
              {(headerExpanded || !isMobile) && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="text-[10px] text-muted-foreground leading-relaxed overflow-hidden"
                >
                  Your conversation is handled by {expertName} for precision. For complex personal matters, professional representation may be recommended.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform md:hidden ${headerExpanded ? "rotate-180" : ""}`} />
        </button>

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
                  {!isUser && !isExpert && <HugoAvatar size={42} animate={false} />}
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

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="glass-strong shimmer-chat-form p-2.5 flex items-end gap-2">
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
          {messages.length >= 2 && requestId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button" size="icon" variant="ghost"
                  className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => setShowDocFactory(true)}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Generate Document</TooltipContent>
            </Tooltip>
          )}
          <Button type="submit" size="icon" disabled={!input.trim() || sending} className="shrink-0 h-8 w-8">
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {showDocFactory && requestId && (
          <DocumentFactoryButton
            topic={requestTitle || "Legal Topic"}
            requestId={requestId}
            conversationContext={messages.slice(-4).map(m => m.content).join("\n")}
            autoOpen
            onClose={() => setShowDocFactory(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserChat;
