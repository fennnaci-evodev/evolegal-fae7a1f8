export class HugoAccessError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export interface AccessDependencies {
  verifyToken: (token: string) => Promise<string | null>;
  ownsChat: (chatId: string, userId: string) => Promise<boolean>;
  isAdmin: (userId: string) => Promise<boolean>;
}
/** No private query or provider call may run before this gate completes. */
export async function authorizeHugo(
  authorization: string | null,
  body: { user_id?: string | null; chat_id?: string | null; action?: string; access_scope?: "own" | "admin" },
  dependencies: AccessDependencies,
): Promise<string> {
  if (!authorization?.startsWith("Bearer ") || !authorization.slice(7).trim()) throw new HugoAccessError(403, "Forbidden: please sign in to continue with Hugo.");
  const userId = await dependencies.verifyToken(authorization.slice(7));
  if (!userId) throw new HugoAccessError(403, "Forbidden: your session has expired. Please sign in again.");
  if (body.user_id && body.user_id !== userId) throw new HugoAccessError(403, "Access denied.");
  if (body.chat_id && !await dependencies.ownsChat(body.chat_id, userId)) throw new HugoAccessError(403, "This conversation is not available to this account.");
  if ((body.action === "metrics_summary" || body.access_scope === "admin") && !await dependencies.isAdmin(userId)) throw new HugoAccessError(403, "Forbidden: administrator access required.");
  return userId;
}