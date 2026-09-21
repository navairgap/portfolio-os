import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useNotifications } from "../store/useNotificationStore";
import { useWindows } from "../store/useWindowStore";
import { useSettings } from "../store/useSettingsStore";
import { sfx } from "../lib/audio";

function Banner({ id, appId, title, body }: { id: string; appId: string; title: string; body: string }) {
  const { dismiss } = useNotifications();
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    timer.current = setTimeout(() => dismiss(id), 5000);
    return () => clearTimeout(timer.current);
  }, [id, dismiss]);
  return (
    <motion.div layout initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
      onMouseEnter={() => clearTimeout(timer.current)}
      className="w-72 rounded-[10px] bg-[rgba(24,24,27,.95)] backdrop-blur-xl border border-[rgba(255,255,255,.08)] shadow-[0_8px_24px_rgba(0,0,0,.4)] p-3 flex gap-2.5"
      onClick={() => { const w = useWindows.getState().windows.find((w) => w.appId === appId); if (w) useWindows.getState().focusWindow(w.id); dismiss(id); }}>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-[#f4f4f5] truncate">{title}</div>
        <div className="text-[12px] text-[rgba(244,244,245,.62)] line-clamp-2">{body}</div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); dismiss(id); }} className="text-[rgba(244,244,245,.38)] hover:text-white h-fit"><X size={13} /></button>
    </motion.div>
  );
}

export default function Notifications() {
  const { list } = useNotifications();
  const dnd = useSettings((s) => s.dnd);
  const lastCount = useRef(0);
  useEffect(() => {
    if (list.length > lastCount.current) sfx.notify();
    lastCount.current = list.length;
  }, [list.length]);
  const visible = dnd ? [] : list.slice(0, 4);
  return (
    <div className="fixed top-10 right-4 z-[170] flex flex-col gap-2" role="status" aria-live="polite">
      <AnimatePresence>{visible.map((n) => <Banner key={n.id} {...n} />)}</AnimatePresence>
    </div>
  );
}
