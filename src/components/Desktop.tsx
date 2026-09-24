import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Terminal, FolderOpen, Info, Image as ImageIcon, FileText, Activity,
  Mail, Globe, Settings, Search, Wifi, Volume2, BatteryMedium,
  Sun, Moon, LayoutGrid, ChevronLeft,
} from "lucide-react";
import { useOS, AppId, APP_ORDER } from "../store";
import { ABOUT } from "../content";
import Window from "./Window";
import { TerminalApp, FilesApp, AboutApp, MonitorApp, MailApp, EditorApp, WebApp, SettingsApp, GalleryApp } from "./apps";

const ICONS: Record<AppId, React.ReactNode> = {
  terminal: <Terminal size={22} />, files: <FolderOpen size={22} />, about: <Info size={22} />,
  gallery: <ImageIcon size={22} />, editor: <FileText size={22} />, monitor: <Activity size={22} />,
  mail: <Mail size={22} />, browser: <Globe size={22} />, settings: <Settings size={22} />,
};
const LABELS: Record<AppId, string> = {
  terminal: "Terminal", files: "Files", about: "About", gallery: "Gallery", editor: "Editor",
  monitor: "Monitor", mail: "Mail", browser: "Web", settings: "Settings",
};

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  return <span className="clock">{now.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>;
}

function ContextMenu({ pos, close }: { pos: { x: number; y: number }; close: () => void }) {
  const { openApp, setWallpaper } = useOS();
  useEffect(() => {
    const h = () => close();
    addEventListener("pointerdown", h);
    return () => removeEventListener("pointerdown", h);
  }, [close]);
  return (
    <div className="ctx" style={{ left: pos.x, top: pos.y }} onPointerDown={(e) => e.stopPropagation()}>
      <button onClick={() => { setWallpaper(Math.floor(Math.random() * 4)); close(); }}><ImageIcon size={14} /> Change Background</button>
      <button onClick={() => { openApp("terminal"); close(); }}><Terminal size={14} /> Open Terminal Here</button>
      <hr />
      <button onClick={() => { openApp("settings"); close(); }}><Settings size={14} /> Display Settings</button>
    </div>
  );
}

function Overview({ close }: { close: () => void }) {
  const openApp = useOS((s) => s.openApp);
  const [q, setQ] = useState("");
  const apps = APP_ORDER.filter((a) => LABELS[a].toLowerCase().includes(q.toLowerCase()));
  return (
    <motion.div className="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
      <input autoFocus className="ov-search" placeholder="Type to search apps…  (Esc to close)"
        value={q} onChange={(e) => setQ(e.target.value)} onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === "Enter" && apps[0]) { openApp(apps[0]); close(); } }} />
      <div className="ov-grid" onClick={(e) => e.stopPropagation()}>
        {apps.map((a) => (
          <button key={a} onClick={() => { openApp(a); close(); }}>{ICONS[a]}{LABELS[a]}</button>
        ))}
      </div>
    </motion.div>
  );
}

function ScreenSaver({ off }: { off: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext("2d")!;
    c.width = innerWidth; c.height = innerHeight;
    const fs = 15, cols = Math.floor(c.width / fs);
    const drops = Array.from({ length: cols }, () => Math.random() * -40);
    const chars = "01アイウエオカキクケコサシスセソ<>/\\{}$#";
    const iv = setInterval(() => {
      g.fillStyle = "rgba(2,3,5,0.14)"; g.fillRect(0, 0, c.width, c.height);
      g.font = fs + "px JetBrains Mono";
      for (let i = 0; i < cols; i++) {
        g.fillStyle = Math.random() > 0.975 ? "#6FCF97" : "#1d5c3a";
        g.fillText(chars[Math.floor(Math.random() * chars.length)], i * fs, drops[i] * fs);
        drops[i] = drops[i] * fs > c.height && Math.random() > 0.975 ? 0 : drops[i] + 1;
      }
    }, 50);
    const stop = () => { clearInterval(iv); off(); };
    addEventListener("pointerdown", stop);
    addEventListener("keydown", stop);
    return () => { clearInterval(iv); removeEventListener("pointerdown", stop); removeEventListener("keydown", stop); };
  }, [off]);
  return <canvas ref={ref} className="saver" />;
}

