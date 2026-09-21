import { useEffect, useRef, useState } from "react";
import { genStats } from "../apps/SystemMonitor/SystemMonitorApp";

export default function StatsWidget() {
  const [s, setS] = useState(genStats());
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const i = setInterval(() => setS(genStats()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => {
    const c = ref.current!, x = c.getContext("2d")!;
    const w = (c.width = 190), h = (c.height = 44);
    x.clearRect(0, 0, w, h);
    x.fillStyle = "#7c9cff";
    const bw = w / 12;
    for (let i = 0; i < 12; i++) { const v = Math.random(); x.globalAlpha = .3 + v * .7; x.fillRect(i * bw + 2, h - v * h, bw - 4, v * h); }
    x.globalAlpha = 1;
  }, [s]);
  return (
    <div>
      <div className="flex justify-between text-[11px] text-[rgba(244,244,245,.5)] mb-1"><span>CPU {s.cpu.toFixed(0)}%</span><span>MEM {s.memUsed.toFixed(1)}G</span></div>
      <canvas ref={ref} className="w-full" />
    </div>
  );
}
