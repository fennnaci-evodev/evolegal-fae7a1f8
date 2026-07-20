import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DOCUMENT_TYPES = [
  { id: "overview", label: "Information Overview", badge: "Self-Help Outline", desc: "Educational overview of relevant frameworks and considerations" },
  { id: "checklist", label: "Preparation Checklist", badge: "Draft Framework", desc: "Organizational checklist of materials commonly gathered" },
  { id: "template", label: "Template Outline", badge: "Draft Framework", desc: "Structural template with fillable placeholders you control" },
  { id: "comparative", label: "Comparative Guide", badge: "Self-Help Outline", desc: "Neutral side-by-side comparison of alternative approaches" },
] as const;

const COMPLIANCE_DISCLAIMER =
  "EvoLegal is an automated self-help platform providing legal information and document frameworks. This document is an educational draft generated based on user-inputted parameters, does not constitute legal advice, and does not establish an attorney-client relationship. Review by qualified human counsel is recommended before formal execution.";


interface DocumentFactoryProps {
  topic: string;
  chatId?: string | null;
  requestId?: string | null;
  conversationContext?: string;
  autoOpen?: boolean;
  onClose?: () => void;
}

export function DocumentFactoryButton({ topic, chatId, requestId, conversationContext, autoOpen, onClose }: DocumentFactoryProps) {
  const [open, setOpen] = useState(autoOpen ?? false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState("");

  const handleClose = () => {
    if (!generating) {
      setOpen(false);
      onClose?.();
    }
  };

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
      toast.success("Here is a general informational template that many people find useful as a starting point.");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setGenerating(null);
    }
  };

  return (
    <>
      {!autoOpen && (
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
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong w-full max-w-lg p-6 relative"
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-display font-semibold">Generate Document</h3>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-primary/30 text-primary/90 bg-primary/5">
                    Self-Help Framework
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a document type for: <span className="text-foreground font-medium">{topic}</span>
                </p>
              </div>

              {generatedUrl ? (
                <div className="space-y-4">
                  <div className="glass rounded-xl p-4 flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{generatedTitle}</p>
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-primary/30 text-primary/90 bg-primary/5 shrink-0">
                          Draft Framework
                        </span>
                      </div>
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
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{doc.label}</p>
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-primary/30 text-primary/90 bg-primary/5">
                              {doc.badge}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{doc.desc}</p>
                        </div>
                        {generating === doc.id && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-border/40">
                <p className="text-[9px] text-muted-foreground/60 leading-relaxed text-center">
                  {COMPLIANCE_DISCLAIMER}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

