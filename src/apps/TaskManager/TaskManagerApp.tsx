import { useState } from "react";
import { Crosshair, Minus, X } from "lucide-react";
import { useWindows } from "../../store/useWindowStore";
import { APPS } from "../../registry/appRegistry";
import { hashPid } from "../SystemMonitor/SystemMonitorApp";

export default function TaskManagerApp() {
  const { windows, focusWindow, minimizeWindow, closeWindow } = useWindows();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const running = windows.length;
  const memGB = (running * 0.18 + 0.6).toFixed(1);
  return (
    <div className="h-full flex flex-col text-[13px] text-[#f4f4f5]">
      <div className="grid grid-cols-[1fr_64px_90px_70px_120px] gap-2 px-3 py-2 text-[11px] text-[rgba(244,244,245,.38)] uppercase border-b border-[rgba(255,255,255,.08)]">
        <span>Name</span><span>PID</span><span>Status</span><span>Memory</span><span>Actions</span>
      </div>
      <div className="flex-1 overflow-auto p-1.5">
        {windows.map((w) => (
          <div key={w.id} className="grid grid-cols-[1fr_64px_90px_70px_120px] gap-2 px-2 py-1.5 rounded-[6px] hover:bg-[rgba(255,255,255,.05)] items-center">
            <span className="truncate">{APPS.find((a) => a.id === w.appId)?.title || w.title}</span>
            <span className="font-mono text-[12px]">{hashPid(w.id)}</span>
            <span className={`text-[11px] ${w.isFocused ? "text-[#4ade80]" : w.isMinimized ? "text-[#fbbf24]" : "text-[rgba(244,244,245,.62)]"}`}>
              {w.isMinimized ? "Minimized" : w.isFocused ? "Focused" : "Running"}
            </span>
            <span className="text-[12px]">{Math.round(60 + (hashPid(w.id) % 300))} MB</span>
            <span className="flex gap-1">
              <button title="focus" onClick={() => focusWindow(w.id)} className="p-1 rounded hover:bg-[rgba(255,255,255,.1)]"><Crosshair size={12} /></button>
              <button title="minimize" onClick={() => minimizeWindow(w.id)} className="p-1 rounded hover:bg-[rgba(255,255,255,.1)]"><Minus size={12} /></button>
              <button title="end task" onClick={() => setConfirmId(w.id)} className="p-1 rounded hover:bg-[rgba(255,92,92,.2)] text-[#ff5c5c]"><X size={12} /></button>
            </span>
          </div>
        ))}
        {!windows.length && <div className="text-center text-[rgba(244,244,245,.28)] py-10">no applications running</div>}
      </div>
      <div className="px-3 py-2 border-t border-[rgba(255,255,255,.08)] text-[12px] text-[rgba(244,244,245,.62)]">
        {running} application{running === 1 ? "" : "s"} running · {memGB} GB memory used
      </div>
      {confirmId && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-[rgba(14,14,16,.6)] backdrop-blur-sm">
          <div className="w-72 rounded-[12px] bg-[var(--bg-surface)] border border-[rgba(255,255,255,.12)] p-4">
            <div className="text-[13px] font-semibold">End this task?</div>
            <div className="text-[12px] text-[rgba(244,244,245,.62)] mt-1">The window will be closed immediately.</div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setConfirmId(null)} className="px-3 py-1.5 rounded-[6px] bg-[rgba(255,255,255,.08)] text-[12px]">Cancel</button>
              <button onClick={() => { closeWindow(confirmId); setConfirmId(null); }} className="px-3 py-1.5 rounded-[6px] bg-[#ff5c5c] text-black text-[12px] font-semibold">End Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
