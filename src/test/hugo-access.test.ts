import { describe, it, expect, vi } from "vitest";
import { authorizeHugo } from "../../supabase/functions/hugo-chat/access";

const userId = "owner";
const deps = () => ({ verifyToken: vi.fn().mockResolvedValue(userId), ownsChat: vi.fn().mockResolvedValue(true), isAdmin: vi.fn().mockResolvedValue(false) });
describe("Hugo protected gateway", () => {
  it("rejects missing sessions before private access", async () => {
    const d = deps();
    await expect(authorizeHugo(null, { chat_id: "private" }, d)).rejects.toMatchObject({ status: 403 });
    expect(d.ownsChat).not.toHaveBeenCalled();
  });
  it("rejects invalid sessions before private access", async () => {
    const d = deps(); d.verifyToken.mockResolvedValue(null);
    await expect(authorizeHugo("Bearer invalid", { chat_id: "private" }, d)).rejects.toMatchObject({ status: 403 });
    expect(d.ownsChat).not.toHaveBeenCalled();
  });
  it("rejects client identity substitution", async () => {
    const d = deps();
    await expect(authorizeHugo("Bearer verified", { user_id: "victim" }, d)).rejects.toMatchObject({ status: 403 });
  });
  it("rejects another user's conversation even for authenticated users", async () => {
    const d = deps(); d.ownsChat.mockResolvedValue(false);
    await expect(authorizeHugo("Bearer verified", { chat_id: "foreign" }, d)).rejects.toMatchObject({ status: 403 });
    expect(d.ownsChat).toHaveBeenCalledWith("foreign", userId);
  });
  it("protects metrics with a stored administrative role", async () => {
    const d = deps();
    await expect(authorizeHugo("Bearer verified", { action: "metrics_summary" }, d)).rejects.toMatchObject({ status: 403 });
    d.isAdmin.mockResolvedValue(true);
    await expect(authorizeHugo("Bearer verified", { action: "metrics_summary" }, d)).resolves.toBe(userId);
  });
  it("binds an owned conversation to the verified identity", async () => {
    const d = deps();
    await expect(authorizeHugo("Bearer verified", { chat_id: "owned", action: "recall_memory" }, d)).resolves.toBe(userId);
  });
  it("requires a stored admin role for explicitly privileged chat execution", async () => {
    const d = deps();
    await expect(authorizeHugo("Bearer verified", { access_scope: "admin" }, d)).rejects.toMatchObject({ status: 403 });
    d.isAdmin.mockResolvedValue(true);
    await expect(authorizeHugo("Bearer verified", { access_scope: "admin" }, d)).resolves.toBe(userId);
  });
  it("never allows administrators to continue foreign chats", async () => {
    const d = deps(); d.isAdmin.mockResolvedValue(true); d.ownsChat.mockResolvedValue(false);
    await expect(authorizeHugo("Bearer verified", { chat_id: "foreign", access_scope: "admin" }, d)).rejects.toMatchObject({ status: 403 });
  });
});