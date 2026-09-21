import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = (import.meta as any).env?.BASE_URL + "models/office-computer.glb";

// Atomic scene: model + ambient + one directional light + FIXED camera. Nothing else.
function Scene({ onReady, onTick, onEnter }: any) {
  const { scene } = useGLTF(MODEL_URL);
  const { camera } = useThree();
  const ready = useRef(false);

  useEffect(() => {
    // normalize: center XZ at origin, floor at y=0, scale so the model is ~2.4m wide
    const box = new THREE.Box3().setFromObject(scene);
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const scale = 2.4 / Math.max(size.x, size.z);
    scene.scale.setScalar(scale);
    scene.position.set(-c.x * scale, -box.min.y * scale, -c.z * scale);
    // fixed camera: 3m out, 1.8m up, looking at model center (0, ~1, 0)
    camera.position.set(2.6, 1.9, 2.6);
    camera.lookAt(0, 0.9, 0);
    scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.frustumCulled = false; });
    ready.current = true;
    onReady?.(size, scale);
  }, [scene, camera, onReady]);

  useFrame(() => { if (ready.current) onTick?.(); });
  return <primitive object={scene} />;
}
useGLTF.preload(MODEL_URL);

export default function Room({ onEnter }: { onEnter: () => void }) {
  const [ticks, setTicks] = useState(0);
  const [meta, setMeta] = useState<string>("loading…");
  const [failed, setFailed] = useState<string | null>(null);
  const tickRef = useRef(0);
  const lastUi = useRef(0);

  return (
    <div className="fixed inset-0 z-[120] bg-black flex flex-col">
      <Canvas
        dpr={1}
        camera={{ fov: 45, near: 0.05, far: 60 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={() => setMeta((m) => m + " · gl ok")}
        onPointerMissed={() => {}}
        onError={(e: any) => setFailed(String(e?.message || e))}
      >
        <color attach="background" args={["#141420"]} />
        <Suspense fallback={null}>
          <Scene
            onReady={(size: any, scale: number) => setMeta(`model ${size.x.toFixed(0)}×${size.y.toFixed(0)}×${size.z.toFixed(0)} · scale ${scale.toFixed(4)}`)}
            onTick={() => {
              tickRef.current++;
              const now = performance.now();
              if (now - lastUi.current > 500) { lastUi.current = now; setTicks(tickRef.current); }
            }}
          />
        </Suspense>
        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 5, 3]} intensity={2.2} />
        <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#8aa" />
      </Canvas>
      <div className="absolute top-3 left-4 text-[11px] uppercase tracking-[.15em] text-[var(--text-tertiary)] space-x-3">
        <span>office <b className="text-[var(--accent)]">atomic build</b></span>
        <span>frames: <b className="text-[var(--terminal-fg)]">{ticks}</b></span>
        <span>{meta}</span>
      </div>
      <div className="absolute top-3 right-4 flex gap-2">
        <button onClick={onEnter} className="px-3 py-1 bg-[var(--accent)] text-black text-[11px] font-bold uppercase">take the desk (esc)</button>
      </div>
      {failed && (
        <div className="absolute inset-x-0 bottom-16 text-center text-[var(--accent)] text-[12px] font-mono">canvas error: {failed}</div>
      )}
    </div>
  );
}
