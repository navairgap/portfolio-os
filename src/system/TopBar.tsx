import { useEffect, useState } from "react";
import { Wifi, WifiOff, Volume2, VolumeX, Battery, Bell, LogOut, Lock, Power, RotateCw, Grid2x2 } from "lucide-react";
import { useSettings } from "../store/useSettingsStore";
import { useWindows } from "../store/useWindowStore";
import { useSession } from "../store/useSessionStore";
import { useNotifications } from "../store/useNotificationStore";
import { APPS } from "../registry/appRegistry";
import { sfx } from "../lib/audio";
import { useBatteryDrain } from "../features/battery/useBatteryDrain";
import VoiceHUD, { voiceSupported } from "../features/voice/VoiceCommandHUD";
import { tzClock } from "../features/lockScreen/LockScreen";
import { useNotifPanel } from "./NotificationsPanel";

function Clock({ onClick }: { onClick: () => void }) {
  const s = useSettings();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: s.timezone, timeZoneName: "shortOffset" }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value || "";
  return <button onClick={onClick} title={`${s.timezone} (${offset})`} className="text-[13px] text-[#f4f4f5] hover:opacity-80">{tzClock(s, now)}</button>;
}

function Calendar({ onClose }: { onClose: () => void }) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  return (
    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 rounded-[10px] bg-[rgba(20,20,24,.95)] backdrop-blur-xl border border-[rgba(255,255,255,.08)] shadow-[0_8px_24px_rgba(0,0,0,.4)] p-4 z-[120]">
      <div className="text-[13px] font-semibold mb-3">{now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[rgba(244,244,245,.38)]">
        {["S","M","T","W","T","F","S"].map((d, i) => <div key={i}>{d}</div>)}
        {Array.from({ length: first }).map((_, i) => <div key={"p" + i} />)}
        {Array.from({ length: days }).map((_, i) => (
          <div key={i} className={`py-1 rounded-[4px] ${i + 1 === now.getDate() ? "bg-[#7c9cff] text-black font-semibold" : "text-[#f4f4f5]"}`}>{i + 1}</div>
        ))}
      </div>
      <button onClick={onClose} className="mt-3 w-full text-[12px] text-[rgba(244,244,245,.62)] hover:text-white">close</button>
    </div>
  );
}

