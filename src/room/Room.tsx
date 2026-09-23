import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useCursor, useGLTF } from "@react-three/drei";
import gsap from "gsap";
import type { ReactNode } from "react";

/*
 * navairgap OS — room v7 ("fresh start")
 * Loads the provided gaming-room GLB as-is (glTF is already Y-up — no rotation).
 * The monitor anchor, screen size, facing direction and camera placement are
 * ALL measured at runtime from the loaded model. Nothing is hardcoded.
 */

const MODEL_URL = "models/gaming_room.glb";
const MONITOR_NAME = "Cube.005_moniter1"; // main screen of the triple-monitor set

interface Measured {
  panelPos: THREE.Vector3;
  facing: THREE.Vector3;
  quat: THREE.Quaternion;
  w: number;          // screen width (m)
  h: number;          // screen height (m)
  depth: number;
  camPos: THREE.Vector3;
  lookAt: THREE.Vector3;
  near: number;
  far: number;
  roomCenter: THREE.Vector3;
}

/** measure the model; if the monitor's smallest axis is Y the model is
 *  Z-up tipped — apply a -90° X fix and re-measure once. */
function useMeasurements(gltf: { scene: THREE.Group }, rotFix: number, setRotFix: (r: number) => void) {
  const [m, setM] = useState<Measured | null>(null);
  useEffect(() => {
    const scene = gltf.scene;
    scene.rotation.set(rotFix, 0, 0);
    scene.updateMatrixWorld(true);

    const all = new THREE.Box3().setFromObject(scene);
    const mon = scene.getObjectByName(MONITOR_NAME);
    if (!mon) { console.warn("monitor node not found:", MONITOR_NAME); return; }
    const mb = new THREE.Box3().setFromObject(mon);

    const monCenter = mb.getCenter(new THREE.Vector3());
    const monSize = mb.getSize(new THREE.Vector3());
    const roomCenter = all.getCenter(new THREE.Vector3());
    const roomSize = all.getSize(new THREE.Vector3());

    // screen plane = the two LARGEST axes of the monitor box; smallest = depth
    const dims: Array<[number, number]> = ([
      [monSize.x, 0], [monSize.y, 1], [monSize.z, 2],
    ] as Array<[number, number]>).sort((a, b) => b[0] - a[0]);
    const [w, wAxis] = dims[0];
    const [h, hAxis] = dims[1];
    const [depth, dAxis] = dims[2];

    // if the smallest axis is Y, the model is tipped → fix and re-measure
    if (dAxis === 1 && rotFix === 0) { setRotFix(-Math.PI / 2); return; }

    // facing: along the depth axis, toward the room interior
    const facing = new THREE.Vector3();
    facing.setComponent(dAxis, 1);
    if (facing.dot(roomCenter.clone().sub(monCenter)) < 0) facing.negate();

    const panelPos = monCenter.clone().add(facing.clone().multiplyScalar(depth / 2 + 0.002));

    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(new THREE.Vector3(), facing.clone(), up)
    );

    const dist = Math.max(w, h) * 2.4;
    const camPos = panelPos.clone().add(facing.clone().multiplyScalar(dist)).add(new THREE.Vector3(0, dist * 0.12, 0));
    const maxDim = Math.max(roomSize.x, roomSize.y, roomSize.z);

    setM({ panelPos, facing, quat, w, h, depth, camPos, lookAt: panelPos.clone(), near: maxDim * 0.01, far: maxDim * 12, roomCenter });
  }, [gltf.scene, rotFix, setRotFix]);
  return m;
}

function Model({ gltf, night }: { gltf: { scene: THREE.Group }; night: boolean }) {
  useMemo(() => {
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat?.map) { mat.map.anisotropy = 8; mat.map.colorSpace = THREE.SRGBColorSpace; }
      }
    });
  }, [gltf.scene]);
  return <primitive object={gltf.scene} />;
}

function Lights({ night }: { night: boolean }) {
  return (
    <>
      <ambientLight intensity={night ? 0.35 : 0.85} color={night ? "#4a4460" : "#ffffff"} />
      <hemisphereLight args={night ? ["#3a3450", "#14141c", 0.5] : ["#eef1ff", "#a89f8d", 0.9]} />
      <directionalLight position={[4, 6, 3]} intensity={night ? 0.15 : 0.7} color="#fff4e4" />
      {/* neon accents, kept away from surfaces */}
      <pointLight position={[0, 2.2, 0]} color="#8b5cff" intensity={night ? 0.6 : 0} distance={8} decay={2} />
      <pointLight position={[-2, 1.4, 2]} color="#ff2bd6" intensity={night ? 0.4 : 0} distance={6} decay={2} />
    </>
  );
}

