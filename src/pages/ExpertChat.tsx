import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ScalesOfJustice } from "@/components/ScalesOfJustice";
import { HugoAvatar } from "@/components/HugoAvatar";
import { Button } from "@/components/ui/button";
import { Send, User, Info, Mic, MicOff, Plus, Trash2, MessageCircle } from "lucide-react";
import { isRateLimited } from "@/lib/security";
import { InlineELoader } from "@/components/InlineELoader";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useHugoChat, fetchHugoChats, deleteHugoChat, type HugoChat } from "@/hooks/useHugoChat";
import { Skeleton } from "@/components/ui/skeleton";
import { HugoChatTopicChips } from "@/components/HugoChatTopicChips";
import { HugoChatRecentTopics } from "@/components/HugoChatRecentTopics";

const ExpertChat = () => {
  const { chatId: paramChatId } = useParams<{ chatId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fromBubble = searchParams.get("from") === "bubble";

  const {
    messages,
    streaming,
    historyLoading,
    currentChatId,
    sendMessage,
    startNewChat,
    setCurrentChatId,
    loadMessages,
  } = useHugoChat(paramChatId || null);

  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [chatList, setChatList] = useState<HugoChat[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load chat list
  useEffect(() => {
    if (!user) return;
    fetchHugoChats().then(setChatList);
  }, [user, currentChatId]);

  // Handle bubble history transfer
  useEffect(() => {
    if (fromBubble) {
      try {
        const raw = sessionStorage.getItem("evo_bubble_chat_id");
        if (raw) {
          sessionStorage.removeItem("evo_bubble_chat_id");
          navigate(`/dashboard/hugo/${raw}`, { replace: true });
        }
      } catch { /* ignore */ }
    }
  }, [fromBubble, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || streaming) return;
    if (isRateLimited("hugo_chat", 15, 60_000)) {
      toast.error("Too many messages — please wait a moment.");
      return;
    }

    const text = input;
    setInput("");
    const result = await sendMessage(text);

    // Navigate to the chat URL if we just created a new chat
    if (result?.chatId && !paramChatId) {
      navigate(`/dashboard/hugo/${result.chatId}`, { replace: true });
    }
  };

  const handleNewChat = () => {
    startNewChat();
    navigate("/dashboard/chat", { replace: true });
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    loadMessages(id);
    navigate(`/dashboard/hugo/${id}`, { replace: true });
    setShowSidebar(false);
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    const ok = await deleteHugoChat(id);
    if (ok) {
      setChatList(prev => prev.filter(c => c.id !== id));
      if (currentChatId === id) handleNewChat();
      toast.success("Chat deleted");
    }
  };

  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto h-[calc(100vh-6rem)] flex gap-3">
        {/* Chat History Sidebar - desktop */}
        <div className="hidden md:flex flex-col w-56 shrink-0">
          <Button variant="outline" size="sm" className="mb-3 w-full justify-start gap-2" onClick={handleNewChat}>
            <Plus className="h-3.5 w-3.5" /> New Chat
          </Button>
          <div className="flex-1 overflow-y-auto space-y-1">
            {chatList.map(chat => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-xs cursor-pointer transition-all hover:bg-muted/30 ${
                  currentChatId === chat.id ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                <MessageCircle className="h-3 w-3 shrink-0" />
                <span className="flex-1 truncate">{chat.title}</span>
                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="glass-card p-4 mb-4 flex items-center gap-3" style={{ borderRadius: "1rem" }}>
            <HugoAvatar size={44} />
            <div className="flex-1">
              <h2 className="font-display font-semibold">Chat with Hugo <span className="text-muted-foreground font-normal text-xs">· AI Expert Manager</span></h2>
              <p className="text-xs text-muted-foreground">Every response is carefully reviewed by our Experts — structured with Options → Risks → Resources.{"\n"}We deeply care about accuracy and your legal security.</p>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowSidebar(!showSidebar)}>
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile sidebar overlay */}
          <AnimatePresence>
            {showSidebar && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="md:hidden glass-strong rounded-xl p-3 mb-4 space-y-1 max-h-48 overflow-y-auto"
              >
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 mb-2" onClick={handleNewChat}>
                  <Plus className="h-3.5 w-3.5" /> New Chat
                </Button>
                {chatList.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-xs cursor-pointer ${
                      currentChatId === chat.id ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <MessageCircle className="h-3 w-3 shrink-0" />
                    <span className="flex-1 truncate">{chat.title}</span>
                    <button onClick={(e) => handleDeleteChat(chat.id, e)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4" style={{ overflowAnchor: "none" }}>
            {historyLoading && (
              <div className="space-y-3 p-4">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-12 w-1/2 ml-auto" />
                <Skeleton className="h-12 w-2/3" />
              </div>
            )}

            {!historyLoading && messages.length === 0 && !streaming && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-5">
                <ScalesOfJustice />
                <div>
                  <h3 className="text-lg font-display font-semibold mb-1">Talk to Hugo</h3>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Ask about legal processes, terms, or concepts. Hugo provides detailed, structured insights.
                  </p>
                </div>
                <HugoChatTopicChips onSelect={(q) => setInput(q)} />
                {chatList.length > 0 && (
                  <HugoChatRecentTopics chats={chatList} onSelect={handleSelectChat} currentChatId={currentChatId} />
                )}
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && <HugoAvatar size={32} animate={false} />}
                  <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "glass rounded-bl-md"
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                      <User className="h-4 w-4 text-accent" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {streaming && messages[messages.length - 1]?.role === "user" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-center">
                <HugoAvatar size={32} animate={false} />
                <div className="glass rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                  <InlineELoader size={24} />
                  <span className="text-xs text-muted-foreground/60">Hugo is thinking…</span>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Disclaimer */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/20 mb-3">
            <Info className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            <p className="text-[10px] text-muted-foreground/50">
              Hugo works hard on every response. For complex personal matters, professional representation may be recommended.
            </p>
          </div>

          {/* Input */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="glass-strong shimmer-chat-form p-3 flex items-end gap-3">
            <Button
              type="button" size="icon" variant="ghost"
              onClick={toggleVoice}
              className={`shrink-0 ${listening ? "text-primary" : "text-muted-foreground"}`}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask Hugo about a legal topic..."
              className="chat-input-plain flex-1 bg-transparent border-0 resize-none text-sm placeholder:text-muted-foreground focus:outline-none leading-relaxed"
              disabled={streaming}
              rows={1}
              style={{ maxHeight: 120, minHeight: 36 }}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || streaming} className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExpertChat;
