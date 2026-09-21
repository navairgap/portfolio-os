import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { useSession } from "../../store/useSessionStore";
import { openApp } from "../../system/DesktopIcons";
import { useSettings } from "../../store/useSettingsStore";
import { sfx } from "../../lib/audio";

const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
export const voiceSupported = !!SR && !matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function VoiceHUD() {
  const [active, setActive] = useState(false);
  const [text, setText] = useState("");
  const rec = useRef<any>(null);
  const [bars, setBars] = useState<number[]>(Array.from({ length: 16 }, () => 20));
  useEffect(() => {
    const id = setInterval(() => setBars(Array.from({ length: 16 }, () => 10 + Math.random() * 90)), 140);
    return () => clearInterval(id);
  }, []);

  const run = (t: string) => {
    const low = t.toLowerCase().trim();
    const mOpen = low.match(/open (\w+)/), mClose = low.match(/close (\w+)/), mSearch = low.match(/search (.+)/), mTheme = low.match(/theme (\w+)/);
    if (mOpen) openApp(mOpen[1].toLowerCase());
    else if (mClose) { const w = useSession.getState(); import("../../store/useWindowStore").then(({ useWindows }) => { const win = useWindows.getState().windows.find((x) => x.appId === mClose[1].toLowerCase()); if (win) useWindows.getState().closeWindow(win.id); }); }
    else if (mSearch) { const s = useSession.getState(); s.setLauncherOpen(true); setTimeout(() => { const el = document.querySelector<HTMLInputElement>("#launcher-input"); if (el) { el.value = mSearch[1]; el.dispatchEvent(new Event("input", { bubbles: true })); } }, 120); }
    else if (mTheme) useSettings.getState().set({ theme: mTheme[1] === "light" ? "light" : "dark" });
    else if (low.includes("shutdown")) useSession.getState().setPhase("shutdown");
    else if (low.includes("restart")) useSession.getState().setPhase("restart");
    else if (low.includes("lock")) useSession.getState().setPhase("lock");
  };

  const toggle = () => {
    if (!SR) return;
    if (active) { rec.current?.stop(); setActive(false); return; }
    const r = new SR();
    rec.current = r;
    r.continuous = false; r.interimResults = true; r.lang = "en-US";
    r.onresult = (e: any) => {
      const t = [...e.results].map((x: any) => x[0].transcript).join("");
      setText(t);
      if (e.results[e.results.length - 1].isFinal) { setTimeout(() => { run(t); setActive(false); setText(""); }, 500); }
    };
    r.onend = () => setActive(false);
    r.onerror = () => setActive(false);
    r.start(); setActive(true); setText("listening...");
    sfx.click();
  };

  useEffect(() => {
    const h = () => toggle();
    addEventListener("os-voice", h);
    return () => removeEventListener("os-voice", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!voiceSupported) return null;
  return (<>
    <button onClick={toggle} title="voice commands (hold ctrl+space)" aria-label="voice commands"
      className={`relative text-[rgba(244,244,245,.62)] hover:text-white ${active ? "text-[#ff5c5c]" : ""}`}>
      {active ? <Mic size={14} /> : <MicOff size={14} />}
    </button>
    {active && (
      <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[250] w-[420px] rounded-[14px] bg-[rgba(20,20,24,.95)] border border-[rgba(255,255,255,.14)] backdrop-blur-xl p-4 shadow-[0_16px_48px_rgba(0,0,0,.5)]">
        <div className="flex items-center gap-2 text-[12px] text-[rgba(244,244,245,.62)] mb-3">
          <Mic size={12} className="text-[#ff5c5c] animate-pulse" /> voice command
        </div>
        <div className="text-[15px] text-[#f4f4f5] min-h-[22px] mb-3">{text}</div>
        <div className="flex items-end gap-[3px] h-8">
          {bars.map((b, i) => <i key={i} className="flex-1 rounded-[1px] bg-[#7c9cff] transition-all duration-150" style={{ height: b + "%" }} />)}
        </div>
        <div className="text-[11px] text-[rgba(244,244,245,.38)] mt-2">try: "open terminal" · "theme dark" · "search files" · "lock"</div>
      </div>
    )}
  </>);
}
