import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PlayCircle, MessageCircle, BookOpen, FileText, ArrowRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { fadeUp } from "@/lib/animations";

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

const recentActivity = [
  { title: "Tenant rights inquiry submitted", time: "2 hours ago", status: "In Review" },
  { title: "UK divorce overview — delivered", time: "1 day ago", status: "Complete" },
];

const Dashboard = () => {
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

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
            <h2 className="text-lg font-display font-semibold mb-3">Recent Activity</h2>
            <div className="space-y-2">
              {recentActivity.map((item) => (
                <div key={item.title} className="glass-card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    item.status === "Complete" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                  }`}>
                    {item.status}
                  </span>
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