function OSMonitor({ m, onZoomStart, entering, children }: { m: Measured; onZoomStart: () => void; entering: boolean; children: ReactNode }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as { enabled: boolean } | null;

  const click = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (entering) return;
    onZoomStart();
    if (controls) controls.enabled = false;
    const close = m.panelPos.clone().add(m.facing.clone().multiplyScalar(m.h * 1.4));
    gsap.to(camera.position, { x: close.x, y: close.y, z: close.z, duration: 1.5, ease: "power3.inOut" });
    gsap.to(camera, { fov: 30, duration: 1.5, ease: "power3.inOut",
      onUpdate: () => (camera as THREE.PerspectiveCamera).updateProjectionMatrix() });
  };

  return (
    <group position={m.panelPos} quaternion={m.quat}>
      <mesh position={[0, 0, 0.001]}
        onClick={click}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}>
        <planeGeometry args={[m.w + m.w * 0.15, m.h + m.h * 0.15]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* backlight */}
      <mesh position={[0, 0, -0.001]}>
        <planeGeometry args={[m.w, m.h]} />
        <meshBasicMaterial color="#0b1220" />
      </mesh>
      {/* the OS */}
      <Html transform position={[0, 0, 0.004]} scale={m.w / 2048} zIndexRange={[16777271, 0]}>
        <div style={{ width: 2048, height: Math.round(2048 * (m.h / m.w)), overflow: "hidden",
                      background: "#000", position: "relative", pointerEvents: "auto" }}>
          {children}
          <div style={{ position: "absolute", top: 8, right: 14, color: "#2fbf71", font: "700 22px monospace",
                        zIndex: 99999, pointerEvents: "none" }}>● OS</div>
        </div>
      </Html>
      {/* soft glow onto the desk */}
      <pointLight position={[0, -m.h * 0.4, m.depth]} color="#9db8ff" intensity={0.5} distance={m.w * 4} decay={2} />
    </group>
  );
}

export default function Room({ onEnter, children }: { onEnter: () => void; children: ReactNode }) {
  const gltf = useGLTF(MODEL_URL);
  const [rotFix, setRotFix] = useState(0);
  const [night, setNight] = useState(false); // default: fully lit
  const [entering, setEntering] = useState(false);
  const [fade, setFade] = useState(false);
  const m = useMeasurements(gltf, rotFix, setRotFix);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "l" && !entering) setNight((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entering]);

  const zoom = () => { setEntering(true); setFade(true); window.setTimeout(onEnter, 520); };

  return (
    <div className={`fixed inset-0 z-[120] transition-opacity duration-500 ${fade ? "opacity-0 pointer-events-none" : "opacity-100"}`}
         style={{ background: night ? "#0a0912" : "#1a1a20" }}>
      <Canvas dpr={[1, 1.5]} gl={{ antialias: true, toneMappingExposure: 1.05 }}
              camera={{ fov: 55, near: m ? m.near : 0.01, far: m ? m.far : 100,
                        position: m ? m.camPos : [1, 1, 2] }}>
        <color attach="background" args={[night ? "#0a0912" : "#1a1a20"]} />
        <Lights night={night} />
        <Model gltf={gltf} night={night} />
        {m && <OSMonitor m={m} onZoomStart={zoom} entering={entering}>{children}</OSMonitor>}
        {m && (
          <OrbitControls makeDefault target={m.lookAt.toArray() as [number, number, number]}
            minDistance={m.h} maxDistance={Math.max(m.w, m.h) * 8}
            minPolarAngle={0.35} maxPolarAngle={Math.PI / 1.9}
            enablePan={false} enableDamping dampingFactor={0.08} />
        )}
      </Canvas>

      {!entering && (
        <button onClick={() => setNight((v) => !v)}
          className="absolute top-5 right-5 z-10 flex items-center gap-2 px-4 py-2.5 rounded-full border border-[rgba(139,92,255,.5)] bg-[rgba(12,10,22,.8)] backdrop-blur-md text-sm text-[#d9d4ff] hover:bg-[rgba(30,24,55,.9)] transition-colors cursor-pointer">
          <span className="text-base">{night ? "🌙" : "☀️"}</span>{night ? "mood lights" : "bright"}
        </button>
      )}
      {!entering && (
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full border border-[rgba(139,92,255,.35)] bg-[rgba(10,8,18,.72)] backdrop-blur-md text-[12px] tracking-wide text-[#b9b2ff] select-none">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8b5cff] animate-pulse" />
          drag to look · click the main monitor to enter · L toggles lights · R to skip
        </div>
      )}
    </div>
  );
}
