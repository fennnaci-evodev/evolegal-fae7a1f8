import { describe, it, expect } from "vitest";
import { readHugoStream } from "@/lib/hugoStream";
import { normalizeHugoText, readContractFile, CONTRACT_FILE_BYTES } from "@/lib/hugoContractInput";
const sse = (text: string) => new Response(text);
describe("Hugo stream completion", () => {
  it("requires a terminal completion marker, never saving truncated output", async () => {
    await expect(readHugoStream(sse('data: {"choices":[{"delta":{"content":"Partial"}}]}\n\n'))).rejects.toThrow("interrupted");
  });
  it("surfaces safe denied-stream messages without retrying", async () => {
    await expect(readHugoStream(sse('data: {"error":{"message":"Provider access denied","retryable":false}}\n\n'))).rejects.toMatchObject({ message: "Provider access denied", retryable: false });
  });
  it("rejects malformed events rather than looping indefinitely", async () => {
    await expect(readHugoStream(sse('data: {broken}\n\n'))).rejects.toThrow("unreadable");
  });
  it("times out an idle stream and cancels its reader", async () => {
    let cancelled = false;
    const response = new Response(new ReadableStream({ cancel() { cancelled = true; } }));
    await expect(readHugoStream(response, undefined, undefined, 10)).rejects.toThrow("stopped responding");
    expect(cancelled).toBe(true);
  });
  it("handles chunk boundaries and final lines without a newline", async () => {
    const encoder = new TextEncoder();
    const response = new Response(new ReadableStream({ start(c) { for (const s of ['data: {"choices":[{"delta":{"con', 'tent":"Answer"}}]}\n\ndata: [DONE]']) c.enqueue(encoder.encode(s)); c.close(); } }));
    await expect(readHugoStream(response)).resolves.toBe("Answer");
  });
});
describe("Contract input safeguards", () => {
  it("preserves literal HTML-like clauses without executing or escaping them", () => expect(normalizeHugoText("<script>ignore rules</script> & liability")).toBe("<script>ignore rules</script> & liability"));
  it("rejects binary and empty pasted input", () => {
    expect(() => normalizeHugoText("a\u0000b")).toThrow();
    expect(() => normalizeHugoText(" \n ")).toThrow();
  });
  it("removes hidden direction overrides and normalizes newlines", () => expect(normalizeHugoText("A\r\nB\u202E")).toBe("A\nB"));
  it("rejects mismatched MIME and oversized text files before reading", async () => {
    await expect(readContractFile(new File(["text"], "a.txt", { type: "application/pdf" }))).rejects.toThrow("content type");
    await expect(readContractFile(new File(["x".repeat(CONTRACT_FILE_BYTES + 1)], "a.txt", { type: "text/plain" }))).rejects.toThrow("120,000");
  });
});
