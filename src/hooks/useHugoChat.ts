import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { rememberLastChat, getOrCreateSessionId } from "@/lib/hugoMemory";
import { fetchHugo } from "@/lib/hugoTransport";
import { readHugoStream } from "@/lib/hugoStream";
import { normalizeHugoText } from "@/lib/hugoContractInput";

// Establish a recovery session id as soon as the hook module loads.
try { getOrCreateSessionId(); } catch { /* SSR safe */ }

export interface HugoMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  consilium?: boolean;
}

export interface HugoChat {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/** Generate a structured title via the AI Title Engine */
async function generateSmartTitle(messages: { role: string; content: string }[]): Promise<string> {
  try {
    const resp = await fetchHugo({ action: "generate_title", messages });
    if (resp.ok) {
      const data = await resp.json();
      return data.title || "New Chat";
    }
  } catch (e) {
    console.error("Title generation failed:", e);
  }
  // Fallback: extract first few words
  const firstUser = messages.find(m => m.role === "user");
  if (firstUser) {
    const words = firstUser.content.replace(/[^a-zA-Z0-9\s]/g, "").trim().split(/\s+/).slice(0, 5).join(" ");
    return words || "New Chat";
  }
  return "New Chat";
}

export function useHugoChat(chatId?: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<HugoMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const sendingRef = useRef(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId ?? null);
  const [currentTitle, setCurrentTitle] = useState<string>("New Chat");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [conversationUnavailable, setConversationUnavailable] = useState(false);
  const loadVersionRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<HugoMessage[]>(messages);
  messagesRef.current = messages;
  // Track IDs of assistant messages created in this session (not loaded from DB)
  const newAssistantIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  // Load messages for an existing chat
  const loadMessages = useCallback(async (cId: string) => {
    if (!user) return;
    const version = ++loadVersionRef.current;
    setHistoryLoading(true);
    setConversationUnavailable(false);
    setMessages([]);
    // Load chat title
    const { data: chatData, error: chatError } = await supabase
      .from("hugo_chats" as any)
      .select("title")
      .eq("id", cId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (version !== loadVersionRef.current) return;
    if (chatError || !chatData) {
      setCurrentChatId(null);
      setCurrentTitle("New Chat");
      setConversationUnavailable(true);
      setHistoryLoading(false);
      toast.error("This conversation belongs to another account or is unavailable. Start a new chat to continue.");
      return;
    }
    if (chatData) setCurrentTitle((chatData as any).title || "New Chat");

    const { data, error } = await supabase
      .from("hugo_messages" as any)
      .select("id, role, content, created_at")
      .eq("chat_id", cId)
      .order("created_at", { ascending: true });

    if (version !== loadVersionRef.current) return;
    if (error) {
      console.error("Failed to load messages:", error);
    } else if (data) {
      setMessages((data as any[]).map(m => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        created_at: m.created_at,
      })));
    }
    setHistoryLoading(false);
  }, [user]);

  // Load on mount if chatId provided
  useEffect(() => {
    if (chatId && user) {
      setCurrentChatId(chatId);
      loadMessages(chatId);
    }
    return () => { loadVersionRef.current += 1; };
  }, [chatId, loadMessages, user]);

  // Create a new chat session
  const createChat = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("hugo_chats" as any)
      .insert({ user_id: user.id, title: "New Chat" } as any)
      .select("id")
      .single();

