import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  content: string;
  className?: string;
}

/**
 * Detects "Impact on the Case" style bullet items where the raw text starts
 * with `+ ` (positive impact) or `- ` (negative impact) after markdown parsing.
 * We infer polarity from the first meaningful character of the list item.
 */
function extractPolarity(children: ReactNode): "positive" | "negative" | null {
  const flatten = (node: ReactNode): string => {
    if (node == null || typeof node === "boolean") return "";
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(flatten).join("");
    // @ts-expect-error react element children
    if (node?.props?.children) return flatten(node.props.children);
    return "";
  };
  const text = flatten(children).trim();
  // remark strips the leading list marker; but authors sometimes prefix with + / − / ✓ / ✗
  if (/^(\+|✓|✅|\bpositive\b|\bstrengthens?\b|\bstrong\b)/i.test(text)) return "positive";
  if (/^(-|−|–|✗|❌|\bnegative\b|\bweakens?\b|\brisk\b|\bweak\b)/i.test(text)) return "negative";
  return null;
}

/**
 * Beautiful, safe markdown renderer for Hugo messages.
 * Adds visual accents to "Impact on the Case" style bullets:
 *  - Positive → green left border + up arrow icon
 *  - Negative → red left border + down arrow icon
 */
export function HugoMessageMarkdown({ content, className }: Props) {
  return (
    <div className={`hugo-md ${className ?? ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          h1: ({ children }) => (
            <h3 className="text-sm font-display font-semibold mb-1.5 mt-3 first:mt-0">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="text-sm font-display font-semibold mb-1.5 mt-3 first:mt-0">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-[13px] font-display font-semibold mb-1 mt-2.5 first:mt-0" style={{ color: "hsl(186 100% 65%)" }}>{children}</h4>
          ),
          h4: ({ children }) => (
            <h5 className="text-[12px] font-semibold mb-1 mt-2 first:mt-0">{children}</h5>
          ),
          ul: ({ children }) => <ul className="space-y-1.5 my-2 pl-0 list-none">{children}</ul>,
          ol: ({ children }) => <ol className="space-y-1.5 my-2 pl-4 list-decimal marker:text-muted-foreground/60">{children}</ol>,
          li: ({ children }) => {
            const polarity = extractPolarity(children);
            if (polarity === "positive") {
              return (
                <li
                  className="flex items-start gap-2 rounded-lg pl-2.5 pr-2 py-1.5 text-[13px] leading-relaxed"
                  style={{
                    borderLeft: "2px solid hsl(150 75% 55%)",
                    background: "hsla(150,75%,55%,0.06)",
                  }}
                >
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 mt-[3px]" style={{ color: "hsl(150 75% 60%)" }} aria-hidden="true" />
                  <span className="min-w-0">{children}</span>
                </li>
              );
            }
            if (polarity === "negative") {
              return (
                <li
                  className="flex items-start gap-2 rounded-lg pl-2.5 pr-2 py-1.5 text-[13px] leading-relaxed"
                  style={{
                    borderLeft: "2px solid hsl(0 75% 62%)",
                    background: "hsla(0,75%,62%,0.06)",
                  }}
                >
                  <ArrowDownRight className="h-3.5 w-3.5 shrink-0 mt-[3px]" style={{ color: "hsl(0 75% 66%)" }} aria-hidden="true" />
                  <span className="min-w-0">{children}</span>
                </li>
              );
            }
            return (
              <li className="flex items-start gap-2 text-[13px] leading-relaxed">
                <span className="mt-[9px] h-1 w-1 rounded-full shrink-0 bg-muted-foreground/60" aria-hidden="true" />
                <span className="min-w-0">{children}</span>
              </li>
            );
          },
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer noopener" className="text-primary underline underline-offset-2 hover:opacity-80">{children}</a>
          ),
          code: ({ children }) => (
            <code className="px-1 py-0.5 rounded bg-muted/40 text-[12px] font-mono">{children}</code>
          ),
          hr: () => <hr className="my-3 border-border/30" />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground italic">{children}</blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
