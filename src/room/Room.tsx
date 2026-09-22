import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useWindows } from "../store/useWindowStore";
import { useSettings } from "../store/useSettingsStore";
import { WALLPAPERS } from "../data/wallpapers";
import { APPS } from "../registry/appRegistry";

const MODEL_URL = (import.meta as any).env?.BASE_URL + "models/room2.glb";
// camera + control values tuned to this exact room.glb (study of a working build)
const CAM_POS = { x: 1.009028643133046, y: 0.5463638814987481, z: 0.4983449671971262 };

/* ---------- live OS preview on the CRT ---------- */
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

/* ---------- find screen panel (name-then-heuristic) ---------- */
function findScreen(scene: THREE.Object3D) {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3(), s = new THREE.Vector3(), v = new THREE.Vector3();
  let byName: THREE.Mesh | null = null, byShape: THREE.Mesh | null = null;
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    if (/Cube\.002/.test(m.name)) byName = m;
    box.setFromObject(m); box.getSize(s); box.getCenter(v);
    const thin = Math.min(s.x, s.y, s.z);
    if (thin < 0.03 && Math.max(s.x, s.z) > 0.3 && v.y > 0.3 && !byShape) byShape = m;
  });
  const screen = byName || byShape;
  if (!screen) return null;
  box.setFromObject(screen as THREE.Mesh);
  const c = box.getCenter(new THREE.Vector3());
  const sz = box.getSize(new THREE.Vector3());
  const thinAxis = sz.x <= sz.y && sz.x <= sz.z ? "x" : sz.y <= sz.z ? "y" : "z";
  // front: toward the default camera position (user side)
  const front = new THREE.Vector3(CAM_POS.x - c.x, 0, CAM_POS.z - c.z).normalize();
  const perp = new THREE.Vector3(-front.z, 0, front.x);
  const w = Math.abs(sz.x * perp.x) + Math.abs(sz.z * perp.z);
  const h = sz.y;
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), front);
  const pos = c.clone().addScaledVector(front, (sz[thinAxis as "x" | "y" | "z"] as number) / 2 + 0.006);
  return { pos, quat, w: w * 0.96, h: h * 0.96 };
}

/* ---------- scene ---------- */
function FlyIn({ controls }: { controls: any }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(2.2, 1.6, 2.2);
    gsap.to(camera.position, { ...CAM_POS, duration: 1.6, ease: "power3.out", onUpdate: () => controls.current?.update() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function Scene({ onEnter, onTick }: { onEnter: () => void; onTick: (n: number) => void }) {
  const { scene } = useGLTF(MODEL_URL);
  const ticks = useRef(0);
  const screen = useMemo(() => findScreen(scene), [scene]);

  useFrame(() => { ticks.current++; if (ticks.current % 15 === 0) onTick(ticks.current); });

  const clickScreen = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onEnter(); };

  return (<>
    <primitive object={scene} />
    {screen && (
      <group position={screen.pos.toArray()} quaternion={screen.quat}>
        <mesh onClick={clickScreen} onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }} onPointerOut={() => (document.body.style.cursor = "")}>
          <planeGeometry args={[screen.w, screen.h]} />
          <meshBasicMaterial color="#000" side={THREE.DoubleSide} />
        </mesh>
        <Html transform position={[0, 0, 0.01]} scale={screen.w / 1024}>
          <ScreenPreview onEnter={onEnter} />
        </Html>
      </group>
    )}
    <ambientLight intensity={0.7} />
    <directionalLight position={[3, 5, 3]} intensity={1.6} />
    <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#8aa" />
  </>);
}
useGLTF.preload(MODEL_URL);

export default function Room({ onEnter }: { onEnter: () => void }) {
  const [ticks, setTicks] = useState(0);
  const controls = useRef<any>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onEnter(); };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, [onEnter]);

  return (
    <div className="fixed inset-0 z-[120] bg-black flex flex-col">
      <Canvas shadows="soft" dpr={[1, 1.5]} camera={{ fov: 75, near: 0.01, far: 1000, position: [2.2, 1.6, 2.2] }} gl={{ antialias: true }} onPointerMissed={() => {}}>
        <Suspense fallback={null}>
          <Scene onEnter={onEnter} onTick={(t) => setTicks(t)} />
        </Suspense>
        <FlyIn controls={controls} />
        <OrbitControls
          ref={controls}
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={0.9}
          maxDistance={1.6}
          minAzimuthAngle={0.2}
          maxAzimuthAngle={Math.PI * 0.78}
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
      <div className="absolute top-3 left-4 text-[11px] uppercase tracking-[.15em] text-[var(--text-tertiary)] space-x-3 pointer-events-none">
        <span>office <b className="text-[var(--accent)]">drag to look · scroll to zoom</b></span>
        <span>frames: <b className="text-[var(--terminal-fg)]">{ticks}</b></span>
      </div>
      <div className="absolute top-3 right-4">
        <button onClick={onEnter} className="px-3 py-1 bg-[var(--accent)] text-black text-[11px] font-bold uppercase">take the desk (esc)</button>
      </div>
    </div>
  );
}
