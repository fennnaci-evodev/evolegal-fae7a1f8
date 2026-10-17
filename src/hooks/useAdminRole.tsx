import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useAdminRole() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setIsAdmin(false); setLoading(false); setResolvedUserId(null); return; }
    let cancelled = false;
    setLoading(true);

    const check = async () => {
      const { data, error } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (cancelled) return;
      setResolvedUserId(user.id);
      setIsAdmin(!error && !!data);
      setLoading(false);
    };
    check();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  return { isAdmin: resolvedUserId === user?.id && isAdmin, loading: authLoading || loading || Boolean(user && resolvedUserId !== user.id) };
}
