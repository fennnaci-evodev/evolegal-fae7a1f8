import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PlayCircle, MessageCircle, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { fadeUp } from "@/lib/animations";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

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
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400",
  reviewing: "bg-blue-500/10 text-blue-400",
  completed: "bg-primary/10 text-primary",
  archived: "bg-muted/30 text-muted-foreground",
};

const Dashboard = () => {
  const { user } = useAuth();
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("legal_requests" as any)
      .select("id, title, created_at, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setRecentRequests(data as any);
      });
  }, [user]);

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

        {/* Recent Requests from DB */}
        {recentRequests.length > 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-display font-semibold">Recent Requests</h2>
              <Link to="/dashboard/requests">
                <Button variant="ghost" size="sm" className="text-primary">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {recentRequests.map((item) => (
                <div key={item.id} className="glass-card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
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
              <motion.div
                key={item.title}
                initial="hidden" animate="visible" variants={fadeUp} custom={5 + i}
                className="glass-card p-5 cursor-pointer group"
              >
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
