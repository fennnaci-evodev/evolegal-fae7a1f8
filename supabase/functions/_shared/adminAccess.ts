export class AdminAccessError extends Error {
  readonly status = 403;
  constructor() { super("Forbidden: administrator access required."); }
}

/** The dependency must resolve a stored database role, never caller metadata. */
export async function assertStoredAdmin(userId: string | null, check: (id: string) => Promise<boolean>) {
  if (!userId || !await check(userId)) throw new AdminAccessError();
}