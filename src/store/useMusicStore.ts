import { create } from "zustand";
import { useSettings } from "./useSettingsStore";

export interface Track { id: string; title: string; artist: string; dur: number; notes: number[]; type: OscillatorType }
export const TRACKS: Track[] = [
  { id: "drift", title: "drift", artist: "navairgap", dur: 96, notes: [220, 261.6, 329.6, 392], type: "sine" },
  { id: "sentinel", title: "sentinel", artist: "navairgap", dur: 88, notes: [196, 246.9, 293.7, 392], type: "triangle" },
  { id: "airgap", title: "airgap", artist: "navairgap", dur: 104, notes: [174.6, 220, 261.6, 349.2], type: "sine" },
  { id: "humming", title: "humming terminal", artist: "navairgap", dur: 80, notes: [233.1, 293.7, 349.2, 466.2], type: "triangle" },
];

interface MState {
  track: number; playing: boolean; time: number;
  setTrack: (i: number) => void; toggle: () => void; next: () => void; prev: () => void;
  tick: (t: number) => void;
}
export const useMusic = create<MState>((set) => ({
  track: Number(localStorage.getItem("os.music.track") || 0),
  playing: false,
  time: Number(localStorage.getItem("os.music.time") || 0),
  setTrack: (i) => { localStorage.setItem("os.music.track", String(i)); set({ track: i, time: 0 }); },
  toggle: () => set((s) => ({ playing: !s.playing })),
  next: () => set((s) => { const i = (s.track + 1) % TRACKS.length; localStorage.setItem("os.music.track", String(i)); return { track: i, time: 0 }; }),
  prev: () => set((s) => { const i = (s.track - 1 + TRACKS.length) % TRACKS.length; localStorage.setItem("os.music.track", String(i)); return { track: i, time: 0 }; }),
  tick: (t) => { localStorage.setItem("os.music.time", String(t)); set({ time: t }); },
}));

// synthesized ambient engine
let ctx: AudioContext | null = null, nodes: { osc: OscillatorNode; gain: GainNode }[] = [], master: GainNode | null = null, timer: ReturnType<typeof setInterval> | null = null;
export function startPlayback(track: Track) {
  stopPlayback();
  try {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = (useSettings.getState().volume / 100) * 0.16;
    master.connect(ctx.destination);
    nodes = track.notes.map((f, i) => {
      const osc = ctx!.createOscillator();
      osc.type = track.type;
      osc.frequency.value = f * (i === 3 ? 0.5 : 1);
      const gain = ctx!.createGain();
      gain.gain.value = 0;
      const lfo = ctx!.createOscillator(), lg = ctx!.createGain();
      lfo.frequency.value = 0.07 + i * 0.03; lg.gain.value = 0.05;
      lfo.connect(lg).connect(gain.gain);
      osc.connect(gain).connect(master!);
      gain.gain.setValueAtTime(0, ctx!.currentTime);
      gain.gain.linearRampToValueAtTime(0.25 / track.notes.length * 4, ctx!.currentTime + 3);
      osc.start(); lfo.start();
      return { osc, gain };
    });
    timer = setInterval(() => {
      const m = useMusic.getState();
      const t = m.time + 1;
      if (t >= track.dur) m.next();
      else m.tick(t);
    }, 1000);
  } catch { /* no audio */ }
}
export function stopPlayback() {
  if (timer) clearInterval(timer);
  timer = null;
  nodes.forEach(({ osc, gain }) => { try { gain.gain.linearRampToValueAtTime(0, (ctx?.currentTime || 0) + 0.5); osc.stop((ctx?.currentTime || 0) + 0.6); } catch { /* noop */ } });
  nodes = [];
  setTimeout(() => { ctx?.close().catch(() => {}); ctx = null; master = null; }, 700);
}
export function setPlaybackVolume(v: number) { master?.gain.setValueAtTime((v / 100) * 0.16, ctx?.currentTime || 0); }
