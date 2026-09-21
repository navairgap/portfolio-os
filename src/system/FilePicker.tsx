import { useEffect, useState } from "react";
import { create } from "zustand";
import { motion } from "framer-motion";
import { X, Folder, FileText, ChevronRight, Home, ArrowUp } from "lucide-react";
import { useFS } from "../store/useFileSystemStore";
import { HOME, parentOf, joinPath } from "../lib/filesystem";

interface PickerState { open: boolean; accept: "file" | "image" | "all"; resolve: ((p: string | null) => void) | null; start: string; ask: (o: { accept?: "file" | "image" | "all"; start?: string }) => Promise<string | null>; close: (p: string | null) => void }
export const useFilePicker = create<PickerState>((set, get) => ({
  open: false, accept: "all", resolve: null, start: HOME,
  ask: ({ accept = "all", start = HOME }) => new Promise((resolve) => set({ open: true, accept, resolve, start })),
  close: (p) => { get().resolve?.(p); set({ open: false, resolve: null }); },
}));

export function pickFile(opts?: { accept?: "file" | "image" | "all"; start?: string }) { return useFilePicker.getState().ask(opts || {}); }

export default function FilePicker() {
  const { open, accept, start, close } = useFilePicker();
  const fs = useFS();
  const [cwd, setCwd] = useState(HOME);
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => { if (open) { setCwd(start || HOME); setSel(null); } }, [open, start]);
  if (!open) return null;

  const ok = (p: string) => {
    const n = fs.get(p);
    if (!n) return false;
    if (accept === "image") return n.type === "file" && /\.(png|jpe?g|gif|webp|svg)$/i.test(n.name);
    return n.type === "file";
  };
  const crumbs = cwd === "/" ? ["/"] : cwd.split("/").filter(Boolean).reduce<string[]>((a, _, i, arr) => [...a, "/" + arr.slice(0, i + 1).join("/")], []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[240] grid place-items-center p-4" style={{ background: "rgba(0,0,0,.45)", backdropFilter: "blur(6px)" }}
      onMouseDown={(e) => e.target === e.currentTarget && close(null)}>
      <motion.div initial={{ scale: .96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: .15 }}
        className="w-[560px] max-w-full h-[380px] rounded-[14px] border border-[rgba(255,255,255,.12)] bg-[var(--bg-surface)] flex flex-col overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,.5)]">
        <div className="flex items-center gap-2 px-3 h-10 border-b border-[rgba(255,255,255,.08)]">
          <span className="text-[13px] font-semibold text-[#f4f4f5]">Choose a file</span>
          <span className="text-[11px] text-[rgba(244,244,245,.38)]">{accept === "image" ? "images only" : "any file"}</span>
          <button onClick={() => close(null)} className="ml-auto p-1 rounded hover:bg-[rgba(255,255,255,.08)] text-[rgba(244,244,245,.5)]"><X size={14} /></button>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[rgba(255,255,255,.08)] text-[12px]">
          <button onClick={() => setCwd(HOME)} className="flex items-center gap-1 text-[rgba(244,244,245,.62)] hover:text-white"><Home size={11} /></button>
          {crumbs.map((c) => (
            <button key={c} onClick={() => setCwd(c)} className="flex items-center gap-1 text-[rgba(244,244,245,.62)] hover:text-white">
              <ChevronRight size={10} className="text-[rgba(244,244,245,.3)]" />{c.split("/").pop() || "/"}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-2">
          <div className="grid grid-cols-[repeat(auto-fill,86px)] gap-1">
            {fs.list(cwd).map((p) => {
              const n = fs.get(p)!;
              const Icon = n.type === "folder" ? Folder : FileText;
              const enabled = n.type === "folder" || ok(p);
              return (
                <button key={p} disabled={!enabled} onDoubleClick={() => n.type === "folder" ? (setCwd(p), setSel(null)) : ok(p) && close(p)}
                  onClick={() => setSel(p)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-[8px] disabled:opacity-30 ${sel === p ? "bg-[rgba(124,156,255,.2)]" : "hover:bg-[rgba(255,255,255,.06)]"}`}>
                  <Icon size={26} className={n.type === "folder" ? "text-[#7c9cff]" : "text-[rgba(244,244,245,.72)]"} />
                  <span className="text-[11px] text-center break-all leading-tight text-[#f4f4f5]">{n.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 border-t border-[rgba(255,255,255,.08)]">
          <button onClick={() => cwd !== "/" && setCwd(parentOf(cwd))} className="flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[rgba(255,255,255,.06)] text-[12px] text-[#f4f4f5] hover:bg-[rgba(255,255,255,.1)]"><ArrowUp size={11} /> Up</button>
          <span className="text-[11px] text-[rgba(244,244,245,.38)] truncate">{sel || ""}</span>
          <button disabled={!sel || !ok(sel)} onClick={() => sel && close(sel)}
            className="ml-auto px-4 py-1.5 rounded-[8px] bg-[#7c9cff] text-black text-[12px] font-semibold disabled:opacity-30">Select</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
