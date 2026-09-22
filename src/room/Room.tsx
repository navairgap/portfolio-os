import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useWindows } from "../store/useWindowStore";
import { useSettings } from "../store/useSettingsStore";
import { WALLPAPERS } from "../data/wallpapers";
import { APPS } from "../registry/appRegistry";

const MODEL_URL = (import.meta as any).env?.BASE_URL + "models/room2.glb";

/* ---- live OS preview (read-only) ---- */
function ScreenPreview({ onEnter }: { onEnter: () => void }) {
  const { windows, activeWorkspace } = useWindows();
  const s = useSettings();
  const wp = WALLPAPERS[s.wallpaper] || WALLPAPERS[0];
  const VW = 1024, VH = 768;
  const clock = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return (
    <div onClick={onEnter} title="click to take the desk"
      style={{ width: VW, height: VH, background: "#000", color: "#e6e6e6", fontFamily: "JetBrains Mono, monospace", position: "relative", overflow: "hidden", cursor: "pointer" }}>
      <div style={{ position: "absolute", inset: 0, background: wp.css.includes("gradient") ? "#0a0a0c" : "#050507" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 22, background: "rgba(5,5,7,.85)", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 10, padding: "0 10px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>
        <span style={{ color: "#ff2b2b" }}>█</span>
        <span style={{ color: "rgba(230,230,230,.4)" }}>[ workspace {activeWorkspace + 1} ]</span>
        <span style={{ marginLeft: "auto", color: "#00ff9c" }}>{clock}</span>
      </div>
      {windows.filter((w) => w.workspaceId === activeWorkspace && !w.isMinimized).map((w) => {
        const app = APPS.find((a) => a.id === w.appId);
        return (
          <div key={w.id} style={{
            position: "absolute", left: (w.x / innerWidth) * VW * 0.8 + 20, top: (w.y / innerHeight) * VH * 0.7 + 26,
            width: Math.max(80, (w.width / innerWidth) * VW * 0.62), height: Math.max(56, (w.height / innerHeight) * VH * 0.6),
            background: "#0b0b0e", border: `1px solid ${w.isFocused ? "#ff2b2b" : "rgba(255,255,255,.12)"}`, borderLeft: `3px solid ${w.isFocused ? "#ff2b2b" : "rgba(255,255,255,.2)"}`,
          }}>
            <div style={{ height: 18, background: "#131317", borderBottom: "1px solid rgba(255,255,255,.04)", fontSize: 10, padding: "2px 6px", textTransform: "uppercase", letterSpacing: ".06em", color: w.isFocused ? "#ff2b2b" : "rgba(230,230,230,.4)" }}>{app?.title || w.title}</div>
            <div style={{ padding: 6, fontSize: 10, color: "rgba(230,230,230,.35)" }}>{w.appId === "terminal" ? "navairgap@blackarch:~$ █" : ""}</div>
          </div>
        );
      })}
      {!windows.length && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 13, color: "rgba(230,230,230,.35)" }}>desktop idle — click to take the desk</div>}
      <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "rgba(255,43,43,.8)", textTransform: "uppercase", letterSpacing: ".2em" }}>click to take control</div>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 3px)" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: "inset 0 0 60px rgba(0,0,0,.55)" }} />
    </div>
  );
}

