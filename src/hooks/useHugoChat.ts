import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hugo-chat`;

export interface HugoMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
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
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ action: "generate_title", messages }),
    });
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
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId ?? null);
  const [currentTitle, setCurrentTitle] = useState<string>("New Chat");
  const [historyLoading, setHistoryLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<HugoMessage[]>(messages);
  messagesRef.current = messages;

  // Load messages for an existing chat
  const loadMessages = useCallback(async (cId: string) => {
    setHistoryLoading(true);
    // Load chat title
    const { data: chatData } = await supabase
      .from("hugo_chats" as any)
      .select("title")
      .eq("id", cId)
      .single();
    if (chatData) setCurrentTitle((chatData as any).title || "New Chat");

    const { data, error } = await supabase
      .from("hugo_messages" as any)
      .select("id, role, content, created_at")
      .eq("chat_id", cId)
      .order("created_at", { ascending: true });

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
  }, []);

  // Load on mount if chatId provided
  useEffect(() => {
    if (chatId) {
      setCurrentChatId(chatId);
      loadMessages(chatId);
    }
  }, [chatId, loadMessages]);

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
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming || !user) return;

    let cId = currentChatId;
    const isFirst = !cId;

    // Create chat if needed
    if (!cId) {
      cId = await createChat();
      if (!cId) return;
    }

    // Add user message optimistically
    const userMsg: HugoMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);

    // Save user message
    const savedId = await saveMessage(cId, "user", text);
    if (savedId) userMsg.id = savedId;

    // Stream Hugo's response
    const allMsgs = [...messages, userMsg];
    const apiMessages = allMsgs.map(m => ({ role: m.role, content: m.content }));

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, chat_id: cId, user_id: user.id }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        if (resp.status === 429) throw new Error("Too many requests — please wait a moment.");
        if (resp.status === 402) throw new Error("AI credits exhausted.");
        throw new Error("Hugo is temporarily unavailable.");
      }

      if (!resp.body) throw new Error("No response stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let full = "";
      const assistantId = crypto.randomUUID();

      const updateAssistant = (text: string) => {
        full = text;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id === assistantId) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: full } : m);
          }
          return [...prev, { id: assistantId, role: "assistant", content: full }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const c = JSON.parse(json).choices?.[0]?.delta?.content;
            if (c) { full += c; updateAssistant(full); }
          } catch { buf = line + "\n" + buf; break; }
        }
      }

      // Strip metrics tags from response (internal Hugo metrics, not shown to user)
      let finalContent = full.replace(/<!--METRICS:.*?-->/s, "").trim();
      
      // Handle escalation markers
      if (finalContent.includes("[ESCALATE_TO_EXPERT]")) {
        finalContent = finalContent.replace(/\[ESCALATE_TO_EXPERT\]/g, "").trim() || "Let me connect you with an EvoLegal Expert right away.";
      }
      
      // Update displayed message with cleaned content
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 && m.role === "assistant" ? { ...m, content: finalContent } : m
      ));

      // Save assistant message
      if (finalContent) {
        await saveMessage(cId, "assistant", finalContent);
      }

      // Generate smart title after first exchange (user + assistant both exist)
      if (isFirst && finalContent) {
        const titleMessages = [
          { role: "user", content: text },
          { role: "assistant", content: finalContent },
        ];
        generateSmartTitle(titleMessages).then(title => {
          setCurrentTitle(title);
          updateTitle(cId!, title);
        });
      }

      return { escalated: full.includes("[ESCALATE_TO_EXPERT]"), chatId: cId };
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error(err.message || "Something went wrong.");
        const errMsg: HugoMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I'm sorry, I wasn't able to process that right now. Please try again in a moment.",
        };
        setMessages(prev => [...prev, errMsg]);
        await saveMessage(cId!, "assistant", errMsg.content);
      }
      return { escalated: false, chatId: cId };
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [streaming, user, currentChatId, messages, createChat, saveMessage, updateTitle]);

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
    setCurrentChatId(null);
    setCurrentTitle("New Chat");
    setMessages([]);
  }, []);

  return {
    messages,
    setMessages,
    streaming,
    loading,
    historyLoading,
    currentChatId,
    currentTitle,
    sendMessage,
    editLastMessage,
    startNewChat,
    loadMessages,
    setCurrentChatId,
  };
}

/** Fetch all Hugo chats for the current user */
export async function fetchHugoChats(): Promise<HugoChat[]> {
  const { data, error } = await supabase
    .from("hugo_chats" as any)
    .select("id, title, status, created_at, updated_at")
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
