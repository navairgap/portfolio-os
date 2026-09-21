import { useRef } from "react";
import { motion } from "framer-motion";
import { Minus, Square, X } from "lucide-react";
import type { WindowState } from "../types";
import { useWindows } from "../store/useWindowStore";
import { useWindowDrag } from "./useWindowDrag";
import { useWindowResize } from "./useWindowResize";
import { useWindowSnap } from "./useWindowSnap";
import { APPS } from "../registry/appRegistry";
import { openContextMenu } from "../system/ContextMenu";
import { sfx } from "../lib/audio";

export default function WindowView({ win, children }: { win: WindowState; children: React.ReactNode }) {
  const { focusWindow, closeWindow, minimizeWindow, toggleMaximize } = useWindows();
  const elRef = useRef<HTMLElement | null>(null);
  const drag = useWindowDrag(win.id, elRef);
  const rs = useWindowResize(win.id, elRef, win.minWidth, win.minHeight);
  const bodyRef = useRef<HTMLDivElement>(null);
  const app = APPS.find((a) => a.id === win.appId);
  const Icon = app?.icon || Square;

  return (
    <motion.section
      role="dialog" aria-label={win.title}
      initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: .1, transition: { duration: .22 } }}
      transition={{ duration: .16, ease: [0.4, 0, 0.2, 1] }}
      onPointerDown={() => !win.isFocused && focusWindow(win.id)}
      className={`absolute flex flex-col rounded-[10px] overflow-hidden
        ${win.isFocused ? "shadow-[0_20px_60px_rgba(0,0,0,.5)]" : "shadow-[0_10px_30px_rgba(0,0,0,.35)]"}`}
      style={{
        left: win.x, top: win.y, width: win.width, height: win.isMaximized ? "calc(100vh - 32px)" : win.height,
        zIndex: win.zIndex, background: "var(--bg-surface)",
        border: `1px solid ${win.isFocused ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "var(--border-subtle)"}`,
        boxShadow: win.isFocused ? "0 24px 64px rgba(0,0,0,.55), 0 0 24px color-mix(in srgb, var(--accent) 12%, transparent)" : undefined,
        willChange: win.isMinimized ? "auto" : "transform",
      }}>
      <div className={`h-7 flex items-center gap-2 px-2 select-none touch-none border-b border-[rgba(255,255,255,.04)] ${win.isFocused ? "bg-[var(--bg-elevated)]" : "bg-[rgba(255,255,255,.02)]"}`}
        {...drag} onDoubleClick={() => win.isResizable && toggleMaximize(win.id)}
        onContextMenu={(e) => { e.preventDefault(); openContextMenu(e.clientX, e.clientY, [
          { label: "Minimize", action: () => minimizeWindow(win.id) },
          { label: win.isMaximized ? "Restore" : "Maximize", action: () => toggleMaximize(win.id) },
          { label: "Close", danger: true, action: () => { sfx.close(); closeWindow(win.id); } },
        ]); }}>
        <Icon size={15} className="text-[rgba(244,244,245,.72)]" />
        <span className={`text-[11px] font-semibold uppercase tracking-[.08em] flex-1 truncate ${win.isFocused ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`}>{win.title}</span>
        <div className="flex items-center gap-1">
          <button aria-label="minimize" onClick={() => minimizeWindow(win.id)}
            className="w-7 h-7 grid place-items-center text-[13px] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors">─</button>
          {win.isResizable && (
            <button aria-label="maximize" onClick={() => toggleMaximize(win.id)}
              className="w-7 h-7 grid place-items-center text-[12px] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors">□</button>
          )}
          <button aria-label="close" onClick={() => { sfx.close(); closeWindow(win.id); }}
            className="w-7 h-7 grid place-items-center text-[14px] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors">×</button>
        </div>
      </div>
      <div ref={bodyRef} className="flex-1 overflow-hidden relative" onPointerDown={() => !win.isFocused && focusWindow(win.id)}>
        {children}
      </div>
      {win.isFocused && win.isResizable && !win.isMaximized && rs.handles.map((h) => (
        <div key={h.dir} className={`absolute z-10 ${h.cls}`} style={{ cursor: rs.cursors[h.dir] }}
          onPointerDown={rs.begin(h.dir)} onPointerMove={rs.move} onPointerUp={rs.up} />
      ))}
    </motion.section>
  );
}
