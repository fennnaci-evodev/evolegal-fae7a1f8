import { useAdminMode } from "@/contexts/AdminModeContext";
import { Shield, User } from "lucide-react";
import { motion } from "framer-motion";

export function AdminModeToggle() {
  const { mode, toggleMode, isMainAdmin } = useAdminMode();

  if (!isMainAdmin) return null;

  const isAdminMode = mode === "admin";

  return (
    <button
      onClick={toggleMode}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-strong border border-border/30 transition-all duration-300 hover:scale-[1.02] group"
      title={`Switch to ${isAdminMode ? "User" : "Admin"} Mode`}
    >
      <div className="relative w-9 h-5 rounded-full bg-muted/50 border border-border/30 transition-colors duration-300">
        <motion.div
          className="absolute top-0.5 w-4 h-4 rounded-full flex items-center justify-center"
          style={{
            background: isAdminMode
              ? "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-purple)))"
              : "hsl(var(--muted-foreground))",
          }}
          animate={{ left: isAdminMode ? "1px" : "17px" }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {isAdminMode ? (
            <Shield className="w-2.5 h-2.5 text-primary-foreground" />
          ) : (
            <User className="w-2.5 h-2.5 text-primary-foreground" />
          )}
        </motion.div>
      </div>
      <motion.span
        key={mode}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[10px] font-semibold uppercase tracking-wider hidden sm:block"
        style={{
          color: isAdminMode ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
        }}
      >
        {isAdminMode ? "Admin" : "User"}
      </motion.span>
    </button>
  );
}
