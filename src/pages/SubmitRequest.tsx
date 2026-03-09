import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Send, FileText, Info, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { fadeUp } from "@/lib/animations";
import { validateFile, validateTextLength, isRateLimited } from "@/lib/security";
import { useLoading } from "@/contexts/LoadingContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { HugoClarificationModal } from "@/components/HugoClarificationModal";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "District of Columbia","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota",
  "Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
  "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon",
  "Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah",
  "Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
];

const topicOptions = [
  { value: "tenant-us", label: "Tenant-Landlord (US)" },
  { value: "tenant-uk", label: "Tenant-Landlord (UK)" },
  { value: "family-us", label: "Family Law (US)" },
  { value: "family-uk", label: "Family Law (UK)" },
  { value: "injury-us", label: "Personal Injury (US)" },
  { value: "insurance-us", label: "Insurance Claims (US)" },
  { value: "employment-us", label: "Employment Basics (US)" },
  { value: "contracts-us", label: "Contract Disputes (US)" },
  { value: "crypto", label: "Crypto Law (US & UK)" },
  { value: "other", label: "Other" },
];

const SubmitRequest = () => {
  const [submitting, setSubmitting] = useState(false);
  const [topic, setTopic] = useState("");
  const [state, setState] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keyFacts, setKeyFacts] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showLoader, hideLoader } = useLoading();
  const { user } = useAuth();

  // Clarification modal state
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [clarifyMessage, setClarifyMessage] = useState("");
  const [clarifyLoading, setClarifyLoading] = useState(false);
  const [additionalContext, setAdditionalContext] = useState("");

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const validated: File[] = [];
    for (const file of Array.from(incoming)) {
      const result = validateFile(file);
      if (!result.valid) {
        toast.error(result.error);
      } else {
        validated.push(file);
      }
    }
    setFiles((prev) => [...prev, ...validated].slice(0, 5));
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const saveRequest = async (extraContext?: string) => {
    if (!user) return;
    showLoader();

    try {
      const topicLabel = topicOptions.find(o => o.value === topic)?.label ?? topic;
      const finalDescription = extraContext
        ? `${description.trim()}\n\n--- Additional context provided ---\n${extraContext}`
        : description.trim();

      const { error } = await supabase.from("legal_requests").insert({
        user_id: user.id,
        topic: topicLabel,
        title: title.trim() || "Untitled Request",
        description: finalDescription,
        facts: keyFacts.trim() ? { summary: keyFacts.trim() } : {},
        state: state,
        audit_log: [{ timestamp: new Date().toISOString(), action: "created", actor: "user", note: "Request submitted" }],
      });

      if (error) {
        console.error("Failed to save request:", error);
        toast.error("Something went wrong — please try again or contact support.");
        return;
      }

      toast.success("Your request has been received and is now in the register. Hugo will prepare insights soon.");
      setTopic("");
      setState("");
      setTitle("");
      setDescription("");
      setKeyFacts("");
      setFiles([]);
      setAdditionalContext("");
    } catch (err) {
      console.error("Unexpected error submitting request:", err);
      toast.error("Something went wrong — please try again.");
    } finally {
      hideLoader();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot) return;

    if (isRateLimited("submit_request", 5, 60_000)) {
      toast.error("Too many submissions. Please wait a minute.");
      return;
    }

    if (!topic || !description.trim()) {
      toast.error("Please select a topic and describe your question.");
      return;
    }

    if (!user) {
      toast.error("You must be signed in to submit a request.");
      return;
    }

    const descCheck = validateTextLength(description, 5000, "Description");
    if (!descCheck.valid) { toast.error(descCheck.error); return; }

    setSubmitting(true);
    showLoader();

    try {
      // Ask Hugo if clarification is needed
      const topicLabel = topicOptions.find(o => o.value === topic)?.label ?? topic;
      const { data, error } = await supabase.functions.invoke("hugo-clarify", {
        body: {
          topic: topicLabel,
          description: description.trim(),
          facts: keyFacts.trim(),
          state: state,
        },
      });

      hideLoader();

      if (error || !data) {
        // On error, proceed without clarification
        console.warn("Hugo clarification unavailable, proceeding:", error);
        await saveRequest();
      } else if (data.clear) {
        // Input is clear — save directly
        await saveRequest();
      } else if (data.message) {
        // Hugo wants to ask questions
        setClarifyMessage(data.message);
        setClarifyOpen(true);
      } else {
        await saveRequest();
      }
    } catch (err) {
      console.error("Clarification check failed:", err);
      hideLoader();
      // Fallback: save anyway
      await saveRequest();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClarifyAnswer = async (answer: string) => {
    setClarifyLoading(true);
    const combined = additionalContext ? `${additionalContext}\n${answer}` : answer;
    setAdditionalContext(combined);

    try {
      // Re-evaluate with the new context
      const topicLabel = topicOptions.find(o => o.value === topic)?.label ?? topic;
      const { data, error } = await supabase.functions.invoke("hugo-clarify", {
        body: {
          topic: topicLabel,
          description: `${description.trim()}\n\nUser clarification: ${combined}`,
          facts: keyFacts.trim(),
          state: state,
        },
      });

      if (error || !data || data.clear) {
        // Clear now or error — save with context
        setClarifyOpen(false);
        await saveRequest(combined);
      } else if (data.message) {
        // More questions
        setClarifyMessage(data.message);
      } else {
        setClarifyOpen(false);
        await saveRequest(combined);
      }
    } catch {
      setClarifyOpen(false);
      await saveRequest(combined);
    } finally {
      setClarifyLoading(false);
    }
  };

  const handleClarifySkip = async () => {
    setClarifyOpen(false);
    await saveRequest(additionalContext || undefined);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <h1 className="text-2xl font-display font-bold mb-2">Submit a Request</h1>
          <p className="text-muted-foreground">Describe your topic and we'll prepare a detailed, general informational response.</p>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.5} className="glass rounded-xl px-5 py-3 flex items-start gap-3">
          <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Hugo and our Experts research your topic thoroughly and deliver detailed, structured insights. Typical turnaround: 4 hours for Pro, 8 hours for Basic.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="glass-card p-8 space-y-5"
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-display">Topic Area <span className="text-destructive">*</span></Label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-muted/30 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                required
              >
                <option value="">Select a topic...</option>
                {topicOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-display flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-muted-foreground" /> State <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-muted/30 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              >
                <option value="">Any / Not applicable</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground/50">For context only — responses remain general.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-display">Request Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your question (e.g., 'Security deposit return timeline')"
              className="bg-muted/30 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-display">Describe Your Topic <span className="text-destructive">*</span></Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you'd like general information about..."
              rows={5}
              className="bg-muted/30 border-border/50 resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-display">Key Facts <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              value={keyFacts}
              onChange={(e) => setKeyFacts(e.target.value)}
              placeholder="List any relevant facts, such as dates, specific terminology, or details..."
              rows={3}
              className="bg-muted/30 border-border/50 resize-none"
            />
          </div>

          <div className="absolute opacity-0 pointer-events-none h-0 overflow-hidden" aria-hidden="true" tabIndex={-1}>
            <input type="text" name="website" autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-display">Upload Documents <span className="text-muted-foreground text-xs">(optional, max 5 files)</span></Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              className="glass rounded-xl p-6 text-center cursor-pointer hover:border-primary/20 transition-colors group"
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2 group-hover:text-primary transition-colors" />
              <p className="text-sm text-muted-foreground">Drag & drop files here, or click to browse</p>
              <p className="text-xs text-muted-foreground/50 mt-1">PDF, DOC, TXT, JPG, PNG — Max 15 MB each</p>
            </div>
            {files.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg px-3 py-1.5">
                    <FileText className="h-3 w-3 shrink-0" />
                    <span className="truncate flex-1">{f.name}</span>
                    <span className="text-muted-foreground/50">{(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground/50">
            By submitting, you agree we store this request securely for processing and record-keeping.
          </p>

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Submitting..." : <>Submit Request <Send className="ml-2 h-4 w-4" /></>}
          </Button>

          <p className="text-xs text-muted-foreground/50 text-center">
            Responses provide general information only. State laws differ — professional legal representation in your jurisdiction is recommended for personal matters.
          </p>
        </motion.form>
      </div>

      <HugoClarificationModal
        open={clarifyOpen}
        hugoMessage={clarifyMessage}
        onSubmitAnswer={handleClarifyAnswer}
        onSkip={handleClarifySkip}
        loading={clarifyLoading}
      />
    </DashboardLayout>
  );
};

export default SubmitRequest;
