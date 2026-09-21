import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { openContextMenu } from "../system/ContextMenu";
import { useSettings } from "../store/useSettingsStore";
import { useWindows } from "../store/useWindowStore";
import { loadLS, saveLS } from "../lib/persistence";
import ClockWidget from "./ClockWidget";
import WeatherWidget from "./WeatherWidget";
import StatsWidget from "./StatsWidget";
import StickyNoteWidget from "./StickyNoteWidget";
import NowPlayingWidget from "./NowPlayingWidget";

export const WIDGETS: Record<string, any> = { clock: ClockWidget, weather: WeatherWidget, stats: StatsWidget, note: StickyNoteWidget, now: NowPlayingWidget };
interface WPos { x: number; y: number; w: number; z: number; ws: number }
interface WState { pos: Record<string, WPos>; setPos: (id: string, p: Partial<WPos>) => void; bring: (id: string, front: boolean) => void }
export const useWidgets = create<WState>((set) => ({
  pos: loadLS<Record<string, WPos>>("os.widgets.pos", {}),
  setPos: (id, p) => set((s) => { const np = { ...s.pos, [id]: { x: 90, y: 100, w: 220, z: 1, ws: 0, ...s.pos[id], ...p } }; saveLS("os.widgets.pos", np); return { pos: np }; }),
  bring: (id, front) => set((s) => { const zs = Object.values(s.pos).map((p) => p.z); const z = front ? Math.max(1, ...zs) + 1 : Math.min(1, ...zs) - 1; const np = { ...s.pos, [id]: { x: 90, y: 100, w: 220, z: 1, ws: 0, ...s.pos[id], z } }; saveLS("os.widgets.pos", np); return { pos: np }; }),
}));

function WidgetShell({ id, children }: { id: string; children: React.ReactNode }) {
  const p = useWidgets((s) => s.pos[id]) || { x: 90, y: 100, w: 220, z: 1, ws: 0 };
  const { setPos } = useWidgets();
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number; mode: "move" | "resize" } | null>(null);

  const down = (mode: "move" | "resize") => (e: React.PointerEvent) => {
    drag.current = { dx: e.clientX - p.x, dy: e.clientY - p.y, mode };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault(); e.stopPropagation();
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return;
    if (drag.current.mode === "move") setPos(id, { x: Math.max(0, e.clientX - drag.current.dx), y: Math.max(36, e.clientY - drag.current.dy) });
    else setPos(id, { w: Math.max(140, e.clientX - p.x + 8) });
  };
  const up = () => { drag.current = null; };

  return (
    <div ref={ref} className="absolute rounded-[14px] border border-[rgba(255,255,255,.12)] bg-[rgba(24,24,28,.55)] backdrop-blur-xl shadow-[0_8px_28px_rgba(0,0,0,.35)] overflow-hidden"
      style={{ left: p.x, top: p.y, width: p.w, zIndex: 20 + (p.z || 1) }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); openContextMenu(e.clientX, e.clientY, [
        { label: "Bring forward", action: () => useWidgets.getState().bring(id, true) },
        { label: "Send back", action: () => useWidgets.getState().bring(id, false) },
        { label: "Configure", action: () => { const w = prompt("Width (px):", String(p.w)); if (w) setPos(id, { w: Math.max(140, +w || p.w) }); } },
        [2, 3, 4].map((n) => ({ label: `Move to workspace ${n}`, action: () => setPos(id, { ws: n - 1 }) })),
        { sep: true, label: "" },
        { label: "Remove widget", danger: true, action: () => useSettings.getState().set({ widgets: { ...useSettings.getState().widgets, [id]: false } }) },
      ]); }}>
      <div className="h-6 cursor-grab active:cursor-grabbing touch-none" onPointerDown={down("move")} onPointerMove={move} onPointerUp={up} />
      <div className="px-3 pb-3">{children}</div>
      <div className="absolute bottom-0 right-0 w-4 h-4 cursor-ew-resize touch-none" onPointerDown={down("resize")} onPointerMove={move} onPointerUp={up} />
    </div>
  );
}

export default function WidgetLayer() {
  const w = useSettings((s) => s.widgets);
  const ws = useWindows((s) => s.activeWorkspace);
  return (
    <div className="absolute inset-0 z-[8] pointer-events-none">
      {Object.entries(WIDGETS).map(([id, Comp]) => {
        if (!w[id as keyof typeof w]) return null;
        const pos = useWidgets.getState().pos[id];
        if (pos && pos.ws !== ws) return null;
        return <div key={id} className="pointer-events-auto"><WidgetShell id={id}><Comp /></WidgetShell></div>;
      })}
    </div>
  );
}
