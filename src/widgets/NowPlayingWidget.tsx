import { Play, Pause } from "lucide-react";
import { useMusic, TRACKS } from "../store/useMusicStore";

export default function NowPlayingWidget() {
  const m = useMusic();
  const t = TRACKS[m.track];
  return (
    <div className="flex items-center gap-2.5">
      <button onClick={m.toggle} className="w-8 h-8 grid place-items-center rounded-full bg-[rgba(124,156,255,.2)] text-[#7c9cff] hover:bg-[rgba(124,156,255,.35)]">
        {m.playing ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
      </button>
      <div className="min-w-0">
        <div className="text-[12.5px] text-[#f4f4f5] truncate">{t.title}</div>
        <div className="text-[11px] text-[rgba(244,244,245,.5)]">{m.playing ? "now playing" : "paused"} · {Math.floor(m.time / 60)}:{String(m.time % 60).padStart(2, "0")}</div>
      </div>
    </div>
  );
}
