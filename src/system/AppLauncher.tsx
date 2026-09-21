import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Lock, RotateCw, Power } from "lucide-react";
import { APPS } from "../registry/appRegistry";
import { useSession } from "../store/useSessionStore";
import { openApp } from "./DesktopIcons";
import { sfx } from "../lib/audio";
import { isInstalled } from "../lib/packages/packageManager";
import { SearchInput, useSearchResults, type Result } from "../features/globalSearch/GlobalSearchPalette";

export default function AppLauncher() {
  const { launcherOpen, setLauncherOpen, setPhase } = useSession();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useSearchResults(q);
  const appsOnly = APPS.filter((a) => isInstalled(a.id) && a.title.toLowerCase().includes(q.toLowerCase()));
  const groups = q.trim() ? group(results) : { Applications: appsOnly.map((a) => ({ group: "Applications", icon: a.icon, title: a.title, sub: a.id, run: () => openApp(a.id) })) } as Record<string, Result[]>;

  useEffect(() => { if (launcherOpen) { setTimeout(() => inputRef.current?.focus(), 60); setIdx(0); } }, [launcherOpen]);
  useEffect(() => setIdx(0), [q]);

  const flat = Object.values(groups).flat();
  const open = (r: Result | undefined) => { if (!r) return; r.run(); sfx.open(); setLauncherOpen(false); setQ(""); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); open(flat[idx]); }
    else if (e.key === "Escape") setLauncherOpen(false);
  };

  return (
    <AnimatePresence>
      {launcherOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .15 }}
          className="fixed inset-0 z-[160] flex flex-col items-center pt-[10vh] px-6"
          style={{ background: "rgba(14,14,16,.78)", backdropFilter: "blur(24px)" }}
          onClick={() => setLauncherOpen(false)}>
          <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <SearchInput q={q} setQ={setQ} onEnter={onKey} inputRef={inputRef} />
            <div className="mt-4 max-h-[52vh] overflow-auto pr-1">
              {Object.entries(groups).map(([g, items]) => (
                <div key={g} className="mb-3">
                  <div className="text-[10.5px] uppercase tracking-[.16em] text-[rgba(244,244,245,.35)] px-2 mb-1">{g}</div>
                  {items.map((r) => {
                    const i = flat.indexOf(r);
                    const Icon = r.icon;
                    return (
                      <button key={g + r.title + i} onClick={() => open(r)} onMouseEnter={() => setIdx(i)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-[8px] text-left ${i === idx ? "bg-[rgba(124,156,255,.18)]" : "hover:bg-[rgba(255,255,255,.05)]"}`}>
                        <Icon size={16} className="text-[rgba(244,244,245,.7)] shrink-0" />
                        <span className="min-w-0"><span className="block text-[13px] text-[#f4f4f5] truncate">{r.title}</span>
                        {r.sub && <span className="block text-[11px] text-[rgba(244,244,245,.4)] truncate">{r.sub}</span>}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
              {!flat.length && <div className="text-center text-[13px] text-[rgba(244,244,245,.38)] py-8">no results for “{q}”</div>}
            </div>
            <div className="flex items-center justify-between mt-4 text-[11px] text-[rgba(244,244,245,.38)] px-1">
              <span>↑↓ navigate · Enter open · Esc close</span>
              <div className="flex gap-5">
                <button className="flex items-center gap-1.5 hover:text-white" onClick={() => { setLauncherOpen(false); setPhase("lock"); }}><Lock size={11} /> Lock</button>
                <button className="flex items-center gap-1.5 hover:text-white" onClick={() => setPhase("restart")}><RotateCw size={11} /> Restart</button>
                <button className="flex items-center gap-1.5 hover:text-white" onClick={() => setPhase("shutdown")}><Power size={11} /> Shut Down</button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function group(list: Result[]): Record<string, Result[]> {
  const out: Record<string, Result[]> = {};
  for (const r of list) (out[r.group] = out[r.group] || []).push(r);
  return out;
}
