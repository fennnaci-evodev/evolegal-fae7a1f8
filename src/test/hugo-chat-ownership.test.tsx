import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn(), getSession: vi.fn(), fetchHugo: vi.fn(), toast: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from, auth: { getSession: mocks.getSession } } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "current-owner" } }) }));
vi.mock("@/lib/hugoMemory", () => ({ rememberLastChat: vi.fn(), getOrCreateSessionId: vi.fn() }));
vi.mock("@/lib/hugoTransport", () => ({ fetchHugo: mocks.fetchHugo }));
vi.mock("sonner", () => ({ toast: { error: mocks.toast } }));
import { fetchHugoChats, useHugoChat } from "@/hooks/useHugoChat";
import { HugoTypingMessage } from "@/components/HugoTypingMessage";

describe("Hugo conversation ownership", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("does not load or write another account's conversation", async () => {
    const eq = vi.fn();
    const query = { select: vi.fn(), eq, maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
    query.select.mockReturnValue(query); eq.mockReturnValue(query); mocks.from.mockReturnValue(query);
    const { result } = renderHook(() => useHugoChat());
    await act(async () => { await result.current.loadMessages("foreign-chat"); });
    expect(eq).toHaveBeenCalledWith("user_id", "current-owner");
    expect(result.current.conversationUnavailable).toBe(true);
    expect(result.current.currentChatId).toBeNull();
    expect(result.current.messages).toEqual([]);
    expect(mocks.from).not.toHaveBeenCalledWith("hugo_messages");
    expect(mocks.fetchHugo).not.toHaveBeenCalled();
  });

  it("lists only conversations owned by the active session", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "current-owner" } } } });
    const eq = vi.fn();
    const query = { select: vi.fn(), eq, order: vi.fn().mockResolvedValue({ data: [{ id: "owned-chat" }], error: null }) };
    query.select.mockReturnValue(query); eq.mockReturnValue(query); mocks.from.mockReturnValue(query);
    expect(await fetchHugoChats()).toEqual([{ id: "owned-chat" }]);
    expect(eq).toHaveBeenCalledWith("user_id", "current-owner");
  });

  it("removes an unsaved message and does not call Hugo when saving fails", async () => {
    const query = { insert: vi.fn(), select: vi.fn(), single: vi.fn().mockResolvedValue({ data: null, error: { code: "42501" } }) };
    query.insert.mockReturnValue(query); query.select.mockReturnValue(query); mocks.from.mockReturnValue(query);
    const { result } = renderHook(() => useHugoChat());
    act(() => result.current.setCurrentChatId("owned-chat"));
    let outcome;
    await act(async () => { outcome = await result.current.sendMessage("Keep my draft"); });
    expect(outcome).toEqual({ failed: true, chatId: "owned-chat" });
    await waitFor(() => expect(result.current.messages).toEqual([]));
    expect(result.current.streaming).toBe(false);
    expect(mocks.fetchHugo).not.toHaveBeenCalled();
  });

  it.each([false])("keeps the complete reply visible after saving (request failure: %s)", async (requestFails) => {
    const reply = requestFails
      ? "I'm sorry, I wasn't able to process that right now. Please try again in a moment."
      : "First sentence. Second sentence.\n\nFinal paragraph.";
    let finishSave: (value: unknown) => void = () => {};
    const savedReply = new Promise(resolve => { finishSave = resolve; });
    const query = { insert: vi.fn(), select: vi.fn(), single: vi.fn() };
    query.insert.mockReturnValue(query);
    query.select.mockReturnValue(query);
    query.single.mockResolvedValueOnce({ data: { id: "stored-user" }, error: null })
      .mockReturnValueOnce(savedReply);
    mocks.from.mockReturnValue(query);
    if (requestFails) {
      mocks.fetchHugo.mockRejectedValue(new Error("Request failed"));
    } else {
      mocks.fetchHugo.mockResolvedValue(new Response(new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content: reply } }] })}\n\ndata: [DONE]\n\n`));
          controller.close();
        },
      })));
    }
    let chat: ReturnType<typeof useHugoChat> | undefined;
    function Chat() {
      chat = useHugoChat();
      return <>{chat.messages.filter(m => m.role === "assistant").map(m => (
        <HugoTypingMessage key={m.id} messageId={m.id} content={m.content}
          isStreaming={chat?.streaming} isNew={chat?.newAssistantIds.has(m.id)} />
      ))}</>;
    }
    render(<Chat />);
    act(() => chat?.setCurrentChatId("owned-chat"));
    let sending: ReturnType<ReturnType<typeof useHugoChat>["sendMessage"]> | undefined;
    act(() => { sending = chat?.sendMessage("Test question"); });
    await waitFor(() => expect(query.single).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText(requestFails ? /Please try again in a moment/ : "Final paragraph.")).toBeVisible());
    await act(async () => {
      finishSave({ data: { id: "stored-assistant" }, error: null });
      await sending;
    });
    expect(chat?.streaming).toBe(false);
    expect(chat?.messages[chat.messages.length - 1]?.id).toBe("stored-assistant");
    expect(screen.getByText(requestFails ? /Please try again in a moment/ : "Final paragraph.")).toBeVisible();
  });
  it("clears loading without persisting a fake answer after provider failure", async () => {
    const query = { insert: vi.fn(), select: vi.fn(), single: vi.fn().mockResolvedValue({ data: { id: "stored-user" }, error: null }) };
    query.insert.mockReturnValue(query); query.select.mockReturnValue(query); mocks.from.mockReturnValue(query);
    mocks.fetchHugo.mockRejectedValue(new Error("Provider access denied"));
    const { result } = renderHook(() => useHugoChat());
    act(() => result.current.setCurrentChatId("owned-chat"));
    await act(async () => { await result.current.sendMessage("Test question"); });
    expect(result.current.streaming).toBe(false);
    expect(result.current.responseError).toBe("Provider access denied");
    expect(result.current.messages.filter(m => m.role === "assistant")).toEqual([]);
    expect(query.single).toHaveBeenCalledTimes(1);
  });

});