import { useEffect, useState } from "react";
import { useSettings } from "../store/useSettingsStore";
import { tzClock } from "../features/lockScreen/LockScreen";

export default function ClockWidget() {
  const s = useSettings();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  return (
    <div>
      <div className="text-[30px] font-semibold text-[#f4f4f5] leading-none">{tzClock(s, now)}</div>
      <div className="text-[12px] text-[rgba(244,244,245,.5)] mt-1">{now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: s.timezone })}</div>
    </div>
  );
}
