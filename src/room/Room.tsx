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
  const [mode, setMode] = useState<"desk" | "room">("desk");
  const lowPower = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "v" || e.key === "V" || e.key === "c" || e.key === "C") setMode((m) => (m === "desk" ? "room" : "desk")); };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, []);
  if (lowPower) { onEnter(); return null; }
  return (
    <div className="fixed inset-0 z-[120] bg-black">
      <Canvas
        dpr={[1, 1.5]} shadows={{ type: 2 }} camera={{ fov: 45, near: 0.05, far: 40 }}
        gl={{ antialias: true, toneMapping: 4 /* ACESFilmic */, toneMappingExposure: 1.2 }}
        onPointerMissed={() => setMode((m) => (m === "desk" ? "room" : "desk"))}>
        <color attach="background" args={["#0a0a12"]} />
        <fogExp2 attach="fog" args={["#0a0a12", 0.08]} />
        <Suspense fallback={<Loader />}>
          <OfficeRoom>
            {(found) => (<>
              <RoomShell />
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
      <div className="absolute top-3 left-4 text-[11px] text-[var(--text-tertiary)] uppercase tracking-[.15em]">
        office — <b className="text-[var(--accent)]">v</b>/click background: camera · <b className="text-[var(--accent)]">click the monitor</b> to take the desk
      </div>
    </div>
  );
}
