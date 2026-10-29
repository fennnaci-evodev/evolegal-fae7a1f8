// Synthesized UI sounds (Web Audio API, no assets). Off by default.
const KEY = "evolegal_sound_enabled";
const MASTER = 0.25;
const COOLDOWN_MS = 350;

let ctx: AudioContext | null = null;
let last = 0;

export function isSoundEnabled(): boolean {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}
export function setSoundEnabled(on: boolean) {
  try { localStorage.setItem(KEY, on ? "1" : "0"); } catch { /* ignore */ }
}

function getCtx(): AudioContext | null {
  const AC = typeof window !== "undefined" ? (window.AudioContext || (window as any).webkitAudioContext) : null;
  if (!AC) return null;
  ctx ??= new AC();
  return ctx;
}

// Mobile browsers only allow audio after a direct user gesture. Listen in the
// capture phase so components that stop propagation can't block the unlock,
// and only detach once resume() has actually resolved to "running".
const UNLOCK_EVENTS = ["touchstart", "touchend", "pointerdown", "click", "keydown"] as const;
let unlocked = false;

export function unlockAudio() {
  const ac = getCtx();
  if (!ac) return;
  try {
    const s = ac.createBufferSource();
    s.buffer = ac.createBuffer(1, 1, 22050);
    s.connect(ac.destination);
    s.start(0);
  } catch { /* ignore */ }
  const done = () => {
    if (ac.state === "running" && !unlocked) {
      unlocked = true;
      UNLOCK_EVENTS.forEach((e) => document.removeEventListener(e, unlockAudio, true));
    }
  };
  if (ac.state !== "running") ac.resume().then(done, () => {}); else done();
}

if (typeof document !== "undefined") {
  UNLOCK_EVENTS.forEach((e) => document.addEventListener(e, unlockAudio, { capture: true, passive: true }));
  // iOS suspends the context when the app is backgrounded; re-arm on return.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && ctx && ctx.state !== "running" && unlocked) {
      unlocked = false;
      UNLOCK_EVENTS.forEach((e) => document.addEventListener(e, unlockAudio, { capture: true, passive: true }));
    }
  });
}

// Runs `play` once the context is running; a suspended context is resumed first
// instead of silently dropping the sound.
function withCtx(force: boolean, play: (ac: AudioContext) => void) {
  if (typeof window === "undefined" || document.hidden) return;
  if (!force && !isSoundEnabled()) return;
  const now = performance.now();
  if (now - last < COOLDOWN_MS) return;
  const ac = getCtx();
  if (!ac) return;
  last = now;
  if (ac.state === "running") { play(ac); return; }
  ac.resume().then(() => { if (ac.state === "running") play(ac); }, () => {});
}

function chime(ac: AudioContext) {
  const t = ac.currentTime + 0.02;
  const out = ac.createGain(); out.gain.value = MASTER;
  const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2400;
  lp.connect(out); out.connect(ac.destination);
  [[523.25, 0], [783.99, 0.06]].forEach(([f, d]) => {
    const o = ac.createOscillator(); o.type = "sine"; o.frequency.value = f;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t + d);
    g.gain.exponentialRampToValueAtTime(0.5, t + d + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.42);
    o.connect(g); g.connect(lp);
    o.start(t + d); o.stop(t + d + 0.45);
  });
}

/** Soft harmonic dyad for completed Hugo replies and audits. */
export function playChime(force = false) {
  withCtx(force, chime);
}

/** Short damped click for switches. `force` lets the sound toggle preview itself. */
export function playSwitch(force = false) {
  withCtx(force, (ac) => {
    const t = ac.currentTime + 0.02;
    const o = ac.createOscillator(); o.type = "triangle";
    o.frequency.setValueAtTime(1200, t);
    o.frequency.exponentialRampToValueAtTime(600, t + 0.032);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.18 * (MASTER / 0.25), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + 0.05);
  });
}

/** "off" = disabled, "locked" = browser still blocks audio (needs a tap), "ready" = playable. */
export type AudioState = "off" | "locked" | "ready";
export function getAudioState(): AudioState {
  if (!isSoundEnabled()) return "off";
  return ctx && ctx.state === "running" ? "ready" : "locked";
}
/** Call inside a click handler: unlocks, then reports the resulting state. */
export async function enableAudio(): Promise<AudioState> {
  unlockAudio();
  const ac = getCtx();
  if (ac && ac.state !== "running") { try { await ac.resume(); } catch { /* blocked */ } }
  return getAudioState();
}
