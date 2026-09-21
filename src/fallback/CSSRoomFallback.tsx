import { useSettings } from "../store/useSettingsStore";
import { WALLPAPERS } from "../data/wallpapers";

// WebGL-unavailable / low-power fallback: fullscreen OS + CSS CRT filter.
export default function CSSRoomFallback() {
  const s = useSettings();
  const wp = WALLPAPERS[s.wallpaper] || WALLPAPERS[0];
  return (
    <div className="fixed inset-0 z-[5] pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: wp.css }} />
      <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 3px)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0,0,0,.4) 100%)" }} />
    </div>
  );
}
