import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ScalesOfJustice } from "@/components/ScalesOfJustice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, Bot, Info } from "lucide-react";

const tips = [
  "NY tenants have a warranty of habitability — landlords must maintain livable conditions...",
  "English law distinguishes between assured and assured shorthold tenancies...",
  "Always document communications with your landlord in writing...",
  "In NY, security deposits are typically limited to one month's rent...",
  "UK family courts prioritize the welfare of the child above all else...",
  "Mediation is often required before family court proceedings in England...",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const fakeResponses: Record<string, string> = {
  default: "Here's some general information on that topic:\n\nThis area involves several key concepts worth understanding. The processes and terminology can vary between jurisdictions, so it's important to look at the specific framework that applies.\n\nI'd recommend checking out our video lectures for a deeper dive. Would you like me to suggest specific resources?\n\n*This is general information only — for your specific situation, consider consulting a licensed professional.*",
  tenant: "Here's a general overview of tenant-landlord matters:\n\n**New York:**\n• Tenants have a warranty of habitability — landlords must maintain livable conditions\n• Security deposits are regulated and limited\n• Eviction requires proper court proceedings and notice\n\n**England (UK):**\n• Most residential tenancies are Assured Shorthold Tenancies (ASTs)\n• Landlords must protect deposits in government-approved schemes\n• Section 21 and Section 8 are the main routes for possession\n\nWe have detailed video lectures on these topics — check your library!\n\n*General information only. For your specific situation, consulting a licensed professional is recommended.*",
  family: "Here's a general overview of family law concepts:\n\n**New York:**\n• Divorce can be filed on no-fault grounds (irretrievable breakdown for 6+ months)\n• Child custody uses the \"best interests of the child\" standard\n• Both contested and uncontested pathways exist\n\n**England (UK):**\n• The 2020 Act introduced no-fault divorce\n• Children's welfare is the paramount consideration\n• Financial orders are handled separately from the divorce itself\n\nOur \"Family Court Process Overview\" guide covers this in more detail.\n\n*This is general educational content. For your circumstances, consider consulting a licensed attorney.*",
};

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

    const lower = input.toLowerCase();
    let responseKey = "default";
    if (lower.includes("tenant") || lower.includes("landlord") || lower.includes("rent") || lower.includes("lease") || lower.includes("evict")) {
      responseKey = "tenant";
    } else if (lower.includes("family") || lower.includes("divorce") || lower.includes("custody") || lower.includes("child") || lower.includes("marriage")) {
      responseKey = "family";
    }

    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fakeResponses[responseKey],
      }]);
      setLoading(false);
    }, Math.random() * 3000 + 5000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
        {/* Header */}
        <div className="glass-card p-4 mb-4 flex items-center gap-3" style={{ borderRadius: "1rem" }}>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold">Expert Manager</h2>
            <p className="text-xs text-muted-foreground">General informational guidance</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <ScalesOfJustice />
              <div>
                <h3 className="text-lg font-display font-semibold mb-2">Ask the Expert Manager</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Ask about legal processes, terms, or concepts. I'll provide general educational information and suggest relevant resources.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {["What are tenant rights in NY?", "UK divorce process overview", "How does child custody work?"].map((q) => (
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
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
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
            General information only. For your specific situation, consider consulting a licensed professional.
          </p>
        </div>

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="glass-strong p-3 flex gap-3" style={{ borderRadius: "1rem" }}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a legal topic..."
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
