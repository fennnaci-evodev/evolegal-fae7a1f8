import { z } from "npm:zod@3.25.76";

const message = z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(32000) });
export const HugoBodySchema = z.object({
  action: z.enum(["chat", "generate_title", "recall_memory", "metrics_summary"]).default("chat"),
  chat_id: z.string().uuid().nullish(),
  user_id: z.string().uuid().nullish(),
  messages: z.array(message).min(1).max(100).optional(),
  message: z.string().min(1).max(32000).optional(),
  days: z.number().int().min(1).max(90).default(7),
  precise_mode: z.boolean().default(false),
  mode: z.enum(["auto", "blitz", "consilium"]).default("auto"),
  jurisdiction: z.string().trim().min(2).max(120).optional(),
  topic: z.string().trim().min(2).max(120).optional(),
}).superRefine((body, context) => {
  if ((body.action === "chat" || body.action === "generate_title") && !body.messages && !body.message) context.addIssue({ code: "custom", message: "Provide messages or a message." });
  if (body.messages && body.messages.reduce((total, m) => total + m.content.length, 0) > 120000) context.addIssue({ code: "custom", message: "Conversation is too large." });
});