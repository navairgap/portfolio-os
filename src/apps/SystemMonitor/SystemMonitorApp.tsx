import { useEffect, useRef, useState } from "react";
import { Activity, Cpu, MemoryStick, Network, ListTree, XCircle } from "lucide-react";
import { useWindows } from "../../store/useWindowStore";
import { APPS } from "../../registry/appRegistry";
import type { WindowState } from "../../types";

// shared fake-stats generator (also used by the desktop stats widget)
export function genStats() {
  const t = Date.now() / 1000;
  const base = 10 + Math.sin(t / 7) * 4 + Math.random() * 3;
  const spike = Math.random() < .08 ? 35 + Math.random() * 35 : 0;
  const cpu = Math.min(95, base + spike);
  const memUsed = 3.4 + Math.sin(t / 23) * .8 + Math.random() * .3;
  const down = Math.max(0, Math.sin(t / 5) * 400 + (Math.random() < .06 ? 4000 * Math.random() : 0) + 120);
  const up = Math.max(0, Math.cos(t / 6) * 60 + (Math.random() < .05 ? 900 * Math.random() : 0) + 20);
  return { cpu, memUsed, down, up };
}
export function hashPid(id: string) { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 32768; return h + 1000; }

function LineGraph({ data, color, max }: { data: number[]; color: string; max: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!, x = c.getContext("2d")!;
    const w = (c.width = c.clientWidth * devicePixelRatio), h = (c.height = c.clientHeight * devicePixelRatio);
    x.clearRect(0, 0, w, h);
    x.strokeStyle = color; x.lineWidth = 2 * devicePixelRatio; x.lineJoin = "round"; x.beginPath();
    data.forEach((v, i) => { const px = (i / (data.length - 1)) * w, py = h - (v / max) * (h - 8); i ? x.lineTo(px, py) : x.moveTo(px, py); });
    x.stroke();
    x.lineTo(w, h); x.lineTo(0, h); x.closePath();
    x.globalAlpha = .12; x.fillStyle = color; x.fill(); x.globalAlpha = 1;
  }, [data, color, max]);
  return <canvas ref={ref} className="w-full h-40" />;
}

