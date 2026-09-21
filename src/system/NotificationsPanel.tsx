import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2, ExternalLink } from "lucide-react";
import { useNotifications } from "../store/useNotificationStore";
import { useWindows } from "../store/useWindowStore";
import { APPS } from "../registry/appRegistry";
import { create } from "zustand";

export const useNotifPanel = create<{ open: boolean; set: (v: boolean) => void }>((set) => ({ open: false, set: (open) => set({ open }) }));

const rel = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
};

export default function NotificationsPanel() {
  const { open, set } = useNotifPanel();
  const { list, dismiss, clear } = useNotifications();
  const { windows, focusWindow } = useWindows();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[155]" onClick={() => set(false)} />
          <motion.aside initial={{ x: 340 }} animate={{ x: 0 }} exit={{ x: 340 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-8 right-0 bottom-0 w-[320px] z-[156] border-l border-[rgba(255,255,255,.1)] flex flex-col"
            style={{ background: "var(--bg-overlay)", backdropFilter: "blur(24px)" }}>
            <div className="flex items-center gap-2 px-4 h-11 border-b border-[rgba(255,255,255,.08)]">
              <span className="text-[13px] font-semibold text-[#f4f4f5]">Notification Center</span>
              <button onClick={clear} className="ml-auto text-[11.5px] text-[rgba(244,244,245,.5)] hover:text-white flex items-center gap-1"><Trash2 size={11} /> clear all</button>
              <button onClick={() => set(false)} className="p-1 rounded hover:bg-[rgba(255,255,255,.08)] text-[rgba(244,244,245,.5)]"><X size={14} /></button>
            </div>
            <div className="flex-1 overflow-auto p-2.5 space-y-1.5">
              {list.map((n) => {
                const app = APPS.find((a) => a.id === n.appId);
                const win = windows.find((w) => w.appId === n.appId);
                return (
                  <div key={n.id} className="group rounded-[10px] bg-[rgba(255,255,255,.04)] border border-[rgba(255,255,255,.07)] p-2.5 hover:bg-[rgba(255,255,255,.07)] transition-colors">
                    <div className="flex items-baseline gap-2">
                      <b className="text-[12.5px] text-[#f4f4f5] truncate">{n.title}</b>
                      <span className="ml-auto text-[10px] text-[rgba(244,244,245,.35)] shrink-0">{rel(n.ts)}</span>
                    </div>
                    <div className="text-[12px] text-[rgba(244,244,245,.6)] mt-0.5 leading-relaxed">{n.body}</div>
                    <div className="flex gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {win && <button onClick={() => { focusWindow(win.id); set(false); }} className="text-[11px] text-[#7c9cff] flex items-center gap-1 hover:underline"><ExternalLink size={10} /> open {app?.title}</button>}
                      <button onClick={() => dismiss(n.id)} className="text-[11px] text-[rgba(244,244,245,.4)] hover:text-white ml-auto">dismiss</button>
                    </div>
                  </div>
                );
              })}
              {!list.length && <div className="text-center text-[12px] text-[rgba(244,244,245,.3)] py-10">all clear</div>}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
