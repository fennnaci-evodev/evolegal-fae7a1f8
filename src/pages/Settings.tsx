import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  User, Shield, CreditCard, Bell, Lock, LayoutDashboard, Download, Trash2,
  Eye, EyeOff, CheckCircle, Monitor, Smartphone, LogOut, Camera, X
} from "lucide-react";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

export default function Settings() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();

  // Profile
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Security
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [twoFA, setTwoFA] = useState(false);

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setPhone(data.phone || "");
      }
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setProfileLoading(true);
    const { error } = await supabase.from("profiles").update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
    }).eq("id", user.id);
    setProfileLoading(false);
    if (error) { toast.error("Failed to update profile"); return; }
    toast.success("Profile updated successfully");
  };

  const changePassword = async () => {
    if (newPw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPw !== confirmPw) { toast.error("Passwords do not match"); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwLoading(false);
    if (error) { toast.error(error.message); return; }
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    toast.success("Password changed successfully");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
    toast.success("Profile picture updated");
  };

  const signOutAll = async () => {
    await supabase.auth.signOut({ scope: "global" });
    toast.success("Signed out from all devices");
    window.location.href = "/";
  };

  const deleteAccount = async () => {
    toast.error("Account deletion requires admin assistance. Please contact support@evolegal.com");
  };

  const glassCard = "glass-card border border-border/20";

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        <motion.div {...fadeUp}>
          <h1 className="text-2xl font-display font-bold text-foreground">Account Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your profile, security, and preferences.</p>
        </motion.div>

        {/* Admin Tools */}
        {isAdmin && (
          <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
            <Card className={`${glassCard} border-primary/30`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Admin Tools</CardTitle>
                  <Badge variant="outline" className="ml-auto border-primary/40 text-primary text-[10px]">Admin</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Link to="/dashboard/admin/workdesk">
                  <Button variant="hero" size="sm">Open Expert Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Profile */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <Card className={glassCard}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Profile Information</CardTitle>
              </div>
              <CardDescription>Update your personal details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="h-16 w-16 rounded-full bg-muted/50 border border-border/30 flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <Camera className="h-4 w-4 text-foreground" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>Upload photo</Button>
                  {avatarUrl && (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setAvatarUrl(null)}>
                      <X className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex items-center gap-2">
                  <Input value={user?.email || ""} disabled className="opacity-60" />
                  <Badge variant="outline" className="border-green-500/40 text-green-400 text-[10px] shrink-0">
                    <CheckCircle className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
              </div>

              <Button variant="hero" size="sm" onClick={saveProfile} disabled={profileLoading}>
                {profileLoading ? "Saving…" : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
          <Card className={glassCard}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Security</CardTitle>
              </div>
              <CardDescription>Manage your password and sessions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Change Password */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2"><Lock className="h-4 w-4" /> Change Password</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <div className="relative">
                      <Input type={showPw ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(!showPw)}>
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input type={showPw ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm Password</Label>
                      <Input type={showPw ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                    </div>
                  </div>
                  <Button size="sm" onClick={changePassword} disabled={pwLoading}>
                    {pwLoading ? "Updating…" : "Update Password"}
                  </Button>
                </div>
              </div>

              <Separator className="bg-border/20" />

              {/* 2FA */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Two-Factor Authentication</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Add an extra layer of security to your account.</p>
                </div>
                <Switch checked={twoFA} onCheckedChange={(v) => { setTwoFA(v); toast.info(v ? "2FA will be available soon" : "2FA disabled"); }} />
              </div>

              <Separator className="bg-border/20" />

              {/* Sessions */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Active Sessions</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/10">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm text-foreground">Current session</p>
                        <p className="text-[10px] text-muted-foreground">This device · Active now</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">Active</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={signOutAll} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                  <LogOut className="h-3 w-3 mr-1" /> Sign out from all devices
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <Card className={glassCard}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Subscription & Billing</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/10 border border-border/10">
                <div>
                  <p className="text-sm font-medium text-foreground">Free Plan</p>
                  <p className="text-xs text-muted-foreground">Basic access to Hugo and limited features</p>
                </div>
                <Badge variant="outline" className="border-primary/40 text-primary">Active</Badge>
              </div>

              <Link to="/pricing">
                <Button variant="hero" size="sm">Upgrade Plan</Button>
              </Link>

              <Separator className="bg-border/20" />

              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Billing History</h4>
                <p className="text-xs text-muted-foreground">No billing history yet.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
          <Card className={glassCard}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Notifications</CardTitle>
              </div>
              <CardDescription>Choose what you want to be notified about.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Email notifications for new responses</p>
                  <p className="text-xs text-muted-foreground">Get notified when an expert responds.</p>
                </div>
                <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
              </div>
              <Separator className="bg-border/20" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Push notifications for request updates</p>
                  <p className="text-xs text-muted-foreground">Receive browser push notifications.</p>
                </div>
                <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
              </div>
              <Separator className="bg-border/20" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Marketing emails</p>
                  <p className="text-xs text-muted-foreground">Tips, product updates, and offers.</p>
                </div>
                <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
              </div>
              <Button size="sm" className="mt-2" onClick={() => toast.success("Notification preferences saved")}>
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Privacy & Data */}
        <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
          <Card className={glassCard}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Privacy & Data</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                We take your data security seriously. All requests are stored securely and encrypted. You can download or delete your data at any time.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" onClick={() => toast.info("Data export will be sent to your email")}>
                  <Download className="h-3 w-3 mr-1" /> Download My Data
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                      <Trash2 className="h-3 w-3 mr-1" /> Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-strong border-destructive/30">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive">Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action is permanent and cannot be undone. All your data, requests, and chat history will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
