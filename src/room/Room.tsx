import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useCubeTexture, useCursor, useGLTF, useTexture } from "@react-three/drei";
import gsap from "gsap";
import type { ReactNode } from "react";

/*
 * Experience adapted from "Sooah's Room Portfolio" by Andrew Woan (MIT License)
 * https://github.com/andrewwoan/sooahs-room-folio
 * Baked room scene, day/night shader, hover/click interaction system,
 * piano, sounds and music are ported from the original.
 * OS monitor, camera work and app integration are original to this repo.
 */

/* ================================================================== */
/* shaders (ported 1:1 from the original repo)                         */
/* ================================================================== */

const themeVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;
    gl_Position = projectionPosition;
    vUv = uv;
}
`;

const themeFragmentShader = /* glsl */ `
uniform sampler2D uDayTexture1;
uniform sampler2D uNightTexture1;
uniform sampler2D uDayTexture2;
uniform sampler2D uNightTexture2;
uniform sampler2D uDayTexture3;
uniform sampler2D uNightTexture3;
uniform sampler2D uDayTexture4;
uniform sampler2D uNightTexture4;
uniform float uMixRatio;
uniform int uTextureSet;
varying vec2 vUv;
void main() {
    vec3 dayColor;
    vec3 nightColor;
    if (uTextureSet == 1) {
        dayColor = texture2D(uDayTexture1, vUv).rgb;
        nightColor = texture2D(uNightTexture1, vUv).rgb;
    } else if (uTextureSet == 2) {
        dayColor = texture2D(uDayTexture2, vUv).rgb;
        nightColor = texture2D(uNightTexture2, vUv).rgb;
    } else if (uTextureSet == 3) {
        dayColor = texture2D(uDayTexture3, vUv).rgb;
        nightColor = texture2D(uNightTexture3, vUv).rgb;
    } else {
        dayColor = texture2D(uDayTexture4, vUv).rgb;
        nightColor = texture2D(uNightTexture4, vUv).rgb;
    }
    vec3 finalColor = mix(dayColor, nightColor, uMixRatio);
    finalColor = pow(finalColor, vec3(1.0 / 2.2));
    gl_FragColor = vec4(finalColor, 1.0);
}
`;

/* ================================================================== */
/* audio (ported behaviour, plain HTMLAudio)                           */
/* ================================================================== */

const SFX_CLICK = "audio/sfx/click/bubble.ogg";
const MUSIC = "audio/music/cosmic_candy.ogg";
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

let music: HTMLAudioElement | null = null;
let musicStarted = false;

function ensureMusic() {
  if (musicStarted) return;
  musicStarted = true;
  music = new Audio(MUSIC);
  music.loop = true;
  music.volume = 0.4;
  music.play().catch(() => { musicStarted = false; music = null; });
}

function duckMusic() { if (music) music.volume = 0.08; }
function restoreMusic() { if (music) music.volume = 0.4; }

function playSfx(url: string, volume = 0.5) {
  const a = new Audio(url);
  a.volume = volume;
  a.play().catch(() => {});
}

function playClick() { playSfx(SFX_CLICK, 0.35); }

function pianoUrl(index: number) {
  return `audio/sfx/piano/Key_${index}.ogg`;
}

/** "C1_Key_..." -> 1, "A#2_Key_..." -> 22 (chromatic C1=1 .. B2=24) */
function pianoIndexFromName(name: string): number | null {
  const m = name.match(/^([A-G]#?)(\d)_Key/);
  if (!m) return null;
  const semi = NOTE_NAMES.indexOf(m[1]);
  const octave = parseInt(m[2], 10);
  if (semi < 0) return null;
  return (octave - 1) * 12 + semi + 1;
}

/* ================================================================== */
/* shared                                                              */
/* ================================================================== */

type V3 = [number, number, number];
const DESK = { x: -0.816, y: 3.32, z: -3.28 };
const DESK_CAM: V3 = [-0.816, 3.1, -1.5];
const LOOK = { x: -0.816, y: 2.9, z: -3.3 };

const SECTION_KEYS = ["First", "Second", "Third", "Fourth"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

const DAY_URLS: Record<SectionKey, string> = {
  First: "textures/room/day/first_texture_set_day.webp",
  Second: "textures/room/day/second_texture_set_day.webp",
  Third: "textures/room/day/third_texture_set_day.webp",
  Fourth: "textures/room/day/fourth_texture_set_day.webp",
};
const NIGHT_URLS: Record<SectionKey, string> = {
  First: "textures/room/night/first_texture_set_night.webp",
  Second: "textures/room/night/second_texture_set_night.webp",
  Third: "textures/room/night/third_texture_set_night.webp",
  Fourth: "textures/room/night/fourth_texture_set_night.webp",
};

interface RoomApi {
  hitboxes: THREE.Mesh[];
  resolveVisual: (hitName: string) => THREE.Object3D | null;
  pianoVisual: (index: number) => THREE.Object3D | null;
  chair: THREE.Object3D | null;
  sectionMaterials: THREE.ShaderMaterial[];
  setNight: (night: boolean) => void;
}

/* ================================================================== */
/* ambient canvas texture for the wall Screen (original used a video)  */
/* ================================================================== */

function makeScreenCanvas(): { texture: THREE.CanvasTexture; update: () => void } {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 288;
  const g = c.getContext("2d")!;
  const drops = Array.from({ length: 34 }, () => Math.random() * 288);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  let last = 0;
  const update = () => {
    const now = performance.now();
    if (now - last < 90) return;
    last = now;
    g.fillStyle = "rgba(2,4,8,0.22)";
    g.fillRect(0, 0, 512, 288);
    g.font = "14px monospace";
    for (let i = 0; i < drops.length; i++) {
      const x = i * 15 + 6;
      g.fillStyle = i % 5 === 0 ? "#8b5cff" : "#2fbf71";
      g.fillText(String.fromCharCode(0x30a0 + Math.floor(Math.random() * 90)), x, drops[i]);
      drops[i] = drops[i] > 288 + Math.random() * 400 ? 0 : drops[i] + 16;
    }
    g.fillStyle = "rgba(2,4,8,0.35)";
    g.fillRect(0, 118, 512, 52);
    g.font = "700 34px monospace";
    g.fillStyle = "#e8e2ff";
    g.textAlign = "center";
    g.fillText("NAV ◢", 256, 152);
    texture.needsUpdate = true;
  };
  update();
  return { texture, update };
}

/* ================================================================== */
/* room model                                                          */
/* ================================================================== */

function RoomModel({ apiRef }: { apiRef: React.MutableRefObject<RoomApi | null> }) {
  const gltf = useGLTF("models/Room_Portfolio.glb", "draco/");
  const day = useTexture(DAY_URLS);
  const night = useTexture(NIGHT_URLS);
  const screen = useMemo(() => makeScreenCanvas(), []);

  useEffect(() => {
    for (const set of [day, night])
      for (const t of Object.values(set)) {
        t.flipY = false;
        t.colorSpace = THREE.SRGBColorSpace;
        t.needsUpdate = true;
      }
  }, [day, night]);

  useEffect(() => {
    const scene = gltf.scene;

    /* ---- section shader materials (one per section, all 8 texture uniforms) ---- */
    const mkSectionMaterial = (setIndex: number) =>
      new THREE.ShaderMaterial({
        uniforms: {
          uDayTexture1: { value: day.First }, uNightTexture1: { value: night.First },
          uDayTexture2: { value: day.Second }, uNightTexture2: { value: night.Second },
          uDayTexture3: { value: day.Third }, uNightTexture3: { value: night.Third },
          uDayTexture4: { value: day.Fourth }, uNightTexture4: { value: night.Fourth },
          uMixRatio: { value: 0 },
          uTextureSet: { value: setIndex },
        },
        vertexShader: themeVertexShader,
        fragmentShader: themeFragmentShader,
      });

    const waterMaterial = new THREE.MeshBasicMaterial({ color: "#5aa7e8", transparent: true, opacity: 0.65 });
    const glassMaterial = new THREE.MeshPhysicalMaterial({ color: "#dfeaf5", transparent: true, opacity: 0.22, roughness: 0.15, metalness: 0 });
    const bubbleMaterial = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    const hitboxMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
    const screenMaterial = new THREE.MeshBasicMaterial({ map: screen.texture });

    const hitboxes: THREE.Mesh[] = [];
    const pianoVisuals = new Map<number, THREE.Object3D>();
    const popIn: THREE.Object3D[] = [];

    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const name = mesh.name;

      if (name.includes("Raycaster")) {
        mesh.material = hitboxMaterial;
        hitboxes.push(mesh);
        return;
      }
      if (name.startsWith("Name_Letter")) {
        mesh.visible = false;
        return;
      }
      if (name.startsWith("Screen")) {
        mesh.material = screenMaterial;
        return;
      }
      if (name.includes("Water")) { mesh.material = waterMaterial; return; }
      if (name.includes("Glass")) { mesh.material = glassMaterial; return; }
      if (name.includes("Bubble")) { mesh.material = bubbleMaterial; return; }

      // piano key visuals
      const pi = pianoIndexFromName(name);
      if (pi !== null) {
        pianoVisuals.set(pi, mesh);
        popIn.push(mesh);
        return;
      }

      const key = SECTION_KEYS.find((k) => name.includes(k));
      if (key) {
        mesh.material = mkSectionMaterial(SECTION_KEYS.indexOf(key) + 1);
        return;
      }

      // pop-in props (intro)
      if (/^Hanging_Plank/.test(name) || /^Frame_/.test(name)) popIn.push(mesh);
    });

    /* hide pop-in props until the intro plays */
    const initialScales = new Map<THREE.Object3D, THREE.Vector3>();
    for (const o of popIn) {
      initialScales.set(o, o.scale.clone());
      o.scale.setScalar(0.0001);
    }

    const resolveVisual = (hitName: string): THREE.Object3D | null => {
      const candidates = [
        hitName.replace(/_Raycaster.*$/, ""),
        hitName.replace(/_(Hover|Pointer)_Raycaster.*$/, ""),
        hitName.replace(/_(Hover|Pointer)_Raycaster(_\w+)?$/, ""),
      ];
      for (const c of candidates) {
        if (c === hitName) continue;
        const obj = scene.getObjectByName(c);
        if (obj) return obj;
      }
      return null;
    };

    apiRef.current = {
      hitboxes,
      resolveVisual,
      pianoVisual: (i) => pianoVisuals.get(i) ?? null,
      chair: scene.getObjectByName("Chair_Top_Fourth") ?? null,
      sectionMaterials: [], // uniforms accessed via scene materials below
      setNight: (nightMode) => {
        scene.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined;
          if (m && m.uniforms && m.uniforms.uMixRatio) {
            gsap.to(m.uniforms.uMixRatio, { value: nightMode ? 1 : 0, duration: 1.5, ease: "power2.inOut" });
          }
        });
      },
    };

    (apiRef.current as unknown as { __popIn: typeof popIn; __scales: typeof initialScales; __screenUpdate: () => void }).__popIn = popIn;
    (apiRef.current as unknown as { __scales: typeof initialScales }).__scales = initialScales;
    (apiRef.current as unknown as { __screenUpdate: () => void }).__screenUpdate = screen.update;
  }, [gltf.scene, day, night, screen, apiRef]);

  useFrame((_, delta) => {
    const api = apiRef.current as (RoomApi & { __screenUpdate?: () => void }) | null;
    api?.__screenUpdate?.();
    void delta;
  });

  return <primitive object={gltf.scene} />;
}

/* ================================================================== */
/* interactions (ported raycaster system)                              */
/* ================================================================== */

function Interactions({ apiRef, onToggleNight }: { apiRef: React.MutableRefObject<RoomApi | null>; onToggleNight: () => void }) {
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(-10, -10), []);
  const { camera, gl } = useThree();
  const lastHover = useRef<string | null>(null);
  const api = () => apiRef.current;

  useEffect(() => {
    const el = gl.domElement;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    const pick = () => {
      const a = api();
      if (!a) return null;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(a.hitboxes, false);
      return hits.length ? hits[0].object : null;
    };
    const onClick = () => {
      const a = api();
      if (!a) return;
      ensureMusic();
      const hit = pick();
      if (!hit) return;
      playClick();
      const name = hit.name;
      if (name.includes("Lamp")) { onToggleNight(); return; }
      const pi = pianoIndexFromName(name.replace(/_(Hover|Pointer)_Raycaster.*$/, "_Key"));
      if (pi !== null) {
        playSfx(pianoUrl(pi), 0.7);
        duckMusic();
        const vis = a.pianoVisual(pi);
        if (vis) {
          gsap.timeline()
            .to(vis.rotation, { x: vis.rotation.x - 0.12, duration: 0.12 })
            .to(vis.rotation, { x: vis.rotation.x, duration: 0.35, ease: "back.out(3)" });
        }
        window.setTimeout(restoreMusic, 1800);
      }
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("click", onClick);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("click", onClick);
    };
  }, [gl, camera, pointer, raycaster, apiRef, onToggleNight]);

  useFrame(() => {
    const a = api();
    if (!a) return;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(a.hitboxes, false);
    const hit = hits.length ? hits[0].object : null;
    const name = hit?.name ?? null;
    if (name !== lastHover.current) {
      lastHover.current = name;
      gl.domElement.style.cursor = name ? "pointer" : "";
      if (name) {
        playClick();
        const vis = a.resolveVisual(name);
        if (vis) {
          if (!vis.userData.__is) vis.userData.__is = vis.scale.clone();
          const s = vis.userData.__is as THREE.Vector3;
          gsap.timeline()
            .to(vis.scale, { x: s.x * 1.35, y: s.y * 1.35, z: s.z * 1.35, duration: 0.2, ease: "power2.out" })
            .to(vis.scale, { x: s.x, y: s.y, z: s.z, duration: 0.5, ease: "back.out(2)" });
        }
      }
    }
    // desk chair sway
    if (a.chair) a.chair.rotation.y = Math.sin(performance.now() * 0.00025) * 0.05;
  });

  return null;
}

/* ================================================================== */
/* intro camera flight + pop-in                                        */
/* ================================================================== */

function Intro({ apiRef, done }: { apiRef: React.MutableRefObject<RoomApi | null>; done: () => void }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as { enabled: boolean } | null;
  useEffect(() => {
    if (controls) controls.enabled = false;
    camera.position.set(6.5, 5.5, 8.5);
    gsap.to(camera.position, {
      x: DESK_CAM[0], y: DESK_CAM[1], z: DESK_CAM[2],
      duration: 2.6, ease: "power3.inOut",
      onComplete: () => {
        if (controls) controls.enabled = true;
        const api = apiRef.current as (RoomApi & { __popIn?: THREE.Object3D[]; __scales?: Map<THREE.Object3D, THREE.Vector3> }) | null;
        if (api?.__popIn && api.__scales) {
          const tl = gsap.timeline({ delay: 0.1 });
          api.__popIn.forEach((o) => {
            const s = api.__scales!.get(o);
            if (s) tl.to(o.scale, { x: s.x, y: s.y, z: s.z, duration: 0.6, ease: "back.out(2.5)" }, "<0.05");
          });
        }
        done();
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/* ================================================================== */
/* the OS monitor (original to this repo)                              */
/* ================================================================== */

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
    gsap.to(camera.position, { x: DESK.x, y: DESK.y, z: DESK.z + 1.0, duration: 1.5, ease: "power3.inOut" });
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
        <mesh castShadow>
          <boxGeometry args={[1.44, 0.88, 0.05]} />
          <meshStandardMaterial color="#0a0a0f" metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, -0.032]}>
          <boxGeometry args={[1.4, 0.84, 0.012]} />
          <meshStandardMaterial color="#000" emissive="#8b5cff" emissiveIntensity={1.4} />
        </mesh>
        <mesh position={[0, -0.63, -0.01]} castShadow>
          <boxGeometry args={[0.09, 0.4, 0.05]} />
          <meshStandardMaterial color="#101014" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.82, 0.02]} castShadow>
          <boxGeometry args={[0.4, 0.025, 0.26]} />
          <meshStandardMaterial color="#101014" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.027]}>
          <planeGeometry args={[1.36, 0.8]} />
          <meshBasicMaterial color="#010103" />
        </mesh>
        <Html transform position={[0, 0, 0.032]} scale={1.36 / 1024} zIndexRange={[16777271, 0]}>
          <div style={{ width: 1024, height: 592, overflow: "hidden", background: "#000", position: "relative" }}>
            {children}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 99999,
                          background: "repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 3px)" }} />
          </div>
        </Html>
      </group>
      <pointLight position={[0, -0.2, 0.8]} color="#9db8ff" intensity={1.4} distance={4} decay={2} />
      <ambientLight intensity={0.5} />
    </group>
  );
}

/* ================================================================== */
/* the room                                                            */
/* ================================================================== */

export default function Room({ onEnter, children }: { onEnter: () => void; children: ReactNode }) {
  const [entering, setEntering] = useState(false);
  const [fade, setFade] = useState(false);
  const [night, setNight] = useState(true);
  const [introDone, setIntroDone] = useState(false);
  const apiRef = useRef<RoomApi | null>(null);

  const toggleNight = () => setNight((v) => !v);

  useEffect(() => {
    apiRef.current?.setNight(night);
  }, [night, introDone]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "l" && !entering) toggleNight();
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
        camera={{ position: DESK_CAM, fov: 55, near: 0.1, far: 60 }}
        gl={{ antialias: true, toneMappingExposure: 1.1 }}
      >
        <RoomModel apiRef={apiRef} />
        <Interactions apiRef={apiRef} onToggleNight={toggleNight} />
        {!entering && <Intro apiRef={apiRef} done={() => setIntroDone(true)} />}
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

      {!entering && (
        <button
          onClick={toggleNight}
          className="absolute top-5 right-5 z-10 flex items-center gap-2 px-4 py-2.5 rounded-full border border-[rgba(139,92,255,.5)] bg-[rgba(12,10,22,.8)] backdrop-blur-md text-sm text-[#d9d4ff] hover:bg-[rgba(30,24,55,.9)] transition-colors cursor-pointer"
        >
          <span className="text-base">{night ? "🌙" : "☀️"}</span>
          {night ? "night" : "day"} · click the lamp or press L
        </button>
      )}

      {!entering && (
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full border border-[rgba(139,92,255,.35)] bg-[rgba(10,8,18,.72)] backdrop-blur-md text-[12px] tracking-wide text-[#b9b2ff] select-none">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8b5cff] animate-pulse" />
          drag to look · click the monitor to enter · piano is playable · lamp toggles day/night · R to skip
        </div>
      )}
    </div>
  );
}
