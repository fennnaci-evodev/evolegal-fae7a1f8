import { useEffect, useRef, useState } from "react";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
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

const iconBtn = "inline-flex h-9 w-10 items-center justify-center rounded-full transition-colors duration-100 sm:h-7 sm:w-8 disabled:opacity-60";

/**
 * One tap saves the rating. Diagnostic reasons and the optional note update the
 * same row (upsert on the per-user unique key), never creating a duplicate.
 */
export function HugoFeedbackButtons({ messageId, chatId, auditId, userId, existingRating }: Props) {
  const [rating, setRating] = useState<Rating | null>(existingRating ?? null);
  const [reasons, setReasons] = useState<FeedbackReason[]>([]);
  const [comment, setComment] = useState("");
  const [savedComment, setSavedComment] = useState("");
  const [saving, setSaving] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    if (existingRating !== undefined) return;
    const q = auditId
      ? supabase.from("hugo_audit_feedback").select("rating, reasons, comment").eq("audit_id", auditId).eq("user_id", userId).maybeSingle()
      : supabase.from("hugo_feedback").select("rating, reasons, comment").eq("message_id", messageId!).eq("user_id", userId).maybeSingle();
    void q.then(({ data }) => {
      if (!data) return;
      setRating(data.rating as Rating);
      setReasons((data.reasons ?? []) as FeedbackReason[]);
      setComment(data.comment ?? ""); setSavedComment(data.comment ?? "");
    });
  }, [auditId, messageId, userId, existingRating]);

  const save = async (next: Rating, nextReasons: FeedbackReason[], nextComment: string, announce: boolean) => {
    const id = ++seq.current;
    setSaving(true);
    const payload = {
      rating: next,
      reasons: next === "negative" ? nextReasons : [],
      comment: next === "negative" && nextComment.trim() ? nextComment.trim().slice(0, 1000) : null,
      updated_at: new Date().toISOString(),
    };
    const { error } = auditId
      ? await supabase.from("hugo_audit_feedback").upsert({ audit_id: auditId, user_id: userId, ...payload }, { onConflict: "audit_id,user_id" })
      : await supabase.from("hugo_feedback").upsert({ message_id: messageId!, chat_id: chatId!, user_id: userId, ...payload }, { onConflict: "message_id,user_id" });
    if (id === seq.current) setSaving(false);
    if (error) { toast.error("Feedback could not be saved. Please retry."); return false; }
    if (announce) toast.success("Feedback recorded.");
    return true;
  };

  const rate = async (next: Rating) => {
    const prev = rating;
    setRating(next);
    const nextReasons = next === "negative" ? reasons : [];
    if (next === "positive") { setReasons([]); setComment(""); setSavedComment(""); }
    if (!(await save(next, nextReasons, next === "negative" ? comment : "", true))) setRating(prev);
  };

  const toggle = (r: FeedbackReason) => {
    const next = reasons.includes(r) ? reasons.filter(x => x !== r) : [...reasons, r];
    setReasons(next);
    void save("negative", next, comment, false);
  };

  const commitComment = () => {
    if (comment.trim() === savedComment.trim()) return;
    setSavedComment(comment);
    void save("negative", reasons, comment, false);
  };

  const open = rating === "negative";

  return (
    <div className="mt-1">
      <div className="flex items-center">
        <button type="button" aria-label="Helpful" aria-pressed={rating === "positive"} onClick={() => rate("positive")} disabled={saving && rating === "positive"}
            className={`${iconBtn} ${rating === "positive" ? "text-risk-safe" : "text-muted-foreground/50 hover:text-risk-safe"}`}>
          <ThumbsUp className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <button type="button" aria-label="Inaccurate or unhelpful" aria-pressed={rating === "negative"} onClick={() => rating !== "negative" && rate("negative")}
            className={`${iconBtn} ${rating === "negative" ? "text-risk-high" : "text-muted-foreground/50 hover:text-risk-high"}`}>
          <ThumbsDown className="h-4 w-4" strokeWidth={1.75} />
        </button>
        {rating && <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground" aria-live="polite">
          <Check className="h-3 w-3" />{saving ? "Saving" : "Saved"}
        </span>}
      </div>
      <div className="evo-collapse" data-open={open} aria-hidden={!open}>
        <div className="evo-collapse-inner">
          <div className="mt-2 max-w-md rounded-lg border border-border bg-card p-3">
            <p className="mb-2 text-xs text-muted-foreground">Optional: what went wrong?</p>
            <div className="flex flex-wrap gap-1.5">
              {FEEDBACK_REASONS.map(r => (
                <button key={r.id} type="button" tabIndex={open ? 0 : -1} aria-pressed={reasons.includes(r.id)} onClick={() => toggle(r.id)}
                  className={`min-h-9 rounded-full border px-3 text-xs transition-colors duration-100 sm:min-h-7 ${reasons.includes(r.id) ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <input value={comment} tabIndex={open ? 0 : -1} onChange={e => setComment(e.target.value)} maxLength={1000} placeholder="Optional detail, saved when you leave the field"
              onBlur={commitComment} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commitComment(); } }}
              className="mt-2 h-9 w-full rounded-md bg-muted/30 px-2 text-xs outline-none placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