    if (error || !data) {
      console.error("Failed to create chat:", error);
      toast.error("Failed to start chat session");
      return null;
    }
    const id = (data as any).id as string;
    setCurrentChatId(id);
    // Persist as the recovery target for cross-session continuity
    rememberLastChat(user.id, id);
    return id;
  }, [user]);

  // Save a single message to the database
  const saveMessage = useCallback(async (cId: string, role: string, content: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from("hugo_messages" as any)
      .insert({ chat_id: cId, role, content } as any)
      .select("id")
      .single();

    if (error) {
      console.error("Failed to save message:", error);
      return null;
    }
    return (data as any)?.id ?? null;
  }, []);

  // Update chat title
  const updateTitle = useCallback(async (cId: string, title: string) => {
    await supabase
      .from("hugo_chats" as any)
      .update({ title } as any)
      .eq("id", cId);
  }, []);

  // Stream and persist
  const sendMessage = useCallback(async (text: string, opts?: { precise?: boolean; mode?: "auto" | "blitz" | "consilium" }) => {
    if (!text.trim() || sendingRef.current || streaming || historyLoading || !user) return;
    try { text = normalizeHugoText(text); } catch (err) { toast.error(err instanceof Error ? err.message : "Invalid message."); return { failed: true }; }
    sendingRef.current = true;
    setResponseError(null);

    let cId = currentChatId;
    const isFirst = !cId;

    // Create chat if needed
    if (!cId) {
      cId = await createChat();
      if (!cId) { sendingRef.current = false; return { failed: true }; }
    }

    // Add user message optimistically
    const userMsg: HugoMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);

    // Save user message
    const savedId = await saveMessage(cId, "user", text);
    if (!savedId) {
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
      setStreaming(false);
      sendingRef.current = false;
      toast.error("Unable to save this message. Please try again.");
      return { failed: true, chatId: cId };
    }
    userMsg.id = savedId;

    // Stream Hugo's response
    const allMsgs = [...messagesRef.current.filter(m => m.id !== savedId && m.id !== userMsg.id), userMsg];
    const apiMessages = allMsgs.map(m => ({ role: m.role, content: m.content }));

    const assistantId = crypto.randomUUID();
    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const resp = await fetchHugo({ messages: apiMessages, chat_id: cId, precise_mode: !!opts?.precise, mode: opts?.mode ?? "auto" }, controller.signal);

      let full = "";
      newAssistantIdsRef.current.add(assistantId);

      const updateAssistant = (text: string) => {
        full = text;
        // Detect Consilium marker at the very start and strip it from display.
        const consilium = /^\s*\[CONSILIUM_ACTIVE\]\s*\n?/.test(text);
        const display = text.replace(/^\s*\[CONSILIUM_ACTIVE\]\s*\n?/, "");
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id === assistantId) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: display, consilium } as any : m);
          }
          return [...prev, { id: assistantId, role: "assistant", content: display, consilium } as any];
        });
      };

      full = await readHugoStream(resp, updateAssistant, controller.signal);

      // Strip metrics tags and Consilium signal from the persisted response
      const wasConsilium = /\[CONSILIUM_ACTIVE\]/.test(full);
      let finalContent = full
        .replace(/<!--METRICS:.*?-->/s, "")
        .replace(/^\s*\[CONSILIUM_ACTIVE\]\s*\n?/, "")
        .trim();

      // Detect precise-mode suggestion marker (auto-suggested by Hugo)
      const suggestPrecise = /\[SUGGEST_PRECISE_MODE\]/.test(finalContent);
      if (suggestPrecise) {
        finalContent = finalContent.replace(/\[SUGGEST_PRECISE_MODE\]/g, "").trim();
      }

      // Detect Consilium-mode suggestion marker (Blitz self-check flagged this
      // query as complex enough to benefit from a deep multi-perspective analysis)
      const suggestConsilium = /\[SUGGEST_CONSILIUM\]/.test(finalContent);
      if (suggestConsilium) {
        finalContent = finalContent.replace(/\[SUGGEST_CONSILIUM\]/g, "").trim();
      }

      // Handle escalation markers
      if (finalContent.includes("[ESCALATE_TO_EXPERT]")) {
        finalContent = finalContent.replace(/\[ESCALATE_TO_EXPERT\]/g, "").trim() || "Let me connect you with an EvoLegal Expert right away.";
      }

      // Update displayed message with cleaned content
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 && m.role === "assistant" ? { ...m, content: finalContent, consilium: wasConsilium } : m
      ));

      // Save assistant message and adopt the stored row id so edits/feedback target it
      if (finalContent) {
        const storedId = await saveMessage(cId, "assistant", finalContent);
        if (storedId) {
          // Already displayed while streaming; the saved row must not replay on remount.
          newAssistantIdsRef.current.delete(assistantId);
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, id: storedId } : m));
        }
      }

      // Generate smart title after first exchange (user + assistant both exist)
      if (isFirst && finalContent) {
        const titleMessages = [
          { role: "user", content: text },
          { role: "assistant", content: finalContent },
        ];
        generateSmartTitle(titleMessages).then(title => {
          setCurrentTitle(title);
          if (cId) updateTitle(cId, title);
        });
      }

      return { escalated: full.includes("[ESCALATE_TO_EXPERT]"), suggestPrecise, suggestConsilium, chatId: cId };
    } catch (err: any) {
      // Failed/partial answers never enter stored conversation context.
      setMessages(prev => prev.filter(m => m.id !== assistantId));
      newAssistantIdsRef.current.delete(assistantId);
      if (err.name !== "AbortError") {
        const message = err.message || "Hugo could not complete this reply. Send a fresh request.";
        setResponseError(message);
        toast.error(message);
      }
      return { responseFailed: true, chatId: cId };
    } finally {
      setStreaming(false);
      sendingRef.current = false;
      abortRef.current = null;
    }
  }, [streaming, historyLoading, user, currentChatId, createChat, saveMessage, updateTitle]);

  // Edit the last user message: remove last user+assistant msgs, return the text
  const editLastMessage = useCallback(async (): Promise<string | null> => {
    if (streaming || !currentChatId) return null;

    // Find the last user message index
    const lastUserIdx = messages.length - 1 - [...messages].reverse().findIndex(m => m.role === "user");
    if (lastUserIdx < 0 || lastUserIdx >= messages.length) return null;

    const lastUserMsg = messages[lastUserIdx];
    const toRemove = messages.slice(lastUserIdx); // user msg + any assistant after it

    // Remove from DB
    for (const msg of toRemove) {
      await supabase.from("hugo_messages" as any).delete().eq("id", msg.id);
    }

    // Also delete any feedback for removed assistant messages
    const assistantIds = toRemove.filter(m => m.role === "assistant").map(m => m.id);
    if (assistantIds.length > 0) {
      await supabase.from("hugo_feedback" as any).delete().in("message_id", assistantIds);
    }

    // Remove from state
    setMessages(prev => prev.slice(0, lastUserIdx));

    return lastUserMsg.content;
  }, [streaming, currentChatId, messages]);

  // Start a new chat (reset state)
  const startNewChat = useCallback(() => {
    abortRef.current?.abort();
    setResponseError(null);
    loadVersionRef.current += 1;
    setHistoryLoading(false);
    setConversationUnavailable(false);
    setCurrentChatId(null);
    setCurrentTitle("New Chat");
    setMessages([]);
  }, []);

  return {
    messages,
    setMessages,
    streaming,
    responseError,
    loading,
    historyLoading,
    conversationUnavailable,
    currentChatId,
    currentTitle,
    sendMessage,
    editLastMessage,
    startNewChat,
    loadMessages,
    setCurrentChatId,
    newAssistantIds: newAssistantIdsRef.current,
  };
}

/** Fetch all Hugo chats for the current user */
export async function fetchHugoChats(): Promise<HugoChat[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) return [];
  const { data, error } = await supabase
    .from("hugo_chats" as any)
    .select("id, title, status, created_at, updated_at")
    .eq("user_id", sessionData.session.user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch chats:", error);
    return [];
  }
  return (data as any[]) ?? [];
}

/** Delete a Hugo chat (messages first, then chat) */
export async function deleteHugoChat(chatId: string): Promise<boolean> {
  // Delete messages first (FK constraint)
  const { error: msgErr } = await supabase
    .from("hugo_messages" as any)
    .delete()
    .eq("chat_id", chatId);

  if (msgErr) {
    console.error("Failed to delete chat messages:", msgErr);
    toast.error("Failed to delete chat");
    return false;
  }

  const { error } = await supabase
    .from("hugo_chats" as any)
    .delete()
    .eq("id", chatId);

  if (error) {
    console.error("Failed to delete chat:", error);
    toast.error("Failed to delete chat");
    return false;
  }
  return true;
}
