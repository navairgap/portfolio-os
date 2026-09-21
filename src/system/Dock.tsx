import { useState } from "react";
import { motion } from "framer-motion";
import { useWindows } from "../store/useWindowStore";
import { APPS } from "../registry/appRegistry";
import { isInstalled } from "../lib/packages/packageManager";
import { useFileDrag, compatible, dropOnApp } from "../features/dragToOpen/useDragToOpen";
import { openContextMenu } from "./ContextMenu";
import { sfx } from "../lib/audio";

export default function Dock() {
  const { windows, openWindow, focusWindow, minimizeWindow, closeWindow, activeWorkspace } = useWindows();
  const [hover, setHover] = useState<string | null>(null);
  const [mag, setMag] = useState<Record<string, number>>({});
  const onMove = (id: string) => (e: React.MouseEvent) => {
    const el = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const d0 = Math.abs(e.clientY - (el.top + el.height / 2));
    setMag((m) => ({ ...m, [id]: Math.max(0, 1.45 - d0 / 90) }));
  };

  const launch = (appId: string, newWindow = false) => {
    const app = APPS.find((a) => a.id === appId)!;
    const existing = windows.find((w) => w.appId === appId && w.workspaceId === activeWorkspace && !newWindow);
    if (existing) { existing.isMinimized ? focusWindow(existing.id) : minimizeWindow(existing.id); return; }
    const w = app.defaultSize.width, h = app.defaultSize.height;
    openWindow({
      appId, title: app.title, x: Math.max(20, (innerWidth - w) / 2 + (Math.random() * 80 - 40)),
      y: Math.max(40, (innerHeight - h) / 3 + (Math.random() * 60 - 30)),
      width: w, height: h, isResizable: app.resizable, minWidth: app.minSize.width, minHeight: app.minSize.height,
      workspaceId: activeWorkspace, props: {},
    });
    sfx.open();
  };

  return (
    <motion.div initial={{ x: -70, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 22, delay: .25 }}
      className="fixed left-3 top-1/2 -translate-y-1/2 z-[105] flex flex-col gap-2 p-2 rounded-[16px] w-[64px]"
      style={{ background: "var(--bg-overlay)", backdropFilter: "blur(20px)", border: "1px solid var(--border-subtle)" }}
      role="toolbar" aria-label="dock">
      {APPS.filter((a) => isInstalled(a.id)).map((app) => {
        const running = windows.some((w) => w.appId === app.id);
        const Icon = app.icon;
        return (
          <div key={app.id} className="relative group" onMouseEnter={() => setHover(app.id)} onMouseLeave={() => setHover(null)} onMouseMove={onMove(app.id)}>
            {hover === app.id && (
              <div className="absolute left-[52px] top-1/2 -translate-y-1/2 px-2 py-1 rounded-[6px] bg-[rgba(24,24,27,.95)] border border-[rgba(255,255,255,.08)] text-[12px] text-[#f4f4f5] whitespace-nowrap z-50">{app.title}</div>
            )}
            <button aria-label={app.title} onClick={() => launch(app.id)}
              onDragOver={(e) => { const p = useFileDrag.getState().path; if (p && compatible(app.id, p)) e.preventDefault(); }}
              onDrop={(e) => { const p = useFileDrag.getState().path; if (p) { e.preventDefault(); dropOnApp(app.id, p); useFileDrag.getState().set(null); } }}
              onContextMenu={(e) => { e.preventDefault(); openContextMenu(e.clientX + 10, e.clientY, [
                { label: "Open", action: () => launch(app.id) },
                { label: "New Window", action: () => launch(app.id, true) },
                { label: "Quit", danger: true, action: () => windows.filter((w) => w.appId === app.id).forEach((w) => closeWindow(w.id)) },
              ]); }}
              className="w-10 h-10 grid place-items-center rounded-[10px] text-[rgba(244,244,245,.72)] hover:bg-[rgba(255,255,255,.08)] hover:text-white transition-all"
              style={{ transform: `scale(${(mag[app.id] || 1).toFixed(3)})` }}>
              <Icon size={20} />
            </button>
            {running && <i className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#7c9cff]" />}
          </div>
        );
      })}
    </motion.div>
  );
}
