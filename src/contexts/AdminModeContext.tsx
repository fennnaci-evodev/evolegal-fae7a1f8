import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";

const MAIN_ADMIN_EMAIL = "vldkrnvl@gmail.com";

type Mode = "admin" | "user";

interface AdminModeCtx {
  mode: Mode;
  toggleMode: () => void;
  isMainAdmin: boolean;
  isAdmin: boolean;
  adminLoading: boolean;
}

const AdminModeContext = createContext<AdminModeCtx | undefined>(undefined);

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const [mode, setMode] = useState<Mode>("admin");

  const isMainAdmin = !!user && user.email === MAIN_ADMIN_EMAIL && isAdmin;

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "admin" ? "user" : "admin"));
  }, []);

  // Non-main admins are always in admin mode
  const effectiveMode = isAdmin && !isMainAdmin ? "admin" : isAdmin ? mode : "user";

  return (
    <AdminModeContext.Provider
      value={{ mode: effectiveMode, toggleMode, isMainAdmin, isAdmin, adminLoading }}
    >
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const ctx = useContext(AdminModeContext);
  if (!ctx) throw new Error("useAdminMode must be used within AdminModeProvider");
  return ctx;
}
