// Synthesized operator sound set — all Web Audio, no files.
let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch { return null; }
}
function tone(freq: number, dur: number, type: OscillatorType, peak: number, slideTo?: number, delay = 0) {
  const c = ac(); if (!c) return;
  const t0 = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak * 0.5, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}
export const osfx = {
  bootStart: () => tone(110, 0.3, "sine", 0.18),
  kernelTick: () => tone(60, 0.02, "square", 0.05),
  loginOk: () => { tone(440, 0.06, "sine", 0.14); tone(880, 0.06, "sine", 0.12, undefined, 0.08); },
  loginFail: () => tone(120, 0.2, "square", 0.12),
  open: () => tone(1200, 0.04, "sine", 0.1),
  close: () => tone(1200, 0.04, "sine", 0.09, 800),
  focus: () => tone(2000, 0.015, "sine", 0.02),
  click: () => tone(2000, 0.03, "square", 0.04),
  error: () => { tone(600, 0.1, "square", 0.09); tone(500, 0.1, "square", 0.09, undefined, 0.1); tone(400, 0.1, "square", 0.09, undefined, 0.2); },
  notify: () => tone(1400, 0.25, "sine", 0.08),
  termOk: () => tone(1600, 0.05, "sine", 0.06),
  key: () => tone(1800 + Math.random() * 300, 0.012, "square", 0.018),
  shutdown: () => tone(880, 1.2, "sine", 0.12, 110),
};
