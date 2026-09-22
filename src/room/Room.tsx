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
const CAM_POS = { x: 1.009028643133046, y: 0.5463638814987481, z: 0.4983449671971262 };
const CAM_ROT = { x: -0.8310687859940357, y: 0.9380973951104649, z: 0.7243388791233853 };

/* ---------- live OS preview ---------- */
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

/* ---------- mesh finding ---------- */
function analyze(scene: THREE.Object3D) {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3(), s = new THREE.Vector3(), v = new THREE.Vector3();
  let screen: THREE.Mesh | null = null, switchM: THREE.Mesh | null = null, book: THREE.Mesh | null = null;
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    if (/^Stand/.test(m.name) && !screen) screen = m;
    if (/^Switch/.test(m.name) && !switchM) switchM = m;
    if (/^Book/.test(m.name) && !book) book = m;
    box.setFromObject(m); box.getSize(s); box.getCenter(v);
    if (!screen && Math.min(s.x, s.y, s.z) < 0.03 && Math.max(s.x, s.z) > 0.3 && v.y > 0.3) screen = m;
  });
  const out: any = {};
  if (switchM) { const b = new THREE.Box3().setFromObject(switchM as THREE.Mesh); out.switchBox = { pos: b.getCenter(new THREE.Vector3()), size: b.getSize(new THREE.Vector3()) }; }
  if (book) { const b = new THREE.Box3().setFromObject(book as THREE.Mesh); out.bookBox = { pos: b.getCenter(new THREE.Vector3()), size: b.getSize(new THREE.Vector3()) }; }
  if (screen) {
    box.setFromObject(screen as THREE.Mesh);
    const c = box.getCenter(new THREE.Vector3());
    const sz = box.getSize(new THREE.Vector3());
    const thinAxis = sz.x <= sz.y && sz.x <= sz.z ? "x" : sz.y <= sz.z ? "y" : "z";
    const front = new THREE.Vector3(CAM_POS.x - c.x, 0, CAM_POS.z - c.z).normalize();
    const perp = new THREE.Vector3(-front.z, 0, front.x);
    out.screen = {
      pos: c.clone().addScaledVector(front, ((sz as any)[thinAxis]) / 2 + 0.006),
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), front),
      w: (Math.abs(sz.x * perp.x) + Math.abs(sz.z * perp.z)) * 0.96,
      h: sz.y * 0.96,
      center: c, front,
    };
  }
  return out;
}