export default function TopBar() {
  const s = useSettings();
  const { windows, activeWorkspace, setWorkspace, focusWindow } = useWindows();
  const { menu, setMenu, setLauncherOpen, setOverviewOpen, setPhase } = useSession();
  const { list, clear } = useNotifications();
  const bat = useBatteryDrain();
  const focused = windows.find((w) => w.isFocused && !w.isMinimized);
  const focusedApp = focused ? APPS.find((a) => a.id === focused.appId) : null;
  const [cal, setCal] = useState(false);

  const power = (m: "shutdown" | "restart" | "lock" | "logout") => {
    setMenu(null);
    if (m === "shutdown" || m === "restart") setPhase(m);
    else if (m === "lock") setPhase("login");
    else { useWindows.getState().closeAll(); setPhase("login"); }
  };

  const menuCls = "absolute top-10 right-0 w-64 rounded-[10px] bg-[rgba(20,20,24,.95)] backdrop-blur-xl border border-[rgba(255,255,255,.08)] shadow-[0_8px_24px_rgba(0,0,0,.4)] p-2 z-[120]";
  const itemCls = "w-full flex items-center gap-3 px-3 py-2 rounded-[6px] text-[13px] text-[#f4f4f5] hover:bg-[rgba(255,255,255,.08)] text-left";

  return (
    <div className="fixed top-0 left-0 right-0 h-8 z-[110] flex items-center px-3 gap-4 text-[13px]"
      style={{ background: "var(--bg-overlay)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border-subtle)" }}>
      <button onClick={() => setLauncherOpen(true)} className="font-semibold text-[#f4f4f5] hover:opacity-80">Activities</button>
      <span className="text-[rgba(244,244,245,.62)]">
        {focusedApp ? `${focusedApp.title}${focused ? " — " + focused.title : ""}` : "Desktop"}
      </span>
      <div className="relative ml-auto">
        <Clock onClick={() => setCal((c) => !c)} />
        {cal && <Calendar onClose={() => setCal(false)} />}
      </div>
      <div className="flex items-center gap-3">
        {/* workspaces */}
        <div className="flex gap-[3px]" title="workspaces (Ctrl+1..4)">
          {[0, 1, 2, 3].map((i) => (
            <button key={i} onClick={() => setWorkspace(i)} aria-label={"workspace " + (i + 1)}
              className="relative w-[18px] h-[12px] rounded-[2px] border border-[rgba(255,255,255,.2)]">
              <i className={`absolute inset-[2px] rounded-[1px] ${activeWorkspace === i ? "bg-[#7c9cff]" : "bg-[rgba(255,255,255,.12)]"}`} />
            </button>
          ))}
          <button onClick={() => setOverviewOpen(true)} aria-label="workspace overview" className="ml-1 text-[rgba(244,244,245,.62)] hover:text-white"><Grid2x2 size={13} /></button>
        </div>
        <button onClick={() => setMenu(menu === "wifi" ? null : "wifi")} className="text-[rgba(244,244,245,.62)] hover:text-white" aria-label="network">
          {s.wifi ? <Wifi size={14} /> : <WifiOff size={14} />}
        </button>
        <button onClick={() => setMenu(menu === "volume" ? null : "volume")} className="text-[rgba(244,244,245,.62)] hover:text-white" aria-label="volume">
          {s.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        {voiceSupported && <VoiceHUD />}
        <button onClick={() => setMenu(menu === "battery" ? null : "battery")} className="text-[rgba(244,244,245,.62)] hover:text-white flex items-center gap-1" aria-label="battery">
          <Battery size={14} /><span className="text-[11px]">{bat.level}%</span>
        </button>
        <button onClick={() => useNotifPanel.getState().set(true)} className="relative text-[rgba(244,244,245,.62)] hover:text-white" aria-label="notification center">
          <Bell size={14} />
          {list.length > 0 && <i className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#ff5c5c]" />}
        </button>
        <button onClick={() => setMenu(menu === "power" ? null : "power")} aria-label="user menu"
          className="w-5 h-5 rounded-full bg-[#232328] border border-[rgba(255,255,255,.16)] grid place-items-center overflow-hidden">
          {s.avatar ? <img src={s.avatar} className="w-full h-full object-cover" alt="" /> : <span className="text-[10px] text-[#7c9cff] font-semibold">n</span>}
        </button>
      </div>

      {menu === "wifi" && <div className={menuCls} style={{ right: 120 }}>
        <div className="px-3 py-2 text-[13px] font-semibold">{s.wifi ? "Connected to portfolio-net" : "Offline"}</div>
        <div className="px-3 pb-2"><div className="h-1 rounded bg-[rgba(255,255,255,.12)]"><div className="h-full w-[82%] rounded bg-[#4ade80]" /></div></div>
        <button className={itemCls} onClick={() => { s.set({ wifi: !s.wifi }); sfx.click(); }}>{s.wifi ? "Turn WiFi off" : "Turn WiFi on"}</button>
        <button className={itemCls} onClick={() => useWindows.getState().openWindow({ appId: "settings", title: "Settings", x: 120, y: 80, width: 760, height: 520, isResizable: true, minWidth: 560, minHeight: 400, workspaceId: activeWorkspace, props: { tab: "network" } })}>Network Settings</button>
      </div>}
      {menu === "volume" && <div className={menuCls} style={{ right: 90 }}>
        <div className="px-3 py-2 flex items-center gap-3">
          <input type="range" min={0} max={100} value={s.volume} onChange={(e) => s.set({ volume: +e.target.value })}
            className="flex-1 accent-[#7c9cff]" aria-label="volume" />
          <span className="text-[12px] w-8 text-right">{s.volume}%</span>
        </div>
        <button className={itemCls} onClick={() => s.set({ muted: !s.muted })}>{s.muted ? "Unmute" : "Mute"}</button>
        <div className="px-3 py-1 text-[12px] text-[rgba(244,244,245,.38)]">Output: portfolio-analog-stereo</div>
      </div>}
      {menu === "battery" && <div className={menuCls} style={{ right: 60 }}>
        <div className="px-3 py-3 text-[13px]">{bat.level}% — {bat.plugged ? "plugged in" : bat.status.toLowerCase()}</div>
        <div className="px-3 pb-2"><div className="h-2 rounded bg-[rgba(255,255,255,.12)]"><div className={`h-full rounded ${bat.level <= 20 ? "bg-[#fbbf24]" : bat.level <= 10 ? "bg-[#ff5c5c]" : "bg-[#4ade80]"}`} style={{ width: bat.level + "%" }} /></div></div>
        <button className={itemCls} onClick={() => bat.setPlugged(!bat.plugged)}>{bat.plugged ? "Unplug" : "Plug in"}</button>
      </div>}
      {menu === "power" && <div className={menuCls}>
        <button className={itemCls} onClick={() => power("lock")}><Lock size={14} /> Lock</button>
        <button className={itemCls} onClick={() => power("logout")}><LogOut size={14} /> Log Out</button>
        <button className={itemCls} onClick={() => power("restart")}><RotateCw size={14} /> Restart</button>
        <button className={itemCls} onClick={() => power("shutdown")}><Power size={14} /> Shut Down</button>
      </div>}
    </div>
  );
}
