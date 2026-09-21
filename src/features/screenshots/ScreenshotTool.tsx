import { useEffect, useRef, useState } from "react";
import { useWindows } from "../../store/useWindowStore";
import { useFS } from "../../store/useFileSystemStore";
import { useSettings } from "../../store/useSettingsStore";
import { useNotifications } from "../../store/useNotificationStore";
import { WALLPAPERS } from "../../data/wallpapers";
import { openApp } from "../../system/DesktopIcons";

export default function ScreenshotTool() {
  const [sel, setSel] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const active = useRef(false);

  useEffect(() => {
    const begin = () => { active.current = true; };
    addEventListener("os-screenshot", begin);
    return () => removeEventListener("os-screenshot", begin);
  }, []);
  if (!active.current) return null;

  const down = (e: React.PointerEvent) => { setStart({ x: e.clientX, y: e.clientY }); setSel(null); (e.target as HTMLElement).setPointerCapture(e.pointerId); };
  const move = (e: React.PointerEvent) => { if (!start) return; setSel({ x: Math.min(start.x, e.clientX), y: Math.min(start.y, e.clientY), w: Math.abs(e.clientX - start.x), h: Math.abs(e.clientY - start.y) }); };
  const up = () => {
    if (!sel || sel.w < 8 || sel.h < 8) { setStart(null); setSel(null); active.current = false; return; }
    capture(sel);
    setStart(null); setSel(null); active.current = false;
  };
  const key = (e: React.KeyboardEvent) => { if (e.key === "Escape") { active.current = false; setStart(null); setSel(null); } };

  return (
    <div className="fixed inset-0 z-[450] cursor-crosshair" style={{ background: "rgba(0,0,0,.45)" }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onKeyDown={key} tabIndex={-1}>
      {sel && (
        <div className="absolute border border-[#7c9cff] bg-[rgba(124,156,255,.2)]" style={{ left: sel.x, top: sel.y, width: sel.w, height: sel.h }}>
          <span className="absolute -top-6 left-0 text-[11px] font-mono text-white bg-[rgba(0,0,0,.7)] px-1.5 py-0.5 rounded">{sel.w}×{sel.h}</span>
        </div>
      )}
      {!sel && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 text-[13px] text-[rgba(244,244,245,.7)]">drag to select a region · esc to cancel</div>}
    </div>
  );
}

function capture(sel: { x: number; y: number; w: number; h: number }) {
  const s = useSettings.getState();
  const { windows, activeWorkspace } = useWindows.getState();
  const c = document.createElement("canvas");
  c.width = sel.w * devicePixelRatio; c.height = sel.h * devicePixelRatio;
  const x = c.getContext("2d")!;
  x.scale(devicePixelRatio, devicePixelRatio);
  x.fillStyle = "#0e0e10"; x.fillRect(0, 0, sel.w, sel.h);
  x.fillStyle = (WALLPAPERS[s.wallpaper] || WALLPAPERS[0]).css.includes("gradient") ? "#141419" : "#0e0e10";
  x.fillRect(0, 0, sel.w, sel.h);
  x.fillStyle = "rgba(20,20,24,.9)"; x.fillRect(0, 0, sel.w, 8);
  for (const w of windows.filter((w) => w.workspaceId === activeWorkspace && !w.isMinimized)) {
    const ix = w.x - sel.x, iy = w.y - sel.y;
    if (ix + w.width < 0 || iy + w.height < 0 || ix > sel.w || iy > sel.h) continue;
    x.fillStyle = "#18181b"; x.strokeStyle = "rgba(255,255,255,.14)";
    x.beginPath(); x.roundRect(ix, iy, w.width, w.height, 8); x.fill(); x.stroke();
    x.fillStyle = "#232328"; x.fillRect(ix, iy, w.width, 30);
    x.fillStyle = "#f4f4f5"; x.font = "12px sans-serif"; x.fillText(w.title, ix + 12, iy + 20);
  }
  const now = new Date();
  const name = `Screenshot-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}.png`;
  const path = `/home/navairgap/Pictures/${name}`;
  const fs = useFS.getState();
  fs.mkdir("/home/navairgap/Pictures");
  fs.createFile("/home/navairgap/Pictures", name);
  fs.writeFile(path, c.toDataURL("image/png"));
  useNotifications.getState().push({ appId: "files", title: "Screenshot saved", body: `~/Pictures/${name}` });
  const id = useNotifications.getState().list[0]?.id;
  setTimeout(() => {
    const n = useNotifications.getState().list.find((n) => n.id === id);
    if (n) useNotifications.getState().push({ appId: "files", title: n.title, body: n.body + " — click to show in Files" });
    const w = useWindows.getState().windows.find((w) => w.appId === "files");
    if (w) useWindows.getState().closeWindow(w.id);
    openApp("files", { path: "/home/navairgap/Pictures" }, "Pictures");
  }, 400);
}
