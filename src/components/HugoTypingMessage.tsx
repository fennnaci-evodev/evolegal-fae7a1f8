import { useState, useEffect, useRef, useMemo } from "react";

interface HugoTypingMessageProps {
  content: string;
  isStreaming?: boolean;
  messageId: string;
  isNew?: boolean;
}

/** Split text into paragraphs (double newline) */
function splitParagraphs(text: string): string[] {
  const parts = text.split(/\n\n+/);
  return parts.filter((p) => p.trim().length > 0);
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

export function HugoTypingMessage({ content, isStreaming, messageId, isNew }: HugoTypingMessageProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [revealedCount, setRevealedCount] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevIdRef = useRef(messageId);

  const paragraphs = useMemo(() => splitParagraphs(content), [content]);

  const shouldAnimate = isNew === true && !isStreaming && !reducedMotion;

  useEffect(() => {
    if (prevIdRef.current !== messageId) {
      setRevealedCount(0);
      setDone(false);
      prevIdRef.current = messageId;
    }
  }, [messageId]);

  useEffect(() => {
    if (!shouldAnimate) {
      setRevealedCount(paragraphs.length);
      setDone(true);
      return;
    }

    if (done) return;

    const revealNext = () => {
      setRevealedCount((prev) => {
        const next = prev + 1;
        if (next >= paragraphs.length) {
          setDone(true);
          return next;
        }
        // Calm pace: ~50ms per word, min 400ms, max 1800ms per paragraph
        const wordCount = paragraphs[next]?.split(/\s+/).length ?? 5;
        const delay = Math.min(Math.max(wordCount * 50, 400), 1800);
        timerRef.current = setTimeout(revealNext, delay);
        return next;
      });
    };

    // Initial delay before first paragraph
    timerRef.current = setTimeout(revealNext, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [paragraphs, shouldAnimate, done]);

  useEffect(() => {
    if (!shouldAnimate && revealedCount < paragraphs.length) {
      setRevealedCount(paragraphs.length);
      setDone(true);
    }
  }, [paragraphs.length, shouldAnimate, revealedCount]);

  if (!shouldAnimate) {
    return <span>{content}</span>;
  }

  const showCursor = !done;

  return (
    <span className="hugo-typing-container">
      {paragraphs.map((para, i) => {
        if (i >= revealedCount) return null;
        const isLatest = i === revealedCount - 1 && !done;
        return (
          <span
            key={i}
            className={isLatest ? "hugo-paragraph-reveal" : undefined}
            style={{ display: "block", marginBottom: i < paragraphs.length - 1 ? "0.75em" : 0 }}
          >
            {para}
          </span>
        );
      })}
      {showCursor && (
        <span className="hugo-typing-cursor" aria-hidden="true">|</span>
      )}
    </span>
  );
}
