import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { HugoMessageMarkdown } from "@/components/HugoMessageMarkdown";

interface HugoTypingMessageProps {
  content: string;
  isStreaming?: boolean;
  messageId: string;
  isNew?: boolean;
}

/** Split text into paragraphs, then each paragraph into sentences */
function splitParagraphs(text: string): string[][] {
  const paras = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  return paras.map(splitSentences);
}

/** Split a paragraph into sentences, keeping punctuation attached */
function splitSentences(para: string): string[] {
  // Split on sentence-ending punctuation followed by a space or end
  const raw = para.match(/[^.!?]*[.!?]+[\s]?|[^.!?]+$/g);
  if (!raw) return [para];
  return raw.map((s) => s.trim()).filter((s) => s.length > 0);
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

interface RevealState {
  paraIndex: number;
  sentenceIndex: number;
}

export function HugoTypingMessage({ content, isStreaming, messageId, isNew }: HugoTypingMessageProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [revealed, setRevealed] = useState<RevealState>({ paraIndex: 0, sentenceIndex: 0 });
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevIdRef = useRef(messageId);

  const paragraphs = useMemo(() => splitParagraphs(content), [content]);

  // Total sentence count for quick checks
  const totalSentences = useMemo(() => paragraphs.reduce((sum, p) => sum + p.length, 0), [paragraphs]);

  const shouldAnimate = isNew === true && !isStreaming && !reducedMotion && totalSentences > 0;

  // Reset on new message
  useEffect(() => {
    if (prevIdRef.current !== messageId) {
      setRevealed({ paraIndex: 0, sentenceIndex: 0 });
      setDone(false);
      prevIdRef.current = messageId;
    }
  }, [messageId]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Main reveal loop
  useEffect(() => {
    if (!shouldAnimate) {
      setDone(true);
      return;
    }
    if (done) return;

    const scheduleNext = (currentPara: number, currentSent: number) => {
      const para = paragraphs[currentPara];
      if (!para) {
        setDone(true);
        return;
      }

      const isLastSentenceInPara = currentSent >= para.length - 1;
      const isLastPara = currentPara >= paragraphs.length - 1;

      if (isLastSentenceInPara && isLastPara) {
        // All done
        setDone(true);
        return;
      }

      let nextPara = currentPara;
      let nextSent = currentSent + 1;

      if (isLastSentenceInPara) {
        // Move to next paragraph
        nextPara = currentPara + 1;
        nextSent = 0;
      }

      // Calculate delay based on context
      let delay: number;
      if (isLastSentenceInPara && !isLastPara) {
        // Pause between paragraphs: 600-800ms
        delay = 700;
      } else {
        // Pause between sentences: 300-500ms, scaled by sentence length
        const nextSentText = paragraphs[nextPara]?.[nextSent] ?? "";
        const wordCount = nextSentText.split(/\s+/).length;
        delay = Math.min(Math.max(wordCount * 35, 300), 500);
      }

      timerRef.current = setTimeout(() => {
        setRevealed({ paraIndex: nextPara, sentenceIndex: nextSent });
        scheduleNext(nextPara, nextSent);
      }, delay);
    };

    // Start: reveal first sentence after a brief initial delay
    timerRef.current = setTimeout(() => {
      setRevealed({ paraIndex: 0, sentenceIndex: 0 });
      scheduleNext(0, 0);
    }, 200);

    return clearTimer;
  }, [paragraphs, shouldAnimate, done, clearTimer]);

  // If animation conditions change mid-way, finish instantly
  useEffect(() => {
    if (!shouldAnimate && !done) {
      setDone(true);
      clearTimer();
    }
  }, [shouldAnimate, done, clearTimer]);

  // No animation — render full content instantly (with markdown)
  if (!shouldAnimate && !isNew) {
    return <HugoMessageMarkdown content={content} />;
  }

  // Reduced motion — soft fade, markdown
  if (reducedMotion && isNew) {
    return (
      <span className="hugo-typing-reduced">
        <HugoMessageMarkdown content={content} />
      </span>
    );
  }

  // Done — show full content with a subtle settle, rendered as markdown
  if (done) {
    return (
      <span className={isNew ? "hugo-msg-settle" : undefined}>
        <HugoMessageMarkdown content={content} />
      </span>
    );
  }

  // Animating — render revealed sentences
  return (
    <span className="hugo-typing-container">
      {paragraphs.map((para, pi) => {
        if (pi > revealed.paraIndex) return null;
        const isCurrentPara = pi === revealed.paraIndex;
        const visibleCount = isCurrentPara ? revealed.sentenceIndex + 1 : para.length;

        return (
          <span key={pi} style={{ display: "block", marginBottom: pi < paragraphs.length - 1 ? "0.75em" : 0 }}>
            {para.map((sentence, si) => {
              if (si >= visibleCount) return null;
              const isLatest = isCurrentPara && si === revealed.sentenceIndex;
              return (
                <span
                  key={si}
                  className={isLatest ? "hugo-sentence-reveal" : undefined}
                >
                  {sentence}{si < visibleCount - 1 ? " " : ""}
                </span>
              );
            })}
          </span>
        );
      })}
      <span className="hugo-typing-cursor" aria-hidden="true">|</span>
    </span>
  );
}
