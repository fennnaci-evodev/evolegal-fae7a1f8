import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface HugoCopyButtonProps {
  content: string;
  className?: string;
}

export function HugoCopyButton({ content, className = "" }: HugoCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Copied!", { duration: 1500 });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy message"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border border-cyan-400/20 bg-cyan-400/5 text-cyan-300/70 hover:text-cyan-200 hover:bg-cyan-400/10 hover:border-cyan-400/40 hover:shadow-[0_0_8px_hsla(180,100%,70%,0.25)] active:scale-95 ${className}`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
