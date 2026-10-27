import { useEffect, useState } from "react";
import { Database } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function TrainingConsentCard({ userId }: { userId: string }) {
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void supabase.from("hugo_training_consent").select("allow_training_curation").eq("user_id", userId).maybeSingle()
      .then(({ data }) => { setOn(!!data?.allow_training_curation); setReady(true); });
  }, [userId]);
  const change = async (next: boolean) => {
    setOn(next);
    const { error } = await supabase.from("hugo_training_consent").upsert({ user_id: userId, allow_training_curation: next }, { onConflict: "user_id" });
    if (error) { setOn(!next); toast.error("Preference could not be saved."); return; }
    toast.success(next ? "Rated replies may now be reviewed for quality improvement." : "Consent withdrawn. Staged items from your account were removed.");
  };
  return (
    <Card className="glass-card border border-border/20">
      <CardHeader>
        <div className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" /><CardTitle className="text-lg">Quality Improvement</CardTitle></div>
        <CardDescription>Off by default. When on, replies you rate may be anonymized and reviewed by EvoLegal experts to improve Hugo.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <Label htmlFor="training-consent" className="text-sm font-normal text-muted-foreground">Names, emails, phone numbers and addresses are removed before review. Withdrawing removes items not yet exported.</Label>
        <Switch id="training-consent" checked={on} disabled={!ready} onCheckedChange={change} />
      </CardContent>
    </Card>
  );
}
