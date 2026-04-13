import { useState, useEffect, useRef, useMemo } from "react";

interface HugoTypingMessageProps {
  content: string;
  isStreaming?: boolean;
  messageId: string;
  /** Only animate if this is a brand-new message (not loaded from history) */
  isNew?: boolean;
}

function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?\n]+[.!?\n]*[\s]*/g);
  if (!parts) return [text];
  return parts;
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

  const sentences = useMemo(() => splitSentences(content), [content]);

  // Only animate if: isNew=true, not streaming, not reduced motion
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
      setRevealedCount(sentences.length);
      setDone(true);
      return;
    }

    if (done) return;

    const revealNext = () => {
      setRevealedCount((prev) => {
        const next = prev + 1;
        if (next >= sentences.length) {
          setDone(true);
          return next;
        }
        // Faster: 30ms per word, min 80ms, max 500ms
        const wordCount = sentences[next]?.split(/\s+/).length ?? 2;
        const delay = Math.min(Math.max(wordCount * 30, 80), 500);
        timerRef.current = setTimeout(revealNext, delay);
        return next;
      });
    };

    timerRef.current = setTimeout(revealNext, 60);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sentences, shouldAnimate, done]);

  useEffect(() => {
    if (!shouldAnimate && revealedCount < sentences.length) {
      setRevealedCount(sentences.length);
      setDone(true);
    }
  }, [sentences.length, shouldAnimate, revealedCount]);

  if (!shouldAnimate) {
    return <span>{content}</span>;
  }

  const visibleText = sentences.slice(0, revealedCount).join("");
  const showCursor = !done;

  return (
    <span className="hugo-typing-container">
      {visibleText}
      {showCursor && (
        <span className="hugo-typing-cursor" aria-hidden="true">|</span>
      )}
    </span>
  );
}
