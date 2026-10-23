import { beforeEach, describe, expect, it, vi } from "vitest";
const { from, eq, maybeSingle } = vi.hoisted(() => ({ from: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from } }));
import { rememberLastChat, recoverLastChat } from "@/lib/hugoMemory";

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  const chain = { select: vi.fn().mockReturnThis(), eq, order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), maybeSingle };
  eq.mockReturnValue(chain);
  from.mockReturnValue(chain);
});
describe("Owned Hugo recovery", () => {
  it("validates a remembered pointer against the current owner", async () => {
    await rememberLastChat("owner", "chat-1");
    maybeSingle.mockResolvedValue({ data: { id: "chat-1" } });
    expect(await recoverLastChat("owner")).toBe("chat-1");
    expect(eq).toHaveBeenCalledWith("user_id", "owner");
    expect(eq).toHaveBeenCalledWith("id", "chat-1");
    expect(from).toHaveBeenCalledWith("hugo_chats");
  });
  it("falls back to owned history when the stored chat is unavailable", async () => {
    await rememberLastChat("owner", "foreign-chat");
    maybeSingle.mockResolvedValueOnce({ data: null }).mockResolvedValueOnce({ data: { id: "owned-chat" } });
    expect(await recoverLastChat("owner")).toBe("owned-chat");
    expect(eq.mock.calls.filter(([key, value]) => key === "user_id" && value === "owner")).toHaveLength(2);
  });
  it("does not reuse another account's pointer", async () => {
    await rememberLastChat("other", "other-chat");
    maybeSingle.mockResolvedValue({ data: null });
    expect(await recoverLastChat("owner")).toBeNull();
    expect(eq).not.toHaveBeenCalledWith("id", "other-chat");
  });
});