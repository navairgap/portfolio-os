import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { CameraControls, Preload } from "@react-three/drei";
import * as THREE from "three";
import MonitorScreen from "./MonitorScreen";
import { starfieldTexture, posterTexture } from "./textures";
import { MODES } from "./useCameraModes";

const BEIGE = "#c8c0b0", BEIGE2 = "#b0a894", DARK = "#1a1a1e", WOOD = "#4a3524";

function Desk() {
  return (
    <group>
      <mesh position={[0, 0.78, -1.2]}><boxGeometry args={[3.2, 0.08, 1.5]} /><meshStandardMaterial color={WOOD} roughness={0.8} /></mesh>
      {[[-1.5, -0.75], [1.5, -0.75], [-1.5, -1.65], [1.5, -1.65]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.37, z]}><boxGeometry args={[0.08, 0.78, 0.08]} /><meshStandardMaterial color={WOOD} roughness={0.85} /></mesh>
      ))}
    </group>
  );
}

function Keyboard() {
  const keys = Array.from({ length: 60 }, (_, i) => i);
  return (
    <group position={[0, 0.84, -0.62]} rotation={[0.06, 0, 0]}>
      <mesh><boxGeometry args={[0.72, 0.03, 0.26]} /><meshStandardMaterial color={BEIGE} roughness={0.7} /></mesh>
      {keys.map((k) => {
        const r = Math.floor(k / 15), c = k % 15;
        return <mesh key={k} position={[-0.33 + c * 0.047, 0.02, -0.09 + r * 0.055]}><boxGeometry args={[0.04, 0.015, 0.045]} /><meshStandardMaterial color="#ddd6c8" roughness={0.6} /></mesh>;
      })}
    </group>
  );
}

function Tower() {
  const led = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => { if (led.current) led.current.emissiveIntensity = 1.2 + Math.sin(clock.elapsedTime * 4) * 1.2; });
  return (
    <group position={[1.35, 0.55, -1.5]}>
      <mesh><boxGeometry args={[0.34, 0.72, 0.66]} /><meshStandardMaterial color={BEIGE} roughness={0.75} /></mesh>
      <mesh position={[0, 0.18, 0.331]}><boxGeometry args={[0.28, 0.05, 0.005]} /><meshStandardMaterial color="#222" /></mesh>
      {[0, 1, 2, 3].map((i) => <mesh key={i} position={[0, -0.05 - i * 0.09, 0.331]}><boxGeometry args={[0.28, 0.05, 0.005]} /><meshStandardMaterial color="#999" /></mesh>)}
      <mesh position={[0.1, 0.28, 0.34]}><sphereGeometry args={[0.012, 8, 8]} /><meshStandardMaterial ref={led} color="#00ff9c" emissive="#00ff9c" emissiveIntensity={2} /></mesh>
    </group>
  );
}

function Lamp() {
  return (
    <group position={[-1.25, 0.82, -1.45]}>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.14, 0.16, 0.04, 20]} /><meshStandardMaterial color="#223" metalness={0.4} roughness={0.5} /></mesh>
      <mesh position={[0, 0.28, 0]} rotation={[0, 0, 0.25]}><cylinderGeometry args={[0.02, 0.02, 0.55, 8]} /><meshStandardMaterial color="#334" metalness={0.5} /></mesh>
      <mesh position={[0.14, 0.55, 0]} rotation={[0, 0, -0.9]}><coneGeometry args={[0.13, 0.2, 20, 1, true]} /><meshStandardMaterial color="#2a4a3a" side={THREE.DoubleSide} /></mesh>
      <pointLight position={[0.2, 0.48, 0]} color="#ffcf8a" intensity={6} distance={4} decay={2} castShadow />
    </group>
  );
}

function Shelf() {
  const books: [number, string][] = [[0.05, "#7a1a1a"], [0.16, "#2a3a5a"], [0.28, "#3a4a2a"], [0.4, "#5a2a4a"], [0.52, "#333"], [0.62, "#7a5a1a"]];
  return (
    <group position={[-1.9, 1.6, -2.35]}>
      <mesh><boxGeometry args={[1.3, 0.05, 0.32]} /><meshStandardMaterial color={WOOD} roughness={0.8} /></mesh>
      {books.map(([x, c], i) => (
        <mesh key={i} position={[-0.5 + x, 0.14, 0]} rotation={[0, 0, i % 3 === 0 ? 0.08 : 0]}>
          <boxGeometry args={[0.07, 0.22, 0.22]} /><meshStandardMaterial color={c} roughness={0.85} /></mesh>
      ))}
      {[[0.72, "#222"], [0.84, "#223"], [0.96, "#232"]].map(([x, c], i) => (
        <mesh key={"f" + i} position={[-0.5 + x, 0.08, 0]}><boxGeometry args={[0.1, 0.1, 0.09]} /><meshStandardMaterial color={c} /></mesh>
      ))}
    </group>
  );
}

