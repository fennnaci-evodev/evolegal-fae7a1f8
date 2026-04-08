import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { EvoLogo } from "@/components/EvoLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Send, Bold, Italic, Underline, Link2, Smile, Pause, X, FileDown,
  FileText, Clock, LogOut, Search, MessageSquare, ChevronLeft, Copy, Download, List,
} from "lucide-react";
import { toast } from "sonner";
import { InlineELoader } from "@/components/InlineELoader";
import { generateCasePdf } from "@/lib/generateCasePdf";

// Types
interface RequestItem {
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
  admin_notes: string;
  assigned_to: string | null;
  assigned_to_name: string;
  ticket_number: string | null;
  assigned_at: string | null;
}

interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
}

interface Expert {
  user_id: string;
  name: string;
  openCount: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  reviewing: "bg-blue-500/20 text-blue-400",
  completed: "bg-emerald-500/20 text-emerald-400",
  archived: "bg-muted/30 text-muted-foreground",
};

const topicOptions = [
  "Crypto Law", "Tenant-Landlord", "Family Law",
  "Personal Injury", "Insurance", "Employment",
  "Contract", "Immigration", "Tax Law",
  "Intellectual Property", "Criminal Defense", "Civil Rights",
  "Corporate Law", "Real Estate", "Bankruptcy",
  "Estate Planning", "Consumer Protection", "Other",
];

