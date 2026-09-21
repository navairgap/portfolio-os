import { useRef } from "react";
import { useWindows } from "../store/useWindowStore";
import { updateSnap2, clearSnap2, zoneRect, type SnapZone2 } from "./useWindowSnap";
import { useSnapPreview } from "../features/snapPreview/SnapPreview";

export function useWindowDrag(id: string) {
  const dragging = useRef(false);
  let currentZone: SnapZone2 = null;
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
    currentZone = updateSnap2(e.clientX, e.clientY);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const r = zoneRect(currentZone);
    clearSnap2();
    if (r) useWindows.getState().resizeWindow(id, r.x, r.y, r.width, r.height);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };
  return { onPointerDown, onPointerMove, onPointerUp };
}
