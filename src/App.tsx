import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useOS, AppId, APP_ORDER } from "./store";
import { ABOUT, RESUME_TEXT } from "./content";
import Desktop from "./components/Desktop";
import { TerminalApp, FilesApp, AboutApp, GalleryApp, EditorApp, MonitorApp, MailApp, WebApp, SettingsApp } from "./components/apps";
import {
  Terminal, FolderOpen, Info, Image as ImageIcon, FileText, Activity,
  Mail, Globe, Settings,
} from "lucide-react";

const M_ICONS: Record<AppId, React.ReactNode> = {
  terminal: <Terminal size={30} />, files: <FolderOpen size={30} />, about: <Info size={30} />,
  gallery: <ImageIcon size={30} />, editor: <FileText size={30} />, monitor: <Activity size={30} />,
  mail: <Mail size={30} />, browser: <Globe size={30} />, settings: <Settings size={30} />,
};
const M_LABELS: Record<AppId, string> = {
  terminal: "Terminal", files: "Files", about: "About", gallery: "Gallery", editor: "Editor",
  monitor: "Monitor", mail: "Mail", browser: "Web", settings: "Settings",
};

function Boot() {
  const setPhase = useOS((s) => s.setPhase);
  const [log, setLog] = useState<string[]>([]);
  const done = useOS((s) => s.booted);
  useEffect(() => {
    if (done) { setPhase("desktop"); return; }
    const lines = [
      "[ ok ] navairgap-os 3.0 kernel",
      "[ ok ] mounted /dev/portfolio (rw,encrypted)",
      "[ ok ] started window-manager.service",
      "[ ok ] armed honeypots — just kidding. mostly.",
      "[ .. ] starting display-manager",
    ];
    let i = 0;
    const iv = setInterval(() => {
      if (i < lines.length) { setLog((l) => [...l, lines[i]]); i++; }
      else { clearInterval(iv); setTimeout(() => setPhase("login"), 450); }
    }, 420);
    const skip = () => { clearInterval(iv); setPhase("login"); };
    addEventListener("pointerdown", skip);
    addEventListener("keydown", skip);
    return () => { clearInterval(iv); removeEventListener("pointerdown", skip); removeEventListener("keydown", skip); };
  }, [done, setPhase]);
  return (
    <div className="boot" onClick={() => setPhase("login")}>
      <svg className="mark" viewBox="0 0 100 100"><path d="M28 74 L50 26 L72 74 Z" fill="none" stroke="#F5A623" strokeWidth="7" /><path d="M40 74 L50 52 L60 74 Z" fill="#6FCF97" /></svg>
      <div className="log">{log.join("\n")}</div>
      <div className="hint">CLICK TO SKIP</div>
    </div>
  );
}

function Login() {
  const setPhase = useOS((s) => s.setPhase);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const go = () => {
    if (pw.length >= 0) setPhase("desktop");       // any password works, promise
    else setErr(true);
  };
  return (
    <motion.div className="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="avatar">◢</div>
      <h2>{ABOUT.name}</h2>
      <input
        type="password"
        placeholder="password"
        value={pw}
        autoFocus
        className={err ? "err" : ""}
        onChange={(e) => { setPw(e.target.value); setErr(false); }}
        onKeyDown={(e) => e.key === "Enter" && go()}
      />
      <small>any password works, I promise</small>
      <button className="acts" style={{ border: "1px solid var(--line)", padding: "9px 26px", borderRadius: 999 }} onClick={go}>Log In →</button>
    </motion.div>
  );
}

/* mobile: app grid + fullscreen app */
function Mobile() {
  const os = useOS();
  const [openApp, setOpenApp] = useState<AppId | null>(null);
  const AppView = openApp;
  return (
    <div className="mobile" data-theme={os.dark ? "dark" : "light"}>
      <div className="mpanel">navairgap OS · {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
      {!openApp ? (
        <div className="mgrid">
          {APP_ORDER.map((a) => (
            <button key={a} onClick={() => setOpenApp(a)}>{M_ICONS[a]}{M_LABELS[a]}</button>
          ))}
        </div>
      ) : (
        <div className="mapp">
          <div className="mhead">
            <button onClick={() => setOpenApp(null)}><ChevronL /> back</button>
            <b style={{ fontSize: 13 }}>{M_LABELS[openApp]}</b>
          </div>
          <div className="mbody">
            {AppView === "terminal" && <Lazy><TerminalApp /></Lazy>}
            {AppView === "files" && <Lazy><FilesApp /></Lazy>}
            {AppView === "about" && <Lazy><AboutApp /></Lazy>}
            {AppView === "gallery" && <Lazy><GalleryApp /></Lazy>}
            {AppView === "editor" && <Lazy><EditorApp /></Lazy>}
            {AppView === "monitor" && <Lazy><MonitorApp /></Lazy>}
            {AppView === "mail" && <Lazy><MailApp /></Lazy>}
            {AppView === "browser" && <Lazy><WebApp /></Lazy>}
            {AppView === "settings" && <Lazy><SettingsApp /></Lazy>}
          </div>
        </div>
      )}
      <a className="skip-resume" style={{ top: 52 }} href="#plain" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("open-plain")); }}>plain résumé ↗</a>
    </div>
  );
}
function ChevronL() { return <span>‹</span>; }
function Lazy({ children }: { children: React.ReactNode }) { return <>{children}</>; }

function Plain({ close }: { close: () => void }) {
  return (
    <div className="plain-resume">
      <button onClick={close}>✕ close</button>
      <pre>{RESUME_TEXT}</pre>
      <p style={{ marginTop: 18 }}>— plain-text escape hatch, for recruiters on phones and screen readers. The desktop is the show; this is the info.</p>
    </div>
  );
}

export default function App() {
  const phase = useOS((s) => s.phase);
  const booted = useOS((s) => s.booted);
  const [isMobile] = useState(() => matchMedia("(max-width: 768px)").matches);
  const [plain, setPlain] = useState(false);

  useEffect(() => {
    if (booted && phase === "boot") useOS.getState().setPhase("desktop");
  }, [booted, phase]);

  useEffect(() => {
    const h = () => setPlain(true);
    addEventListener("open-plain", h);
    return () => removeEventListener("open-plain", h);
  }, []);

  if (isMobile) {
    return (
      <>
        <Mobile />
        {plain && <Plain close={() => setPlain(false)} />}
      </>
    );
  }
  return (
    <>
      {phase === "boot" && <Boot />}
      {phase === "login" && <Login />}
      {phase === "desktop" && <Desktop />}
      {plain && <Plain close={() => setPlain(false)} />}
    </>
  );
}
