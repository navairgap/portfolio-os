import { useEffect, useState } from "react";
import { Palette, Monitor, Volume2, Wifi, User, Clock, Bell, Keyboard, HardDrive, Info, Power } from "lucide-react";
import { useSettings } from "../store/useSettingsStore";
import { useFS } from "../store/useFileSystemStore";
import { useNotifications } from "../store/useNotificationStore";
import { WALLPAPERS } from "../data/wallpapers";
import { sfx } from "../lib/audio";
import { pickFile } from "../system/FilePicker";
import type { WindowState } from "../types";

const SHORTCUTS: [string, string][] = [
  ["Super", "app launcher"], ["Ctrl+1..4", "switch workspace"], ["Ctrl+Alt+T", "terminal"],
  ["Ctrl+Alt+F", "files"], ["Ctrl+Alt+S", "settings"], ["Alt+Tab", "cycle windows"],
  ["Alt+F4", "close window"], ["Ctrl+W", "close window"], ["Ctrl+M", "minimize"],
  ["Ctrl+Shift+W", "maximize/restore"], ["Super+L", "lock"], ["Ctrl+Shift+Q", "power menu"], ["Esc", "close menus"],
];

const Row = ({ label, children }: any) => (
  <div className="flex items-center justify-between py-2.5 border-b border-[rgba(255,255,255,.06)]">
    <span className="text-[13px] text-[#f4f4f5]">{label}</span>{children}
  </div>
);
const Toggle = ({ on, onChange }: any) => (
  <button role="switch" aria-checked={on} onClick={() => onChange(!on)}
    className={`w-10 h-[22px] rounded-full relative transition-colors ${on ? "bg-[#7c9cff]" : "bg-[rgba(255,255,255,.15)]"}`}>
    <i className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all ${on ? "left-[20px]" : "left-[2px]"}`} />
  </button>
);
const Slider = ({ value, onChange }: any) => (
  <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(+e.target.value)} className="w-40 accent-[#7c9cff]" />
);

const TABS = [
  ["appearance", "Appearance", Palette], ["display", "Display", Monitor], ["sound", "Sound", Volume2],
  ["network", "Network", Wifi], ["users", "Users", User], ["datetime", "Date & Time", Clock],
  ["notifications", "Notifications", Bell], ["keyboard", "Keyboard", Keyboard],
  ["storage", "Storage", HardDrive], ["power", "Power", Power], ["about", "About This System", Info],
] as const;

export default function SettingsApp({ win }: { win: WindowState }) {
  const s = useSettings();
  const [tab, setTab] = useState<string>((win.props.tab as string) || "appearance");
  const { list, clear } = useNotifications();
  const useFS_any = useFS;
  const [repos, setRepos] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/users/navairgap").then((r) => r.json()).then((d) => setRepos(d.public_repos)).catch(() => setRepos(null));
  }, []);

  const accents = ["#7c9cff", "#ff5c5c", "#4ade80", "#fbbf24", "#c084fc", "#22d3ee", "#f472b6", "#a3e635"];

  return (
    <div className="h-full flex text-[#f4f4f5]">
      <div className="w-44 border-r border-[rgba(255,255,255,.08)] p-2 space-y-0.5 shrink-0 overflow-auto">
        {TABS.map(([id, label, Icon]: any) => (
          <button key={id} onClick={() => setTab(id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-left text-[12.5px] ${tab === id ? "bg-[rgba(124,156,255,.16)]" : "hover:bg-[rgba(255,255,255,.06)]"}`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {tab === "appearance" && (<>
          <h3 className="text-[13px] font-semibold mb-1">Appearance</h3>
          <Row label="Theme">
            <div className="flex gap-1">
              {["dark", "light", "auto"].map((t) => (
                <button key={t} onClick={() => s.set({ theme: t as any })}
                  className={`px-2.5 py-1 rounded-[6px] text-[12px] capitalize ${s.theme === t ? "bg-[#7c9cff] text-black" : "bg-[rgba(255,255,255,.06)]"}`}>{t}</button>
              ))}
            </div>
          </Row>
          <Row label="Accent color">
            <div className="flex gap-1.5 items-center">
              {accents.map((a) => (
                <button key={a} onClick={() => s.set({ accent: a })} aria-label={a}
                  className={`w-5 h-5 rounded-full border ${s.accent === a ? "border-white scale-110" : "border-transparent"}`} style={{ background: a }} />
              ))}
              <input type="color" value={s.accent} onChange={(e) => s.set({ accent: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer bg-transparent" title="custom color" />
            </div>
          </Row>
          <div className="py-3">
            <div className="text-[13px] mb-2">Wallpaper</div>
            <div className="grid grid-cols-4 gap-2">
              {WALLPAPERS.map((w, i) => (
                <button key={w.name} onClick={() => s.set({ wallpaper: i })} title={w.name}
                  className={`h-14 rounded-[8px] border ${s.wallpaper === i ? "border-[#7c9cff]" : "border-[rgba(255,255,255,.1)]"}`}
                  style={{ background: w.css }} />
              ))}
            </div>
          </div>
          <Row label="Font size">
            <div className="flex gap-1">
              {[["small", "S"], ["medium", "M"], ["large", "L"]].map(([v, l]) => (
                <button key={v} onClick={() => s.set({ fontSize: v as any })}
                  className={`px-2.5 py-1 rounded-[6px] text-[12px] ${s.fontSize === v ? "bg-[#7c9cff] text-black" : "bg-[rgba(255,255,255,.06)]"}`}>{l}</button>
              ))}
            </div>
          </Row>
          <Row label="Animations"><Toggle on={s.animations} onChange={(v: boolean) => s.set({ animations: v })} /></Row>
          <Row label="Skip boot on reload"><Toggle on={s.skipBoot} onChange={(v: boolean) => s.set({ skipBoot: v })} /></Row>
          <div className="py-3">
            <div className="text-[13px] mb-2">Desktop widgets</div>
            {[["clock", "Clock"], ["weather", "Weather"], ["stats", "System stats"], ["note", "Sticky note"], ["now", "Now playing"]].map(([id, label]) => (
              <Row key={id} label={label}><Toggle on={(s.widgets as any)[id]} onChange={(v: boolean) => s.set({ widgets: { ...s.widgets, [id]: v } })} /></Row>
            ))}
            <button onClick={() => { localStorage.removeItem("os.widgets.pos"); location.reload(); }} className="mt-3 px-3 py-1.5 rounded-[6px] bg-[rgba(255,255,255,.08)] text-[12px]">Reset widget layout</button>
          </div>
        </>)}
        {tab === "display" && (<>
          <h3 className="text-[13px] font-semibold mb-1">Display</h3>
          <Row label="Brightness"><Slider value={s.brightness} onChange={(v: number) => s.set({ brightness: v })} /></Row>
          <Row label="Night light"><Toggle on={s.nightLight} onChange={(v: boolean) => s.set({ nightLight: v })} /></Row>
          <Row label="Scale">
            <div className="flex gap-1">
              {[100, 90, 80].map((v) => (
                <button key={v} onClick={() => s.set({ scale: v })}
                  className={`px-2.5 py-1 rounded-[6px] text-[12px] ${s.scale === v ? "bg-[#7c9cff] text-black" : "bg-[rgba(255,255,255,.06)]"}`}>{v}%</button>
              ))}
            </div>
          </Row>
        </>)}
        {tab === "sound" && (<>
          <h3 className="text-[13px] font-semibold mb-1">Sound</h3>
          <Row label="Master volume"><div className="flex items-center gap-2"><Slider value={s.volume} onChange={(v: number) => s.set({ volume: v })} /><span className="text-[12px] w-8">{s.volume}%</span></div></Row>
          <Row label="Mute"><Toggle on={s.muted} onChange={(v: boolean) => s.set({ muted: v })} /></Row>
          <Row label="Startup sound"><Toggle on={s.startupSound} onChange={(v: boolean) => s.set({ startupSound: v })} /></Row>
          <Row label="UI sounds"><Toggle on={s.uiSounds} onChange={(v: boolean) => s.set({ uiSounds: v })} /></Row>
          <div className="flex gap-2 mt-3">
            <button onClick={() => sfx.startup()} className="px-3 py-1.5 rounded-[6px] bg-[rgba(255,255,255,.08)] text-[12px]">test startup</button>
            <button onClick={() => sfx.notify()} className="px-3 py-1.5 rounded-[6px] bg-[rgba(255,255,255,.08)] text-[12px]">test notification</button>
          </div>
        </>)}
        {tab === "network" && (<>
          <h3 className="text-[13px] font-semibold mb-1">Network</h3>
          <Row label="WiFi"><Toggle on={s.wifi} onChange={(v: boolean) => s.set({ wifi: v })} /></Row>
          <Row label="Ethernet"><Toggle on={s.ethernet} onChange={(v: boolean) => s.set({ ethernet: v })} /></Row>
          <div className="mt-3 p-3 rounded-[8px] bg-[rgba(255,255,255,.04)] border border-[rgba(255,255,255,.08)]">
            <div className="text-[13px] font-semibold">{s.wifi ? "Connected to portfolio-net" : "Offline"}</div>
            <div className="text-[12px] text-[rgba(244,244,245,.38)] mt-0.5">signal strength: excellent</div>
          </div>
          <div className="mt-2 space-y-1 text-[12px] text-[rgba(244,244,245,.62)]">
            {["prettyfly-5g", "xfinitywifi", "café-guest", "home-2.4"].map((n) => <div key={n} className="flex items-center gap-2"><Wifi size={11} /> {n} <span className="text-[rgba(244,244,245,.28)]">secured</span></div>)}
          </div>
          <button onClick={() => { setSpeed(null); let p = 0; const i = setInterval(() => { p += Math.random() * 18; if (p >= 100) { clearInterval(i); setSpeed(94.2 + Math.random() * 30); } }, 120); }}
            className="mt-3 px-3 py-1.5 rounded-[6px] bg-[#7c9cff] text-black text-[12px] font-semibold">
            {speed ? `${speed.toFixed(1)} Mbps` : "run speed test"}
          </button>
        </>)}
        {tab === "users" && (<>
          <h3 className="text-[13px] font-semibold mb-1">Users</h3>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-full bg-[#232328] border border-[rgba(255,255,255,.16)] grid place-items-center overflow-hidden">
              {s.avatar ? <img src={s.avatar} className="w-full h-full object-cover" alt="" /> : <span className="text-[22px] text-[#7c9cff] font-semibold">n</span>}
            </div>
            <button onClick={async () => { const p = await pickFile({ accept: "image" }); if (p) { const c = useFS.getState().get(p)?.content; if (c) s.set({ avatar: c }); } }}
              className="px-3 py-1.5 rounded-[6px] bg-[rgba(255,255,255,.08)] text-[12px] hover:bg-[rgba(255,255,255,.14)]">
              choose from Files
            </button>
            <label className="px-3 py-1.5 rounded-[6px] bg-[rgba(255,255,255,.08)] text-[12px] cursor-pointer hover:bg-[rgba(255,255,255,.14)]">
              upload
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]; if (!f) return;
                const r = new FileReader(); r.onload = () => s.set({ avatar: String(r.result) }); r.readAsDataURL(f);
              }} />
            </label>
          </div>
          <Row label="Display name">
            <input value={s.displayName} onChange={(e) => s.set({ displayName: e.target.value })}
              className="h-8 px-2 rounded-[6px] bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.08)] text-[#f4f4f5] focus:outline-none focus:border-[#7c9cff] w-44" />
          </Row>
          <Row label="Password"><span className="text-[12px] text-[rgba(244,244,245,.38)]">No password required in demo</span></Row>
        </>)}
        {tab === "datetime" && (<>
          <h3 className="text-[13px] font-semibold mb-1">Date & Time</h3>
          <Row label="12-hour clock"><Toggle on={s.hour12} onChange={(v: boolean) => s.set({ hour12: v })} /></Row>
          <Row label="Show seconds"><Toggle on={s.showSeconds} onChange={(v: boolean) => s.set({ showSeconds: v })} /></Row>
          <Row label="Timezone">
            <select value={s.timezone} onChange={(e) => s.set({ timezone: e.target.value })} className="h-8 px-2 rounded-[6px] bg-[#232328] border border-[rgba(255,255,255,.08)] text-[#f4f4f5] text-[12px] max-w-[220px]">
              {(Intl as any).supportedValuesOf ? (Intl as any).supportedValuesOf("timeZone").map((t: string) => <option key={t}>{t}</option>) : <option>{s.timezone}</option>}
            </select>
          </Row>
        </>)}
        {tab === "notifications" && (<>
          <h3 className="text-[13px] font-semibold mb-1">Notifications</h3>
          <Row label="Do Not Disturb"><Toggle on={s.dnd} onChange={(v: boolean) => s.set({ dnd: v })} /></Row>
          <div className="flex justify-between items-center mt-3 mb-1">
            <span className="text-[12px] text-[rgba(244,244,245,.38)]">history ({list.length})</span>
            <button onClick={clear} className="text-[12px] text-[#ff5c5c]">clear all</button>
          </div>
          {list.map((n) => <div key={n.id} className="px-3 py-2 rounded-[6px] bg-[rgba(255,255,255,.04)] mb-1"><b className="text-[12.5px]">{n.title}</b><div className="text-[12px] text-[rgba(244,244,245,.62)]">{n.body}</div></div>)}
          {list.length === 0 && <div className="text-[12px] text-[rgba(244,244,245,.28)]">no notifications yet</div>}
        </>)}
        {tab === "keyboard" && (<>
          <h3 className="text-[13px] font-semibold mb-1">Keyboard Shortcuts</h3>
          {SHORTCUTS.map(([k, d]) => <Row key={k} label={d}><kbd className="px-2 py-0.5 rounded-[4px] bg-[rgba(255,255,255,.08)] border border-[rgba(255,255,255,.12)] text-[11px] font-mono">{k}</kbd></Row>)}
        </>)}
        {tab === "storage" && (<>
          <h3 className="text-[13px] font-semibold mb-1">Storage</h3>
          <div className="mt-3">
            <div className="h-2 rounded bg-[rgba(255,255,255,.1)]"><div className="h-full w-[2%] rounded bg-[#7c9cff]" /></div>
            <div className="text-[12px] text-[rgba(244,244,245,.62)] mt-1.5">Used: 2.4 GB / 128 GB</div>
          </div>
          <Row label="GitHub repositories"><span className="text-[13px]">{repos ?? "offline"}</span></Row>
          <Row label="Lines of code (approx)"><span className="text-[13px]">41,208 and counting</span></Row>
        </>)}
        {tab === "power" && (<>
          <h3 className="text-[13px] font-semibold mb-1">Power</h3>
          <Row label="Battery drain simulation"><Toggle on={s.powerDrain} onChange={(v: boolean) => s.set({ powerDrain: v })} /></Row>
          <Row label="Automatic suspend"><span className="text-[12px] text-[rgba(244,244,245,.38)]">never — this is a portfolio</span></Row>
        </>)}
        {tab === "about" && (<>
          <h3 className="text-[13px] font-semibold mb-1">About This System</h3>
          <p className="text-[13px] text-[rgba(244,244,245,.72)] max-w-md leading-[1.7]">
            This OS is a portfolio. Every window, every file, every command tells you something about navairgap —
            defensive security × backend. Open Projects/, run `projects` in the terminal, or read Documents/resume.pdf.
          </p>
          <div className="mb-3 p-3 rounded-[8px] bg-[rgba(255,255,255,.04)] border border-[rgba(255,255,255,.08)]">
            <div className="text-[12px] text-[rgba(244,244,245,.62)]">System has been booted <b className="text-[#f4f4f5]">{localStorage.getItem("os.bootcount") || 1}</b> times
              {localStorage.getItem("os.lastboot") && <> · last booted {Math.max(0, Math.round((Date.now() - Number(localStorage.getItem("os.lastboot"))) / 60000))} minutes ago</>}</div>
          </div>
          <div className="mb-3">
            <div className="text-[13px] font-semibold mb-1">AI Assistant</div>
            <input value={s.aiKey} onChange={(e) => s.set({ aiKey: e.target.value })} type="password" placeholder="OpenAI API key (stored locally, used by terminal 'ask')"
              className="w-full max-w-sm h-8 px-2 rounded-[6px] bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.08)] text-[#f4f4f5] focus:outline-none focus:border-[#7c9cff] text-[12px]" />
          </div>
          <div className="mt-3 p-3 rounded-[8px] bg-[rgba(255,255,255,.04)] border border-[rgba(255,255,255,.08)] font-mono text-[12px] text-[rgba(244,244,245,.62)]">
            <div><b className="text-[#7c9cff]">OS</b> navairgap OS 1.0</div>
            <div><b className="text-[#7c9cff]">Kernel</b> 6.8.0-portfolio</div>
            <div><b className="text-[#7c9cff]">DE</b> navairgap-shell · <b className="text-[#7c9cff]">WM</b> portfolio-wm</div>
            <div><b className="text-[#7c9cff]">Built with</b> React 18 · TypeScript · Zustand · Framer Motion · Tailwind · xterm.js · CodeMirror 6</div>
          </div>
        </>)}
      </div>
    </div>
  );
}
