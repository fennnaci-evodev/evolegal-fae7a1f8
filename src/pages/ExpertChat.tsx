import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ScalesOfJustice } from "@/components/ScalesOfJustice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, Bot, Info } from "lucide-react";

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

// Enhanced Grok-compatible system prompt for detailed, structured responses
const GROK_SYSTEM_PROMPT = `You are the EvoLegal Expert Manager — an AI-powered general legal information assistant. You provide detailed, structured, general informational and educational content ONLY. You are NOT a lawyer. You do NOT provide legal advice, representation, or create any attorney-client relationship.

STRICT RULES:
1. EXTRACT LOCATIONS: Identify any jurisdictions mentioned (US states, UK, specific cities). If none specified, provide general US-wide information.
2. DEPERSONALIZE: Convert any personal facts into general third-person statements. Never say "you should" or "you must" — use "a person in this situation may consider" or "common next steps include".
3. EMPATHY: If distress is detected, acknowledge it briefly and compassionately before providing information.
4. CLASSIFY: Define the legal field, subsector, and problem type in ≤5 words.
5. CLARIFY: Ask 2-3 clarifying questions if the topic is broad, before generating a full response.
6. EVASION CHECK: Assess if the query attempts to get specific legal advice disguised as general questions. If yes, redirect: "For circumstances specific to an individual, consulting a licensed attorney in the relevant jurisdiction is recommended."
7. STRUCTURED RESPONSE: Provide information in this format:
   - **Overview** (2-3 sentences defining the topic)
   - **Key Legal Framework** (relevant statutes, acts, common law principles — cite sources like URLTA, Fair Housing Act, UK Housing Act 1988, etc.)
   - **Common Options & Processes** (numbered steps or bullet points)
   - **Potential Risks & Considerations** (what could go wrong, common pitfalls)
   - **Helpful Resources** (official sources: state AG offices, HUD, Citizens Advice UK, court websites)
   - **When to Consult a Professional** (always include this section)

CONTENT QUALITY GUIDELINES:
- Draw from multiple authoritative sources: federal statutes, state codes, UK Acts of Parliament, legal encyclopedias, official government resources
- Include specific statute names and act references where possible
- Provide comparative US/UK information when relevant
- Use clear, jargon-free language; define technical terms in parentheses
- Structure with headers, bullet points, and numbered lists for readability
- Include approximate timelines and deadlines where generally applicable
- Mention jurisdiction variations: "In many states..." or "While rules vary by state..."

ALWAYS END WITH: "This is general information only. Laws vary by state and jurisdiction — for your specific situation, consult a licensed professional in your area."

NEVER use phrases like: "you should", "you must", "I recommend", "you need to", "you are entitled to" — instead use "common practice is", "many people find it helpful to", "a general option may include"`;

