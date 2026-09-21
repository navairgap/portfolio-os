import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useSettings } from "../store/useSettingsStore";

function useClock(showSeconds: boolean, hour12: boolean) {
  const [now, setNow] = useState(new Date());
  useState(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  });
  const time = now.toLocaleTimeString("en-US", { hour12, hour: "2-digit", minute: "2-digit", ...(showSeconds ? { second: "2-digit" } : {}) });
  const date = now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return { time, date };
}

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const { showSeconds, hour12, displayName, avatar } = useSettings();
  const { time, date } = useClock(showSeconds, hour12);
  const [pw, setPw] = useState("");
  const [leaving, setLeaving] = useState(false);

  const login = () => {
    setLeaving(true);
    setTimeout(onLogin, 400);
  };
  const bootAgain = () => {
    localStorage.clear();
    location.reload();
  };

  return (
    <motion.div exit={{ opacity: 0 }} transition={{ duration: .4 }}
      className="fixed inset-0 z-[150] flex flex-col items-center justify-between py-16"
      style={{ background: "radial-gradient(1200px 800px at 30% 20%, #1a1a22 0%, #0e0e10 60%), radial-gradient(900px 600px at 80% 85%, #1c1218 0%, transparent 60%)" }}>
      <div className="text-center mt-10">
        <div className="text-[15px] text-[rgba(244,244,245,.62)]">{date}</div>
        <div className="text-[72px] font-semibold text-[#f4f4f5] leading-none tracking-tight">{time}</div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-[#232328] border border-[rgba(255,255,255,.16)] grid place-items-center overflow-hidden">
          {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-[28px] font-semibold text-[#7c9cff]">n</span>}
        </div>
        <div className="text-[17px] font-medium text-[#f4f4f5]">{displayName}</div>
        <div className="flex items-center gap-2">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="press enter to log in"
            className="w-56 h-9 px-3 rounded-[6px] bg-[rgba(20,20,24,.72)] border border-[rgba(255,255,255,.16)] text-[13px] text-[#f4f4f5] placeholder:text-[rgba(244,244,245,.38)] focus:outline-none focus:border-[#7c9cff]"
          />
          <button onClick={login} aria-label="sign in"
            className="h-9 w-9 grid place-items-center rounded-[6px] bg-[#7c9cff] text-black hover:brightness-110">
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
      <button onClick={bootAgain}
        className="absolute bottom-5 right-6 flex items-center gap-2 text-[12px] text-[rgba(244,244,245,.38)] hover:text-[rgba(244,244,245,.62)]">
        <RotateCcw size={12} /> boot again (reset)
      </button>
    </motion.div>
  );
}
