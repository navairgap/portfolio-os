import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import BootSequence from "./system/BootSequence";
import ShutdownScreen from "./system/ShutdownScreen";
import Desktop from "./system/Desktop";
import { useSession } from "./store/useSessionStore";
import { useSettings, applySettings } from "./store/useSettingsStore";
import { restoreSession } from "./store/useWindowStore";
import type { OSPhase } from "./types";
import LockScreen from "./features/lockScreen/LockScreen";
import RecoveryShell from "./features/recovery/RecoveryShell";
import ErrorBoundary from "./system/ErrorBoundary";

export default function App() {
  const { phase, setPhase } = useSession();
  const s = useSettings();
  const [bootedOnce, setBootedOnce] = useState(() => !!localStorage.getItem("os.welcomed"));

  useEffect(() => { applySettings(s); }, [s]);

  // power events from terminal
  useEffect(() => {
    const h = (e: Event) => {
      const p = (e as CustomEvent).detail as OSPhase;
      setTimeout(() => setPhase(p), 600);
    };
    addEventListener("os-power", h);
    return () => removeEventListener("os-power", h);
  }, [setPhase]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Shift" && useSession.getState().phase === "boot") setPhase("recovery"); };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, [setPhase]);
  useEffect(() => {
    if (phase !== "desktop") return;
    if (s.autoTerminal && !localStorage.getItem("os.autoterm")) {
      localStorage.setItem("os.autoterm", "1");
      setTimeout(() => import("./system/DesktopIcons").then((m) => m.openApp("terminal")), 900);
    }
    localStorage.setItem("os.bootcount", String(Number(localStorage.getItem("os.bootcount") || 0) + 1));
    localStorage.setItem("os.lastboot", String(Date.now()));
    fetch("./api/telemetry/increment", { method: "POST" }).catch(() => {});
  }, [phase]);

  const onBootDone = useCallback(() => {
    restoreSession();
    setBootedOnce(true);
    setPhase("desktop");
  }, [setPhase]);

  const reboot = useCallback(() => {
    localStorage.removeItem("os.session");
    setPhase("boot");
  }, [setPhase]);

  return (
    <ErrorBoundary>
    <div className="h-full w-full overflow-hidden select-none" style={{ background: "var(--bg-base)", color: "var(--text-primary)", fontFamily: "Inter, system-ui, sans-serif" }}>
      <AnimatePresence>
        {phase === "boot" && <BootSequence key="boot" onDone={onBootDone} />}
      </AnimatePresence>

      {phase === "desktop" && <Desktop />}
      {phase === "lock" && <Desktop />}
      {phase === "lock" && <LockScreen />}
      {phase === "recovery" && <RecoveryShell onExit={() => setPhase("boot")} />}
      {phase === "shutdown" && <ShutdownScreen mode="shutdown" onReboot={reboot} />}
      {phase === "restart" && <ShutdownScreen mode="restart" onReboot={reboot} />}
    </div>
    </ErrorBoundary>
  );
}
