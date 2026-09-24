import { useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Square, X } from "lucide-react";
import { useOS, AppWindow } from "../store";

type Dir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const CURSORS: Record<Dir, string> = {
  n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
  ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize",
};

export default function Window({ win, children }: { win: AppWindow; children: React.ReactNode }) {
  const { focusWindow, closeWindow, minimizeWindow, toggleMaximize, setGeom, focused } = useOS();
  const drag = useRef<{ dir: Dir | "move"; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number; moved: boolean } | null>(null);

  const start = useCallback((dir: Dir | "move") => (e: React.PointerEvent) => {
    e.stopPropagation();
    focusWindow(win.id);
    if (win.maximized && dir === "move") { /* unmaximize, follow cursor */ setGeom(win.id, { maximized: false, x: e.clientX - win.width / 2, y: e.clientY - 14 }); }
    drag.current = { dir, sx: e.clientX, sy: e.clientY, ox: win.x, oy: win.y, ow: win.width, oh: win.height, moved: false };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [win, focusWindow, setGeom]);

  const onMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    if (d.dir === "move") setGeom(win.id, { x: d.ox + dx, y: d.oy + dy, snap: null });
    else {
      let { x, y, width: w, height: h } = { x: d.ox, y: d.oy, width: d.ow, height: d.oh };
      if (d.dir.includes("e")) w = d.ow + dx;
      if (d.dir.includes("s")) h = d.oh + dy;
      if (d.dir.includes("w")) { w = d.ow - dx; x = d.ox + dx; }
      if (d.dir.includes("n")) { h = d.oh - dy; y = d.oy + dy; }
      setGeom(win.id, { x, y, width: Math.max(280, w), height: Math.max(200, h) });
    }
  }, [win.id, setGeom]);

  const onUp = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.dir !== "move" || !d.moved) return;
    // edge snap
    if (e.clientX <= 6) setGeom(win.id, { x: 0, y: 38, width: innerWidth / 2, height: innerHeight - 38, snap: "left" });
    else if (e.clientX >= innerWidth - 6) setGeom(win.id, { x: innerWidth / 2, y: 38, width: innerWidth / 2, height: innerHeight - 38, snap: "right" });
  }, [win.id, setGeom]);

  const mono = (dir: Dir) => (
    <div key={dir} className={`rz ${dir}`} style={{ cursor: CURSORS[dir] }}
      onPointerDown={start(dir)} onPointerMove={onMove} onPointerUp={onUp} />
  );

  return (
    <AnimatePresence>
      {!win.minimized && (
        <motion.div
          className={`win ${focused === win.id ? "focused" : ""} ${win.maximized ? "max" : ""}`}
          style={{ left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.z }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.16 }}
          onPointerDown={() => focusWindow(win.id)}
          role="dialog" aria-label={win.title}
        >
          <div className="titlebar" onPointerDown={start("move")} onPointerMove={onMove} onPointerUp={onUp} onDoubleClick={() => toggleMaximize(win.id)}>
            <span className="ttl">{win.title}</span>
            <div className="wbtns">
              <button aria-label="Minimize" onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}><Minus size={14} /></button>
              <button aria-label="Maximize" onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}><Square size={12} /></button>
              <button aria-label="Close" className="close" onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}><X size={14} /></button>
            </div>
          </div>
          <div className="winbody">{children}</div>
          {!win.maximized && (["n", "s", "e", "w", "ne", "nw", "se", "sw"] as Dir[]).map(mono)}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
