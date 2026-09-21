import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Music2 } from "lucide-react";
import { useMusic, TRACKS, startPlayback, stopPlayback, setPlaybackVolume } from "../../store/useMusicStore";
import { useSettings } from "../../store/useSettingsStore";

export default function MusicApp() {
  const m = useMusic();
  const volume = useSettings((s) => s.volume);
  const track = TRACKS[m.track];
  const barsRef = useRef<HTMLDivElement>(null);
  const [localVol, setLocalVol] = useState(volume);

  useEffect(() => {
    if (m.playing) startPlayback(track); else stopPlayback();
    return () => stopPlayback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.playing, m.track]);
  useEffect(() => setPlaybackVolume(localVol), [localVol]);

  useEffect(() => {
    if (!m.playing || !barsRef.current) return;
    let raf = 0;
    const t0 = performance.now();
    const bars = [...barsRef.current.children] as HTMLElement[];
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      bars.forEach((b, i) => {
        const v = Math.abs(Math.sin(t * 2.2 + i * 0.45) * 0.6 + Math.sin(t * 3.7 + i * 1.3) * 0.4);
        b.style.height = `${18 + v * 80}%`;
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [m.playing]);

  const pct = (m.time / track.dur) * 100;
  return (
    <div className="h-full flex text-[#f4f4f5]">
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-5">
        <div className="relative w-40 h-40 rounded-[14px] overflow-hidden album-art">
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#7c9cff,#ff5c5c,#17171c,#4ade80)", backgroundSize: "300% 300%" }} />
          <Music2 size={44} className="absolute inset-0 m-auto text-white/80" />
        </div>
        <div className="text-center">
          <div className="text-[16px] font-semibold">{track.title}</div>
          <div className="text-[12px] text-[rgba(244,244,245,.38)]">{track.artist} · ambient loop</div>
        </div>
        <div className="w-64">
          <div className="h-1.5 rounded bg-[rgba(255,255,255,.12)] cursor-pointer" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); m.tick(Math.round(((e.clientX - r.left) / r.width) * track.dur)); }}>
            <div className="h-full rounded bg-[#7c9cff]" style={{ width: pct + "%" }} />
          </div>
          <div className="flex justify-between text-[10px] text-[rgba(244,244,245,.38)] mt-1">
            <span>{Math.floor(m.time / 60)}:{String(m.time % 60).padStart(2, "0")}</span><span>{Math.floor(track.dur / 60)}:{String(track.dur % 60).padStart(2, "0")}</span>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <button onClick={m.prev} className="hover:text-white text-[rgba(244,244,245,.62)]"><SkipBack size={18} /></button>
          <button onClick={m.toggle} className="w-12 h-12 grid place-items-center rounded-full bg-[#7c9cff] text-black hover:brightness-110">
            {m.playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
          <button onClick={m.next} className="hover:text-white text-[rgba(244,244,245,.62)]"><SkipForward size={18} /></button>
        </div>
        <input type="range" min={0} max={100} value={localVol} onChange={(e) => setLocalVol(+e.target.value)} className="w-40 accent-[#7c9cff]" aria-label="volume" />
        <div ref={barsRef} className="flex items-end gap-[3px] h-12 w-64">
          {Array.from({ length: 32 }).map((_, i) => <i key={i} className="flex-1 rounded-[1px] bg-[rgba(124,156,255,.7)]" style={{ height: "18%" }} />)}
        </div>
      </div>
      <div className="w-48 border-l border-[rgba(255,255,255,.08)] p-2 overflow-auto shrink-0">
        <div className="text-[11px] text-[rgba(244,244,245,.38)] uppercase px-2 py-1.5">playlist</div>
        {TRACKS.map((t, i) => (
          <button key={t.id} onClick={() => m.setTrack(i)} className={`w-full flex items-center gap-2 px-2 py-2 rounded-[6px] text-left ${i === m.track ? "bg-[rgba(124,156,255,.16)]" : "hover:bg-[rgba(255,255,255,.05)]"}`}>
            <span className="text-[11px] text-[rgba(244,244,245,.38)] w-4">{i + 1}</span>
            <span className="flex-1 min-w-0"><span className="block text-[12.5px] truncate">{t.title}</span><span className="block text-[11px] text-[rgba(244,244,245,.38)]">{t.artist}</span></span>
            {i === m.track && m.playing && <i className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />}
          </button>
        ))}
      </div>
      <style>{`.album-art > div:first-child { animation: albumspin 12s ease-in-out infinite alternate; } @keyframes albumspin { 0%{background-position:0% 0%} 100%{background-position:100% 100%} }`}</style>
    </div>
  );
}