function WindowView() {
  return (
    <group position={[1.9, 1.7, -2.38]}>
      <mesh><boxGeometry args={[1.1, 1.3, 0.06]} /><meshStandardMaterial color="#0b0d12" /></mesh>
      <mesh position={[0, 0, 0.04]}><planeGeometry args={[0.95, 1.15]} /><meshBasicMaterial map={starfieldTexture()} /></mesh>
      <mesh position={[0, 0, 0.05]}><boxGeometry args={[0.04, 1.15, 0.02]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh position={[0, 0, 0.05]}><boxGeometry args={[0.95, 0.04, 0.02]} /><meshStandardMaterial color="#222" /></mesh>
    </group>
  );
}

function Posters() {
  return (<>
    <mesh position={[-0.6, 1.9, -2.44]}><planeGeometry args={[0.62, 0.92]} /><meshBasicMaterial map={posterTexture(["SENTINEL", "WIFI"], "#ff2b2b")} /></mesh>
    <mesh position={[0.5, 1.95, -2.44]}><planeGeometry args={[0.56, 0.84]} /><meshBasicMaterial map={posterTexture(["AIRGAP", "OS"], "#00ff9c", "#0a0f0c")} /></mesh>
  </>);
}

function MugAndPapers() {
  return (<>
    <group position={[0.85, 0.83, -0.85]}>
      <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.05, 0.045, 0.1, 16]} /><meshStandardMaterial color="#7a1a1a" roughness={0.6} /></mesh>
      <mesh position={[0.06, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.03, 0.008, 8, 16]} /><meshStandardMaterial color="#7a1a1a" /></mesh>
    </group>
    {[[-0.7, 0.3], [-0.55, 0.5], [1.1, 0.2]].map(([x, r], i) => (
      <mesh key={i} position={[x, 0.825 + i * 0.002, -0.75 + i * 0.08]} rotation={[-Math.PI / 2, 0, r]}>
        <planeGeometry args={[0.28, 0.2]} /><meshStandardMaterial color="#d8d2c4" roughness={0.9} /></mesh>
    ))}
  </>);
}

function Rig({ mode, onEnter }: { mode: "desk" | "room"; onEnter: () => void }) {
  const controls = useRef<CameraControls | null>(null);
  const first = useRef(true);
  useEffect(() => {
    const c = controls.current as any;
    if (!c) return;
    const m = MODES[mode];
    if (first.current) { c.setLookAt(m.pos[0], m.pos[1], m.pos[2], m.target[0], m.target[1], m.target[2], false); first.current = false; return; }
    c.setLookAt(m.pos[0], m.pos[1], m.pos[2], m.target[0], m.target[1], m.target[2], true);
  }, [mode]);
  return (
    <>
      <CameraControls ref={controls as any} makeDefault enabled={false} minDistance={0.2} maxDistance={8} />
      {/* room shell */}
      <mesh position={[0, 2, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[7, 6]} /><meshStandardMaterial color="#121216" /></mesh>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[7, 6]} /><meshStandardMaterial color="#181410" roughness={0.9} /></mesh>
      <mesh position={[0, 2, -2.5]}><planeGeometry args={[7, 4]} /><meshStandardMaterial color="#17171c" /></mesh>
      <mesh position={[-3.2, 2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[6, 4]} /><meshStandardMaterial color="#15151a" /></mesh>
      <mesh position={[3.2, 2, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[6, 4]} /><meshStandardMaterial color="#15151a" /></mesh>
      <ambientLight intensity={0.14} />
      <directionalLight position={[2, 3, 1]} intensity={0.15} color="#8aa" />
      <Desk /><Keyboard /><Tower /><Lamp /><Shelf /><WindowView /><Posters /><MugAndPapers />
      {/* screen glow lighting the desk */}
      <pointLight position={[0, 1.2, -1.0]} color="#9fb8a8" intensity={2.2} distance={2.6} decay={2} />
      <MonitorScreen onEnter={onEnter} />
      <Preload all />
    </>
  );
}

export default function Room({ onEnter }: { onEnter: () => void }) {
  const [mode, setMode] = useState<"desk" | "room">("desk");
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "v" || e.key === "V") setMode((m) => (m === "desk" ? "room" : "desk")); };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, []);
  return (
    <div className="fixed inset-0 z-[120] bg-black">
      <Canvas dpr={[1, 1.5]} camera={{ fov: 42, near: 0.05, far: 30 }} gl={{ antialias: true }} onPointerMissed={() => setMode((m) => (m === "desk" ? "room" : "desk"))}>
        <Suspense fallback={null}>
          <Rig mode={mode} onEnter={onEnter} />
        </Suspense>
      </Canvas>
      <div className="absolute top-3 left-4 text-[11px] text-[var(--text-tertiary)] uppercase tracking-[.15em]">
        room view — <b className="text-[var(--accent)]">v</b> or click background: camera · <b className="text-[var(--accent)]">click the monitor</b> to take the desk
      </div>
    </div>
  );
}
