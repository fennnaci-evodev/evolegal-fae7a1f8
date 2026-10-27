// Synthesized UI sounds (Web Audio API, no assets). Off by default.
const KEY = "evolegal_sound_enabled";
const MASTER = 0.12;
const COOLDOWN_MS = 350;

let ctx: AudioContext | null = null;
let last = 0;

export function isSoundEnabled(): boolean {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}
export function setSoundEnabled(on: boolean) {
  try { localStorage.setItem(KEY, on ? "1" : "0"); } catch { /* ignore */ }
}

function ready(force = false): AudioContext | null {
  if (typeof window === "undefined" || document.hidden) return null;
  if (!force && !isSoundEnabled()) return null;
  const now = performance.now();
  if (now - last < COOLDOWN_MS) return null;
  last = now;
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Soft harmonic dyad for completed Hugo replies and audits. */
export function playChime() {
  const ac = ready(); if (!ac) return;
  const t = ac.currentTime;
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

/** Short damped click for switches. `force` lets the sound toggle preview itself. */
export function playSwitch(force = false) {
  const ac = ready(force); if (!ac) return;
  const t = ac.currentTime;
  const o = ac.createOscillator(); o.type = "triangle";
  o.frequency.setValueAtTime(1200, t);
  o.frequency.exponentialRampToValueAtTime(600, t + 0.032);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.08 * (MASTER / 0.12), t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  o.connect(g); g.connect(ac.destination);
  o.start(t); o.stop(t + 0.05);
}
