import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FileText, Clock, Search, Eye, MessageSquare, CheckCircle, Archive, Download,
} from "lucide-react";
import { fadeUp } from "@/lib/animations";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AdminRequest {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  topic: string;
  title: string;
  description: string;
  facts: any;
  state: string;
  user_id: string;
  audit_log: any[];
  admin_response: string;
  responded_at: string | null;
  file_urls: string[];
  ticket_number: string | null;
  assigned_to_name: string | null;
  assigned_to: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  reviewing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-primary/10 text-primary border-primary/20",
  archived: "bg-muted/30 text-muted-foreground border-border/20",
};

const statusOptions = ["pending", "reviewing", "completed", "archived"] as const;

const AdminRequests = () => {
  const { isAdmin, loading: roleLoading } = useAdminRole();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Detail modal
  const [selected, setSelected] = useState<AdminRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Respond modal
  const [respondOpen, setRespondOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [responding, setResponding] = useState(false);

  // Bulk status change
  const [bulkStatus, setBulkStatus] = useState<string>("");

  useEffect(() => {
    if (roleLoading) return;
    if (!isAdmin) { navigate("/dashboard"); return; }
    fetchRequests();
  }, [isAdmin, roleLoading]);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("legal_requests" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin fetch error:", error);
      toast.error("Failed to load requests.");
    } else {
      setRequests((data as any) ?? []);
    }
    setLoading(false);
  };

  const changeStatus = async (req: AdminRequest, newStatus: string) => {
    const updatedLog = [
      ...(req.audit_log || []),
      { timestamp: new Date().toISOString(), action: `status_changed_to_${newStatus}`, actor: "admin", note: `Admin changed status to ${newStatus}` },
    ];

    const { error } = await supabase
      .from("legal_requests" as any)
      .update({ status: newStatus, audit_log: updatedLog, updated_at: new Date().toISOString() } as any)
      .eq("id", req.id);

    if (error) {
      toast.error("Failed to update status.");
    } else {
      toast.success(`Status updated to ${newStatus}.`);
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: newStatus, audit_log: updatedLog } : r));
      if (selected?.id === req.id) setSelected({ ...req, status: newStatus, audit_log: updatedLog });
    }
  };

  // Bulk status change
  const handleBulkStatusChange = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    let successCount = 0;

    for (const id of ids) {
      const req = requests.find(r => r.id === id);
      if (!req) continue;
      const updatedLog = [
        ...(req.audit_log || []),
        { timestamp: new Date().toISOString(), action: `bulk_status_changed_to_${bulkStatus}`, actor: "admin", note: `Bulk status change to ${bulkStatus}` },
      ];
      const { error } = await supabase
        .from("legal_requests" as any)
        .update({ status: bulkStatus, audit_log: updatedLog, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (!error) successCount++;
    }

    toast.success(`${successCount} request(s) updated to "${bulkStatus}".`);
    setSelectedIds(new Set());
    setBulkStatus("");
    fetchRequests();
  };

  // CSV export
  const handleExportCSV = () => {
    const toExport = selectedIds.size > 0
      ? requests.filter(r => selectedIds.has(r.id))
      : filtered;

    const header = "ID,User ID,Date,Topic,Status,Title,Description\n";
    const rows = toExport.map(r =>
      [
        r.id,
        r.user_id,
        new Date(r.created_at).toLocaleDateString(),
        `"${(r.topic || "").replace(/"/g, '""')}"`,
        r.status,
        `"${(r.title || "").replace(/"/g, '""')}"`,
        `"${(r.description || "").slice(0, 200).replace(/"/g, '""')}"`,
      ].join(",")
    ).join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evolegal-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${toExport.length} request(s) to CSV.`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(r => r.id)));
    }
  };

  const openDetail = (req: AdminRequest) => {
    setSelected(req);
    setDetailOpen(true);
  };

  const openRespond = (req: AdminRequest) => {
    setSelected(req);
    setResponseText(req.admin_response || "");
    setRespondOpen(true);
  };

  const sendResponse = async () => {
    if (!selected || !responseText.trim()) { toast.error("Response cannot be empty."); return; }
    setResponding(true);

    const updatedLog = [
      ...(selected.audit_log || []),
      { timestamp: new Date().toISOString(), action: "response_sent", actor: "admin", note: "Admin sent response as Hugo" },
    ];

    const { error } = await supabase
      .from("legal_requests" as any)
      .update({
        admin_response: responseText.trim(),
        responded_at: new Date().toISOString(),
        status: "completed",
        audit_log: updatedLog,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", selected.id);

    if (error) {
      toast.error("Failed to send response.");
    } else {
      toast.success("Response sent and request marked as completed.");
      setRespondOpen(false);
      fetchRequests();
    }
    setResponding(false);
  };

  const filtered = requests.filter(r => {
    const matchesSearch = !searchTerm ||
      r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (roleLoading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Clock className="h-6 w-6 animate-pulse text-muted-foreground" />
      </div>
    </DashboardLayout>
  );

  if (!isAdmin) return null;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <h1 className="text-2xl font-display font-bold mb-1">Request Register</h1>
          <p className="text-sm text-muted-foreground">View, process, and respond to all user-submitted legal requests.</p>
        </motion.div>

        {/* Filters */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.5} className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search requests..."
              className="pl-9 bg-muted/30 border-border/50"
            />
          </div>
          <div className="flex gap-1.5">
            <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>All</Button>
            {statusOptions.map(s => (
              <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">{s}</Button>
            ))}
          </div>
        </motion.div>

        {/* Bulk actions bar */}
        {filtered.length > 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.7} className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedIds.size === filtered.length && filtered.length > 0}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all"
              />
              <span className="text-xs text-muted-foreground">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
              </span>
            </div>

            {selectedIds.size > 0 && (
              <>
                <Select value={bulkStatus} onValueChange={setBulkStatus}>
                  <SelectTrigger className="w-[140px] h-8 text-xs bg-muted/30 border-border/50">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(s => (
                      <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={handleBulkStatusChange} disabled={!bulkStatus} className="text-xs h-8">
                  Apply
                </Button>
              </>
            )}

            <Button size="sm" variant="outline" onClick={handleExportCSV} className="text-xs h-8 ml-auto gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export CSV{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </Button>
          </motion.div>
        )}

        {/* Request List */}
        {loading ? (
          <div className="glass-card p-12 text-center">
            <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading all requests...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No requests found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((req, i) => (
              <motion.div
                key={req.id}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i * 0.05 + 1}
                className="glass-card p-4 flex items-center gap-4"
              >
                <Checkbox
                  checked={selectedIds.has(req.id)}
                  onCheckedChange={() => toggleSelect(req.id)}
                  aria-label={`Select request ${req.title || req.id}`}
                  className="shrink-0"
                />
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    {req.ticket_number && (
                      <span className="font-mono text-[10px] text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded">{req.ticket_number}</span>
                    )}
                    <h3 className="font-display font-semibold text-sm truncate">{req.title || "Untitled"}</h3>
                    <Badge variant="outline" className={`text-[10px] px-2 py-0 ${statusColors[req.status] ?? ""}`}>
                      {req.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                    <span>{req.topic}</span>
                    <span>•</span>
                    <span>{new Date(req.created_at).toLocaleDateString()}</span>
                    {req.state && <><span>•</span><span>{req.state}</span></>}
                    {req.assigned_to_name && <><span>•</span><span>Expert: {req.assigned_to_name}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openDetail(req)} title="View Details">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openRespond(req)} title="Respond as Hugo">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </Button>
                  {req.status === "pending" && (
                    <Button variant="ghost" size="sm" onClick={() => changeStatus(req, "reviewing")} title="Mark Reviewing">
                      <CheckCircle className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {req.status !== "archived" && (
                    <Button variant="ghost" size="sm" onClick={() => changeStatus(req, "archived")} title="Archive">
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{selected?.title || "Request Details"}</DialogTitle>
            <DialogDescription>
              {selected?.ticket_number && <span className="font-mono text-primary mr-2">{selected.ticket_number}</span>}
              {selected?.topic} • {selected?.created_at ? new Date(selected.created_at).toLocaleString() : ""}
              {selected?.assigned_to_name && <> • Expert: {selected.assigned_to_name}</>}
            </DialogDescription>
          </DialogHeader>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Status</p>
                <div className="flex gap-1.5">
                  {statusOptions.map(s => (
                    <Button key={s} variant={selected.status === s ? "default" : "outline"} size="sm" className="capitalize text-xs" onClick={() => changeStatus(selected, s)}>{s}</Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Description</p>
                <p className="text-foreground whitespace-pre-wrap">{selected.description}</p>
              </div>
              {selected.facts && Object.keys(selected.facts).length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Key Facts</p>
                  <p className="text-foreground">{typeof selected.facts === "object" ? JSON.stringify(selected.facts) : String(selected.facts)}</p>
                </div>
              )}
              {selected.state && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">State/Jurisdiction</p>
                  <p>{selected.state}</p>
                </div>
              )}
              {selected.admin_response && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Admin Response</p>
                  <p className="text-foreground whitespace-pre-wrap">{selected.admin_response}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-xs mb-1">User ID</p>
                <p className="font-mono text-xs">{selected.user_id}</p>
              </div>
              {selected.audit_log && selected.audit_log.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Audit Trail</p>
                  <div className="space-y-1">
                    {(selected.audit_log as any[]).map((entry: any, i: number) => (
                      <div key={i} className="text-xs text-muted-foreground flex gap-2">
                        <span className="text-muted-foreground/50">{new Date(entry.timestamp).toLocaleString()}</span>
                        <span className="capitalize">[{entry.actor}]</span>
                        <span>{entry.note || entry.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Respond Modal */}
      <Dialog open={respondOpen} onOpenChange={setRespondOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Respond as Hugo</DialogTitle>
            <DialogDescription>
              Write a response for: {selected?.title || "this request"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="glass rounded-lg p-3 text-xs text-muted-foreground max-h-32 overflow-y-auto">
              <p className="font-semibold mb-1">User's request:</p>
              <p>{selected?.description}</p>
            </div>
            <Textarea
              value={responseText}
              onChange={e => setResponseText(e.target.value)}
              placeholder="Write your response in Hugo's warm, professional voice..."
              rows={8}
              className="bg-muted/30 border-border/50 resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={sendResponse} disabled={responding}>
              {responding ? "Sending..." : "Send Response & Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminRequests;
