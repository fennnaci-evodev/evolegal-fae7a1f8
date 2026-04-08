import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, ArrowRight, Download } from "lucide-react";
import { fadeUp } from "@/lib/animations";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { generateCasePdf } from "@/lib/generateCasePdf";
import { toast } from "sonner";

interface LegalRequest {
  id: string;
  created_at: string;
  status: string;
  topic: string;
  title: string;
  description: string;
  state: string;
  facts: any;
  admin_response: string;
  responded_at: string | null;
  ticket_number: string | null;
  assigned_to_name: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  reviewing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-primary/10 text-primary border-primary/20",
  archived: "bg-muted/30 text-muted-foreground border-border/20",
};

const MyRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LegalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from("legal_requests" as any)
        .select("id, created_at, status, topic, title, description, state, facts, admin_response, responded_at, ticket_number, assigned_to_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch requests:", error);
      } else {
        setRequests((data as any) ?? []);
      }
      setLoading(false);
    };
    fetchRequests();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold mb-1">My Requests</h1>
            <p className="text-sm text-muted-foreground">Track all your submitted requests and their status.</p>
          </div>
          <Link to="/dashboard/submit">
            <Button variant="hero" size="sm">
              New Request <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </motion.div>

        {loading ? (
          <div className="glass-card p-12 text-center">
            <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="glass-card p-12 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No requests yet. Submit your first one!</p>
            <Link to="/dashboard/submit">
              <Button variant="outline">Submit a Request</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {requests.map((req, i) => (
              <motion.div
                key={req.id}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i * 0.1 + 1}
                className="glass-card p-5 flex items-start gap-4"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-display font-semibold text-sm truncate">{req.title}</h3>
                    <Badge variant="outline" className={`text-[10px] px-2 py-0 ${statusColors[req.status] ?? ""}`}>
                      {req.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{req.description}</p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                    <span>{req.topic}</span>
                    <span>•</span>
                    <span>{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {req.status === "completed" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-xs gap-1.5"
                    onClick={() => {
                      generateCasePdf({
                        requestId: req.id,
                        title: req.title,
                        topic: req.topic,
                        description: req.description,
                        status: req.status,
                        state: req.state,
                        facts: req.facts,
                        adminResponse: req.admin_response,
                        createdAt: req.created_at,
                        respondedAt: req.responded_at,
                      });
                      toast.success("PDF downloaded");
                    }}
                    aria-label="Download PDF summary"
                  >
                    <Download className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyRequests;
