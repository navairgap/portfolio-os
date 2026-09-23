import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useCursor, useGLTF } from "@react-three/drei";
import gsap from "gsap";
import type { ReactNode } from "react";

/*
 * navairgap OS — room v6
 * Environment: "Gaming Room" GLB (embedded textures, no draco, no external files).
 * OS runs live on the main monitor; click to zoom into fullscreen.
 * Verified anchors below were extracted from the GLB's own vertex bounds —
 * every number is measured from the model, not guessed.
 */

const MODEL_URL = "models/gaming_room.glb";

/* measured from the GLB (bounds midpoint, cm → m, Z-up → Y-up) */
const MONITOR_POS: [number, number, number] = [-0.009, 0.567, 0.2015]; // main screen center, faces -z
const SCREEN_W = 0.139;
const SCREEN_H = 0.083;
const CAM_START: [number, number, number] = [0.42, 0.62, 0.62];
const LOOK_AT: [number, number, number] = [0, 0.45, 0.14];

/* ------------------------------------------------------------------ */
/* the model                                                           */
/* ------------------------------------------------------------------ */

function GamingRoom({ night }: { night: boolean }) {
  const gltf = useGLTF(MODEL_URL);
  useMemo(() => {
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat && mat.map) {
          mat.map.anisotropy = 8;
          mat.map.colorSpace = THREE.SRGBColorSpace;
        }
      }
    });
  }, [gltf.scene]);
  // natural scale; Z-up converted to Y-up by the -PI/2 X rotation
  return <primitive object={gltf.scene} rotation={[-Math.PI / 2, 0, 0]} />;
}

/* ------------------------------------------------------------------ */
/* the OS on the main monitor                                          */
/* ------------------------------------------------------------------ */

function OSMonitor({ onZoomStart, entering, children }: { onZoomStart: () => void; entering: boolean; children: ReactNode }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as { enabled: boolean } | null;

  const click = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (entering) return;
    onZoomStart();
    if (controls) controls.enabled = false;
    gsap.to(camera.position, { x: MONITOR_POS[0], y: MONITOR_POS[1], z: MONITOR_POS[2] - 0.16, duration: 1.5, ease: "power3.inOut" });
    gsap.to(camera, {
      fov: 26, duration: 1.5, ease: "power3.inOut",
      onUpdate: () => (camera as THREE.PerspectiveCamera).updateProjectionMatrix(),
    });
  };

  return (
    <group position={MONITOR_POS}>
      {/* invisible click plane flush over the model's screen */}
      <mesh
        position={[0, 0, -0.001]}
        onClick={click}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[SCREEN_W + 0.02, SCREEN_H + 0.02]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* screen backlight (never a black void) */}
      <mesh position={[0, 0, -0.002]}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        <meshBasicMaterial color="#0b1220" />
      </mesh>
      {/* the OS, live */}
      <Html transform position={[0, 0, -0.004]} scale={SCREEN_W / 2048} zIndexRange={[16777271, 0]}>
        <div style={{ width: 2048, height: 1226, overflow: "hidden", background: "#000", position: "relative", pointerEvents: "auto" }}>
          {children}
          <div style={{ position: "absolute", top: 8, right: 14, color: "#2fbf71", font: "700 22px monospace", zIndex: 99999, pointerEvents: "none" }}>● OS</div>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 99999,
                        background: "repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 3px)" }} />
        </div>
      </Html>
      {/* glow onto the desk */}
      <pointLight position={[0, -0.06, -0.12]} color="#9db8ff" intensity={0.35} distance={0.5} decay={2} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* lights — the model's textures are pre-lit; we add mood              */
/* ------------------------------------------------------------------ */

function MoodLights({ night }: { night: boolean }) {
  return (
    <>
      <ambientLight intensity={night ? 0.22 : 0.5} color={night ? "#2a2440" : "#ffffff"} />
      <hemisphereLight args={night ? ["#2a2440", "#0c0c10", 0.4] : ["#e8ecff", "#9a917f", 0.7]} />
      <pointLight position={[0.3, 0.75, 0.2]} color="#fff2df" intensity={night ? 0.12 : 0.9} distance={3} decay={2} />
      {/* purple accents for the neon vibe */}
      <pointLight position={[0, 0.6, 0.0]} color="#8b5cff" intensity={night ? 0.5 : 0.05} distance={1.2} decay={2} />
      <pointLight position={[-0.3, 0.4, 0.3]} color="#ff2bd6" intensity={night ? 0.35 : 0.03} distance={1} decay={2} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* the room                                                            */
/* ------------------------------------------------------------------ */

export default function Room({ onEnter, children }: { onEnter: () => void; children: ReactNode }) {
  const [entering, setEntering] = useState(false);
  const [fade, setFade] = useState(false);
  const [night, setNight] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "l" && !entering) setNight((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entering]);

  const zoom = () => {
    setEntering(true);
    setFade(true);
    window.setTimeout(onEnter, 520);
  };

  return (
    <div
      className={`fixed inset-0 z-[120] transition-opacity duration-500 ${fade ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      style={{ background: night ? "#07060c" : "#b8b4aa" }}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: CAM_START, fov: 55, near: 0.01, far: 20 }}
        gl={{ antialias: true, toneMappingExposure: 1.05 }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color(night ? "#07060c" : "#b8b4aa");
          scene.fog = new THREE.Fog(night ? "#07060c" : "#b8b4aa", 2.5, 7);
        }}
      >
        <MoodLights night={night} />
        <GamingRoom night={night} />
        <OSMonitor onZoomStart={zoom} entering={entering}>{children}</OSMonitor>
        <OrbitControls
          makeDefault
          target={LOOK_AT}
          minDistance={0.25}
          maxDistance={1.1}
          minPolarAngle={0.6}
          maxPolarAngle={1.62}
          minAzimuthAngle={-Math.PI / 2.4}
          maxAzimuthAngle={Math.PI / 2.4}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>

      {!entering && (
        <button
          onClick={() => setNight((v) => !v)}
          className="absolute top-5 right-5 z-10 flex items-center gap-2 px-4 py-2.5 rounded-full border border-[rgba(139,92,255,.5)] bg-[rgba(12,10,22,.8)] backdrop-blur-md text-sm text-[#d9d4ff] hover:bg-[rgba(30,24,55,.9)] transition-colors cursor-pointer"
        >
          <span className="text-base">{night ? "🌙" : "☀️"}</span>
          {night ? "night" : "day"}
        </button>
      )}

      {!entering && (
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full border border-[rgba(139,92,255,.35)] bg-[rgba(10,8,18,.72)] backdrop-blur-md text-[12px] tracking-wide text-[#b9b2ff] select-none">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8b5cff] animate-pulse" />
          drag to look · click the center monitor to enter · L toggles mood · R to skip
        </div>
      )}
    </div>
  );
}
