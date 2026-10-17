import { describe, it, expect, vi, beforeEach } from "vitest";
const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession } } }));
import { fetchHugo, fetchHugoReply } from "@/lib/hugoTransport";
beforeEach(() => { vi.restoreAllMocks(); getSession.mockReset(); });
describe("Hugo session transport", () => {
  it("does not send a provider request without a session", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    const fetch = vi.spyOn(globalThis, "fetch");
    await expect(fetchHugo({ message: "hello" })).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("sends the current session bearer rather than a public key", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "test-session" } }, error: null });
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("ok"));
    await fetchHugo({ message: "hello" });
    expect(fetch.mock.calls[0]?.[1]?.headers).toMatchObject({ Authorization: "Bearer test-session" });
  });
  it("reads a streamed expert reply instead of expecting a JSON reply", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "test-session" } }, error: null });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response('data: {"choices":[{"delta":{"content":"General information."}}]}\n\ndata: [DONE]\n\n'));
    await expect(fetchHugoReply("Summarize")).resolves.toBe("General information.");
  });
});