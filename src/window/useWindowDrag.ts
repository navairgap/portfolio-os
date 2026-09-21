import { useRef } from "react";
import { useWindows } from "../store/useWindowStore";
import { updateSnap2, clearSnap2, zoneRect } from "./useWindowSnap";

// 60fps drag: pointer capture + transform on the element; zustand only updates on pointerup.
export function useWindowDrag(id: string, elRef: React.RefObject<HTMLElement | null>) {
  const dragging = useRef(false);
  const off = useRef({ dx: 0, dy: 0 });
  let zone: ReturnType<typeof updateSnap2> = null;

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
    const x = e.clientX - off.current.dx, y = Math.max(30, e.clientY - off.current.dy);
    if (elRef.current) elRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (!e.shiftKey) zone = updateSnap2(e.clientX, e.clientY); else { clearSnap2(); zone = null; }
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    clearSnap2();
    const w = useWindows.getState().windows.find((w) => w.id === id);
    if (!w) return;
    const cur = elRef.current?.style.transform.match(/translate3d\((-?\d+(?:\.\d+)?)px, (-?\d+(?:\.\d+)?)px/);
    const r = zoneRect(zone);
    if (r) useWindows.getState().resizeWindow(id, r.x, r.y, r.width, r.height);
    else if (cur) useWindows.getState().moveWindow(id, parseFloat(cur[1]), parseFloat(cur[2]));
    if (elRef.current) elRef.current.style.transform = "";
  };
  return { onPointerDown, onPointerMove, onPointerUp };
}
