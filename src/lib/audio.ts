// Web Audio API synthesized sounds. No external files.
let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch { return null; }
}
function readAudioPrefs(): { vol: number; muted: boolean; ui: boolean } {
  try {
    const raw = localStorage.getItem("os.settings");
    const s = raw ? JSON.parse(raw).state : null;
    return {
      vol: s?.volume ?? 40,
      muted: s?.muted ?? false,
      ui: s?.uiSounds ?? true,
    };
  } catch { return { vol: 40, muted: false, ui: true }; }
}
function tone(freq: number, dur: number, type: OscillatorType, gainPeak: number, slideTo?: number, delay = 0) {
  const c = ac(); if (!c) return;
  const { vol, muted, ui } = readAudioPrefs();
  if (muted || !ui || vol === 0) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gainPeak * (vol / 100), t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}
export const sfx = {
  click: () => tone(1400, 0.04, "square", 0.04),
  open: () => tone(520, 0.15, "sine", 0.08, 880),
  close: () => tone(700, 0.15, "sine", 0.08, 360),
  error: () => { tone(330, 0.1, "square", 0.06); tone(220, 0.12, "square", 0.06, undefined, 0.11); },
  notify: () => { tone(880, 0.4, "sine", 0.07); tone(1320, 0.35, "sine", 0.05, undefined, 0.06); },
  startup: () => { tone(523.25, 0.6, "sine", 0.09); tone(659.25, 0.6, "sine", 0.08, undefined, 0.18); },
  shutdown: () => tone(440, 0.8, "sine", 0.09, 110),
};
