import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Lock, RotateCw, Power } from "lucide-react";
import { APPS } from "../registry/appRegistry";
import { useSession } from "../store/useSessionStore";
import { openApp } from "./DesktopIcons";
import { sfx } from "../lib/audio";

export default function AppLauncher() {
  const { launcherOpen, setLauncherOpen, setPhase } = useSession();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = APPS.filter((a) => a.title.toLowerCase().includes(q.toLowerCase()) || a.id.includes(q.toLowerCase()));

  useEffect(() => { if (launcherOpen) setTimeout(() => inputRef.current?.focus(), 60); }, [launcherOpen]);

  return (
    <AnimatePresence>
      {launcherOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .15 }}
          className="fixed inset-0 z-[160] flex flex-col items-center pt-[12vh] px-6"
          style={{ background: "rgba(14,14,16,.78)", backdropFilter: "blur(24px)" }}
          onClick={() => setLauncherOpen(false)}>
          <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 h-12 rounded-[12px] bg-[rgba(35,35,40,.9)] border border-[rgba(255,255,255,.16)]">
              <Search size={16} className="text-[rgba(244,244,245,.62)]" />
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && filtered[0]) { openApp(filtered[0].id); sfx.open(); setLauncherOpen(false); setQ(""); } if (e.key === "Escape") setLauncherOpen(false); }}
                placeholder="type to search applications"
                className="flex-1 bg-transparent text-[14px] text-[#f4f4f5] placeholder:text-[rgba(244,244,245,.38)] focus:outline-none" />
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-6">
              {filtered.map((app) => {
                const Icon = app.icon;
                return (
                  <button key={app.id} onClick={() => { openApp(app.id); sfx.open(); setLauncherOpen(false); setQ(""); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-[12px] hover:bg-[rgba(255,255,255,.07)] transition-colors">
                    <Icon size={28} className="text-[#f4f4f5]" />
                    <span className="text-[12px] text-[rgba(244,244,245,.72)]">{app.title}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-center gap-6 mt-8 text-[12px] text-[rgba(244,244,245,.62)]">
              <button className="flex items-center gap-1.5 hover:text-white" onClick={() => { setLauncherOpen(false); setPhase("login"); }}><Lock size={12} /> Lock</button>
              <button className="flex items-center gap-1.5 hover:text-white" onClick={() => setPhase("restart")}><RotateCw size={12} /> Restart</button>
              <button className="flex items-center gap-1.5 hover:text-white" onClick={() => setPhase("shutdown")}><Power size={12} /> Shut Down</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
