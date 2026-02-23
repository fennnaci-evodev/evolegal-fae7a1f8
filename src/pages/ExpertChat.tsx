import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ScalesOfJustice } from "@/components/ScalesOfJustice";
import { HugoAvatar } from "@/components/HugoAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, Info } from "lucide-react";
import { generateHugoResponse } from "@/lib/hugoResponses";

const tips = [
  "US tenants generally have a warranty of habitability — landlords must maintain livable conditions...",
  "English law distinguishes between assured and assured shorthold tenancies...",
  "Always document communications with your landlord in writing...",
  "Security deposit rules vary by state — some limit amounts to 1-2 months' rent...",
  "UK family courts prioritize the welfare of the child above all else...",
  "Mediation is often required before family court proceedings in England...",
  "Personal injury claims in the US typically involve proving negligence...",
  "Insurance claim timelines vary by state and type of coverage...",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const ExpertChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, Math.random() * 3000 + 5000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const response = generateHugoResponse(input);

    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
      }]);
      setLoading(false);
    }, Math.random() * 3000 + 5000);
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
                {["What are tenant rights in the US?", "UK divorce process overview", "How do personal injury claims work?", "Insurance claim basics"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="glass rounded-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all"
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

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-8 space-y-4">
              <ScalesOfJustice animating />
              <p className="text-sm text-primary font-display font-medium animate-pulse">Preparing your insights...</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentTip}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-xs text-muted-foreground text-center max-w-xs"
                >
                  {tips[currentTip]}
                </motion.p>
              </AnimatePresence>
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
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Hugo about a legal topic..."
            className="bg-transparent border-0 focus-visible:ring-0"
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || loading} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ExpertChat;
