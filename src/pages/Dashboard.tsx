import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PlayCircle, MessageCircle, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const quickActions = [
  { icon: PlayCircle, title: "Video Lectures", desc: "Watch expert explanations", to: "/dashboard/library", color: "primary" },
  { icon: MessageCircle, title: "Ask Expert Manager", desc: "Get general information", to: "/dashboard/chat", color: "accent" },
  { icon: BookOpen, title: "Guides & Templates", desc: "Download resources", to: "/dashboard/library", color: "primary" },
];

const featuredContent = [
  { title: "Understanding NY Tenant Rights", type: "Video", duration: "12 min", topic: "Tenant-Landlord" },
  { title: "UK Family Court Process Overview", type: "Guide", duration: "8 min read", topic: "Family Law" },
  { title: "Lease Agreement Key Terms", type: "Video", duration: "15 min", topic: "Tenant-Landlord" },
  { title: "Divorce Filing Steps in NY", type: "Guide", duration: "10 min read", topic: "Family Law" },
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back 👋</h1>
          <p className="text-muted-foreground font-body">Continue your legal education journey.</p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          {quickActions.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={item.to} className="glass rounded-xl p-6 flex flex-col gap-4 hover:border-primary/30 transition-all group block">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:glow-cyan transition-all">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground font-body">{item.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Featured Content */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Featured Content</h2>
            <Link to="/dashboard/library">
              <Button variant="ghost" size="sm" className="text-primary">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {featuredContent.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="glass rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{item.type}</span>
                  <span className="text-xs text-muted-foreground font-body">{item.duration}</span>
                </div>
                <h3 className="font-medium mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-xs text-muted-foreground font-body">{item.topic}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="glass rounded-xl p-4 border-primary/20">
          <p className="text-xs text-muted-foreground text-center font-body">
            ⚖ All content is for general informational and educational purposes only. Not legal advice. Always consult a licensed professional.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