const WALLS = ["wp0", "wp1", "wp2", "wp3"];

export default function Desktop() {
  const os = useOS();
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  const [overview, setOverview] = useState(false);
  const [saver, setSaver] = useState(false);
  const idle = useRef<number>(0);

  /* keyboard: Esc closes focused, alt+tab cycles */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (overview) { setOverview(false); return; }
        os.closeTop();
      }
      if (e.key === "Tab" && e.altKey) { e.preventDefault(); os.cycleWindows(); }
    };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, [os, overview]);

  /* idle screensaver (skip if reduced motion) */
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const reset = () => { window.clearTimeout(idle.current as number); if (!saver) idle.current = window.setTimeout(() => setSaver(true), 60000); };
    ["pointermove", "pointerdown", "keydown", "scroll"].forEach((ev) => addEventListener(ev, reset));
    reset();
    return () => { window.clearTimeout(idle.current as number); };
  }, [saver]);

  const running = (a: AppId) => os.windows.some((w) => w.appId === a);

  return (
    <div className={`desktop ${os.dark ? "" : ""}`} data-theme={os.dark ? "dark" : "light"}
      onContextMenu={(e) => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY }); }}>
      <div className={`wallpaper ${WALLS[os.wallpaper]}`} />

      <div className="dicons">
        <button className="dicon" onDoubleClick={() => os.openApp("editor")} onClick={(e) => (e.detail === 1 ? null : null)}>
          <FileText size={30} color="#F5A623" /> resume.txt
        </button>
        <button className="dicon" onDoubleClick={() => os.openApp("about")}>
          <Info size={30} color="#6FCF97" /> about-me
        </button>
        <button className="dicon" onDoubleClick={() => os.openApp("files", "projects")}>
          <FolderOpen size={30} color="#8b5cff" /> Projects
        </button>
      </div>

      <header className="panel">
        <button className="acts" onClick={() => setOverview(true)}><LayoutGrid size={15} /> Activities</button>
        <Clock />
        <div className="tray">
          <span className="dot" />
          <button aria-label="network"><Wifi size={15} /></button>
          <button aria-label="volume"><Volume2 size={15} /></button>
          <button aria-label="battery"><BatteryMedium size={15} /></button>
          <button aria-label="toggle theme" onClick={os.toggleTheme}>{os.dark ? <Sun size={15} /> : <Moon size={15} />}</button>
        </div>
      </header>

      {/* windows of current workspace only; assign by app: 0 work,1 gallery,2 contact */}
      {os.windows.map((w) => {
        const ws = w.appId === "gallery" ? 1 : w.appId === "mail" ? 2 : 0;
        if (ws !== os.workspace) return null;
        return (
          <Window key={w.id} win={w}>
            {w.appId === "terminal" && <TerminalApp />}
            {w.appId === "files" && <FilesApp initial={w.payload} />}
            {w.appId === "about" && <AboutApp />}
            {w.appId === "gallery" && <GalleryApp />}
            {w.appId === "editor" && <EditorApp />}
            {w.appId === "monitor" && <MonitorApp />}
            {w.appId === "mail" && <MailApp />}
            {w.appId === "browser" && <WebApp />}
            {w.appId === "settings" && <SettingsApp />}
          </Window>
        );
      })}

      <nav className="dock" aria-label="dock">
        {APP_ORDER.map((a) => (
          <button key={a} className={`${running(a) ? "run" : ""} ${os.windows.some((w) => w.appId === a && w.minimized) ? "min" : ""}`}
            aria-label={LABELS[a]} title={LABELS[a]} onClick={() => os.openApp(a)}>
            {ICONS[a]}{running(a) && <span className="run" />}
          </button>
        ))}
      </nav>

      <div className="ws" aria-label="workspaces">
        {[0, 1, 2].map((i) => (
          <button key={i} className={os.workspace === i ? "on" : ""} onClick={() => os.setWorkspace(i)}>{i + 1}</button>
        ))}
      </div>

      <a className="skip-resume" href="#plain" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("open-plain")); }}>skip to plain résumé ↗</a>

      {ctx && <ContextMenu pos={ctx} close={() => setCtx(null)} />}
      {overview && <Overview close={() => setOverview(false)} />}
      {saver && <ScreenSaver off={() => setSaver(false)} />}
    </div>
  );
}
