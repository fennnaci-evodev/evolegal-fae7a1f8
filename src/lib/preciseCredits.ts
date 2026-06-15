/**
 * Precise-mode credit accounting.
 *
 * v1: client-side daily counter + purchased credit balance in localStorage,
 * keyed per user. This is a transitional implementation while the
 * `precise_analysis_usage` table migration is queued (Lovable Cloud paused).
 * The public API below is shaped to swap to server enforcement without
 * touching call sites.
 */

export type PlanTier = "free" | "basic" | "pro" | "premium";

export const PLAN_DAILY_PRECISE_LIMIT: Record<PlanTier, number> = {
  free: 2,
  basic: 15,
  pro: 60,
  premium: Number.POSITIVE_INFINITY,
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const usageKey = (uid: string) => `evo_precise_usage_${uid}`;
const creditsKey = (uid: string) => `evo_precise_credits_${uid}`;
const planKey = (uid: string) => `evo_plan_${uid}`;

export interface PreciseStatus {
  plan: PlanTier;
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
  packCredits: number;
  canConsume: boolean;
}

export function getPlan(userId: string | null | undefined): PlanTier {
  if (!userId) return "free";
  return (localStorage.getItem(planKey(userId)) as PlanTier) || "free";
}

export function getPreciseStatus(userId: string | null | undefined): PreciseStatus {
  if (!userId) {
    return { plan: "free", dailyLimit: 0, usedToday: 0, remainingToday: 0, packCredits: 0, canConsume: false };
  }
  const plan = getPlan(userId);
  const raw = localStorage.getItem(usageKey(userId));
  let usedToday = 0;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { day: string; count: number };
      if (parsed.day === todayKey()) usedToday = parsed.count;
    } catch { /* ignore */ }
  }
  const dailyLimit = PLAN_DAILY_PRECISE_LIMIT[plan];
  const packCredits = Number(localStorage.getItem(creditsKey(userId)) || 0);
  const remainingToday = Math.max(0, dailyLimit - usedToday);
  const canConsume = remainingToday > 0 || packCredits > 0 || dailyLimit === Number.POSITIVE_INFINITY;
  return { plan, dailyLimit, usedToday, remainingToday, packCredits, canConsume };
}

/** Consume one precise-mode credit. Returns true if allowed. */
export function consumePreciseCredit(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const status = getPreciseStatus(userId);
  if (!status.canConsume) return false;
  if (status.remainingToday > 0 || status.dailyLimit === Number.POSITIVE_INFINITY) {
    const next = status.usedToday + 1;
    localStorage.setItem(usageKey(userId), JSON.stringify({ day: todayKey(), count: next }));
  } else if (status.packCredits > 0) {
    localStorage.setItem(creditsKey(userId), String(status.packCredits - 1));
  }
  return true;
}

export function addPackCredits(userId: string, amount: number) {
  if (!userId || amount <= 0) return;
  const current = Number(localStorage.getItem(creditsKey(userId)) || 0);
  localStorage.setItem(creditsKey(userId), String(current + amount));
}

export function setPlan(userId: string, plan: PlanTier) {
  if (!userId) return;
  localStorage.setItem(planKey(userId), plan);
}
