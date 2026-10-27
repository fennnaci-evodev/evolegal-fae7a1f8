import { useState } from "react";
import { Volume2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { isSoundEnabled, playSwitch, setSoundEnabled } from "@/lib/sound";

export function SoundSettingsCard() {
  const [on, setOn] = useState(isSoundEnabled);
  const change = (next: boolean) => { setSoundEnabled(next); setOn(next); if (next) playSwitch(true); };
  return (
    <Card className="surface-card shadow-none">
      <CardHeader>
        <div className="flex items-center gap-2"><Volume2 className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-[15px] font-semibold tracking-tight">Sound Effects</CardTitle></div>
        <CardDescription>Off by default. A quiet chime when Hugo finishes a reply or audit, and a soft click on switches.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <Label htmlFor="sound-effects" className="text-sm font-normal text-muted-foreground">Play sound effects</Label>
        <Switch id="sound-effects" checked={on} onCheckedChange={change} />
      </CardContent>
    </Card>
  );
}
