import { useEffect } from "react";
import { useSettings, applySettings } from "../store/useSettingsStore";
import { useSession } from "../store/useSessionStore";
import { WALLPAPERS } from "../data/wallpapers";
import TopBar from "./TopBar";
import Dock from "./Dock";
import DesktopIcons, { openApp } from "./DesktopIcons";
import ContextMenu, { openContextMenu } from "./ContextMenu";
import Notifications from "./Notifications";
import AppLauncher from "./AppLauncher";
import WorkspaceOverview from "./WorkspaceOverview";
import WindowManager from "../window/WindowManager";
import { useGlobalShortcuts } from "../lib/shortcuts";
import { useFS } from "../store/useFileSystemStore";
import { DESKTOP } from "../lib/filesystem";
import { sfx } from "../lib/audio";
import { useNotifications } from "../store/useNotificationStore";

export default function Desktop() {
  const s = useSettings();
  const { setLauncherOpen, setPhase } = useSession();
  const fs = useFS();
  useGlobalShortcuts();

  useEffect(() => { applySettings(s); }, [s]);
  useEffect(() => {
    if (s.startupSound && !localStorage.getItem("os.chimed")) { sfx.startup(); localStorage.setItem("os.chimed", "1"); }
    if (!localStorage.getItem("os.welcomed")) {
      setTimeout(() => {
        useNotifications.getState().push({ appId: "about", title: "Welcome to navairgap OS", body: "This is a working desktop. Drag windows. Open apps. Right-click everything." });
        openApp("about", {}, "Welcome to navairgap OS");
        localStorage.setItem("os.welcomed", "1");
      }, 700);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wp = WALLPAPERS[s.wallpaper] || WALLPAPERS[0];

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <div className="absolute inset-[-4%] wp-drift transition-[background] duration-500" style={{ background: wp.css }} />
      <div className="absolute inset-0 pointer-events-none z-[5] opacity-[.05]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      <div className="absolute inset-0 pointer-events-none z-[5]"
        style={{ background: "radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(0,0,0,.35) 100%)" }} />
      <div className="absolute inset-0" onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu(e.clientX, e.clientY, [
          { label: "New Folder", action: () => fs.mkdir(`${DESKTOP}/New Folder`) },
          { label: "New Document", action: () => fs.createFile(DESKTOP, "untitled.md") },
          { label: "Change Wallpaper", action: () => openApp("settings", { tab: "appearance" }) },
          { label: "Display Settings", action: () => openApp("settings", { tab: "display" }) },
          { label: "Open Terminal Here", action: () => openApp("terminal", { cwd: DESKTOP }) },
          { sep: true, label: "" },
          { label: "Shut Down", danger: true, action: () => setPhase("shutdown") },
        ]);
      }} onDoubleClick={(e) => { if (e.target === e.currentTarget) setLauncherOpen(true); }} />
      <DesktopIcons />
      <WindowManager />
      <TopBar />
      <Dock />
      <ContextMenu />
      <Notifications />
      <AppLauncher />
      <WorkspaceOverview />
    </div>
  );
}
