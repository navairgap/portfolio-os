import { useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useCubeTexture, useCursor, useGLTF, useTexture } from "@react-three/drei";
import gsap from "gsap";
import type { ReactNode } from "react";

/*
 * Room environment: "Sooah's Room Portfolio" by Andrew Woan (MIT License)
 * https://github.com/andrewwoan/sooahs-room-folio
 * The baked Blender scene (day + night texture sets) is used as the
 * environment; the OS monitor, camera work and interactions are ours.
 */

const SECTIONS = ["First", "Second", "Third", "Fourth"] as const;
type Section = (typeof SECTIONS)[number];

const DAY: Record<Section, string> = {
  First: "textures/room/day/first_texture_set_day.webp",
  Second: "textures/room/day/second_texture_set_day.webp",
  Third: "textures/room/day/third_texture_set_day.webp",
  Fourth: "textures/room/day/fourth_texture_set_day.webp",
};
const NIGHT: Record<Section, string> = {
  First: "textures/room/night/first_texture_set_night.webp",
  Second: "textures/room/night/second_texture_set_night.webp",
  Third: "textures/room/night/third_texture_set_night.webp",
  Fourth: "textures/room/night/fourth_texture_set_night.webp",
};

/* desk-monitor anchor, derived from the model's Fourth (desk) section */
const DESK = { x: -0.816, y: 3.42, z: -3.02 }; // panel center, wall-mounted above the desk
const LOOK = { x: -0.816, y: 2.9, z: -3.3 };

function RoomModel({ lights }: { lights: boolean }) {
  const gltf = useGLTF("models/Room_Portfolio.glb", "draco/");
  const day = useTexture(DAY);
  const night = useTexture(NIGHT);

  useEffect(() => {
    for (const set of [day, night])
      for (const t of Object.values(set)) {
        t.flipY = false; // glTF UV convention
        t.colorSpace = THREE.SRGBColorSpace;
        t.needsUpdate = true;
      }
  }, [day, night]);

  useEffect(() => {
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const name = mesh.name;
      // interaction proxies + the author's name display are not scenery
      if (name.includes("Raycaster") || name.includes("Name_Letter") || name === "Screen") {
        mesh.visible = false;
        return;
      }
      const key = SECTIONS.find((s) => name.includes(s));
      if (key) {
        const tex = (lights ? day : night)[key];
        mesh.material = new THREE.MeshBasicMaterial({ map: tex });
      }
    });
  }, [gltf.scene, lights, day, night]);

  return <primitive object={gltf.scene} />;
}

function Skybox() {
  const scene = useThree((s) => s.scene);
  const env = useCubeTexture(["px.webp", "nx.webp", "py.webp", "ny.webp", "pz.webp", "nz.webp"], {
    path: "textures/skybox/",
  });
  useEffect(() => {
    env.colorSpace = THREE.SRGBColorSpace;
    scene.background = env;
  }, [env, scene]);
  return null;
}

/* ------------------------------------------------------------------ */
/* the monitor — your OS runs live inside it                           */
/* ------------------------------------------------------------------ */

function Monitor({ onZoomStart, entering, children }: { onZoomStart: () => void; entering: boolean; children: ReactNode }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as { enabled: boolean } | null;

  const click = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (entering) return;
    onZoomStart();
    if (controls) controls.enabled = false;
    gsap.to(camera.position, { x: DESK.x, y: DESK.y, z: DESK.z + 1.05, duration: 1.5, ease: "power3.inOut" });
    gsap.to(camera, {
      fov: 32, duration: 1.5, ease: "power3.inOut",
      onUpdate: () => (camera as THREE.PerspectiveCamera).updateProjectionMatrix(),
    });
  };

  return (
    <group position={[DESK.x, DESK.y, DESK.z]}>
      <group
        onClick={click}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        {/* slim bezel, wall-mounted over the desk */}
        <mesh>
          <boxGeometry args={[1.5, 0.92, 0.04]} />
          <meshStandardMaterial color="#0a0a0f" metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, -0.026]}>
          <boxGeometry args={[1.54, 0.96, 0.012]} />
          <meshStandardMaterial color="#000" emissive="#8b5cff" emissiveIntensity={1.6} />
        </mesh>
        {/* screen */}
        <mesh position={[0, 0, 0.021]}>
          <planeGeometry args={[1.42, 0.84]} />
          <meshBasicMaterial color="#010103" />
        </mesh>

        {/* the OS itself, running in the screen */}
        <Html transform position={[0, 0, 0.025]} scale={1.42 / 1024} zIndexRange={[30, 0]}>
          <div style={{ width: 1024, height: 592, overflow: "hidden", background: "#000", position: "relative" }}>
            {children}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 99999,
                          background: "repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 3px)" }} />
          </div>
        </Html>
      </group>

      {/* screen glow onto the desk area */}
      <pointLight position={[0, -0.2, 0.8]} color="#9db8ff" intensity={1.4} distance={4} decay={2} />
      <ambientLight intensity={0.5} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* the room                                                            */
/* ------------------------------------------------------------------ */

export default function Room({ onEnter, children }: { onEnter: () => void; children: ReactNode }) {
  const [entering, setEntering] = useState(false);
  const [fade, setFade] = useState(false);
  const [lights, setLights] = useState(false); // false = baked night set

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "l" && !entering) setLights((v) => !v);
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
      style={{ background: "#000" }}
    >
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [-0.816, 3.2, -0.9], fov: 55, near: 0.1, far: 60 }}
        gl={{ antialias: true, toneMappingExposure: 1.1 }}
      >
        <Skybox />
        <RoomModel lights={lights} />
        <Monitor onZoomStart={zoom} entering={entering}>{children}</Monitor>
        <OrbitControls
          makeDefault
          target={[LOOK.x, LOOK.y, LOOK.z]}
          minDistance={1.4}
          maxDistance={7}
          minPolarAngle={0.6}
          maxPolarAngle={1.65}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>

      {/* day/night toggle — deliberately impossible to miss */}
      {!entering && (
        <button
          onClick={() => setLights((v) => !v)}
          className="absolute top-5 right-5 z-10 flex items-center gap-2 px-4 py-2.5 rounded-full border border-[rgba(139,92,255,.5)] bg-[rgba(12,10,22,.8)] backdrop-blur-md text-sm text-[#d9d4ff] hover:bg-[rgba(30,24,55,.9)] transition-colors cursor-pointer"
        >
          <span className="text-base">{lights ? "🌙" : "☀️"}</span>
          {lights ? "night lights" : "day light"}
        </button>
      )}

      {!entering && (
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full border border-[rgba(139,92,255,.35)] bg-[rgba(10,8,18,.72)] backdrop-blur-md text-[12px] tracking-wide text-[#b9b2ff] select-none">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8b5cff] animate-pulse" />
          drag to look · click the monitor to enter · L or ☀️ toggles day/night · R to skip
        </div>
      )}
    </div>
  );
}
