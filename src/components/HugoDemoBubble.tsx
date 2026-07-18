import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, LogIn, ArrowRight, Users, Crown, Sparkles, Zap } from "lucide-react";
import { HugoAvatar } from "@/components/HugoAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineELoader } from "@/components/InlineELoader";
import { HugoTypingMessage } from "@/components/HugoTypingMessage";
import { HugoCopyButton } from "@/components/HugoCopyButton";
import { HugoModeBadge, getHugoModePref, setHugoModePref, useHugoMode } from "@/components/HugoModeBadge";
import { HugoConsiliumGate, useConsiliumConfirmed, confirmConsilium } from "@/components/HugoConsiliumGate";
import { HugoConsiliumAnchor } from "@/components/HugoConsiliumAnchor";
import { HugoConsiliumSuggestion } from "@/components/HugoConsiliumSuggestion";
import { HugoUPLNotice } from "@/components/HugoUPLNotice";
import { HugoConsiliumLoader } from "@/components/HugoConsiliumLoader";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { lovable } from "@/integrations/lovable/index";
import { useHugoChat } from "@/hooks/useHugoChat";
import { getPreciseStatus, consumePreciseCredit, type PreciseStatus } from "@/lib/preciseCredits";

const MESSAGES_BEFORE_CHOICE = 3;

