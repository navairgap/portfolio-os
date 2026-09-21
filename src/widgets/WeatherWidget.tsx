import { useEffect, useState } from "react";
import { Sun, CloudRain, Cloud, Wind } from "lucide-react";

export default function WeatherWidget() {
  const [data, setData] = useState<{ temp: number; cond: string; icon: any }>({ temp: 72, cond: "clear", icon: Sun });
  useEffect(() => {
    const i = setInterval(() => {
      const conds = [["clear", Sun], ["partly cloudy", Cloud], ["light rain", CloudRain], ["windy", Wind]] as const;
      const c = conds[Math.floor(Math.random() * conds.length)];
      setData({ temp: 66 + Math.round(Math.random() * 14), cond: c[0], icon: c[1] });
    }, 30000);
    return () => clearInterval(i);
  }, []);
  const Icon = data.icon;
  return (
    <div className="flex items-center gap-3">
      <Icon size={34} className="text-[#fbbf24] animate-[wob_6s_ease-in-out_infinite]" />
      <div>
        <div className="text-[26px] font-semibold text-[#f4f4f5] leading-none">{data.temp}°F</div>
        <div className="text-[12px] text-[rgba(244,244,245,.5)] capitalize">{data.cond}</div>
      </div>
      <style>{`@keyframes wob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }`}</style>
    </div>
  );
}
