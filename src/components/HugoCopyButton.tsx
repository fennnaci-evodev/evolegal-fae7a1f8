import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface HugoCopyButtonProps {
  content: string;
  className?: string;
}

async function copyToClipboard(text: string): Promise<boolean> {
  // Modern API (requires secure context + permission)
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy fallback
    }
  }
  // Legacy fallback using a hidden textarea + execCommand
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.setAttribute("aria-hidden", "true");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.width = "1px";
    textarea.style.height = "1px";
    textarea.style.padding = "0";
    textarea.style.border = "none";
    textarea.style.outline = "none";
    textarea.style.boxShadow = "none";
    textarea.style.background = "transparent";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function HugoCopyButton({ content, className = "" }: HugoCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyToClipboard(content);
    if (ok) {
      setCopied(true);
      toast.success("Copied!", { duration: 1500 });
      setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error("Failed to copy");
    }
  };

  const label = copied ? "Message copied to clipboard" : "Copy message to clipboard";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={label}
          aria-live="polite"
          // Fixed min-width so the label swap between "Copy" and "Copied" doesn't
          // reflow the surrounding chat layout during Hugo's message animations.
          // `will-change: transform` keeps the hover/active transitions on the
          // compositor instead of triggering layout.
          style={{ minWidth: 62, willChange: "transform" }}
          className={`inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium leading-none transition-colors duration-150 border border-cyan-400/20 bg-cyan-400/5 text-cyan-300/70 backdrop-blur-sm hover:text-cyan-200 hover:bg-cyan-400/10 hover:border-cyan-400/40 hover:shadow-[0_0_8px_hsla(180,100%,70%,0.25)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${className}`}
        >
          {copied ? (
            <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
          ) : (
            <Copy className="h-3 w-3 shrink-0" aria-hidden="true" />
          )}
          <span aria-hidden="true">{copied ? "Copied" : "Copy"}</span>
          <span className="sr-only" role="status" aria-live="polite">
            {copied ? "Copied to clipboard" : ""}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[10px]">
        {copied ? "Copied!" : "Copy message"}
      </TooltipContent>
    </Tooltip>
  );
}
