import { useRef } from "react";
import { useWindows } from "../store/useWindowStore";
import type { SnapZone } from "./useWindowSnap";
import { snapRect } from "./useWindowSnap";

export function useWindowDrag(id: string, snap: { update: (x: number, y: number) => void; clear: () => void; zoneRef: { current: SnapZone } }) {
  const dragging = useRef(false);
  const off = useRef({ dx: 0, dy: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const w = useWindows.getState().windows.find((w) => w.id === id);
    if (!w || w.isMaximized) return;
    dragging.current = true;
    off.current = { dx: e.clientX - w.x, dy: e.clientY - w.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const x = e.clientX - off.current.dx, y = Math.max(32, e.clientY - off.current.dy);
    useWindows.getState().moveWindow(id, x, y);
    snap.update(e.clientX, e.clientY);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const r = snapRect(snap.zoneRef.current);
    snap.clear();
    if (r) {
      useWindows.getState().resizeWindow(id, r.x, r.y, r.width, r.height);
    }
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };
  return { onPointerDown, onPointerMove, onPointerUp };
}