const avatarColors = [
  "bg-primary/30 text-primary",
  "bg-secondary/30 text-secondary",
  "bg-emerald-500/30 text-emerald-400",
  "bg-amber-500/30 text-amber-400",
  "bg-rose-500/30 text-rose-400",
  "bg-violet-500/30 text-violet-400",
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(profile?: Profile | null, fallback?: string) {
  if (profile?.first_name || profile?.last_name) {
    return ((profile.first_name?.[0] || "") + (profile.last_name?.[0] || "")).toUpperCase() || "U";
  }
  return fallback?.[0]?.toUpperCase() || "U";
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

const ExpertDashboard = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Data
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [draftMsg, setDraftMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState<"active" | "inactive">("active");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Modal states
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [expertsLoading, setExpertsLoading] = useState(false);

  const selected = requests.find(r => r.id === selectedId) || null;
  const selectedProfile = selected ? profiles[selected.user_id] : null;

  // Redirect non-admins
  useEffect(() => {
    if (!roleLoading && !isAdmin) navigate("/dashboard");
  }, [isAdmin, roleLoading]);

  // Load requests + profiles
  useEffect(() => {
    if (!isAdmin) return;
    loadRequests();
  }, [isAdmin]);

  // Open from URL param
  useEffect(() => {
    const rid = searchParams.get("request");
    if (rid && requests.length > 0) {
      setSelectedId(rid);
    }
  }, [searchParams, requests]);

  // Load messages when selection changes
  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId);
      if (selected) {
        setNotes(selected.admin_notes || "");
      }
    }
  }, [selectedId]);

  // Realtime messages — also reactivate paused chats
  useEffect(() => {
    if (!selectedId) return;
    const channel = supabase
      .channel(`messages-${selectedId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "request_messages",
        filter: `request_id=eq.${selectedId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => [...prev, newMsg]);
        // If a user sends a message on a reviewing (paused) request, reactivate to pending
        if (newMsg.sender_role === "user") {
          setRequests(prev => prev.map(r =>
            r.id === selectedId && r.status === "reviewing"
              ? { ...r, status: "pending", updated_at: new Date().toISOString() }
              : r
          ));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedId]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSendMessage();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [draftMsg, selectedId, sending]);

  const loadRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("legal_requests")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Failed to load requests");
      setLoading(false);
      return;
    }

    const reqs = (data || []) as unknown as RequestItem[];
    setRequests(reqs);

    const userIds = [...new Set(reqs.map(r => r.user_id))];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profileData) {
        const map: Record<string, Profile> = {};
        (profileData as unknown as Profile[]).forEach(p => { map[p.id] = p; });
        setProfiles(map);
      }
    }
    setLoading(false);
  };

  const loadMessages = async (requestId: string) => {
    setMsgLoading(true);
    const { data, error } = await supabase
      .from("request_messages")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });

    if (!error) setMessages((data || []) as unknown as Message[]);
    setMsgLoading(false);
  };

  const handleSendMessage = async () => {
    if (!draftMsg.trim() || !selectedId || !user || sending) return;
    setSending(true);

    const mentionsHugo = /@hugo/i.test(draftMsg);

    const { error } = await supabase
      .from("request_messages")
      .insert({
        request_id: selectedId,
        sender_id: user.id,
        sender_role: "admin",
        content: draftMsg.trim(),
      } as any);

    if (error) {
      toast.error("Failed to send message");
      setSending(false);
      return;
    }

    const sentMsg = draftMsg.trim();
    setDraftMsg("");
    inputRef.current?.focus();

    if (mentionsHugo && selected) {
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke("hugo-chat", {
          body: {
            message: `Context: This is a legal request about "${selected.topic}". The user's original request: "${selected.description}". The admin asked: "${sentMsg.replace(/@hugo/i, "").trim()}"`,
          },
        });

        if (!fnError && fnData?.reply) {
          await supabase
            .from("request_messages")
            .insert({
              request_id: selectedId,
              sender_id: "00000000-0000-0000-0000-000000000000",
              sender_role: "hugo",
              content: fnData.reply,
            } as any);
        }
      } catch {
        // silently fail Hugo
      }
    }

    setSending(false);
  };

  const updateRequestField = async (field: string, value: any) => {
    if (!selectedId) return;
    const updates: any = { [field]: value, updated_at: new Date().toISOString() };

    const { error } = await supabase
      .from("legal_requests")
      .update(updates)
      .eq("id", selectedId);

    if (error) {
      toast.error(`Failed to update ${field}`);
    } else {
      setRequests(prev => prev.map(r => r.id === selectedId ? { ...r, ...updates } : r));
      toast.success("Updated");
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    await updateRequestField("admin_notes", notes);
    setSavingNotes(false);
  };

  const handleClose = async () => {
    await updateRequestField("status", "completed");
    setCloseConfirmOpen(false);
    toast.success("Request closed — marked as completed");
  };

  const handlePause = async () => {
    await updateRequestField("status", "reviewing");
    toast.success("Request paused — will reactivate when user replies");
  };

  const handleSummarize = async () => {
    if (!selected) return;
    setSummaryLoading(true);
    setSummaryOpen(true);
    setSummaryText("");

    try {
      // Build conversation context
      const chatContext = messages.map(m => {
        const role = m.sender_role === "admin" ? "Expert" : m.sender_role === "hugo" ? "Hugo" : "User";
        return `${role}: ${m.content}`;
      }).join("\n");

      const { data } = await supabase.functions.invoke("hugo-chat", {
        body: {
          message: `You are summarizing a legal case for an expert review. Provide a clear, concise summary with these sections:

**Key Points Discussed:**
**Main User Concerns:**
**Important Context:**
**Expert Insights:**

Topic: ${selected.topic}
Original Request: ${selected.description}
${selected.state ? `Jurisdiction: ${selected.state}` : ""}

Conversation:
${chatContext || "(No messages yet)"}`,
        },
      });

      setSummaryText(data?.reply || "Unable to generate summary.");
    } catch {
      setSummaryText("Failed to generate summary. Please try again.");
    }
    setSummaryLoading(false);
  };

  const handleAssignOpen = async () => {
    setAssignOpen(true);
    setExpertsLoading(true);
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (roles && roles.length > 0) {
        const ids = roles.map(r => r.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", ids);

        // Count open requests per expert
        const { data: reqData } = await supabase
          .from("legal_requests")
          .select("assigned_to")
          .in("status", ["pending", "reviewing"]);

        const countMap: Record<string, number> = {};
        (reqData || []).forEach((r: any) => {
          if (r.assigned_to) countMap[r.assigned_to] = (countMap[r.assigned_to] || 0) + 1;
        });

        const expertList: Expert[] = ids.map(id => {
          const p = (profilesData as unknown as Profile[] || []).find(pr => pr.id === id);
          const name = p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Expert" : "Expert";
          return { user_id: id, name, openCount: countMap[id] || 0 };
        });

        setExperts(expertList.sort((a, b) => a.openCount - b.openCount));
      }
    } catch {
      toast.error("Failed to load experts");
    }
    setExpertsLoading(false);
  };

  const handleAssignTo = async (expert: Expert) => {
    if (!selectedId) return;
    const updates: any = {
      assigned_to: expert.user_id,
      assigned_to_name: expert.name,
      assigned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("legal_requests")
      .update(updates)
      .eq("id", selectedId);

    if (error) {
      toast.error("Failed to assign");
    } else {
      setRequests(prev => prev.map(r => r.id === selectedId ? { ...r, ...updates } : r));
      toast.success(`Assigned to ${expert.name}`);
    }
    setAssignOpen(false);
  };

  const activeRequests = requests.filter(r => r.status === "pending");
  const inactiveRequests = requests.filter(r => r.status === "reviewing" || r.status === "completed" || r.status === "archived");

  const filteredRequests = (sidebarFilter === "active" ? activeRequests : inactiveRequests)
    .filter(r => {
      if (!searchTerm) return true;
      const p = profiles[r.user_id];
      const name = `${p?.first_name || ""} ${p?.last_name || ""}`.toLowerCase();
      const ticket = r.ticket_number?.toLowerCase() || "";
      return name.includes(searchTerm.toLowerCase()) ||
        r.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.includes(searchTerm.toLowerCase());
    });

  if (roleLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Clock className="h-6 w-6 animate-pulse text-muted-foreground" />
    </div>
  );
  if (!isAdmin) return null;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* LEFT SIDEBAR - Request List */}
      <aside className="w-80 flex-shrink-0 border-r border-border/30 flex flex-col glass-strong" style={{ borderRadius: 0 }}>
        <div className="p-4 border-b border-border/20 flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="hover:opacity-70 transition-opacity">
            <EvoLogo size="sm" animate={false} showText={false} />
          </button>
          <div className="flex-1">
            <h2 className="font-display font-bold text-sm">Expert Dashboard</h2>
            <p className="text-[10px] text-muted-foreground">Workdesk</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} title="Back to Dashboard">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-3 border-b border-border/10">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search requests or tickets..."
              className="pl-8 h-8 text-xs bg-muted/20 border-border/30"
            />
          </div>
        </div>

        <div className="flex border-b border-border/10">
          <button
            onClick={() => setSidebarFilter("active")}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              sidebarFilter === "active" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active ({activeRequests.length})
          </button>
          <button
            onClick={() => setSidebarFilter("inactive")}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              sidebarFilter === "inactive" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Inactive ({inactiveRequests.length})
          </button>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-6 text-center">
              <Clock className="h-4 w-4 animate-pulse text-muted-foreground mx-auto" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">No requests found</div>
          ) : (
            <div className="py-1">
              {filteredRequests.map(req => {
                const profile = profiles[req.user_id];
                const name = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "User";
                const isSelected = selectedId === req.id;

                return (
                  <button
                    key={req.id}
                    onClick={() => setSelectedId(req.id)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-l-2 ${
                      isSelected
                        ? "bg-primary/5 border-l-primary"
                        : "border-l-transparent hover:bg-muted/20"
                    }`}
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className={`text-xs font-semibold ${getAvatarColor(req.user_id)}`}>
                        {getInitials(profile)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold truncate">{name || "Unknown"}</span>
                        <span className="text-[10px] text-muted-foreground/50 shrink-0">
                          {formatTime(req.updated_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {req.title || req.topic}
                      </p>
                    </div>
                    {req.status === "pending" && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t border-border/20">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground"
            onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* CENTER - Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto" />
              <p className="text-sm text-muted-foreground">Select a request to start working</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="h-14 border-b border-border/20 px-6 flex items-center gap-3 shrink-0 glass" style={{ borderRadius: 0 }}>
              <Avatar className="h-8 w-8">
                <AvatarFallback className={`text-xs font-semibold ${getAvatarColor(selected.user_id)}`}>
                  {getInitials(selectedProfile)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm font-display font-semibold">
                  {selectedProfile ? `${selectedProfile.first_name || ""} ${selectedProfile.last_name || ""}`.trim() : "User"}
                </h3>
                <div className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${selected.status === "completed" || selected.status === "archived" ? "bg-muted-foreground" : "bg-emerald-400"}`} />
                  <span className={`text-[10px] ${selected.status === "completed" || selected.status === "archived" ? "text-muted-foreground" : "text-emerald-400"}`}>
                    {selected.status === "completed" ? "Closed" : selected.status === "archived" ? "Archived" : "Online"}
                  </span>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {selected.ticket_number && (
                  <span className="font-mono text-[10px] text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded">{selected.ticket_number}</span>
                )}
                <Badge variant="outline" className={`text-[10px] ${statusColors[selected.status] || ""}`}>
                  {selected.status}
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-6 py-4">
              {msgLoading ? (
                <div className="flex justify-center py-8">
                  <Clock className="h-4 w-4 animate-pulse text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4 max-w-3xl mx-auto">
                  <div className="flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground/40 bg-muted/20 px-3 py-1 rounded-full">
                      {isToday(selected.created_at) ? "Today" : new Date(selected.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Original request */}
                  <div className="flex gap-3">
                    <Avatar className="h-7 w-7 mt-1 shrink-0">
                      <AvatarFallback className={`text-[10px] font-semibold ${getAvatarColor(selected.user_id)}`}>
                        {getInitials(selectedProfile)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="max-w-[70%]">
                      <div className="bg-muted/30 rounded-2xl rounded-tl-md px-4 py-2.5 text-sm">
                        <p className="text-[10px] text-muted-foreground/50 mb-1 font-semibold">{selected.topic}</p>
                        {selected.title && <p className="font-medium mb-1 text-xs">{selected.title}</p>}
                        <p className="whitespace-pre-wrap text-foreground/90">{selected.description}</p>
                      </div>
                      <span className="text-[9px] text-muted-foreground/40 ml-2 mt-1 block">
                        {formatTime(selected.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Chat messages */}
                  {messages.map(msg => {
                    const isAdminMsg = msg.sender_role === "admin";
                    const isHugo = msg.sender_role === "hugo";
                    const isRight = isAdminMsg || isHugo;

                    return (
                      <div key={msg.id} className={`flex gap-3 ${isRight ? "flex-row-reverse" : ""}`}>
                        <Avatar className="h-7 w-7 mt-1 shrink-0">
                          <AvatarFallback className={`text-[10px] font-semibold ${
                            isHugo ? "bg-primary/30 text-primary" :
                            isAdminMsg ? "bg-secondary/30 text-secondary" :
                            getAvatarColor(msg.sender_id)
                          }`}>
                            {isHugo ? "H" : isAdminMsg ? "A" : getInitials(profiles[msg.sender_id])}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[70%]`}>
                          <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                            isHugo
                              ? "bg-primary/10 border border-primary/20 rounded-tr-md"
                              : isAdminMsg
                              ? "bg-secondary/10 border border-secondary/20 rounded-tr-md"
                              : "bg-muted/30 rounded-tl-md"
                          }`}>
                            {isHugo && <p className="text-[10px] text-primary/60 mb-1 font-semibold">Hugo</p>}
                            <p className="whitespace-pre-wrap text-foreground/90">{msg.content}</p>
                          </div>
                          <span className={`text-[9px] text-muted-foreground/40 mt-1 block ${isRight ? "mr-2 text-right" : "ml-2"}`}>
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Closed banner */}
                  {(selected.status === "completed" || selected.status === "archived") && (
                    <div className="flex items-center justify-center py-4">
                      <span className="text-[11px] text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border border-border/20">
                        This request has been closed. No further messages can be sent.
                      </span>
                    </div>
                  )}

                  {sending && (
                    <div className="flex gap-3 flex-row-reverse items-center">
                      <div className="h-7 w-7" />
                      <div className="glass rounded-2xl rounded-tr-md px-4 py-2.5 flex items-center gap-2">
                        <InlineELoader size={22} />
                        <span className="text-[11px] text-muted-foreground/50">Processing…</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input area - disabled if completed/archived */}
            {selected.status !== "completed" && selected.status !== "archived" ? (
              <div className="border-t border-border/20 p-4 shrink-0">
                <div className="max-w-3xl mx-auto">
                  <div className="glass rounded-xl p-3" style={{ borderRadius: "0.75rem" }}>
                    <div className="flex items-center gap-1 mb-2 pb-2 border-b border-border/10">
                      {[Bold, Italic, Underline, Link2, Smile].map((Icon, i) => (
                        <button key={i} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground/50 hover:text-foreground hover:bg-muted/30 transition-colors">
                          <Icon className="h-3.5 w-3.5" />
                        </button>
                      ))}
                      <span className="text-[10px] text-muted-foreground/30 ml-auto">@Hugo for AI draft</span>
                    </div>
                    <div className="shimmer-chat-form flex items-end gap-2 p-2 rounded-[1.25rem]">
                      <textarea
                        ref={inputRef}
                        value={draftMsg}
                        onChange={e => {
                          setDraftMsg(e.target.value);
                          const el = e.target;
                          el.style.height = "auto";
                          el.style.height = Math.min(el.scrollHeight, 140) + "px";
                        }}
                        placeholder="Type a message... (Ctrl+Enter to send)"
                        rows={1}
                        className="chat-input-plain flex-1 bg-transparent border-0 resize-none text-sm placeholder:text-muted-foreground/40 focus:outline-none leading-relaxed"
                        style={{ maxHeight: 140, minHeight: 36 }}
                        onKeyDown={e => {
                          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        variant="default"
                        className="h-8 w-8 shrink-0 rounded-lg"
                        onClick={handleSendMessage}
                        disabled={!draftMsg.trim() || sending}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-t border-border/20 p-4 shrink-0 text-center">
                <p className="text-xs text-muted-foreground">This request is closed. The user must create a new request for further assistance.</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* RIGHT SIDEBAR - Details */}
      {selected && (
        <aside className="w-80 flex-shrink-0 border-l border-border/30 flex flex-col glass-strong overflow-y-auto" style={{ borderRadius: 0 }}>
          {/* Customer Info */}
          <div className="p-4 border-b border-border/20">
            <h4 className="text-xs font-display font-bold text-muted-foreground/60 uppercase tracking-wider mb-3">
              Customer Information
            </h4>
            <div className="space-y-2.5">
              <InfoRow label="Name" value={
                selectedProfile ? `${selectedProfile.first_name || ""} ${selectedProfile.last_name || ""}`.trim() || "—" : "—"
              } />
              <InfoRow label="Phone" value={selectedProfile?.phone || "—"} />
              <InfoRow label="Ticket" value={selected.ticket_number || "—"} mono />
              <InfoRow label="User ID" value={selected.user_id.slice(0, 8) + "..."} mono />
              <InfoRow label="Joined" value={selectedProfile ? new Date(selectedProfile.created_at).toLocaleDateString() : "—"} />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground/60">Status</span>
                <Badge variant="outline" className={`text-[10px] ${statusColors[selected.status] || "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                  {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                </Badge>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="text-[11px] text-muted-foreground/60 block mb-1.5">Internal Notes</label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Internal notes..."
                rows={3}
                className="text-xs bg-muted/20 border-border/20 resize-none"
              />
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full text-xs h-7"
                onClick={saveNotes}
                disabled={savingNotes}
              >
                {savingNotes ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </div>

          {/* Request Details */}
          <div className="p-4 flex-1">
            <h4 className="text-xs font-display font-bold text-muted-foreground/60 uppercase tracking-wider mb-3">
              Request Details
            </h4>
            <div className="space-y-3">
              <DetailField label="Topic">
                <Select
                  value={selected.topic}
                  onValueChange={v => updateRequestField("topic", v)}
                >
                  <SelectTrigger className="h-8 text-xs bg-muted/20 border-border/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {topicOptions.map(t => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </DetailField>

              <DetailField label="Status">
                <Select
                  value={selected.status}
                  onValueChange={v => updateRequestField("status", v)}
                >
                  <SelectTrigger className="h-8 text-xs bg-muted/20 border-border/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["pending", "reviewing", "completed", "archived"].map(s => (
                      <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </DetailField>

              <DetailField label="Assignee">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs justify-start bg-muted/20 border-border/20"
                  onClick={handleAssignOpen}
                >
                  {selected.assigned_to_name || "Click to assign..."}
                </Button>
              </DetailField>

              <DetailField label="State/Jurisdiction">
                <span className="text-xs text-foreground/80">{selected.state || "Not specified"}</span>
              </DetailField>

              <DetailField label="Description">
                <p className="text-xs text-foreground/70 whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {selected.description}
                </p>
              </DetailField>

              {selected.file_urls && selected.file_urls.length > 0 && (
                <DetailField label="Files">
                  <div className="space-y-1">
                    {selected.file_urls.map((url, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-primary hover:underline cursor-pointer">
                        <FileText className="h-3 w-3" />
                        <span>Attachment {i + 1}</span>
                      </div>
                    ))}
                  </div>
                </DetailField>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-4 border-t border-border/20 grid grid-cols-3 gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] h-8"
              onClick={() => setCloseConfirmOpen(true)}
              disabled={selected.status === "completed" || selected.status === "archived"}
            >
              <X className="h-3 w-3 mr-1" /> Close
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] h-8"
              onClick={handlePause}
              disabled={selected.status === "completed" || selected.status === "archived"}
            >
              <Pause className="h-3 w-3 mr-1" /> Pause
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] h-8"
              onClick={() => {
                if (!selected) return;
                generateCasePdf({
                  requestId: selected.id,
                  title: selected.title,
                  topic: selected.topic,
                  description: selected.description,
                  status: selected.status,
                  state: selected.state,
                  facts: selected.facts,
                  adminResponse: selected.admin_response,
                  createdAt: selected.created_at,
                  respondedAt: selected.responded_at,
                  ticketNumber: selected.ticket_number || undefined,
                  assignedExpert: selected.assigned_to_name || undefined,
                  chatHistory: messages.map(m => ({
                    sender_role: m.sender_role,
                    content: m.content,
                    created_at: m.created_at,
                  })),
                });
                toast.success("PDF downloaded");
              }}
            >
              <FileDown className="h-3 w-3 mr-1" /> Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] h-8 col-span-2"
              onClick={handleSummarize}
              disabled={summaryLoading}
            >
              {summaryLoading ? "Generating..." : "Summarize"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] h-8"
              onClick={() => setLogsOpen(true)}
            >
              <List className="h-3 w-3 mr-1" /> Logs
            </Button>
          </div>
        </aside>
      )}

      {/* CLOSE CONFIRMATION */}
      <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <AlertDialogContent className="glass-strong border-border/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Close this request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the request as resolved. The user will no longer be able to reply and must create a new request for further assistance. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose}>Close Request</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SUMMARY MODAL */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="glass-strong border-border/30 max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Case Summary</DialogTitle>
            <DialogDescription>
              {selected?.ticket_number || "AI-generated summary"} · {selected?.topic}
            </DialogDescription>
          </DialogHeader>
          {summaryLoading ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <InlineELoader size={28} />
              <span className="text-sm text-muted-foreground">Generating summary...</span>
            </div>
          ) : (
            <div className="text-sm whitespace-pre-wrap text-foreground/90 leading-relaxed">
              {summaryText}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(summaryText);
                toast.success("Copied to clipboard");
              }}
              disabled={!summaryText}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!selected || !summaryText) return;
                generateCasePdf({
                  requestId: selected.id,
                  title: selected.title,
                  topic: selected.topic,
                  description: selected.description,
                  status: selected.status,
                  state: selected.state,
                  facts: selected.facts,
                  adminResponse: summaryText,
                  createdAt: selected.created_at,
                  respondedAt: selected.responded_at,
                  ticketNumber: selected.ticket_number || undefined,
                  assignedExpert: selected.assigned_to_name || undefined,
                  chatHistory: messages.map(m => ({
                    sender_role: m.sender_role,
                    content: m.content,
                    created_at: m.created_at,
                  })),
                });
                toast.success("Summary PDF downloaded");
              }}
              disabled={!summaryText}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" /> Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LOGS MODAL */}
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="glass-strong border-border/30 max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Audit Log</DialogTitle>
            <DialogDescription>{selected?.ticket_number || "Request"} activity</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {/* Built-in status entries */}
            {selected && (
              <div className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-3 py-1">
                <span className="font-medium text-foreground">Created</span> — {new Date(selected.created_at).toLocaleString()}
              </div>
            )}
            {selected?.assigned_at && (
              <div className="text-xs text-muted-foreground border-l-2 border-blue-400/30 pl-3 py-1">
                <span className="font-medium text-foreground">Assigned to {selected.assigned_to_name}</span> — {new Date(selected.assigned_at as string).toLocaleString()}
              </div>
            )}
            {selected?.audit_log && Array.isArray(selected.audit_log) && selected.audit_log.map((entry: any, i: number) => (
              <div key={i} className="text-xs text-muted-foreground border-l-2 border-border/40 pl-3 py-1">
                <span className="font-medium text-foreground">{entry.action || entry.type || "Event"}</span>
                {entry.timestamp && <span> — {new Date(entry.timestamp).toLocaleString()}</span>}
                {entry.details && <p className="text-muted-foreground/70 mt-0.5">{entry.details}</p>}
              </div>
            ))}
            {(!selected?.audit_log || (Array.isArray(selected.audit_log) && selected.audit_log.length === 0)) && (
              <p className="text-xs text-muted-foreground/50 text-center py-4">No additional audit entries</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ASSIGN MODAL */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="glass-strong border-border/30 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Assign Expert</DialogTitle>
            <DialogDescription>Select an expert to handle this request</DialogDescription>
          </DialogHeader>
          {expertsLoading ? (
            <div className="flex items-center justify-center py-6 gap-3">
              <InlineELoader size={24} />
              <span className="text-sm text-muted-foreground">Loading experts...</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {experts.map(exp => (
                <button
                  key={exp.user_id}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-muted/30 border border-transparent ${
                    selected?.assigned_to === exp.user_id ? "border-primary/30 bg-primary/5" : ""
                  }`}
                  onClick={() => handleAssignTo(exp)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={`text-xs font-semibold ${getAvatarColor(exp.user_id)}`}>
                      {exp.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{exp.name}</p>
                    <p className="text-[10px] text-muted-foreground">{exp.openCount} open tickets</p>
                  </div>
                  <Badge variant="outline" className={`text-[9px] ${
                    exp.openCount === 0 ? "text-emerald-400 border-emerald-500/20" :
                    exp.openCount < 5 ? "text-amber-400 border-amber-500/20" :
                    "text-rose-400 border-rose-500/20"
                  }`}>
                    {exp.openCount === 0 ? "Available" : exp.openCount < 5 ? "Active" : "Busy"}
                  </Badge>
                </button>
              ))}
              {experts.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No experts found</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground/60">{label}</span>
      <span className={`text-xs text-foreground/80 ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] text-muted-foreground/60 block mb-1">{label}</label>
      {children}
    </div>
  );
}

export default ExpertDashboard;
