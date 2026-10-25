import { z } from "npm:zod@3.25.76";

const safeText = z.string().min(1).max(30000).transform(s => s.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").replace(/[\u200B\u202A-\u202E\u2066-\u2069]/g, "")).refine(s => s.trim().length > 0 && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFD]/u.test(s), "Invalid text input.");
const message = z.object({ role: z.enum(["user", "assistant"]), content: safeText });
export const HugoBodySchema = z.object({
  action: z.enum(["chat", "generate_title", "recall_memory", "metrics_summary"]).default("chat"),
  chat_id: z.string().uuid().nullish(),
  user_id: z.string().uuid().nullish(),
  messages: z.array(message).min(1).max(100).optional(),
  message: safeText.optional(),
  days: z.number().int().min(1).max(90).default(7),
  precise_mode: z.boolean().default(false),
  mode: z.enum(["auto", "blitz", "consilium"]).default("auto"),
  jurisdiction: z.string().trim().min(2).max(120).optional(),
  topic: z.string().trim().min(2).max(120).optional(),
}).strict().superRefine((body, context) => {
  if ((body.action === "chat" || body.action === "generate_title") && !body.messages && !body.message) context.addIssue({ code: "custom", message: "Provide messages or a message." });
  if (body.messages && body.messages.reduce((total, m) => total + m.content.length, 0) > 120000) context.addIssue({ code: "custom", message: "Conversation is too large." });
});