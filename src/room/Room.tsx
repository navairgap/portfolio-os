import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload, useProgress, Html } from "@react-three/drei";
import OfficeRoom from "./OfficeRoom";
import MonitorScreen from "./MonitorScreen";
import RoomShell from "./RoomShell";
import WallDecor from "./WallDecor";
import CameraRig from "./CameraRig";
import Lighting from "./Lighting";
import Effects from "./Effects";

function Loader() {
  const { progress } = useProgress();
  return <Html center><div className="text-[#00ff9c] text-[13px] font-mono animate-pulse">loading office… {progress.toFixed(0)}%</div></Html>;
}

export default function Room({ onEnter }: { onEnter: () => void }) {
  const [mode, setMode] = useState<"desk" | "room">("room");
  const lowPower = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  useEffect(() => {
    if (lowPower) onEnter();
  }, [lowPower, onEnter]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "v" || e.key === "V" || e.key === "c" || e.key === "C") setMode((m) => (m === "desk" ? "room" : "desk"));
      if (e.key === "Escape") onEnter();
    };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, []);
  if (lowPower) return null;
  return (
    <div className="fixed inset-0 z-[120] bg-black">
      <Canvas key="roomcanvas"
        dpr={[1, 1.25]} shadows camera={{ fov: 45, near: 0.05, far: 40 }}
        gl={{ antialias: true, toneMapping: 4 /* ACESFilmic */, toneMappingExposure: 1.5 }}
        onPointerMissed={() => setMode((m) => (m === "desk" ? "room" : "desk"))}>
        <color attach="background" args={["#0a0a12"]} />
        <fogExp2 attach="fog" args={["#0a0a12", 0.08]} />
        <Suspense fallback={<Loader />}>
          <OfficeRoom>
            {(found) => (<>
              <RoomShell onToggle={() => setMode((m) => (m === "desk" ? "room" : "desk"))} />
              <WallDecor />
              <Lighting screenPos={found.screenPos.toArray() as [number, number, number]} />
              <CameraRig mode={mode} screenPos={found.screenPos.toArray() as [number, number, number]} chairPos={found.chairCenter.toArray() as [number, number, number]} />
              <MonitorScreen found={found} onEnter={onEnter} />
              <Preload all />
            </>)}
          </OfficeRoom>
          <Effects />
        </Suspense>
      </Canvas>
      <div className="absolute top-3 left-4 right-4 flex items-center gap-3 text-[11px] uppercase tracking-[.15em]">
        <span className="text-[var(--text-tertiary)]">office</span>
        <button onClick={() => setMode("room")} className={`px-2.5 py-1 border ${mode === "room" ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--border-strong)] text-[var(--text-secondary)]"}`}>room</button>
        <button onClick={() => setMode("desk")} className={`px-2.5 py-1 border ${mode === "desk" ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--border-strong)] text-[var(--text-secondary)]"}`}>desk</button>
        <span className="text-[var(--text-tertiary)] hidden sm:inline">v / click background also works</span>
        <button onClick={onEnter} className="ml-auto px-3 py-1 bg-[var(--accent)] text-black font-semibold">take the desk (esc)</button>
      </div>
    </div>
  );
}
