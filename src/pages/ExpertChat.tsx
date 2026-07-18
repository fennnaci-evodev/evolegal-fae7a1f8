import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ScalesOfJustice } from "@/components/ScalesOfJustice";
import { HugoAvatar } from "@/components/HugoAvatar";
import { Button } from "@/components/ui/button";
import { Send, User, Info, Mic, MicOff, Plus, Trash2, MessageCircle, FileText, ChevronDown, PanelLeftClose, PanelLeftOpen, Pencil } from "lucide-react";
import { HugoFeedbackButtons } from "@/components/HugoFeedbackButtons";
import { HugoCopyButton } from "@/components/HugoCopyButton";
import { HugoModeBadge, getHugoModePref, type HugoMode } from "@/components/HugoModeBadge";
import { DocumentFactoryButton } from "@/components/DocumentFactoryButton";
import { isRateLimited } from "@/lib/security";
import { InlineELoader } from "@/components/InlineELoader";
import { HugoTypingMessage } from "@/components/HugoTypingMessage";
import { HugoUPLNotice } from "@/components/HugoUPLNotice";
import { HugoConsiliumLoader } from "@/components/HugoConsiliumLoader";
import { HugoConsiliumSuggestion } from "@/components/HugoConsiliumSuggestion";
import { setHugoModePref } from "@/components/HugoModeBadge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useHugoChat, fetchHugoChats, deleteHugoChat, type HugoChat } from "@/hooks/useHugoChat";
import { Skeleton } from "@/components/ui/skeleton";
import { HugoChatTopicChips } from "@/components/HugoChatTopicChips";
import { HugoChatRecentTopics } from "@/components/HugoChatRecentTopics";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { HugoRecallBanner } from "@/components/HugoRecallBanner";
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
    currentTitle,
    sendMessage,
    editLastMessage,
    startNewChat,
    setCurrentChatId,
    loadMessages,
    newAssistantIds,
  } = useHugoChat(paramChatId || null);

  const [input, setInput] = useState("");
  const [editingMode, setEditingMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [chatList, setChatList] = useState<HugoChat[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try { return localStorage.getItem("evo_chatlist_open") !== "false"; } catch { return true; }
  });
  const [headerExpanded, setHeaderExpanded] = useState(false);
  const [showDocFactory, setShowDocFactory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const isMobile = useIsMobile();

  // Load/refresh chat list when chatId or title changes
  useEffect(() => {
    if (!user) return;
    fetchHugoChats().then(setChatList);
  }, [user, currentChatId, currentTitle]);

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
    setEditingMode(false);
    const result = await sendMessage(text, { mode: getHugoModePref() });

    // Navigate to the chat URL if we just created a new chat
    if (result?.chatId && !paramChatId) {
      navigate(`/dashboard/hugo/${result.chatId}`, { replace: true });
    }
  };

  const handleEditLastMessage = async () => {
    const text = await editLastMessage();
    if (text) {
      setInput(text);
      setEditingMode(true);
      textareaRef.current?.focus();
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
      <div className="h-[calc(100vh-6rem)] flex">
        {/* Collapsible Chat History Sidebar - desktop */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 224, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="hidden md:flex flex-col shrink-0 overflow-hidden"
            >
              <div className="flex flex-col h-full w-56 pr-3">
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Separator + toggle between sidebar and chat */}
        <div className="hidden md:flex flex-col items-center shrink-0 mr-3">
          <div className="flex-1 w-px" style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--border) / 0.6) 15%, hsl(var(--border) / 0.6) 85%, transparent)" }} />
          <button
            onClick={() => {
              const next = !sidebarOpen;
              setSidebarOpen(next);
              try { localStorage.setItem("evo_chatlist_open", String(next)); } catch {}
            }}
            className="my-2 flex items-center justify-center h-7 w-7 rounded-full border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all hover:bg-muted/20"
            aria-label={sidebarOpen ? "Hide chat list" : "Show chat list"}
          >
            {sidebarOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
          </button>
          <div className="flex-1 w-px" style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--border) / 0.6) 15%, hsl(var(--border) / 0.6) 85%, transparent)" }} />
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Collapsible Header */}
          <button
            onClick={() => setHeaderExpanded(!headerExpanded)}
            className="glass-card px-4 py-2.5 mb-3 flex items-center gap-3 w-full text-left transition-all"
            style={{ borderRadius: "1rem" }}
          >
            <HugoAvatar size={isMobile ? 39 : 50} />
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-sm truncate">
                {currentChatId && currentTitle !== "New Chat" ? currentTitle : "Chat with Hugo"}
                <span className="text-muted-foreground font-normal text-xs ml-1.5">· Hugo</span>
              </p>
              <AnimatePresence>
                {(headerExpanded || !isMobile) && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="text-[10px] text-muted-foreground leading-relaxed overflow-hidden"
                  >
                    Every response is carefully reviewed by our Experts — structured with Options → Risks → Resources. You will get your answer as soon as possible. It always depends on the complexity of your case.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform md:hidden ${headerExpanded ? "rotate-180" : ""}`} />
            <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={(e) => { e.stopPropagation(); setShowSidebar(!showSidebar); }}>
              <MessageCircle className="h-4 w-4" />
            </Button>
          </button>

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
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3" style={{ overflowAnchor: "none" }}>
            {historyLoading && (
              <div className="space-y-3 p-4">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-12 w-1/2 ml-auto" />
                <Skeleton className="h-12 w-2/3" />
              </div>
            )}

            {!historyLoading && messages.length === 0 && !streaming && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-5">
                <HugoRecallBanner onResume={handleSelectChat} hidden={!!currentChatId} />
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
              {messages.map((msg, idx) => {
                const isLastUserMsg = msg.role === "user" && idx === messages.length - 1 ||
                  (msg.role === "user" && idx === messages.length - 2 && messages[messages.length - 1]?.role === "assistant");
                return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group/msg flex gap-2 sm:gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="shrink-0">
                      <HugoAvatar size={isMobile ? 36 : 48} animate={false} talking={streaming && msg.id === messages[messages.length - 1]?.id} />
                    </div>
                  )}
                  <div className={`flex flex-col min-w-0 ${msg.role === "user" ? "items-end" : "items-start"} max-w-[calc(100%-3rem)] sm:max-w-[85%]`}>
                    <div className={`w-fit max-w-full rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-sm whitespace-pre-wrap leading-relaxed break-words ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "glass rounded-bl-md"
                    }`}>
                      {msg.role === "assistant" ? (
                        <HugoTypingMessage
                          content={msg.content}
                          messageId={msg.id}
                          isStreaming={streaming && idx === messages.length - 1}
                          isNew={newAssistantIds.has(msg.id)}
                        />
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.role === "user" && isLastUserMsg && !streaming && (
                      <button
                        onClick={handleEditLastMessage}
                        className="self-end mt-1 flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-opacity opacity-0 group-hover/msg:opacity-100"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                    )}
                    {msg.role === "assistant" && (
                      <div className="flex items-center justify-between gap-2 mt-1 w-full flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {user && currentChatId ? (
                            <HugoFeedbackButtons messageId={msg.id} chatId={currentChatId} userId={user.id} />
                          ) : null}
                          <HugoModeBadge consilium={(msg as any).consilium} />
                        </div>
                        <HugoCopyButton content={msg.content} />
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className={`rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-1 ${isMobile ? "h-9 w-9" : "h-12 w-12"}`} style={{ imageRendering: "auto" }}>
                      <User className={isMobile ? "h-4 w-4 text-accent" : "h-6 w-6 text-accent"} />
                    </div>
                  )}
                </motion.div>
                );
              })}
            </AnimatePresence>

            {streaming && messages[messages.length - 1]?.role === "user" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-start">
                <HugoAvatar size={isMobile ? 36 : 48} animate={false} talking />
                {getHugoModePref() === "consilium" ? (
                  <div className="flex-1 min-w-0 max-w-[calc(100%-3rem)] sm:max-w-[85%]">
                    <HugoConsiliumLoader />
                  </div>
                ) : (
                  <div className="glass rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                    <InlineELoader size={24} />
                    <span className="text-xs text-muted-foreground/60">Hugo is thinking…</span>
                  </div>
                )}
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Permanent UPL Notice — always visible, keeps bubbles clean */}
          <div className="mb-2">
            <HugoUPLNotice />
          </div>

          {/* Input */}
          {editingMode && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-muted-foreground">
              <Pencil className="h-3 w-3" />
              <span>Editing message</span>
              <button onClick={() => { setEditingMode(false); setInput(""); }} className="ml-auto hover:text-foreground">Cancel</button>
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="glass-strong shimmer-chat-form p-2.5 flex items-end gap-2 relative">
            <Button
              type="button" size="icon" variant="ghost"
              onClick={toggleVoice}
              className={`shrink-0 h-8 w-8 ${listening ? "text-primary" : "text-muted-foreground"}`}
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
            {messages.length >= 2 && currentTitle && (
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
            <Button type="submit" size="icon" disabled={!input.trim() || streaming} className="shrink-0 h-8 w-8">
              <Send className="h-4 w-4" />
            </Button>
          </form>
          {/* Document Factory Modal (triggered by icon) */}
          {showDocFactory && currentTitle && (
            <DocumentFactoryButton
              topic={currentTitle}
              chatId={currentChatId}
              conversationContext={messages.slice(-4).map(m => m.content).join("\n")}
              autoOpen
              onClose={() => setShowDocFactory(false)}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExpertChat;
