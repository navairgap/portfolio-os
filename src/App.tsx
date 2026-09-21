import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import BootSequence from "./system/BootSequence";
import LoginScreen from "./system/LoginScreen";
import ShutdownScreen from "./system/ShutdownScreen";
import Desktop from "./system/Desktop";
import { useSession } from "./store/useSessionStore";
import { useSettings, applySettings } from "./store/useSettingsStore";
import { restoreSession } from "./store/useWindowStore";
import type { OSPhase } from "./types";

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

  const onBootDone = useCallback(() => {
    if (s.skipBoot && bootedOnce) { restoreSession(); setPhase("desktop"); }
    else setPhase("login");
  }, [s.skipBoot, bootedOnce, setPhase]);

  const onLogin = useCallback(() => {
    setBootedOnce(true);
    restoreSession();
    setPhase("desktop");
  }, [setPhase]);

  const reboot = useCallback(() => {
    localStorage.removeItem("os.session");
    setPhase("boot");
  }, [setPhase]);

  return (
    <div className="h-full w-full overflow-hidden select-none" style={{ background: "var(--bg-base)", color: "var(--text-primary)", fontFamily: "Inter, system-ui, sans-serif" }}>
      <AnimatePresence>
        {phase === "boot" && <BootSequence key="boot" onDone={onBootDone} />}
      </AnimatePresence>
      <AnimatePresence>
        {phase === "login" && <LoginScreen key="login" onLogin={onLogin} />}
      </AnimatePresence>
      {phase === "desktop" && <Desktop />}
      {phase === "shutdown" && <ShutdownScreen mode="shutdown" onReboot={reboot} />}
      {phase === "restart" && <ShutdownScreen mode="restart" onReboot={reboot} />}
    </div>
  );
}
