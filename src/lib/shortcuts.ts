import { useEffect } from "react";
import { useWindows } from "../store/useWindowStore";
import { useSession } from "../store/useSessionStore";
import { openApp } from "../system/DesktopIcons";

const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];

export function matrixRain() {
  const c = document.createElement("canvas");
  c.style.cssText = "position:fixed;inset:0;z-index:500;pointer-events:none";
  c.width = innerWidth; c.height = innerHeight;
  document.body.appendChild(c);
  const x = c.getContext("2d")!;
  const cols = Math.floor(c.width / 16);
  const drops = Array.from({ length: cols }, () => Math.random() * -50);
  const glyphs = "01アイウエオカキクケコ<>[]{}$#";
  const t0 = performance.now();
  const tick = () => {
    x.fillStyle = "rgba(10,10,10,.14)"; x.fillRect(0, 0, c.width, c.height);
    x.font = "14px monospace";
    for (let i = 0; i < cols; i++) {
      x.fillStyle = Math.random() < .03 ? "#ff5c5c" : "#3fbf7f";
      x.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * 16, drops[i] * 16);
      if (drops[i] * 16 > c.height && Math.random() > .975) drops[i] = 0;
      drops[i]++;
    }
    if (performance.now() - t0 < 5000) requestAnimationFrame(tick);
    else c.remove();
  };
  tick();
}

export function useGlobalShortcuts() {
  useEffect(() => {
    let konamiIdx = 0;
    let altTabIdx = -1;

    const onKey = (e: KeyboardEvent) => {
      const s = useSession.getState();
      const w = useWindows.getState();
      const k = e.key;

      konamiIdx = k === KONAMI[konamiIdx] ? konamiIdx + 1 : (k === KONAMI[0] ? 1 : 0);
      if (konamiIdx === KONAMI.length) { konamiIdx = 0; dispatchEvent(new Event("os-konami")); }

      if (k === "Meta") { e.preventDefault(); s.setLauncherOpen(!s.launcherOpen); return; }
      if (e.ctrlKey && k >= "1" && k <= "4") { e.preventDefault(); w.setWorkspace(+k - 1); return; }
      if (e.ctrlKey && e.altKey && k.toLowerCase() === "t") { e.preventDefault(); openApp("terminal"); return; }
      if (e.ctrlKey && e.altKey && k.toLowerCase() === "f") { e.preventDefault(); openApp("files"); return; }
      if (e.ctrlKey && e.altKey && k.toLowerCase() === "s") { e.preventDefault(); openApp("settings"); return; }
      if (e.ctrlKey && e.shiftKey && k.toLowerCase() === "q") { e.preventDefault(); s.setMenu(s.menu === "power" ? null : "power"); return; }
      if (e.metaKey && k.toLowerCase() === "l") { e.preventDefault(); s.setPhase("lock"); return; }
      if (e.key === "PrintScreen" || (e.ctrlKey && e.shiftKey && k === "4")) { e.preventDefault(); dispatchEvent(new Event("os-screenshot")); return; }
      if (e.ctrlKey && k === " ") { e.preventDefault(); dispatchEvent(new Event("os-voice")); return; }

      const focused = w.windows.find((x) => x.isFocused);
      if (e.altKey && k === "Tab") {
        e.preventDefault();
        const open = w.windows.filter((x) => !x.isMinimized && x.workspaceId === w.activeWorkspace);
        if (!open.length) return;
        altTabIdx = (altTabIdx + 1) % open.length;
        w.focusWindow(open[altTabIdx].id);
        s.setAltTab(true);
        return;
      }
      if (!e.altKey) altTabIdx = -1;
      if (!focused) return;
      if (e.altKey && k === "F4") { e.preventDefault(); w.closeWindow(focused.id); return; }
      if (e.ctrlKey && k.toLowerCase() === "w") { e.preventDefault(); w.closeWindow(focused.id); return; }
      if (e.ctrlKey && k.toLowerCase() === "m") { e.preventDefault(); w.minimizeWindow(focused.id); return; }
      if (e.ctrlKey && e.shiftKey && k.toLowerCase() === "w") { e.preventDefault(); w.toggleMaximize(focused.id); return; }
    };
    const onUp = (e: KeyboardEvent) => { if (e.key === "Alt") { useSession.getState().setAltTab(false); altTabIdx = -1; } };

    addEventListener("keydown", onKey);
    addEventListener("keyup", onUp);
    return () => { removeEventListener("keydown", onKey); removeEventListener("keyup", onUp); };
  }, []);
}