/* ---------- scene ---------- */
function Scene({ onEnter, onTick, onToggleLights, onFocusBook, lightsOn, focus, setFocus }: any) {
  const { scene } = useGLTF(MODEL_URL);
  const ticks = useRef(0);
  const info = useMemo(() => analyze(scene), [scene]);

  useEffect(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      if (m.name !== 'Wall') { m.castShadow = true; m.receiveShadow = true; }
    });
  }, [scene]);

  useFrame(() => { ticks.current++; if (ticks.current % 15 === 0) onTick(ticks.current); });

  const stop = (e: ThreeEvent<MouseEvent>) => e.stopPropagation();

  return (<>
    <primitive object={scene} />
    {info.screen && (
      <group position={info.screen.pos.toArray()} quaternion={info.screen.quat}>
        <mesh onClick={(e) => { stop(e); focus("screen"); }} onPointerOver={(e) => { stop(e); document.body.style.cursor = "pointer"; }} onPointerOut={() => (document.body.style.cursor = "")}>
          <planeGeometry args={[info.screen.w, info.screen.h]} />
          <meshBasicMaterial color="#000" side={THREE.DoubleSide} />
        </mesh>
        <Html transform position={[0, 0, 0.01]} scale={info.screen.w / 1024}>
          <ScreenPreview onEnter={onEnter} />
        </Html>
      </group>
    )}
    {info.switchBox && (
      <mesh position={info.switchBox.pos.toArray()} onClick={(e) => { stop(e); onToggleLights(); }} onPointerOver={(e) => { stop(e); document.body.style.cursor = "pointer"; }} onPointerOut={() => (document.body.style.cursor = "")}>
        <boxGeometry args={[Math.max(0.06, info.switchBox.size.x * 1.4), Math.max(0.06, info.switchBox.size.y * 1.4), Math.max(0.06, info.switchBox.size.z * 1.4)]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    )}
    {info.bookBox && (
      <mesh position={info.bookBox.pos.toArray()} onClick={(e) => { stop(e); onFocusBook(info.bookBox.pos); }} onPointerOver={(e) => { stop(e); document.body.style.cursor = "pointer"; }} onPointerOut={() => (document.body.style.cursor = "")}>
        <boxGeometry args={[Math.max(0.12, info.bookBox.size.x * 1.2), Math.max(0.08, info.bookBox.size.y * 1.2), Math.max(0.12, info.bookBox.size.z * 1.2)]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    )}
    <Lights lightsOn={lightsOn} />
  </>);
}

function Lights({ lightsOn }: { lightsOn: boolean }) {
  const amb = useRef<THREE.AmbientLight>(null);
  const dir = useRef<THREE.DirectionalLight>(null);
  useFrame(() => {
    if (amb.current) amb.current.intensity += ((lightsOn ? 0.7 : 0.18) - amb.current.intensity) * 0.08;
    if (dir.current) dir.current.intensity += ((lightsOn ? 1.6 : 0.3) - dir.current.intensity) * 0.08;
  });
  return (<>
    <ambientLight ref={amb} intensity={0.7} />
    <directionalLight ref={dir} position={[3, 5, 3]} intensity={1.6} />
    <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#8aa" />
  </>);
}
useGLTF.preload(MODEL_URL);

/* ---------- camera control ---------- */
function CameraRig({ controls, focus, focusPos, focusTarget, onEnter, onReset }: any) {
  const { camera } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const fly = (pos: THREE.Vector3, look: THREE.Vector3, done?: () => void) => {
    dummy.position.copy(pos); dummy.lookAt(look);
    const c = controls.current;
    if (c) c.enabled = false;
    gsap.to(camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: 1.5, ease: "power3.inOut" });
    gsap.to(camera.rotation, { x: dummy.rotation.x, y: dummy.rotation.y, z: dummy.rotation.z, duration: 1.5, ease: "power3.inOut", onUpdate: () => c?.update(), onComplete: () => { if (c) c.enabled = true; done?.(); } });
  };
  useEffect(() => {
    if (focus === "screen" && focusPos) fly(focusPos.pos, focusPos.look, onEnter);
    else if (focus === "book" && focusPos) fly(focusPos.pos, focusPos.look);
    else if (focus === "reset") { camera.position.set(2.2, 1.6, 2.2); gsap.to(camera.position, { ...CAM_POS, duration: 1.5, ease: "power3.inOut" }); gsap.to(camera.rotation, { ...CAM_ROT, duration: 1.5, ease: "power3.inOut", onUpdate: () => controls.current?.update() }); onReset(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);
  return null;
}

export default function Room({ onEnter }: { onEnter: () => void }) {
  const [ticks, setTicks] = useState(0);
  const [lightsOn, setLightsOn] = useState(true);
  const [focus, setFocus] = useState<string>("");
  const [focusPos, setFocusPos] = useState<any>(null);
  const controls = useRef<any>(null);
  const settings = useSettings();

  const focusScreen = () => {
    // computed lazily from the live scene via a custom event into CameraRig's target
    const el = document.querySelector("canvas");
    // ask Scene for screen data through window bridge set below
    const sc = (window as any).__screenInfo;
    if (!sc) return onEnter();
    setFocusPos({ pos: sc.pos.clone().addScaledVector(sc.front, 0.34).add(new THREE.Vector3(0, 0.02, 0)), look: sc.center });
    setFocus("screen");
  };
  useEffect(() => { (window as any).__focusScreen = focusScreen; }, [focusScreen]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onEnter(); };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, [onEnter]);

  return (
    <div className="fixed inset-0 z-[120] bg-black flex flex-col">
      <Canvas shadows="soft" dpr={[1, 1.5]} camera={{ fov: 75, near: 0.01, far: 1000, position: [2.2, 1.6, 2.2] }} gl={{ antialias: true }} onPointerMissed={() => {}}>
        <Suspense fallback={null}>
          <SceneBridge
            onTick={(t: number) => setTicks(t)}
            onEnter={onEnter}
            focus={focus}
            setFocus={setFocus}
            lightsOn={lightsOn}
            onToggleLights={() => setLightsOn((v) => !v)}
            onFocusBook={(pos: THREE.Vector3) => { setFocusPos({ pos: pos.clone().add(new THREE.Vector3(0.05, 0.42, 0.28)), look: pos.clone() }); setFocus("book"); }}
          />
        </Suspense>
        <CameraRig controls={controls} focus={focus} focusPos={focusPos} onEnter={onEnter} onReset={() => setFocus("")} />
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
        <span><b className="text-[var(--accent)]">drag</b> look · <b className="text-[var(--accent)]">scroll</b> zoom</span>
        <span>frames: <b className="text-[var(--terminal-fg)]">{ticks}</b></span>
      </div>
      <div className="absolute top-3 right-4 flex gap-2">
        <button onClick={() => setLightsOn((v) => !v)} className={`px-3 py-1 text-[11px] font-bold uppercase border ${lightsOn ? "bg-[#fbbf24] text-black border-[#fbbf24]" : "text-[#fbbf24] border-[#fbbf24]"}`}>light {lightsOn ? "on" : "off"}</button>
        <button onClick={() => { setFocus("reset"); }} className="px-3 py-1 border border-[var(--border-strong)] text-[var(--text-secondary)] text-[11px] uppercase">reset view</button>
        <button onClick={onEnter} className="px-3 py-1 bg-[var(--accent)] text-black text-[11px] font-bold uppercase">take the desk (esc)</button>
      </div>
      <div className="absolute bottom-4 left-4 text-[10.5px] uppercase tracking-[.14em] text-[var(--text-tertiary)] pointer-events-none">
        click: monitor → zoom into os · light switch → lights · book → focus
      </div>
    </div>
  );
}

function SceneBridge({ onTick, onEnter, focus, setFocus, lightsOn, onToggleLights, onFocusBook }: any) {
  const { scene } = useGLTF(MODEL_URL);
  useEffect(() => {
    const info = analyze(scene);
    if (info.screen) (window as any).__screenInfo = info.screen;
  }, [scene]);
  return <Scene onTick={onTick} onEnter={onEnter} focus={focus} setFocus={setFocus} lightsOn={lightsOn} onToggleLights={onToggleLights} onFocusBook={onFocusBook} />;
}