export function HugoDemoBubble() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [showChoice, setShowChoice] = useState(false);
  const [choiceDismissed, setChoiceDismissed] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [preciseMode, setPreciseMode] = useState(false);
  const [showPreciseSuggest, setShowPreciseSuggest] = useState(false);
  const [showPreciseLimit, setShowPreciseLimit] = useState(false);
  const [preciseStatus, setPreciseStatus] = useState<PreciseStatus>({ plan: "free", dailyLimit: 2, usedToday: 0, remainingToday: 2, packCredits: 0, canConsume: true });
  const [suggestConsilium, setSuggestConsilium] = useState(false);
  const [switchingToConsilium, setSwitchingToConsilium] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    streaming,
    currentChatId,
    sendMessage,
    startNewChat,
    editLastMessage,
    newAssistantIds,
  } = useHugoChat();

  const userMsgCount = messages.filter((m) => m.role === "user").length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (user) setPreciseStatus(getPreciseStatus(user.id));
  }, [user, messages.length]);

  // If auth resolves to a real user, never leave the sign-in overlay up.
  useEffect(() => {
    if (user && showAuthPrompt) setShowAuthPrompt(false);
  }, [user, showAuthPrompt]);

  const EXPERT_TRIGGER_PATTERN = /\b(connect\s*(me\s*)?(to\s*)?(an?\s*)?expert|talk\s*to\s*(an?\s*)?expert|need\s*(an?\s*)?expert|speak\s*(to|with)\s*(an?\s*)?expert|review\s*by\s*expert|human\s*review)/i;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    // Wait for auth to resolve before deciding anything — prevents flashing the
    // sign-in prompt to users who actually have a valid session being restored.
    if (authLoading) return;

    if (!user && userMsgCount >= 1) {
      setShowAuthPrompt(true);
      return;
    }

    // Precise mode: enforce daily/credit limit
    if (preciseMode && user) {
      const status = getPreciseStatus(user.id);
      if (!status.canConsume) {
        setShowPreciseLimit(true);
        return;
      }
      consumePreciseCredit(user.id);
      setPreciseStatus(getPreciseStatus(user.id));
    }

    if (EXPERT_TRIGGER_PATTERN.test(text)) {
      setInput("");
      await sendMessage(text, { precise: preciseMode, mode: getHugoModePref() });
      setShowChoice(true);
      return;
    }

    setInput("");
    setShowPreciseSuggest(false);
    setSuggestConsilium(false);
    const result = await sendMessage(text, { precise: preciseMode, mode: getHugoModePref() });

    if (result?.escalated) {
      setTimeout(() => setShowChoice(true), 300);
      return;
    }

    if (result?.suggestPrecise && !preciseMode) {
      setShowPreciseSuggest(true);
      return;
    }

    if (result?.suggestConsilium && getHugoModePref() !== "consilium") {
      setSuggestConsilium(true);
    }

    const newUserCount = userMsgCount + 1;
    if (newUserCount >= MESSAGES_BEFORE_CHOICE && user && !choiceDismissed) {
      setTimeout(() => setShowChoice(true), 800);
    }
  };

  const handleAcceptConsilium = async () => {
    if (switchingToConsilium || streaming) return;
    setSwitchingToConsilium(true);
    setSuggestConsilium(false);
    setHugoModePref("consilium");
    try {
      const text = await editLastMessage();
      if (text) {
        await sendMessage(text, { precise: preciseMode, mode: "consilium" });
      }
    } finally {
      setSwitchingToConsilium(false);
    }
  };

  const handleAcceptPrecise = () => {
    setShowPreciseSuggest(false);
    if (!user) { setShowAuthPrompt(true); return; }
    const status = getPreciseStatus(user.id);
    if (!status.canConsume) { setShowPreciseLimit(true); return; }
    setPreciseMode(true);
  };


  const handleContinueHugo = () => {
    setShowChoice(false);
    setChoiceDismissed(true);
  };

  const handleConnectExpert = () => {
    if (!user) {
      setShowChoice(false);
      setShowAuthPrompt(true);
      return;
    }
    setShowChoice(false);
    setShowUpgradePrompt(true);
  };

  const handleUpgradeConfirmed = () => {
    setShowUpgradePrompt(false);
    setOpen(false);
    navigate("/pricing");
  };

  const handleContinueFromUpgrade = () => {
    setShowUpgradePrompt(false);
    setChoiceDismissed(true);
  };

  const handleGoogleSignIn = async () => {
    await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
  };

  const handleGoToFullChat = () => {
    if (currentChatId) {
      sessionStorage.setItem("evo_bubble_chat_id", currentChatId);
    }
    setOpen(false);
    navigate(`/dashboard/hugo/${currentChatId || ""}?from=bubble`);
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
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center h-14 w-14 rounded-full bg-primary shadow-lg hover:scale-110 transition-transform"
            style={{ boxShadow: "0 0 28px hsla(186, 100%, 50%, 0.35)" }}
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
            className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 glass-strong overflow-hidden flex flex-col"
            style={{ borderRadius: "1.25rem", maxHeight: "min(520px, 80vh)", maxWidth: "24rem" }}
            role="dialog"
            aria-label="Hugo demo chat"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/20 shrink-0">
              <div className="flex items-center gap-2">
                <HugoAvatar size={39} animate={false} talking={streaming} />
                <span className="font-display font-semibold text-sm">Hugo</span>
                {preciseMode ? (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ background: "hsla(270,95%,75%,0.15)", color: "hsl(270,95%,75%)", border: "1px solid hsla(270,95%,75%,0.35)" }}>
                    <Sparkles className="h-2.5 w-2.5" /> Precise mode
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">· Expert Manager</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {preciseMode && (
                  <button onClick={() => setPreciseMode(false)} className="text-[10px] text-muted-foreground hover:text-foreground mr-2">
                    Exit precise
                  </button>
                )}
                {user && messages.length > 0 && (
                  <button
                    onClick={handleGoToFullChat}
                    className="text-[10px] text-primary hover:underline mr-2"
                  >
                    Open full chat →
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Close chat">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Precise mode suggestion banner (auto-detected by Hugo) */}
            <AnimatePresence>
              {showPreciseSuggest && !preciseMode && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mx-3 mt-3 rounded-xl px-3 py-2.5 flex items-center gap-2"
                  style={{ background: "linear-gradient(135deg, hsla(270,95%,75%,0.08), hsla(186,100%,50%,0.06))", border: "1px solid hsla(270,95%,75%,0.25)" }}
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(270,95%,75%)" }} />
                  <p className="text-[11px] text-foreground/85 leading-snug flex-1">
                    Switch to a deeper Legal Analysis of Your Life Circumstances?
                  </p>
                  <button onClick={handleAcceptPrecise} className="text-[11px] font-semibold text-primary hover:underline shrink-0">
                    Switch
                  </button>
                  <button onClick={() => setShowPreciseSuggest(false)} className="text-muted-foreground/60 hover:text-foreground shrink-0" aria-label="Dismiss">
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Precise mode limit reached */}
            <AnimatePresence>
              {showPreciseLimit && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex items-center justify-center"
                  style={{ background: "hsla(0,0%,0%,0.6)", backdropFilter: "blur(6px)", borderRadius: "1.25rem" }}
                >
                  <div className="glass-strong rounded-xl p-5 mx-4 text-center space-y-3 max-w-[280px]">
                    <Zap className="h-7 w-7 mx-auto" style={{ color: "hsl(270,95%,75%)" }} />
                    <p className="text-sm font-display font-semibold">You've used your daily analyses</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Free plan includes {preciseStatus.dailyLimit} precise analyses per day. Purchase a credit pack or upgrade to Pro for higher limits.
                    </p>
                    <Button variant="hero" size="sm" className="w-full text-xs" onClick={() => { setShowPreciseLimit(false); setOpen(false); navigate("/pricing"); }}>
                      <Crown className="h-3.5 w-3.5 mr-1" /> View plans & credits
                    </Button>
                    <button onClick={() => { setShowPreciseLimit(false); setPreciseMode(false); }} className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors pt-1">
                      Continue with regular Hugo
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>


            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              <div className="glass rounded-xl px-4 py-3 text-sm text-foreground leading-relaxed">
                Hello — I'm Hugo, your Expert Manager. Ask me anything about US or UK legal topics. You will get your answer as soon as possible.
              </div>

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col min-w-0 ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div className={`w-fit max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "glass rounded-bl-sm"
                  }`}>
                    {msg.role === "assistant" ? (
                      <HugoTypingMessage
                        content={msg.content}
                        messageId={msg.id}
                        isStreaming={streaming && msg.id === messages[messages.length - 1]?.id}
                        isNew={newAssistantIds.has(msg.id)}
                      />
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === "assistant" && (
                    <div className="mt-1 max-w-[88%] w-full flex items-center justify-between gap-2 flex-wrap">
                      <HugoModeBadge consilium={(msg as any).consilium} />
                      <HugoCopyButton content={msg.content} />
                    </div>
                  )}
                </motion.div>
              ))}

              {streaming && messages[messages.length - 1]?.role === "user" && (
                getHugoModePref() === "consilium" ? (
                  <HugoConsiliumLoader compact />
                ) : (
                  <div className="flex items-center gap-2">
                    <InlineELoader size={22} />
                    <span className="text-[10px] text-muted-foreground/60">Hugo is thinking…</span>
                  </div>
                )
              )}
              <AnimatePresence>
                {suggestConsilium && !streaming && (
                  <div className="mt-1 max-w-[92%]">
                    <HugoConsiliumSuggestion
                      onAccept={handleAcceptConsilium}
                      onDismiss={() => setSuggestConsilium(false)}
                      loading={switchingToConsilium}
                    />
                  </div>
                )}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Permanent UPL Notice — sticky footer above input */}
            <HugoUPLNotice compact />

            {/* Choice overlay */}
            <AnimatePresence>
              {showChoice && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  className="absolute inset-x-0 bottom-0 p-5 border-t border-border/20"
                  style={{ borderRadius: "0 0 1.25rem 1.25rem", background: "hsla(222, 47%, 6%, 0.92)", backdropFilter: "blur(16px)" }}
                >
                  <p className="text-xs text-muted-foreground text-center mb-4 leading-relaxed">
                    For more precise and refined analysis, connect with an EvoLegal Expert for human review.
                  </p>
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={handleContinueHugo}
                      className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-display font-semibold text-foreground transition-all duration-200 hover:scale-[1.02]"
                      style={{ border: "1px solid hsla(186, 100%, 50%, 0.3)", boxShadow: "0 0 16px hsla(186, 100%, 50%, 0.12)", background: "hsla(186, 100%, 50%, 0.06)" }}
                    >
                      <MessageCircle className="h-4 w-4 text-primary" />
                      Continue with Hugo
                    </button>
                    <button
                      onClick={handleConnectExpert}
                      className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-display font-semibold text-foreground transition-all duration-200 hover:scale-[1.02]"
                      style={{ border: "1px solid hsla(270, 95%, 75%, 0.35)", boxShadow: "0 0 16px hsla(270, 95%, 75%, 0.15)", background: "linear-gradient(135deg, hsla(270, 95%, 75%, 0.1), hsla(186, 100%, 50%, 0.08))" }}
                    >
                      <Users className="h-4 w-4" style={{ color: "hsl(270, 95%, 75%)" }} />
                      Get Precise Help from EvoLegal Expert
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upgrade prompt */}
            <AnimatePresence>
              {showUpgradePrompt && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-center justify-center"
                  style={{ background: "hsla(0, 0%, 0%, 0.6)", backdropFilter: "blur(6px)", borderRadius: "1.25rem" }}
                >
                  <div className="glass-strong rounded-xl p-5 mx-4 text-center space-y-3 max-w-[280px]">
                    <Crown className="h-7 w-7 mx-auto" style={{ color: "hsl(270, 95%, 75%)" }} />
                    <p className="text-sm font-display font-semibold">Pro Subscription Required</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      To connect with an EvoLegal Expert, you need a Pro or Premium subscription.
                    </p>
                    <Button variant="hero" size="sm" className="w-full text-xs" onClick={handleUpgradeConfirmed}>
                      <Crown className="h-3.5 w-3.5 mr-1" /> Upgrade to Pro
                    </Button>
                    <button onClick={handleContinueFromUpgrade} className="w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors pt-1">
                      <MessageCircle className="h-3 w-3" /> Continue with Hugo
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Auth prompt */}
            <AnimatePresence>
              {showAuthPrompt && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-center justify-center"
                  style={{ background: "hsla(0, 0%, 0%, 0.6)", backdropFilter: "blur(6px)", borderRadius: "1.25rem" }}
                >
                  <div className="glass-strong rounded-xl p-5 mx-4 text-center space-y-3 max-w-[280px]">
                    <LogIn className="h-6 w-6 text-primary mx-auto" />
                    <p className="text-sm font-display font-semibold">Sign in to keep chatting</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Create a free account to unlock Hugo's full insights and all EvoLegal features.
                    </p>
                    <Button variant="hero" size="sm" className="w-full text-xs" onClick={handleGoogleSignIn}>
                      Continue with Google
                    </Button>
                    <Button variant="glass" size="sm" className="w-full text-xs" onClick={() => { setOpen(false); navigate("/auth"); }}>
                      Sign in with Email
                    </Button>
                    <button onClick={() => setShowAuthPrompt(false)} className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground">
                      Maybe later
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 border-t border-border/20 flex gap-2 shrink-0">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={authLoading ? "Loading…" : "Ask me a question..."}
                className="bg-transparent border-0 focus-visible:ring-0 text-sm"
                disabled={streaming || authLoading}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || streaming || authLoading} className="shrink-0 h-8 w-8">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
