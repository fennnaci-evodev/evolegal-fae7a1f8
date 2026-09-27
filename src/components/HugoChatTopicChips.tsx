import { motion } from "framer-motion";
import { ShieldAlert, FileSignature, ListChecks, GitCompareArrows, type LucideIcon } from "lucide-react";

const topics: { label: string; prompt: string; icon: LucideIcon }[] = [
  { label: "Audit liability caps, indemnity triggers, and non-standard terms.", prompt: "Audit liability caps, indemnity triggers, and non-standard terms.", icon: ShieldAlert },
  { label: "Draft a balanced NDA aligned with standard commercial terms.", prompt: "Draft a balanced NDA aligned with standard commercial terms.", icon: FileSignature },
  { label: "Extract termination rights, cure periods, and renewal triggers.", prompt: "Extract termination rights, cure periods, and renewal triggers.", icon: ListChecks },
  { label: "Compare draft against playbook and highlight risk deviations.", prompt: "Compare draft against playbook and highlight risk deviations.", icon: GitCompareArrows },
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
