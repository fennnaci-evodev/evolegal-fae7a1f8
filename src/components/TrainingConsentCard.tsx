import { useEffect, useState } from "react";
import { Database, Lock } from "lucide-react";
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
    toast.success(next ? "Quality Improvement enabled." : "Consent withdrawn. All unexported records from your account were deleted.");
  };
  return (
    <Card className="glass-card border border-border/20">
      <CardHeader>
        <div className="mb-3 rounded-2xl border border-border/30 bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Lock className="h-4 w-4 text-primary" />Data Privacy &amp; Protection (GDPR)</div>
          <p className="text-xs leading-relaxed text-muted-foreground">All uploaded documents are encrypted. Personal data is removed prior to any quality-improvement review. System improvement is strictly subject to explicit user consent.</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Enabling Quality Improvement authorizes the processing of anonymized interaction data for future model development. This consent is revocable at any time with immediate effect via a single click, resulting in the prompt deletion of all unexported records.</p>
        </div>
        <div className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" /><CardTitle className="text-lg">Quality Improvement</CardTitle></div>
        <CardDescription>Off by default.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <Label htmlFor="training-consent" className="text-sm font-normal text-muted-foreground">Allow anonymized review of rated replies.</Label>
        <Switch id="training-consent" checked={on} disabled={!ready} onCheckedChange={change} />
      </CardContent>
    </Card>
  );
}
