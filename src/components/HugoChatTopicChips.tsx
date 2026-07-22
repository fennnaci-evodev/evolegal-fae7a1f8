import { motion } from "framer-motion";
import { ShieldAlert, FileSignature, Scale, Home, Briefcase, Gavel, type LucideIcon } from "lucide-react";

const topics: { label: string; prompt: string; icon: LucideIcon }[] = [
  { label: "Highlight hidden risks in this contract", prompt: "Highlight the hidden risks in this contract.", icon: ShieldAlert },
  { label: "Draft a balanced NDA", prompt: "Draft a balanced NDA between two parties.", icon: FileSignature },
  { label: "Summarize key termination clauses", prompt: "Summarize the key termination clauses I should look for.", icon: Scale },
  { label: "Review a rental agreement", prompt: "Review a rental agreement and flag anything unusual.", icon: Home },
  { label: "Explain an employment offer", prompt: "Explain the key terms in an employment offer.", icon: Briefcase },
  { label: "Compare US vs UK tenant rights", prompt: "Compare tenant rights in the US and the UK.", icon: Gavel },
];

interface Props {
  onSelect: (topic: string) => void;
}

export function HugoChatTopicChips({ onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
      {topics.map((t, i) => (
        <motion.button
          key={t.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.25 }}
          onClick={() => onSelect(t.prompt)}
          className="glass rounded-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all flex items-center gap-1.5"
        >
          <t.icon className="h-3.5 w-3.5" />
          <span>{t.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
