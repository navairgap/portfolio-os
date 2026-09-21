import { AnimatePresence } from "framer-motion";
import { Suspense, lazy } from "react";
import { useWindows } from "../store/useWindowStore";
import { APPS } from "../registry/appRegistry";
import WindowView from "./Window";

export default function WindowManager() {
  const { windows, activeWorkspace } = useWindows();
  return (
    <div className="absolute inset-0 top-8 z-[100]" onPointerDown={(e) => { if (e.target === e.currentTarget) windows.forEach(() => useWindows.setState((s) => ({ windows: s.windows.map((w) => ({ ...w, isFocused: false })) }))); }}>
      <AnimatePresence>
        {windows.filter((w) => w.workspaceId === activeWorkspace && !w.isMinimized).map((win) => {
          const app = APPS.find((a) => a.id === win.appId);
          const AppComp = app?.component;
          if (!AppComp) return null;
          return (
            <WindowView key={win.id} win={win}>
              <Suspense fallback={<div className="p-4 text-[13px] text-[rgba(244,244,245,.38)]">loading {app.title}…</div>}>
                {/* @ts-ignore dynamic */}
                <AppComp win={win} />
              </Suspense>
            </WindowView>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// keep lazy imports referenced so vite bundles them
export const _apps = APPS.map((a) => a.component);
void lazy(() => Promise.resolve({ default: () => null }));
