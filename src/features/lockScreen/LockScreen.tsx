import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useSettings } from "../../store/useSettingsStore";
import { useSession } from "../../store/useSessionStore";

export function tzClock(s: { hour12: boolean; showSeconds: boolean; timezone: string }, now: Date) {
  const opts: Intl.DateTimeFormatOptions = { hour12: s.hour12, hour: "2-digit", minute: "2-digit", ...(s.showSeconds ? { second: "2-digit" } : {}), timeZone: s.timezone };
  return now.toLocaleTimeString("en-US", opts);
}

export default function LockScreen() {
  const s = useSettings();
  const { setPhase } = useSession();
  const [now, setNow] = useState(new Date());
  const [pw, setPw] = useState("");
  const [leaving, setLeaving] = useState(false);
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  const unlock = () => { setLeaving(true); setTimeout(() => useSession.getState().setPhase("desktop"), 350); };
  return (
    <div className={`fixed inset-0 z-[300] flex flex-col items-center justify-center transition-all duration-500 ${leaving ? "opacity-0 -translate-y-6" : ""}`}
      style={{ backdropFilter: "blur(30px)", background: "rgba(14,14,16,.45)" }}>
      <div className="absolute top-6 right-8 text-right">
        <div className="text-[14px] text-[rgba(244,244,245,.62)]">{now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}</div>
        <div className="text-[34px] font-semibold text-[#f4f4f5] leading-none">{tzClock(s, now)}</div>
      </div>
      <div className="w-20 h-20 rounded-full bg-[#232328] border border-[rgba(255,255,255,.16)] grid place-items-center overflow-hidden">
        {s.avatar ? <img src={s.avatar} className="w-full h-full object-cover" alt="" /> : <span className="text-[28px] text-[#7c9cff] font-semibold">n</span>}
      </div>
      <div className="text-[17px] font-medium text-[#f4f4f5] mt-3">{s.displayName}</div>
      <div className="flex items-center gap-2 mt-4">
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && unlock()}
          placeholder="enter to unlock"
          className="w-56 h-9 px-3 rounded-[6px] bg-[rgba(20,20,24,.72)] border border-[rgba(255,255,255,.16)] text-[13px] text-[#f4f4f5] placeholder:text-[rgba(244,244,245,.38)] focus:outline-none focus:border-[#7c9cff]" />
        <button onClick={unlock} aria-label="unlock" className="h-9 w-9 grid place-items-center rounded-[6px] bg-[#7c9cff] text-black"><ArrowRight size={16} /></button>
      </div>
      <button onClick={() => setPhase("login")} className="mt-4 text-[12px] text-[rgba(244,244,245,.38)] hover:text-[rgba(244,244,245,.7)]">Switch User</button>
    </div>
  );
}
