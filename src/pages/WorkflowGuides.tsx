import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { HugoAvatar } from "@/components/HugoAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineELoader } from "@/components/InlineELoader";
import { Send, ArrowRight, BookOpen } from "lucide-react";
import { toast } from "sonner";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hugo-chat`;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Workflow {
  id: string;
  title: string;
  description: string;
  systemContext: string;
}

const WORKFLOWS: Workflow[] = [
  {
    id: "crypto-token",
    title: "Crypto Token Classification",
    description: "Understand how tokens are classified under US and UK law — security vs. utility vs. payment token.",
    systemContext: "Guide the user step-by-step through crypto token classification. Start by asking what kind of token they're interested in (utility, payment, security, governance, NFT). Then walk through the Howey Test (US) and UK FCA classification framework, comparing both. Ask clarifying questions at each step. Keep it conversational, no markdown formatting.",
  },
  {
    id: "defi-compliance",
    title: "DeFi Compliance Steps",
    description: "Walk through the general compliance considerations for DeFi protocols in the US and UK.",
    systemContext: "Guide the user through DeFi compliance considerations step by step. Cover AML/KYC obligations, SEC/CFTC considerations in the US, FCA guidance in the UK, smart contract audit expectations, and governance token implications. Ask what type of DeFi activity they're exploring before diving in. Conversational prose only.",
  },
  {
    id: "nft-ownership",
    title: "NFT Ownership & IP Process",
    description: "Learn about NFT ownership rights, IP licensing, and what buying an NFT actually gives you legally.",
    systemContext: "Walk the user through NFT ownership and intellectual property step by step. Cover what ownership of an NFT means legally, difference between owning the token and owning the underlying IP, common licensing models (CC0, commercial rights, restricted), and dispute resolution. Ask the user about their specific situation. Conversational prose only.",
  },
  {
    id: "tenant-eviction",
    title: "Tenant Eviction Process Overview",
    description: "Understand the general eviction process for tenants in the US and UK, step by step.",
    systemContext: "Guide the user through the general eviction process. Start by asking whether they're a tenant or landlord, and whether this is a US or UK situation. Then walk through notice requirements, grounds for eviction, court process, tenant rights and defenses, and timeline expectations. Compare US state-level variations with UK Housing Act provisions. Conversational prose only.",
  },
  {
    id: "personal-injury",
    title: "Personal Injury Claim Workflow",
    description: "Walk through the typical stages of filing and pursuing a personal injury claim.",
    systemContext: "Guide the user through the personal injury claim process step by step. Ask about the type of injury and jurisdiction first. Cover duty of care, establishing negligence, limitation periods (US statutes vs UK Limitation Act), gathering evidence, insurance interactions, settlement vs trial, and compensation types. Conversational prose only.",
  },
];

const WorkflowGuides = () => {
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const startWorkflow = async (wf: Workflow) => {
    setActiveWorkflow(wf);
    setMessages([]);
    setLoading(true);

    // Send initial message to kick off the workflow
    try {
      await streamChat(
        [{ id: "1", role: "user" as const, content: `I'd like to go through the "${wf.title}" workflow. Please guide me step by step.` }],
        wf.systemContext
      );
    } catch {
      toast.error("Hugo is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const streamChat = useCallback(async (allMessages: Message[], extraSystemContext?: string) => {
    const apiMessages = allMessages.map(m => ({ role: m.role, content: m.content }));
    if (extraSystemContext) {
      apiMessages.unshift({ role: "user", content: `[Workflow context: ${extraSystemContext}]` });
    }

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: apiMessages }),
    });

    if (!resp.ok || !resp.body) throw new Error("Stream failed");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantSoFar += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
              }
              return [...prev, { id: Date.now().toString(), role: "assistant", content: assistantSoFar }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading || !activeWorkflow) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      await streamChat(updated, activeWorkflow.systemContext);
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!activeWorkflow) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-display font-bold">Workflow Guides</h1>
            </div>
            <p className="text-sm text-muted-foreground">Hugo will guide you step-by-step through common legal processes. Choose a workflow to begin.</p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {WORKFLOWS.map((wf, i) => (
              <motion.button
                key={wf.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => startWorkflow(wf)}
                className="glass-card p-6 text-left group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-sm mb-2">{wf.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{wf.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
        {/* Header */}
        <div className="glass-card p-4 mb-4 flex items-center gap-3" style={{ borderRadius: "1rem" }}>
          <HugoAvatar size={52} />
          <div className="flex-1">
            <h2 className="font-display font-semibold text-sm">{activeWorkflow.title}</h2>
            <p className="text-xs text-muted-foreground">Guided by Hugo · step-by-step</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setActiveWorkflow(null); setMessages([]); }} className="text-xs text-muted-foreground">
            ← All Guides
          </Button>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
          <AnimatePresence>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && <HugoAvatar size={36} animate={false} talking={loading && msg === messages[messages.length - 1]} />}
                <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "glass rounded-bl-md"
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-center">
              <HugoAvatar size={36} animate={false} talking />
              <div className="glass rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                <InlineELoader size={22} />
                <span className="text-xs text-muted-foreground/60">Hugo is preparing the next step…</span>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="glass-strong p-3 flex gap-3" style={{ borderRadius: "1rem" }}>
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Answer Hugo's question or ask for more detail..."
            className="bg-transparent border-0 focus-visible:ring-0"
            disabled={loading}
            aria-label="Workflow chat input"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || loading} className="shrink-0" aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default WorkflowGuides;
