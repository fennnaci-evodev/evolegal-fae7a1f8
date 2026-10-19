import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn(), getSession: vi.fn(), fetchHugo: vi.fn(), toast: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from, auth: { getSession: mocks.getSession } } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "current-owner" } }) }));
vi.mock("@/lib/hugoMemory", () => ({ rememberLastChat: vi.fn(), getOrCreateSessionId: vi.fn() }));
vi.mock("@/lib/hugoTransport", () => ({ fetchHugo: mocks.fetchHugo }));
vi.mock("sonner", () => ({ toast: { error: mocks.toast } }));
import { fetchHugoChats, useHugoChat } from "@/hooks/useHugoChat";

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
});