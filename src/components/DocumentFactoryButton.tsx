import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DOCUMENT_TYPES = [
  { id: "overview", label: "Information Overview", desc: "General educational overview of the topic" },
  { id: "checklist", label: "Preparation Checklist", desc: "Structured checklist to help organize your approach" },
  { id: "template", label: "Template Outline", desc: "Blank framework with placeholder fields" },
  { id: "comparative", label: "Comparative Guide", desc: "Side-by-side comparison of approaches or frameworks" },
] as const;

interface DocumentFactoryProps {
  topic: string;
  chatId?: string | null;
  requestId?: string | null;
  conversationContext?: string;
}

export function DocumentFactoryButton({ topic, chatId, requestId, conversationContext }: DocumentFactoryProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState("");

  const handleGenerate = async (docType: string) => {
    setGenerating(docType);
    setGeneratedUrl(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to generate documents.");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            document_type: docType,
            topic,
            chat_id: chatId || undefined,
            request_id: requestId || undefined,
            conversation_context: conversationContext || undefined,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Document generation failed.");
        return;
      }

      // Handle risk escalation — AI refused to generate
      if (data.escalated) {
        toast.info(data.message || "This topic requires expert review. Please connect with an EvoLegal Expert.");
        setOpen(false);
        return;
      }

      setGeneratedUrl(data.file_url);
      setGeneratedTitle(data.title);
      toast.success("Document generated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setGenerating(null);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-xs border-primary/30 text-primary hover:bg-primary/10"
      >
        <FileText className="h-3.5 w-3.5" />
        Generate General Document
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => { if (!generating) setOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong w-full max-w-lg p-6 relative"
            >
              <button
                onClick={() => { if (!generating) setOpen(false); }}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-5">
                <h3 className="text-lg font-display font-semibold">Document Factory</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Generate a general informational document about: <span className="text-foreground font-medium">{topic}</span>
                </p>
              </div>

              {generatedUrl ? (
                <div className="space-y-4">
                  <div className="glass rounded-xl p-4 flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{generatedTitle}</p>
                      <p className="text-xs text-muted-foreground">Ready for download</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 gap-2"
                      variant="hero"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = generatedUrl!;
                        link.target = "_blank";
                        link.rel = "noopener noreferrer";
                        link.setAttribute("download", generatedTitle || "EvoLegal_Document.pdf");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedUrl!);
                        toast.success("Download link copied to clipboard!");
                      }}
                      title="Copy download link"
                    >
                      Copy Link
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-xs"
                    onClick={() => { setGeneratedUrl(null); setGeneratedTitle(""); }}
                  >
                    Generate Another
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {DOCUMENT_TYPES.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleGenerate(doc.id)}
                      disabled={generating !== null}
                      className="glass rounded-xl p-4 text-left hover:bg-primary/5 transition-colors disabled:opacity-50 group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{doc.label}</p>
                          <p className="text-xs text-muted-foreground">{doc.desc}</p>
                        </div>
                        {generating === doc.id && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <p className="text-[9px] text-muted-foreground/50 mt-4 text-center leading-relaxed">
                All generated documents contain general information only. No personalized legal advice is provided.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
