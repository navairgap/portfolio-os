import { useRef } from "react";
import { useWindows } from "../store/useWindowStore";

type Dir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

// 60fps resize: mutate element style during drag; one zustand update on pointerup.
export function useWindowResize(id: string, elRef: React.RefObject<HTMLElement | null>, minW: number, minH: number) {
  const resizing = useRef<Dir | null>(null);
  const start = useRef({ x: 0, y: 0, w: 0, h: 0, wx: 0, wy: 0 });

  const begin = (dir: Dir) => (e: React.PointerEvent) => {
    e.stopPropagation();
    const w = useWindows.getState().windows.find((w) => w.id === id);
    if (!w || w.isMaximized) return;
    resizing.current = dir;
    start.current = { x: e.clientX, y: e.clientY, w: w.width, h: w.height, wx: w.x, wy: w.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    const d = resizing.current;
    if (!d || !elRef.current) return;
    const dx = e.clientX - start.current.x, dy = e.clientY - start.current.y;
    let { w, h, wx, wy } = start.current;
    if (d.includes("e")) w = Math.max(minW, start.current.w + dx);
    if (d.includes("s")) h = Math.max(minH, start.current.h + dy);
    if (d.includes("w")) { const nw = Math.max(minW, start.current.w - dx); wx = start.current.wx + (start.current.w - nw); w = nw; }
    if (d.includes("n")) { const nh = Math.max(minH, start.current.h - dy); wy = Math.max(30, start.current.wy + (start.current.h - nh)); h = nh; }
    elRef.current.style.width = w + "px";
    elRef.current.style.height = h + "px";
    elRef.current.style.transform = `translate3d(${wx}px, ${wy}px, 0)`;
    (elRef.current as any)._pending = { wx, wy, w, h };
  };
  const up = () => {
    const d = resizing.current;
    resizing.current = null;
    if (!d || !elRef.current) return;
    const p = (elRef.current as any)._pending;
    if (p) { useWindows.getState().resizeWindow(id, p.wx, p.wy, p.w, p.h); elRef.current.style.transform = ""; }
  };
  const cursors: Record<Dir, string> = { n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize" };
  const handles: { dir: Dir; cls: string }[] = [
    { dir: "n", cls: "top-0 left-2 right-2 h-1.5" }, { dir: "s", cls: "bottom-0 left-2 right-2 h-1.5" },
    { dir: "e", cls: "right-0 top-2 bottom-2 w-1.5" }, { dir: "w", cls: "left-0 top-2 bottom-2 w-1.5" },
    { dir: "ne", cls: "top-0 right-0 w-2 h-2" }, { dir: "nw", cls: "top-0 left-0 w-2 h-2" },
    { dir: "se", cls: "bottom-0 right-0 w-2 h-2" }, { dir: "sw", cls: "bottom-0 left-0 w-2 h-2" },
  ];
  return { begin, move, up, cursors, handles };
}
