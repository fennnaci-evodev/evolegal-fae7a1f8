import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FEEDBACK_REASONS, type FeedbackReason } from "@/lib/curation";

type Rating = "positive" | "negative";
interface Props {
  userId: string;
  /** Hugo reply feedback */
  messageId?: string;
  chatId?: string;
  /** Contract audit feedback */
  auditId?: string;
  existingRating?: Rating | null;
}

export function HugoFeedbackButtons({ messageId, chatId, auditId, userId, existingRating }: Props) {
  const [rating, setRating] = useState<Rating | null>(existingRating ?? null);
  const [open, setOpen] = useState(false);
  const [reasons, setReasons] = useState<FeedbackReason[]>([]);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const table = auditId ? "hugo_audit_feedback" : "hugo_feedback";

  useEffect(() => {
    if (existingRating !== undefined) return;
    const q = auditId
      ? supabase.from("hugo_audit_feedback").select("rating").eq("audit_id", auditId).eq("user_id", userId).maybeSingle()
      : supabase.from("hugo_feedback").select("rating").eq("message_id", messageId!).eq("user_id", userId).maybeSingle();
    void q.then(({ data }) => { if (data) setRating(data.rating as Rating); });
  }, [auditId, messageId, userId, existingRating]);

  const submit = async (next: Rating) => {
    setSaving(true);
    const payload = { rating: next, reasons: next === "negative" ? reasons : [], comment: next === "negative" && comment.trim() ? comment.trim().slice(0, 1000) : null };
    const { error } = auditId
      ? await supabase.from("hugo_audit_feedback").upsert({ audit_id: auditId, user_id: userId, ...payload, updated_at: new Date().toISOString() }, { onConflict: "audit_id,user_id" })
      : rating
        ? await supabase.from("hugo_feedback").update(payload).eq("message_id", messageId!).eq("user_id", userId)
        : await supabase.from("hugo_feedback").insert({ message_id: messageId!, chat_id: chatId!, user_id: userId, ...payload });
    setSaving(false);
    if (error) { toast.error("Feedback could not be saved. Please retry."); return; }
    setRating(next); setOpen(false); setReasons([]); setComment("");
    toast.success("Feedback recorded.");
  };
  void table;

  const toggle = (r: FeedbackReason) => setReasons(cur => cur.includes(r) ? cur.filter(x => x !== r) : [...cur, r]);

  return (
    <div className="mt-1">
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Helpful" aria-pressed={rating === "positive"} onClick={() => submit("positive")} disabled={saving}
          className={`rounded-md p-1 transition-colors ${rating === "positive" ? "bg-risk-safe/10 text-risk-safe" : "text-muted-foreground/50 hover:text-risk-safe"}`}>
          <ThumbsUp className="h-3 w-3" />
        </button>
        <button type="button" aria-label="Inaccurate or unhelpful" aria-pressed={rating === "negative"} onClick={() => setOpen(o => !o)} disabled={saving}
          className={`rounded-md p-1 transition-colors ${rating === "negative" ? "bg-risk-high/10 text-risk-high" : "text-muted-foreground/50 hover:text-risk-high"}`}>
          <ThumbsDown className="h-3 w-3" />
        </button>
      </div>
      {open && (
        <div className="mt-2 max-w-md rounded-lg border border-border bg-card p-3">
          <p className="mb-2 text-xs text-muted-foreground">What went wrong?</p>
          <div className="flex flex-wrap gap-1.5">
            {FEEDBACK_REASONS.map(r => (
              <button key={r.id} type="button" aria-pressed={reasons.includes(r.id)} onClick={() => toggle(r.id)}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${reasons.includes(r.id) ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1">
            <input value={comment} onChange={e => setComment(e.target.value)} maxLength={1000} placeholder="Optional detail"
              onKeyDown={e => { if (e.key === "Enter") void submit("negative"); }}
              className="min-w-0 flex-1 rounded-md bg-muted/30 px-2 py-1 text-xs outline-none placeholder:text-muted-foreground/50" disabled={saving} />
            <button type="button" aria-label="Send feedback" onClick={() => submit("negative")} disabled={saving} className="p-1 text-muted-foreground hover:text-primary"><Send className="h-3 w-3" /></button>
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
