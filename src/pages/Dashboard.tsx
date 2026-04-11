import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PlayCircle, MessageCircle, FileText, ArrowRight, ShieldCheck, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { fadeUp } from "@/lib/animations";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { fetchHugoChats, deleteHugoChat, type HugoChat } from "@/hooks/useHugoChat";
import { HugoAvatar } from "@/components/HugoAvatar";
import { toast } from "sonner";

const quickActions = [
  { icon: PlayCircle, title: "Video Lectures", desc: "Watch expert explanations", to: "/dashboard/library" },
  { icon: MessageCircle, title: "Ask Hugo", desc: "Get detailed insights", to: "/dashboard/chat" },
  { icon: FileText, title: "Submit Request", desc: "Get a detailed response", to: "/dashboard/submit" },
];

const featuredContent = [
  { title: "Understanding NY Tenant Rights", type: "Video", duration: "12 min", topic: "Tenant-Landlord" },
  { title: "UK Family Court Process Overview", type: "Guide", duration: "8 min read", topic: "Family Law" },
  { title: "Lease Agreement Key Terms", type: "Video", duration: "15 min", topic: "Tenant-Landlord" },
  { title: "Divorce Filing Steps in NY", type: "Guide", duration: "10 min read", topic: "Family Law" },
];

interface RecentRequest {
  id: string;
  title: string;
  created_at: string;
  status: string;
  topic: string;
  admin_response: string | null;
  responded_at: string | null;
}

interface ChatEntry {
  id: string;
  title: string;
  topic: string;
  responded_at: string;
  lastMessage?: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400",
  reviewing: "bg-blue-500/10 text-blue-400",
  completed: "bg-primary/10 text-primary",
  archived: "bg-muted/30 text-muted-foreground",
};

const Dashboard = () => {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<RecentRequest[]>([]);
  const [activeChats, setActiveChats] = useState<ChatEntry[]>([]);
  const [hugoChats, setHugoChats] = useState<HugoChat[]>([]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Fetch Hugo chats
      const hChats = await fetchHugoChats();
      setHugoChats(hChats.slice(0, 5));

      // Fetch legal requests
      const { data } = await supabase
        .from("legal_requests" as any)
        .select("id, title, created_at, status, topic, admin_response, responded_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!data) return;
      const requests = data as unknown as RecentRequest[];

      const answered: ChatEntry[] = [];
      const pending: RecentRequest[] = [];

      for (const req of requests) {
        if (req.admin_response && req.admin_response.trim().length > 0) {
          answered.push({
            id: req.id,
            title: req.title || req.topic,
            topic: req.topic,
            responded_at: req.responded_at || req.created_at,
            lastMessage: req.admin_response.slice(0, 80) + (req.admin_response.length > 80 ? "…" : ""),
          });
        } else {
          pending.push(req);
        }
      }

      const answeredIds = new Set(answered.map((a) => a.id));
      const pendingIds = pending.map((p) => p.id);
      if (pendingIds.length > 0) {
        const { data: msgData } = await supabase
          .from("request_messages" as any)
          .select("request_id, content, created_at")
          .in("request_id", pendingIds)
          .in("sender_role", ["admin", "expert"])
          .order("created_at", { ascending: false })
          .limit(50);

        if (msgData) {
          const msgsByRequest = new Map<string, any>();
          for (const m of msgData as any[]) {
            if (!msgsByRequest.has(m.request_id)) msgsByRequest.set(m.request_id, m);
          }
          const stillPending: RecentRequest[] = [];
          for (const req of pending) {
            const expertMsg = msgsByRequest.get(req.id);
            if (expertMsg && !answeredIds.has(req.id)) {
              answered.push({
                id: req.id, title: req.title || req.topic, topic: req.topic,
                responded_at: expertMsg.created_at,
                lastMessage: expertMsg.content?.slice(0, 80) + (expertMsg.content?.length > 80 ? "…" : ""),
              });
            } else {
              stillPending.push(req);
            }
          }
          setPendingRequests(stillPending.slice(0, 5));
        } else {
          setPendingRequests(pending.slice(0, 5));
        }
      } else {
        setPendingRequests([]);
      }

      answered.sort((a, b) => new Date(b.responded_at).getTime() - new Date(a.responded_at).getTime());
      setActiveChats(answered.slice(0, 5));
    };

    load();
  }, [user]);

  const handleDeleteHugoChat = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this Hugo conversation?")) return;
    const ok = await deleteHugoChat(id);
    if (ok) {
      setHugoChats(prev => prev.filter(c => c.id !== id));
      toast.success("Chat deleted");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">Welcome back 👋</h1>
          <p className="text-muted-foreground">Continue your legal education journey.</p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          {quickActions.map((item, i) => (
            <motion.div key={item.title} initial="hidden" animate="visible" variants={fadeUp} custom={i + 1}>
              <Link to={item.to} className="glass-card p-6 flex flex-col gap-4 block">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Hugo Chats */}
        {hugoChats.length > 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-display font-semibold">Chats with Hugo</h2>
              </div>
              <Link to="/dashboard/chat">
                <Button variant="ghost" size="sm" className="text-primary">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {hugoChats.map((chat) => (
                <Link key={chat.id} to={`/dashboard/hugo/${chat.id}`}>
                  <div className="glass-card p-4 flex items-center gap-4 hover:border-primary/20 transition-all cursor-pointer group">
                    <HugoAvatar size={36} animate={false} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                        {chat.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(chat.updated_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                        Hugo
                      </Badge>
                      <button
                        onClick={(e) => handleDeleteHugoChat(chat.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Active Expert Chats */}
        {activeChats.length > 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" style={{ color: "hsl(270, 95%, 75%)" }} />
                <h2 className="text-lg font-display font-semibold">Expert Chats</h2>
              </div>
            </div>
            <div className="space-y-2">
              {activeChats.map((chat) => (
                <Link key={chat.id} to={`/dashboard/chat/${chat.id}`}>
                  <div className="glass-card p-4 flex items-center gap-4 hover:border-primary/20 transition-all cursor-pointer group">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "hsla(270, 95%, 75%, 0.12)" }}>
                      <ShieldCheck className="h-5 w-5" style={{ color: "hsl(270, 95%, 75%)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{chat.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted-foreground">{new Date(chat.responded_at).toLocaleDateString()}</p>
                      <Badge variant="outline" className="text-[10px] mt-1" style={{ color: "hsl(270, 95%, 75%)", borderColor: "hsla(270, 95%, 75%, 0.3)" }}>
                        Expert
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Requests */}
        {pendingRequests.length > 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-display font-semibold">Recent Requests</h2>
              </div>
              <Link to="/dashboard/requests">
                <Button variant="ghost" size="sm" className="text-primary">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {pendingRequests.map((item) => (
                <div key={item.id} className="glass-card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.title || item.topic}</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${statusColors[item.status] ?? ""}`}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Featured Content */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-semibold">Featured Content</h2>
            <Link to="/dashboard/library">
              <Button variant="ghost" size="sm" className="text-primary">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {featuredContent.map((item, i) => (
              <motion.div key={item.title} initial="hidden" animate="visible" variants={fadeUp} custom={7 + i} className="glass-card p-5 cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{item.type}</span>
                  <span className="text-xs text-muted-foreground">{item.duration}</span>
                </div>
                <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.topic}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground/60 text-center">
            Hugo & our Experts are here to help. For complex personal matters, professional representation may be recommended.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
