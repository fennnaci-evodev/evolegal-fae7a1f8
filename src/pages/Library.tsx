import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PlayCircle, FileText, Download, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeUp } from "@/lib/animations";

const videos = [
  { title: "Understanding NY Tenant Rights", duration: "12:34", topic: "Tenant-Landlord", free: true },
  { title: "UK Assured Shorthold Tenancies Explained", duration: "15:20", topic: "Tenant-Landlord", free: true },
  { title: "Lease Agreement Key Terms & Clauses", duration: "18:45", topic: "Tenant-Landlord", free: false },
  { title: "NY Eviction Process Overview", duration: "14:10", topic: "Tenant-Landlord", free: false },
  { title: "UK Family Court Process", duration: "20:15", topic: "Family Law", free: true },
  { title: "Child Custody Standards — US vs UK", duration: "16:30", topic: "Family Law", free: false },
  { title: "Filing for Divorce in NY", duration: "22:00", topic: "Family Law", free: false },
  { title: "UK Divorce Under the 2020 Act", duration: "13:45", topic: "Family Law", free: false },
];

const guides = [
  { title: "Generic Lease Review Checklist", pages: 4, topic: "Tenant-Landlord", free: true },
  { title: "NY Tenant Rights Quick Reference", pages: 6, topic: "Tenant-Landlord", free: true },
  { title: "UK Tenancy Deposit Protection Guide", pages: 5, topic: "Tenant-Landlord", free: false },
  { title: "Family Court Preparation Checklist", pages: 8, topic: "Family Law", free: false },
];

const Library = () => {
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">Content Library</h1>
          <p className="text-muted-foreground">Educational videos, guides, and templates.</p>
        </motion.div>

        {/* Videos */}
        <div>
          <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" /> Video Lectures
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {videos.map((v, i) => (
              <motion.div
                key={v.title}
                initial="hidden" animate="visible" variants={fadeUp} custom={i * 0.5 + 1}
                className="glass-card overflow-hidden cursor-pointer group"
              >
                <div className="aspect-video bg-muted/30 flex items-center justify-center relative">
                  <PlayCircle className="h-12 w-12 text-primary/30 group-hover:text-primary/70 transition-colors" />
                  {!v.free && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-background/60 backdrop-blur-sm text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" /> Pro
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{v.topic}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {v.duration}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium group-hover:text-primary transition-colors">{v.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Guides */}
        <div>
          <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" /> Guides & Templates
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {guides.map((g, i) => (
              <motion.div
                key={g.title}
                initial="hidden" animate="visible" variants={fadeUp} custom={i * 0.5 + 5}
                className="glass-card p-5 flex items-start justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-1">{g.title}</h3>
                    <p className="text-xs text-muted-foreground">{g.pages} pages · {g.topic}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0" disabled={!g.free}>
                  {g.free ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground/60 text-center">
            ⚖ All content is for general informational purposes only. Downloadable materials contain full disclaimers. Always consult a licensed professional.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Library;
