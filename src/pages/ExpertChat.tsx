import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ScalesOfJustice } from "@/components/ScalesOfJustice";
import { HugoAvatar } from "@/components/HugoAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, Info, Mic, MicOff } from "lucide-react";
import { isRateLimited } from "@/lib/security";
import { InlineELoader } from "@/components/InlineELoader";
import { toast } from "sonner";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hugo-chat`;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const presets = [
  "What are tenant rights in the US?",
  "UK divorce process overview",
  "How do personal injury claims work?",
  "How does crypto regulation work?",
];

const ExpertChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const streamChat = useCallback(async (allMessages: Message[]) => {
    const apiMessages = allMessages.map(m => ({ role: m.role, content: m.content }));

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: apiMessages }),
    });

    if (!resp.ok) {
      if (resp.status === 429) throw new Error("Too many requests — please wait a moment.");
      if (resp.status === 402) throw new Error("AI credits exhausted. Please check your workspace.");
      throw new Error("Hugo is temporarily unavailable.");
    }

    if (!resp.body) throw new Error("No response stream");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";

    const updateAssistant = (text: string) => {
      assistantSoFar = text;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { id: Date.now().toString(), role: "assistant", content: assistantSoFar }];
      });
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantSoFar += content;
            updateAssistant(assistantSoFar);
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    if (isRateLimited("hugo_chat", 15, 60_000)) {
      toast.error("Too many messages — please wait a moment.");
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      await streamChat(updated);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
      // Add error as assistant message
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I wasn't able to process that right now. Please try again in a moment — I'm not going anywhere.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Voice input via Web Speech API
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
      <div className="max-w-3xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
        {/* Header */}
        <div className="glass-card p-4 mb-4 flex items-center gap-3" style={{ borderRadius: "1rem" }}>
          <HugoAvatar size={44} />
          <div>
            <h2 className="font-display font-semibold">Hugo <span className="text-muted-foreground font-normal text-sm">· Expert Manager</span></h2>
            <p className="text-xs text-muted-foreground">Here to help — US & UK legal topics</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <ScalesOfJustice />
              <div>
                <h3 className="text-lg font-display font-semibold mb-2">Talk to Hugo</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Ask about legal processes, terms, or concepts. Hugo provides detailed, structured insights with cited sources and resources.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {presets.map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="glass rounded-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all"
                    aria-label={`Ask: ${q}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
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

          {loading && messages[messages.length - 1]?.role === "user" && (
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

        {/* Soft disclaimer */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/20 mb-3">
          <Info className="h-3 w-3 text-muted-foreground/50 shrink-0" />
          <p className="text-[10px] text-muted-foreground/50">
            Hugo works hard on every response. For complex personal matters, professional representation may be recommended.
          </p>
        </div>

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="glass-strong p-3 flex gap-3" style={{ borderRadius: "1rem" }}>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={toggleVoice}
            className={`shrink-0 ${listening ? "text-primary" : "text-muted-foreground"}`}
            aria-label={listening ? "Stop recording" : "Start voice input"}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Hugo about a legal topic..."
            className="bg-transparent border-0 focus-visible:ring-0"
            disabled={loading}
            aria-label="Message input"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || loading} className="shrink-0" aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ExpertChat;
