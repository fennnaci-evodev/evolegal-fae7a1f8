import { useState, useEffect, useRef, useMemo } from "react";

/**
 * HugoTypingMessage — Premium sentence-by-sentence typing reveal for Hugo's messages.
 *
 * - Streaming messages (isStreaming=true): renders content as-is (already animated by SSE).
 * - Non-streaming messages: reveals sentence by sentence with a blinking cursor.
 * - Respects prefers-reduced-motion.
 */

interface HugoTypingMessageProps {
  content: string;
  isStreaming?: boolean;
  /** Unique message id — resets animation when it changes */
  messageId: string;
}

// Split text into sentences, keeping delimiters attached
function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace or end
  const parts = text.match(/[^.!?\n]+[.!?\n]*[\s]*/g);
  if (!parts) return [text];
  return parts;
}

// Check if user prefers reduced motion
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

export function HugoTypingMessage({ content, isStreaming, messageId }: HugoTypingMessageProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [revealedCount, setRevealedCount] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevIdRef = useRef(messageId);

  const sentences = useMemo(() => splitSentences(content), [content]);

  // Reset when messageId changes (new message)
  useEffect(() => {
    if (prevIdRef.current !== messageId) {
      setRevealedCount(0);
      setDone(false);
      prevIdRef.current = messageId;
    }
  }, [messageId]);

  // If streaming or reduced motion, show everything immediately
  const skipAnimation = isStreaming || reducedMotion;

  useEffect(() => {
    if (skipAnimation) {
      setRevealedCount(sentences.length);
      setDone(true);
      return;
    }

    if (done) return;

    // Sentence reveal timing: base 60ms per word in the sentence, min 200ms, max 1200ms
    const revealNext = () => {
      setRevealedCount((prev) => {
        const next = prev + 1;
        if (next >= sentences.length) {
          setDone(true);
          return next;
        }
        // Schedule the next sentence
        const nextSentence = sentences[next];
        const wordCount = nextSentence?.split(/\s+/).length ?? 3;
        const delay = Math.min(Math.max(wordCount * 60, 200), 1200);
        timerRef.current = setTimeout(revealNext, delay);
        return next;
      });
    };

    // Start with a small initial delay
    timerRef.current = setTimeout(revealNext, 120);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sentences, skipAnimation, done]);

  // Also update when content grows (streaming finished, more content appended)
  useEffect(() => {
    if (skipAnimation && revealedCount < sentences.length) {
      setRevealedCount(sentences.length);
      setDone(true);
    }
  }, [sentences.length, skipAnimation, revealedCount]);

  if (skipAnimation) {
    return (
      <span className="hugo-typing-reduced">
        {content}
      </span>
    );
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