export default function SystemMonitorApp() {
  const [tab, setTab] = useState<"cpu" | "mem" | "net" | "proc">("cpu");
  const [stats, setStats] = useState(genStats);
  const [hist, setHist] = useState<number[]>(() => Array.from({ length: 60 }, () => 10 + Math.random() * 5));
  const [histDown, setHistDown] = useState<number[]>(() => Array.from({ length: 60 }, () => 200));
  const [histUp, setHistUp] = useState<number[]>(() => Array.from({ length: 60 }, () => 40));
  const [procs, setProcs] = useState<{ id: string; cmd: string; cpu: number; mem: number; pid: number }[]>([]);
  const { windows, closeWindow } = useWindows();

  useEffect(() => {
    const i = setInterval(() => {
      const s = genStats();
      setStats(s);
      setHist((h) => [...h.slice(-59), s.cpu]);
      setHistDown((h) => [...h.slice(-59), s.down]);
      setHistUp((h) => [...h.slice(-59), s.up]);
    }, 1000);
    return () => clearInterval(i);
  }, []);
  useEffect(() => {
    const roll = () => setProcs(windows.map((w) => ({ id: w.id, cmd: APPS.find((a) => a.id === w.appId)?.title || w.appId, cpu: Math.round(Math.random() * 18 * 10) / 10, mem: Math.round((60 + Math.random() * 380) * 10) / 10, pid: hashPid(w.id) })));
    roll();
    const i = setInterval(roll, 2000);
    return () => clearInterval(i);
  }, [windows]);

  const memTotal = 16, cached = 1.2, used = stats.memUsed;
  return (
    <div className="h-full flex text-[13px] text-[#f4f4f5]">
      <div className="w-40 border-r border-[rgba(255,255,255,.08)] p-2 space-y-0.5 shrink-0">
        {([["cpu", "CPU", Cpu], ["mem", "Memory", MemoryStick], ["net", "Network", Network], ["proc", "Processes", ListTree]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] ${tab === id ? "bg-[rgba(124,156,255,.16)]" : "hover:bg-[rgba(255,255,255,.06)]"}`}><Icon size={13} /> {label}</button>
        ))}
      </div>
      <div className="flex-1 p-4 overflow-auto">
        {tab === "cpu" && (<>
          <div className="flex items-baseline gap-3 mb-3"><span className="text-[28px] font-semibold">{stats.cpu.toFixed(1)}%</span><span className="text-[12px] text-[rgba(244,244,245,.38)]">Portfolio Core i9 — 8 cores</span></div>
          <LineGraph data={hist} color="#7c9cff" max={100} />
        </>)}
        {tab === "mem" && (<>
          <div className="text-[28px] font-semibold mb-1">{used.toFixed(1)} GB <span className="text-[14px] text-[rgba(244,244,245,.38)]">of {memTotal} GB</span></div>
          <div className="flex h-8 rounded-[6px] overflow-hidden my-3 border border-[rgba(255,255,255,.08)]">
            <div className="bg-[#7c9cff] transition-all duration-1000" style={{ width: `${(used / memTotal) * 100}%` }} />
            <div className="bg-[rgba(124,156,255,.35)] transition-all duration-1000" style={{ width: `${(cached / memTotal) * 100}%` }} />
          </div>
          <div className="flex gap-5 text-[12px]">
            <span><i className="inline-block w-3 h-3 rounded-[3px] bg-[#7c9cff] mr-1.5" />Used {used.toFixed(1)} GB</span>
            <span><i className="inline-block w-3 h-3 rounded-[3px] bg-[rgba(124,156,255,.35)] mr-1.5" />Cached {cached.toFixed(1)} GB</span>
            <span><i className="inline-block w-3 h-3 rounded-[3px] bg-[rgba(255,255,255,.1)] mr-1.5" />Free {(memTotal - used - cached).toFixed(1)} GB</span>
          </div>
        </>)}
        {tab === "net" && (<>
          <div className="flex gap-6 mb-3 text-[12px]">
            <span className="flex items-center gap-1.5"><Activity size={12} className="text-[#4ade80]" /> receiving <b>{Math.round(stats.down)} KB/s</b></span>
            <span className="flex items-center gap-1.5"><Activity size={12} className="text-[#fbbf24]" /> sending <b>{Math.round(stats.up)} KB/s</b></span>
          </div>
          <div className="mb-1 text-[11px] text-[rgba(244,244,245,.38)]">down</div><LineGraph data={histDown} color="#4ade80" max={5000} />
          <div className="mb-1 mt-3 text-[11px] text-[rgba(244,244,245,.38)]">up</div><LineGraph data={histUp} color="#fbbf24" max={1500} />
        </>)}
        {tab === "proc" && (<>
          <div className="grid grid-cols-[64px_70px_60px_64px_1fr_70px] gap-2 px-2 py-1.5 text-[11px] text-[rgba(244,244,245,.38)] uppercase">
            <span>PID</span><span>User</span><span>CPU%</span><span>MEM%</span><span>Command</span><span />
          </div>
          {procs.map((p) => (
            <div key={p.id} className="grid grid-cols-[64px_70px_60px_64px_1fr_70px] gap-2 px-2 py-1.5 rounded-[6px] hover:bg-[rgba(255,255,255,.05)] items-center">
              <span className="font-mono">{p.pid}</span><span>navairgap</span><span>{p.cpu}</span><span>{p.mem}</span><span className="truncate">{p.cmd}</span>
              <button onClick={() => closeWindow(p.id)} className="flex items-center gap-1 text-[11px] text-[#ff5c5c] hover:underline justify-self-end"><XCircle size={11} /> kill</button>
            </div>
          ))}
          {!procs.length && <div className="text-center text-[rgba(244,244,245,.28)] py-8">no processes — open some apps</div>}
        </>)}
      </div>
    </div>
  );
}