/* ---- find the flat screen panel + chair at runtime ---- */
function findScreen(scene: THREE.Object3D) {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3(), v = new THREE.Vector3(), s = new THREE.Vector3();
  let screen: THREE.Mesh | null = null, chair: THREE.Object3D | null = null, chairH = 0;
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    box.setFromObject(m); box.getSize(s); box.getCenter(v);
    const thin = Math.min(s.x, s.y, s.z);
    const area = Math.max(s.x, s.y, s.z) * (s.x + s.y + s.z - Math.min(s.x, s.y, s.z) - thin);
    if (thin < 0.03 && Math.max(s.x, s.z) > 0.3 && v.y > 0.4) { if (!screen || area > 0) screen = m; }
    if (s.y > chairH && s.y > 0.7 && s.y < 1.4) { chairH = s.y; chair = m; }
  });
  if (!screen) return null;
  box.setFromObject(screen as THREE.Mesh);
  const c = box.getCenter(new THREE.Vector3());
  const sz = box.getSize(new THREE.Vector3());
  const thinAxis = sz.x < sz.y && sz.x < sz.z ? "x" : sz.y < sz.z ? "y" : "z";
  const perp = thinAxis === "x" ? "x" : thinAxis === "y" ? "y" : "z";
  const w = perp === "x" ? sz.z : sz.x, h = perp === "y" ? sz.z : sz.y;
  const chairC = chair ? new THREE.Box3().setFromObject(chair).getCenter(new THREE.Vector3()) : new THREE.Vector3(c.x, c.y, c.z + 1.5);
  const front = new THREE.Vector3(chairC.x - c.x, 0, chairC.z - c.z).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), front);
  const pos = c.clone().addScaledVector(front, sz[thinAxis as "x" | "y" | "z"] / 2 + 0.003);
  return { pos, quat, w: Math.max(w, h) * 0.94, h: Math.min(w, h) * 0.94 };
}

function Scene({ onTick, onEnter, onReady }: any) {
  const { scene } = useGLTF(MODEL_URL);
  const { camera } = useThree();
  const [screen, setScreen] = useState<any>(null);
  const tick = useRef(0);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const c = box.getCenter(new THREE.Vector3());
    scene.position.set(-c.x, -box.min.y, -c.z);
    const sc = findScreen(scene);
    setScreen(sc);
    if (sc) {
      camera.position.set(sc.pos.x + sc.w * 0 + (sc.quat ? 0 : 0) + (sc.pos.x * 0.4), sc.pos.y + 0.35, sc.pos.z + 1.6);
      camera.lookAt(sc.pos.x, sc.pos.y, sc.pos.z);
    } else {
      camera.position.set(2.2, 1.8, 2.2);
      camera.lookAt(0, 0.9, 0);
    }
    onReady?.(!!sc);
  }, [scene, camera, onReady]);

  useFrame(() => { tick.current++; if (tick.current % 20 === 0) onTick?.(tick.current); });
  return (<>
    <primitive object={scene} />
    {screen && (
      <group position={screen.pos.toArray()} quaternion={screen.quat}>
        <mesh><planeGeometry args={[screen.w, screen.h]} /><meshBasicMaterial color="#000" side={THREE.DoubleSide} /></mesh>
        <Html transform occlude position={[0, 0, 0.002]} scale={screen.w / 1024} zIndexRange={[10, 0]}>
          <ScreenPreview onEnter={onEnter} />
        </Html>
      </group>
    )}
  </>);
}
useGLTF.preload(MODEL_URL);

export default function Room({ onEnter }: { onEnter: () => void }) {
  const [ticks, setTicks] = useState(0);
  const [ready, setReady] = useState<string>("loading…");
  return (
    <div className="fixed inset-0 z-[120] bg-black flex flex-col">
      <Canvas dpr={1} camera={{ fov: 45, near: 0.05, far: 60 }} gl={{ antialias: true, powerPreference: "high-performance" }} onPointerMissed={() => {}}>
        <color attach="background" args={["#0b0b12"]} />
        <Suspense fallback={null}>
          <Scene onEnter={onEnter} onReady={(ok: boolean) => setReady(ok ? "screen mesh found" : "screen NOT found — plain view")} onTick={(t: number) => setTicks(t)} />
        </Suspense>
        <ambientLight intensity={1.1} />
        <directionalLight position={[3, 5, 3]} intensity={2.0} />
        <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#8aa" />
      </Canvas>
      <div className="absolute top-3 left-4 text-[11px] uppercase tracking-[.15em] text-[var(--text-tertiary)] space-x-3">
        <span>office <b className="text-[var(--accent)]">room2</b></span>
        <span>frames: <b className="text-[var(--terminal-fg)]">{ticks}</b></span>
        <span>{ready}</span>
      </div>
      <div className="absolute top-3 right-4">
        <button onClick={onEnter} className="px-3 py-1 bg-[var(--accent)] text-black text-[11px] font-bold uppercase">take the desk (esc)</button>
      </div>
    </div>
  );
}
