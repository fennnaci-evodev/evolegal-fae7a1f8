import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, LogIn } from "lucide-react";
import { HugoAvatar } from "@/components/HugoAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineELoader } from "@/components/InlineELoader";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { lovable } from "@/integrations/lovable/index";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hugo-chat`;
const MESSAGES_BEFORE_CHOICE = 3; // user messages before showing choice

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function HugoDemoBubble() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [showChoice, setShowChoice] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const userMsgCount = messages.filter((m) => m.role === "user").length;
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // Stream from the real hugo-chat edge function
  const streamReply = useCallback(async (allMsgs: Msg[]) => {
    const apiMessages = allMsgs.map((m) => ({ role: m.role, content: m.content }));
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: apiMessages }),
    });

    if (!resp.ok || !resp.body) throw new Error("Hugo unavailable");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let full = "";

    const update = (text: string) => {
      full = text;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: full } : m));
        }
        return [...prev, { id: Date.now().toString(), role: "assistant", content: full }];
      });
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") return;
        try {
          const c = JSON.parse(json).choices?.[0]?.delta?.content;
          if (c) { full += c; update(full); }
        } catch { buf = line + "\n" + buf; break; }
      }
    }
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    // Guest limit: allow 1 message without auth, then prompt
    if (!user && userMsgCount >= 1) {
      setShowAuthPrompt(true);
      return;
    }

    const userMsg: Msg = { id: Date.now().toString(), role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setStreaming(true);

    try {
      await streamReply(updated);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "I'm having a moment — please try again shortly." },
      ]);
    } finally {
      setStreaming(false);
      // Check if we should show the choice overlay
      const newUserCount = updated.filter((m) => m.role === "user").length;
      if (newUserCount >= MESSAGES_BEFORE_CHOICE && user && !showChoice) {
        // Small delay so the reply renders first
        setTimeout(() => setShowChoice(true), 800);
      }
    }
  };

  const handleContinueHugo = () => setShowChoice(false);

  const handleConnectExpert = () => {
    // Save conversation to sessionStorage for the expert chat to pick up
    sessionStorage.setItem("evo_bubble_history", JSON.stringify(messages));
    setOpen(false);
    navigate("/dashboard/chat?from=bubble");
  };

  const handleGoogleSignIn = async () => {
    await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
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

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 glass-strong overflow-hidden flex flex-col"
            style={{ borderRadius: "1.25rem", maxHeight: "min(520px, 80vh)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/20 shrink-0">
              <div className="flex items-center gap-2">
                <HugoAvatar size={28} animate={false} />
                <span className="font-display font-semibold text-sm">Hugo</span>
                <span className="text-[10px] text-muted-foreground">· Expert Manager</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {/* Intro */}
              <div className="glass rounded-xl px-4 py-3 text-sm text-foreground leading-relaxed">
                Hey there! I'm Hugo, your Expert Manager. Ask me anything about US or UK legal topics — I'm here to help.
              </div>

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "glass rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {streaming && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-2">
                  <InlineELoader size={22} />
                  <span className="text-[10px] text-muted-foreground/60">Hugo is thinking…</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Choice overlay */}
            <AnimatePresence>
              {showChoice && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute inset-x-0 bottom-0 p-4 glass-strong border-t border-border/20"
                  style={{ borderRadius: "0 0 1.25rem 1.25rem" }}
                >
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    Want to keep chatting or connect with an EvoLegal expert?
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={handleContinueHugo}
                      className="w-full text-xs border border-primary/30"
                      style={{ boxShadow: "0 0 12px hsla(186, 100%, 50%, 0.15)" }}
                      aria-label="Continue chatting with Hugo"
                    >
                      Continue with Hugo
                    </Button>
                    <Button
                      variant="hero"
                      size="sm"
                      onClick={handleConnectExpert}
                      className="w-full text-xs"
                      aria-label="Connect with an EvoLegal Expert"
                    >
                      Connect EvoLegal Expert
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Auth prompt overlay (guests only) */}
            <AnimatePresence>
              {showAuthPrompt && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-center justify-center"
                  style={{ background: "hsla(0, 0%, 0%, 0.6)", backdropFilter: "blur(6px)", borderRadius: "1.25rem" }}
                >
                  <div className="glass-strong rounded-xl p-5 mx-4 text-center space-y-3 max-w-[280px]">
                    <LogIn className="h-6 w-6 text-primary mx-auto" />
                    <p className="text-sm font-display font-semibold">Sign in to keep chatting</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Create a free account to unlock Hugo's full insights and all EvoLegal features.
                    </p>
                    <Button
                      variant="hero"
                      size="sm"
                      className="w-full text-xs"
                      onClick={handleGoogleSignIn}
                      aria-label="Sign in with Google"
                    >
                      Continue with Google
                    </Button>
                    <Button
                      variant="glass"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => { setOpen(false); navigate("/auth"); }}
                      aria-label="Sign in with email"
                    >
                      Sign in with Email
                    </Button>
                    <button
                      onClick={() => setShowAuthPrompt(false)}
                      className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground"
                    >
                      Maybe later
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="p-3 border-t border-border/20 flex gap-2 shrink-0"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me a question..."
                className="bg-transparent border-0 focus-visible:ring-0 text-sm"
                disabled={streaming}
                aria-label="Demo message input"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || streaming}
                className="shrink-0 h-8 w-8"
                aria-label="Send"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