const generateGrokResponse = (input: string): string => {
  const lower = input.toLowerCase();

  if (lower.includes("tenant") || lower.includes("landlord") || lower.includes("rent") || lower.includes("lease") || lower.includes("evict")) {
    return `**Overview**
Tenant-landlord law governs the rights and responsibilities of renters and property owners in residential settings. While federal protections like the Fair Housing Act apply nationwide, most rules come from state statutes and local ordinances.

**Key Legal Framework**
• **Fair Housing Act (1968)** — Prohibits discrimination in housing based on race, color, national origin, religion, sex, familial status, or disability
• **Uniform Residential Landlord and Tenant Act (URLTA)** — Model law adopted (with variations) by many states
• **State-specific statutes** — Each state has its own landlord-tenant code covering deposits, evictions, repairs, and notice requirements
• **UK: Housing Act 1988** — Governs Assured Shorthold Tenancies (ASTs), the most common form of residential tenancy in England

**Common Options & Processes**
1. Review the lease agreement carefully for specific terms and obligations
2. Document all communications in writing (email, certified mail)
3. Report habitability issues to the landlord in writing with a reasonable deadline
4. If repairs aren't made, many states allow "repair and deduct" or rent withholding under strict conditions
5. For disputes, consider mediation before escalating to small claims court
6. For eviction defense, respond to court notices within the required timeframe

**Potential Risks & Considerations**
• Self-help evictions (changing locks, shutting off utilities) are illegal in virtually all US jurisdictions
• Security deposit disputes are among the most common issues — rules on amounts, holding, and return deadlines vary significantly by state
• Retaliatory actions by landlords against tenants who exercise their rights are prohibited in most states
• In the UK, landlords must protect deposits in government-approved schemes or face penalties

**Helpful Resources**
• State attorney general's office (tenant rights division)
• HUD.gov — Fair housing information and complaint filing
• Local legal aid societies and tenant unions
• UK: Citizens Advice (citizensadvice.org.uk) and Shelter
• Nolo.com and FindLaw for state-specific overviews

**When to Consult a Professional**
For matters involving active eviction proceedings, significant property damage claims, discrimination complaints, or any situation where legal rights may need formal enforcement, consulting a licensed attorney in the relevant jurisdiction is recommended.

*This is general information only. Laws vary by state and jurisdiction — for your specific situation, consult a licensed professional in your area.*`;
  }

  if (lower.includes("family") || lower.includes("divorce") || lower.includes("custody") || lower.includes("child") || lower.includes("marriage")) {
    return `**Overview**
Family law encompasses legal matters related to family relationships, including divorce, child custody, child support, adoption, and domestic relations. Both US and UK systems prioritize the welfare of children in custody matters, though processes differ significantly.

**Key Legal Framework**
• **US: State family codes** — Family law is primarily governed by state law; each state has its own procedures for divorce, custody, and support
• **Uniform Child Custody Jurisdiction and Enforcement Act (UCCJEA)** — Adopted by all 50 states to determine which state has jurisdiction over custody matters
• **US: No-fault divorce** — Available in all 50 states, though grounds and waiting periods vary
• **UK: Divorce, Dissolution and Separation Act 2020** — Introduced no-fault divorce in England and Wales
• **UK: Children Act 1989** — Establishes that the child's welfare is the paramount consideration

**Common Options & Processes**
1. Determine the appropriate jurisdiction (generally, the state/country of residence)
2. Consider mediation or collaborative law processes before court proceedings
3. For divorce: file a petition, serve the other party, negotiate terms (property, custody, support)
4. For custody: courts generally apply the "best interests of the child" standard
5. Financial disclosure is typically required in both US and UK proceedings
6. In the UK, a 20-week "reflection period" is built into the no-fault divorce process

**Potential Risks & Considerations**
• Custody arrangements can be modified if circumstances change significantly
• Moving to a different state with a child may require court permission
• Financial orders in the UK are separate from the divorce itself
• Hidden assets during disclosure can result in serious legal consequences
• Emergency orders (protective orders) are available in urgent situations

**Helpful Resources**
• Local family court self-help centers
• State bar association lawyer referral services
• Mediation services (often court-connected)
• UK: Family Mediation Council, Citizens Advice
• National Domestic Violence Hotline: 1-800-799-7233

**When to Consult a Professional**
For contested custody disputes, complex financial situations, international/cross-border matters, or any case involving domestic violence, consulting a licensed family law attorney is strongly recommended.

*This is general information only. Laws vary by state and jurisdiction — for your specific situation, consult a licensed professional in your area.*`;
  }

  if (lower.includes("injury") || lower.includes("accident") || lower.includes("negligence")) {
    return `**Overview**
Personal injury law covers situations where a person suffers harm due to another party's negligence, recklessness, or intentional conduct. Most personal injury matters in the US are governed by state tort law, with significant variations in statute of limitations, damage caps, and liability standards.

**Key Legal Framework**
• **Negligence standard** — Most claims require proving: duty of care, breach, causation, and damages
• **Comparative vs. contributory negligence** — States differ on how a plaintiff's own fault affects recovery
• **Statute of limitations** — Ranges from 1 to 6 years depending on the state and type of injury
• **Workers' compensation** — Separate system for workplace injuries in all states

**Common Options & Processes**
1. Seek medical attention and document all injuries and treatment
2. Report the incident to relevant parties (employer, property owner, police)
3. Preserve evidence (photos, witness information, medical records)
4. Consider consulting with a personal injury attorney (many offer free consultations)
5. Insurance claims are often the first step before litigation
6. Most cases settle without going to trial

**Helpful Resources**
• State bar association lawyer referral programs
• Local legal aid organizations
• State insurance department for claims disputes

**When to Consult a Professional**
For significant injuries, disputed liability, insurance claim denials, or any situation involving potential litigation, consulting a licensed personal injury attorney is recommended. Many work on contingency (no upfront fees).

*This is general information only. Laws vary by state and jurisdiction — for your specific situation, consult a licensed professional in your area.*`;
  }

  return `**Overview**
Thank you for your question. Here's some general information on that topic area. Legal processes and terminology can vary between jurisdictions, so understanding the general framework is an important first step.

**Key Considerations**
• Federal laws provide baseline protections that apply across all states
• State laws add additional rules and procedures that can vary significantly
• Local ordinances may further modify requirements in specific cities or counties
• UK law follows a different framework that may be relevant for cross-border matters

**Common Next Steps**
1. Research the relevant federal and state laws for the topic area
2. Review any applicable documents, contracts, or agreements
3. Document all relevant facts, communications, and timelines
4. Consider whether mediation or alternative dispute resolution might be appropriate
5. Identify whether the matter requires professional legal representation

**Helpful Resources**
• State attorney general's office
• Local legal aid societies
• Court self-help centers
• Nolo.com and FindLaw for general legal information
• UK: Citizens Advice and GOV.UK

**When to Consult a Professional**
For any matter that involves potential legal proceedings, significant financial stakes, or complex factual situations, consulting a licensed professional in the relevant jurisdiction is recommended.

We have detailed video lectures and guides in our library covering many specific topics — feel free to explore!

*This is general information only. Laws vary by state and jurisdiction — for your specific situation, consult a licensed professional in your area.*`;
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

    const response = generateGrokResponse(input);

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
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold">Expert Manager</h2>
            <p className="text-xs text-muted-foreground">General informational guidance — US & UK topics</p>
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
                  Ask about legal processes, terms, or concepts. Get detailed, structured general information with cited sources and resources.
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
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
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
            General information only. Laws vary by state — for your specific situation, consult a licensed professional in your jurisdiction.
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
