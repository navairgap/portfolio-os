import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, TerminalSquare, Search, Grid2x2, MousePointer2, Bell, Palette } from "lucide-react";
import { openApp } from "./DesktopIcons";

const TIPS = [
  [TerminalSquare, "Ctrl+Alt+T", "open the terminal"],
  [Search, "Super", "search everything"],
  [Grid2x2, "Ctrl+1..4", "switch workspaces"],
  [MousePointer2, "drag to edges", "snap windows, corners for quarters"],
  [Bell, "PrintScreen", "capture any region"],
  [Palette, "right-click desktop", "wallpapers, widgets, terminal"],
];

export default function WelcomeModal({ onClose }: { onClose: () => void }) {
  const [hide, setHide] = useState(false);
  const close = () => { localStorage.setItem("os.welcomed", "1"); onClose(); };
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[260] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)", backdropFilter: "blur(8px)" }}>
        <motion.div initial={{ scale: .95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ duration: .2, ease: [0.4, 0, 0.2, 1] }}
          className="w-[460px] max-w-full rounded-2xl border border-[rgba(255,255,255,.12)] bg-[var(--bg-elevated)] p-6 shadow-[0_24px_64px_rgba(0,0,0,.5)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[17px] font-semibold text-[#f4f4f5]">Welcome to navairgap OS</div>
              <div className="text-[12.5px] text-[rgba(244,244,245,.55)] mt-0.5">This desktop is the portfolio. Everything here is real.</div>
            </div>
            <button onClick={close} className="p-1 rounded hover:bg-[rgba(255,255,255,.08)] text-[rgba(244,244,245,.5)]" aria-label="close"><X size={15} /></button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 my-5">
            {TIPS.map(([Icon, k, d]: any) => (
              <div key={k} className="flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] bg-[rgba(255,255,255,.04)] border border-[rgba(255,255,255,.06)]">
                <Icon size={15} className="text-[#7c9cff] shrink-0" />
                <div className="min-w-0"><kbd className="block text-[11px] font-mono text-[#f4f4f5]">{k}</kbd><span className="block text-[10.5px] text-[rgba(244,244,245,.45)] truncate">{d}</span></div>
              </div>
            ))}
          </div>
          <div className="text-[11.5px] text-[rgba(244,244,245,.4)] mb-4">try: <button className="text-[#7c9cff] hover:underline" onClick={() => { close(); openApp("terminal"); }}>sudo rm -rf /</button> in the terminal · hold <b>Shift</b> during boot for recovery mode · ↑↑↓↓←→←→BA anywhere</div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[12px] text-[rgba(244,244,245,.55)] cursor-pointer select-none">
              <input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} className="accent-[#7c9cff]" />
              don't show again
            </label>
            <button onClick={() => { if (hide) localStorage.setItem("os.welcomed.never", "1"); close(); }}
              className="ml-auto px-4 py-2 rounded-[8px] bg-[#7c9cff] text-black text-[13px] font-semibold hover:brightness-110">
              {hide ? "Start exploring" : "Let's go"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
