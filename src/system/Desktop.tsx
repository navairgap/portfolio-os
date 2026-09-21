import { useEffect, useState } from "react";
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
import WidgetLayer from "../widgets/WidgetLayer";
import SnapPreview from "../features/snapPreview/SnapPreview";
import ScreenshotTool from "../features/screenshots/ScreenshotTool";
import BSOD from "../features/bsod/BSOD";
import MatrixRain from "../features/matrix/MatrixRain";
import { mountShaderWallpaper, stopShaderWallpaper } from "../lib/wallpaper/shaderWallpaper";
import { useNotifications } from "../store/useNotificationStore";
import WelcomeModal from "./WelcomeModal";
import FilePicker from "./FilePicker";
import NotificationsPanel from "./NotificationsPanel";

export default function Desktop() {
  const s = useSettings();
  const { setLauncherOpen, setPhase } = useSession();
  const fs = useFS();
  useGlobalShortcuts();

  useEffect(() => { applySettings(s); }, [s]);
  useEffect(() => {
    if (s.startupSound && !localStorage.getItem("os.chimed")) { sfx.startup(); localStorage.setItem("os.chimed", "1"); }
    if (!localStorage.getItem("os.welcomed") && !localStorage.getItem("os.welcomed.never")) {
      setTimeout(() => setShowWelcome(true), 700);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wp = WALLPAPERS[s.wallpaper] || WALLPAPERS[0];
  const [bsod, setBsod] = useState(false);
  const [welcome, setShowWelcome] = useState(false);
  const [matrixWp, setMatrixWp] = useState(false);
  useEffect(() => {
    addEventListener("os-bsod", () => setBsod(true));
    addEventListener("os-konami", () => setMatrixWp(true));
    return () => { removeEventListener("os-bsod", () => setBsod(true)); };
  }, []);
  useEffect(() => {
    if (s.wallpaper === 8) return mountShaderWallpaper(document.getElementById("wallpaper-host")!, s.accent);
    stopShaderWallpaper();
    return () => stopShaderWallpaper();
  }, [s.wallpaper, s.accent]);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <div id="wallpaper-host" className="absolute inset-[-4%] wp-drift transition-[background] duration-500" style={{ background: wp.css }} />
      {s.wallpaper === 9 && <MatrixRain wallpaper accent={s.accent === "#7c9cff" ? "#3fbf7f" : s.accent} />}
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
          { label: "Take Screenshot", action: () => dispatchEvent(new Event("os-screenshot")) },
          { sep: true, label: "" },
          { label: "Shut Down", danger: true, action: () => setPhase("shutdown") },
        ]);
      }} onDoubleClick={(e) => { if (e.target === e.currentTarget) setLauncherOpen(true); }} />
      <WidgetLayer />
      <DesktopIcons />
      <SnapPreview />
      <WindowManager />
      <TopBar />
      <Dock />
      <ContextMenu />
      <Notifications />
      <AppLauncher />
      <WorkspaceOverview />
      <ScreenshotTool />
      <FilePicker />
      <NotificationsPanel />
      {welcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      {matrixWp && <MatrixRain onPrompt={(set) => { setMatrixWp(false); if (set) useSettings.getState().set({ wallpaper: 9 }); }} />}
      {bsod && <BSOD onDone={() => setBsod(false)} />}
    </div>
  );
}
