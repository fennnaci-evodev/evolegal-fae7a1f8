import { motion } from "framer-motion";
import { Bitcoin, Home, Users, HeartPulse, ClipboardList, Briefcase, type LucideIcon } from "lucide-react";

const topics: { label: string; icon: LucideIcon }[] = [
  { label: "Crypto Law", icon: Bitcoin },
  { label: "Rent Dispute", icon: Home },
  { label: "Family Matter", icon: Users },
  { label: "Personal Injury", icon: HeartPulse },
  { label: "Insurance Claim", icon: ClipboardList },
  { label: "Employment Law", icon: Briefcase },
];

interface Props {
  onSelect: (topic: string) => void;
}

export function HugoChatTopicChips({ onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {topics.map((t, i) => (
        <motion.button
          key={t.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.25 }}
          onClick={() => onSelect(`Tell me about ${t.label} in the US`)}
          className="glass rounded-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all flex items-center gap-1.5"
        >
          <t.icon className="h-3.5 w-3.5" />
          <span>{t.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
