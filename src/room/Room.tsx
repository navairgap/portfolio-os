import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, RoundedBox, useCursor } from "@react-three/drei";
import gsap from "gsap";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* canvas texture helpers                                              */
/* ------------------------------------------------------------------ */

function makeTextTexture(text: string, color: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 300;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, c.width, c.height);
  g.font = '700 120px "JetBrains Mono", monospace';
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = color;
  g.shadowBlur = 48;
  g.fillStyle = color;
  g.fillText(text, c.width / 2, c.height / 2 + 6);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

function makePosterTexture(lines: string[]): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 720;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0b0b13";
  g.fillRect(0, 0, 512, 720);
  g.strokeStyle = "#22223a";
  g.lineWidth = 6;
  g.strokeRect(14, 14, 484, 692);
  g.textAlign = "center";
  lines.forEach((ln, i) => {
    g.font = i === 0 ? "700 60px monospace" : "400 28px monospace";
    g.fillStyle = i === 0 ? "#b9b2ff" : "#4e5278";
    g.fillText(ln, 256, 230 + i * 86);
  });
  return new THREE.CanvasTexture(c);
}

/* ------------------------------------------------------------------ */
/* shared                                                              */
/* ------------------------------------------------------------------ */

const NEON = { purple: "#8b5cff", pink: "#ff2bd6", red: "#ff2b3a", blue: "#3d6bff" };

type V3 = [number, number, number];

function NeonStrip(props: { position: V3; rotation?: V3; size: V3; color: string; intensity?: number }) {
  const { position, rotation = [0, 0, 0], size, color, intensity = 2.4 } = props;
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#000" emissive={color} emissiveIntensity={intensity} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* lighting rig — dark (neon night) or light (room lights on)          */
/* ------------------------------------------------------------------ */

function Lighting({ lights }: { lights: boolean }) {
  return (
    <>
      <ambientLight intensity={lights ? 0.55 : 0.3} />
      <hemisphereLight args={lights ? ["#8a8fb0", "#3a3a42", 0.75] : ["#2a2046", "#0a0a0c", 0.5]} />
      {/* ceiling panel — the actual room light */}
      <mesh position={[0, 2.68, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 0.9]} />
        <meshStandardMaterial color="#000" emissive="#ffffff" emissiveIntensity={lights ? 2.4 : 0.06} />
      </mesh>
      <pointLight
        position={[0, 2.5, 0.3]}
        color="#fff4e0"
        intensity={lights ? 1.8 : 0}
        distance={10}
        decay={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      {/* soft warm fill from the entrance so the room always reads */}
      <pointLight position={[2.4, 2.1, 2.6]} color="#ffd9b0" intensity={lights ? 0.5 : 0.28} distance={9} decay={2} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* desk + peripherals                                                  */
/* ------------------------------------------------------------------ */

function Desk() {
  return (
    <group>
      {/* top */}
      <mesh position={[0, 0.74, -1.75]} castShadow>
        <boxGeometry args={[3.0, 0.06, 0.85]} />
        <meshStandardMaterial color="#241a14" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* panel legs */}
      {[-1.44, 1.44].map((x) => (
        <mesh key={x} position={[x, 0.37, -1.75]} castShadow>
          <boxGeometry args={[0.06, 0.74, 0.8]} />
          <meshStandardMaterial color="#17110d" roughness={0.7} />
        </mesh>
      ))}
      {/* pink under-glow strip along the front edge */}
      <NeonStrip position={[0, 0.705, -1.36]} size={[2.9, 0.015, 0.015]} color={NEON.pink} intensity={1.6} />

      {/* keyboard */}
      <mesh position={[-0.18, 0.785, -1.62]} rotation={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[0.52, 0.025, 0.17]} />
        <meshStandardMaterial color="#101014" roughness={0.6} />
      </mesh>
      <mesh position={[-0.18, 0.799, -1.62]} rotation={[0, 0.06, 0]}>
        <boxGeometry args={[0.48, 0.004, 0.13]} />
        <meshStandardMaterial color="#000" emissive={NEON.purple} emissiveIntensity={0.5} />
      </mesh>
      {/* mousepad + mouse */}
      <mesh position={[0.42, 0.772, -1.66]}>
        <boxGeometry args={[0.5, 0.006, 0.42]} />
        <meshStandardMaterial color="#101014" roughness={0.95} />
      </mesh>
      <mesh position={[0.42, 0.787, -1.7]} castShadow>
        <boxGeometry args={[0.07, 0.03, 0.11]} />
        <meshStandardMaterial color="#1a1a20" roughness={0.4} />
      </mesh>

      {/* game controller resting on the desk */}
      <group position={[0.95, 0.78, -1.6]} rotation={[0, -0.5, 0]}>
        <RoundedBox args={[0.2, 0.035, 0.11]} radius={0.015} castShadow>
          <meshStandardMaterial color="#15151b" roughness={0.55} />
        </RoundedBox>
        <mesh position={[-0.05, 0.026, -0.01]}>
          <cylinderGeometry args={[0.014, 0.014, 0.012, 12]} />
          <meshStandardMaterial color="#26262e" roughness={0.5} />
        </mesh>
        <mesh position={[0.05, 0.026, -0.01]}>
          <cylinderGeometry args={[0.014, 0.014, 0.012, 12]} />
          <meshStandardMaterial color="#26262e" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.024, -0.035]}>
          <boxGeometry args={[0.05, 0.008, 0.02]} />
          <meshStandardMaterial color="#000" emissive={NEON.purple} emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* moon lamp — warm night light */}
      <mesh position={[1.28, 0.9, -1.9]}>
        <sphereGeometry args={[0.075, 24, 24]} />
        <meshStandardMaterial color="#000" emissive="#ffb066" emissiveIntensity={2.6} />
      </mesh>
      <mesh position={[1.28, 0.8, -1.9]}>
        <cylinderGeometry args={[0.035, 0.05, 0.05, 16]} />
        <meshStandardMaterial color="#1c1c22" roughness={0.5} />
      </mesh>
      <pointLight position={[1.28, 1.02, -1.85]} color="#ffb066" intensity={0.6} distance={2.6} decay={2} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* speakers + headphones                                               */
/* ------------------------------------------------------------------ */

function Speaker({ position, rotationY }: { position: V3; rotationY: number }) {
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (ring.current) ring.current.emissiveIntensity = 1.4 + Math.sin(clock.elapsedTime * 2.4) * 0.5;
  });
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.13, 0.3, 0.15]} />
        <meshStandardMaterial color="#131318" roughness={0.6} />
      </mesh>
      {/* woofer */}
      <mesh position={[0, -0.04, 0.078]}>
        <circleGeometry args={[0.045, 24]} />
        <meshStandardMaterial color="#08080b" roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.04, 0.079]}>
        <ringGeometry args={[0.045, 0.058, 24]} />
        <meshStandardMaterial ref={ring} color="#000" emissive={NEON.purple} emissiveIntensity={1.6} side={THREE.DoubleSide} />
      </mesh>
      {/* tweeter */}
      <mesh position={[0, 0.09, 0.078]}>
        <circleGeometry args={[0.022, 20]} />
        <meshStandardMaterial color="#0a0a0e" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Headphones() {
  return (
    <group position={[1.42, 0.77, -1.95]} rotation={[0, -0.7, 0]}>
      {/* stand */}
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.012, 0.05, 0.22, 12]} />
        <meshStandardMaterial color="#16161b" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* headband */}
      <mesh position={[0, 0.26, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.085, 0.014, 12, 24, Math.PI]} />
        <meshStandardMaterial color="#17171d" roughness={0.6} />
      </mesh>
      {/* earcups */}
      {[-0.085, 0.085].map((x) => (
        <mesh key={x} position={[x, 0.175, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.055, 0.055, 0.035, 20]} />
          <meshStandardMaterial color="#141419" roughness={0.55} />
        </mesh>
      ))}
      {/* RGB ring on the cups */}
      {[-0.104, 0.104].map((x) => (
        <mesh key={x} position={[x, 0.175, 0]} rotation={[0, Math.PI / 2, 0]}>
          <ringGeometry args={[0.04, 0.052, 20]} />
          <meshStandardMaterial color="#000" emissive={NEON.pink} emissiveIntensity={1.5} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* the monitor — the OS lives inside it                                */
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
    gsap.to(camera.position, { x: 0, y: 1.28, z: -0.82, duration: 1.5, ease: "power3.inOut" });
    gsap.to(camera, {
      fov: 30, duration: 1.5, ease: "power3.inOut",
      onUpdate: () => (camera as THREE.PerspectiveCamera).updateProjectionMatrix(),
    });
  };

  return (
    <group position={[0, 1.3, -1.98]}>
      {/* stand + base */}
      <mesh position={[0, -0.46, 0.02]} castShadow>
        <cylinderGeometry args={[0.028, 0.05, 0.34, 16]} />
        <meshStandardMaterial color="#17171c" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.63, 0.06]} castShadow>
        <boxGeometry args={[0.46, 0.02, 0.3]} />
        <meshStandardMaterial color="#17171c" metalness={0.6} roughness={0.4} />
      </mesh>

      <group
        onClick={click}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        {/* bias-lighting glow behind the panel */}
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[2.0, 1.25]} />
          <meshBasicMaterial color={NEON.purple} transparent opacity={0.14} side={THREE.DoubleSide} />
        </mesh>
        {/* RGB back ring */}
        <mesh position={[0, 0, -0.032]}>
          <boxGeometry args={[1.76, 1.04, 0.016]} />
          <meshStandardMaterial color="#000" emissive={NEON.purple} emissiveIntensity={1.8} />
        </mesh>
        {/* bezel */}
        <mesh castShadow>
          <boxGeometry args={[1.72, 1.0, 0.045]} />
          <meshStandardMaterial color="#0a0a0f" metalness={0.5} roughness={0.35} />
        </mesh>
        {/* screen */}
        <mesh position={[0, 0, 0.024]}>
          <planeGeometry args={[1.62, 0.94]} />
          <meshBasicMaterial color="#010103" />
        </mesh>

        {/* the OS itself, running in the screen */}
        <Html transform position={[0, 0, 0.028]} scale={1.62 / 1024} zIndexRange={[30, 0]}>
          <div style={{ width: 1024, height: 592, overflow: "hidden", background: "#000", position: "relative" }}>
            {children}
            {/* faint CRT scanlines over the panel */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 99999,
                          background: "repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 3px)" }} />
          </div>
        </Html>
      </group>

      {/* cool screen-glow spilling onto the desk */}
      <pointLight position={[0, -0.1, 0.55]} color="#9db8ff" intensity={1.5} distance={5.5} decay={2} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* RGB PC tower with a working power button                            */
/* ------------------------------------------------------------------ */

function PCTower({ pcOn }: { pcOn: boolean }) {
  const rgbMat = useRef<THREE.MeshStandardMaterial>(null);
  const innerLight = useRef<THREE.PointLight>(null);
  const hub = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  useFrame(({ clock }, delta) => {
    if (pcOn) {
      const h = (clock.elapsedTime * 0.12) % 1;
      rgbMat.current?.emissive.setHSL(h, 1, 0.55);
      innerLight.current?.color.setHSL(h, 1, 0.6);
      if (hub.current) hub.current.rotation.z -= 3.5 * delta;
    }
  });

  const fans = [0.18, 0.38, 0.58];
  return (
    <group position={[-1.52, 0, -1.72]} rotation={[0, 0.35, 0]}>
      {/* body */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.34, 0.76, 0.64]} />
        <meshStandardMaterial color="#111116" metalness={0.55} roughness={0.45} />
      </mesh>
      {/* power button on top — click to power the PC on/off */}
      <mesh
        position={[0.08, 0.765, 0.18]}
        onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("os-pc-power")); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.028, 0.028, 0.012, 20]} />
        <meshStandardMaterial color="#000" emissive={pcOn ? "#3fbf7f" : "#5c5c66"} emissiveIntensity={pcOn ? 2 : 0.8} />
      </mesh>

      {/* front fan rings + spinning hub */}
      {fans.map((y) => (
        <group key={y} position={[0, y, 0.325]}>
          <mesh>
            <ringGeometry args={[0.055, 0.082, 24]} />
            <meshStandardMaterial ref={y === 0.38 ? rgbMat : undefined} color="#000" emissive="#ff2bd6" emissiveIntensity={pcOn ? 2.2 : 0} side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            <circleGeometry args={[0.055, 24]} />
            <meshStandardMaterial color="#08080b" roughness={0.8} />
          </mesh>
          {y === 0.38 && (
            <group ref={hub}>
              {[0, 1, 2].map((b) => (
                <mesh key={b} rotation={[0, 0, (b * Math.PI) / 3]}>
                  <boxGeometry args={[0.09, 0.016, 0.004]} />
                  <meshStandardMaterial color="#1c1c24" roughness={0.6} />
                </mesh>
              ))}
            </group>
          )}
        </group>
      ))}
      {/* tempered side glass + glowing guts */}
      <mesh position={[0.171, 0.38, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.6, 0.7]} />
        <meshStandardMaterial color="#0a0c12" metalness={0.9} roughness={0.12} transparent opacity={0.55} />
      </mesh>
      <mesh position={[0.14, 0.45, 0]}>
        <boxGeometry args={[0.02, 0.5, 0.34]} />
        <meshStandardMaterial color="#000" emissive="#2bd6ff" emissiveIntensity={pcOn ? 1.1 : 0} />
      </mesh>
      <mesh position={[0.14, 0.2, -0.12]}>
        <boxGeometry args={[0.12, 0.05, 0.3]} />
        <meshStandardMaterial color="#101016" roughness={0.4} />
      </mesh>
      <pointLight ref={innerLight} position={[0.1, 0.45, 0]} color="#ff2bd6" intensity={pcOn ? 1 : 0} distance={1.6} decay={2} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* gaming chair                                                        */
/* ------------------------------------------------------------------ */

function GamingChair() {
  const trim = NEON.red;
  return (
    <group position={[1.02, 0, -0.55]} rotation={[0, -0.55, 0]}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i * Math.PI * 2) / 5;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <mesh position={[0.19, 0.07, 0]} rotation={[0, 0, 0.18]} castShadow>
              <boxGeometry args={[0.4, 0.03, 0.05]} />
              <meshStandardMaterial color="#121217" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0.36, 0.045, 0]}>
              <sphereGeometry args={[0.035, 12, 12]} />
              <meshStandardMaterial color="#0e0e12" roughness={0.5} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.032, 0.032, 0.26, 16]} />
        <meshStandardMaterial color="#1c1c22" metalness={0.7} roughness={0.3} />
      </mesh>
      <RoundedBox args={[0.54, 0.11, 0.52]} radius={0.035} position={[0, 0.44, 0]} castShadow>
        <meshStandardMaterial color="#17171e" roughness={0.75} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.06, 0.46]} radius={0.03} position={[0, 0.51, 0.01]}>
        <meshStandardMaterial color="#1c1c25" roughness={0.85} />
      </RoundedBox>
      <group position={[0, 0.55, -0.27]} rotation={[-0.14, 0, 0]}>
        <RoundedBox args={[0.5, 0.78, 0.11]} radius={0.045} position={[0, 0.42, 0]} castShadow>
          <meshStandardMaterial color="#17171e" roughness={0.75} />
        </RoundedBox>
        <RoundedBox args={[0.44, 0.66, 0.06]} radius={0.03} position={[0, 0.4, 0.045]}>
          <meshStandardMaterial color="#1d1d27" roughness={0.85} />
        </RoundedBox>
        <RoundedBox args={[0.3, 0.13, 0.09]} radius={0.04} position={[0, 0.86, 0.02]}>
          <meshStandardMaterial color="#1c1c25" roughness={0.85} />
        </RoundedBox>
        <RoundedBox args={[0.32, 0.14, 0.1]} radius={0.05} position={[0, 0.12, 0.06]}>
          <meshStandardMaterial color="#22222c" roughness={0.9} />
        </RoundedBox>
        <NeonStrip position={[-0.245, 0.42, 0.02]} size={[0.012, 0.72, 0.012]} color={trim} intensity={1.8} />
        <NeonStrip position={[0.245, 0.42, 0.02]} size={[0.012, 0.72, 0.012]} color={trim} intensity={1.8} />
      </group>
      {[-0.3, 0.3].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.56, 0.02]}>
            <boxGeometry args={[0.05, 0.03, 0.24]} />
            <meshStandardMaterial color="#121218" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.47, 0.02]}>
            <boxGeometry args={[0.04, 0.16, 0.04]} />
            <meshStandardMaterial color="#121218" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* room shell — brighter materials so the scene never reads as black   */
/* ------------------------------------------------------------------ */

function Shell({ lights }: { lights: boolean }) {
  const sign = useMemo(() => makeTextTexture("NAV ◢", NEON.purple), []);
  const posterA = useMemo(() => makePosterTexture(["DEFENSE IS", "OFFENSE,", "INVERTED"]), []);
  const posterB = useMemo(() => makePosterTexture(["1337", "root@", "blackarch"]), []);

  const wall = lights ? "#2b2b34" : "#16161e";
  const floor = lights ? "#2a201a" : "#1a140f";
  const ceil = lights ? "#20202a" : "#0c0c11";

  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.4]} receiveShadow>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial color={floor} roughness={0.85} />
      </mesh>
      {/* rug under the chair with a neon edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.55, 0.005, -0.6]}>
        <circleGeometry args={[1.25, 40]} />
        <meshStandardMaterial color="#1c1630" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.55, 0.008, -0.6]}>
        <ringGeometry args={[1.19, 1.25, 40]} />
        <meshStandardMaterial color="#000" emissive={NEON.pink} emissiveIntensity={1.2} side={THREE.DoubleSide} />
      </mesh>

      {/* walls + ceiling */}
      <mesh position={[0, 1.35, -2.45]} receiveShadow>
        <planeGeometry args={[7, 2.7]} />
        <meshStandardMaterial color={wall} roughness={0.95} />
      </mesh>
      <mesh position={[-3.2, 1.35, 0.4]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6.5, 2.7]} />
        <meshStandardMaterial color={wall} roughness={0.95} />
      </mesh>
      <mesh position={[3.2, 1.35, 0.4]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6.5, 2.7]} />
        <meshStandardMaterial color={wall} roughness={0.95} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2.7, 0.4]}>
        <planeGeometry args={[7, 6.5]} />
        <meshStandardMaterial color={ceil} roughness={1} />
      </mesh>

      {/* ceiling LED strips */}
      <NeonStrip position={[0, 2.62, -2.42]} size={[6.4, 0.02, 0.02]} color={NEON.blue} intensity={1.4} />
      <NeonStrip position={[-3.17, 2.62, 0.4]} size={[0.02, 0.02, 6.2]} color={NEON.purple} intensity={1.1} />

      {/* neon sign over the monitor */}
      <mesh position={[0, 2.02, -2.43]}>
        <planeGeometry args={[1.35, 0.4]} />
        <meshStandardMaterial color="#000" emissive="#ffffff" emissiveMap={sign} emissiveIntensity={2.2} />
      </mesh>
      <pointLight position={[0, 1.9, -2.1]} color={NEON.purple} intensity={0.5} distance={2.6} decay={2} />

      {/* posters */}
      <mesh position={[-3.18, 1.5, -0.9]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.62, 0.88]} />
        <meshStandardMaterial map={posterA} emissiveMap={posterA} emissive="#8888ff" emissiveIntensity={0.18} roughness={0.9} />
      </mesh>
      <mesh position={[3.18, 1.45, -0.4]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.62, 0.88]} />
        <meshStandardMaterial map={posterB} emissiveMap={posterB} emissive="#8888ff" emissiveIntensity={0.18} roughness={0.9} />
      </mesh>

      {/* wall shelves with game cases + LED strips (left wall) */}
      {[
        { y: 1.52, z: -1.15 },
        { y: 1.95, z: -0.35 },
      ].map(({ y, z }) => (
        <group key={y}>
          <mesh position={[-2.92, y, z]} castShadow>
            <boxGeometry args={[0.55, 0.03, 0.26]} />
            <meshStandardMaterial color="#1d1712" roughness={0.6} />
          </mesh>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} position={[-3.0 + i * 0.055, y + 0.1, z]} rotation={[0, 0, (i % 2 ? 0.03 : -0.02)]}>
              <boxGeometry args={[0.035, 0.17, 0.2]} />
              <meshStandardMaterial color={["#25253a", "#3a2530", "#253a2e", "#3a3525"][i % 4]} roughness={0.7} />
            </mesh>
          ))}
          <NeonStrip position={[-2.92, y - 0.03, z + 0.12]} size={[0.5, 0.012, 0.012]} color={NEON.blue} intensity={1.3} />
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* wall light switch — toggles the room between night and day          */
/* ------------------------------------------------------------------ */

function LightSwitch({ lights, onToggle }: { lights: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  return (
    <group position={[3.17, 1.25, 1.5]} rotation={[0, -Math.PI / 2, 0]}>
      {/* plate */}
      <mesh>
        <boxGeometry args={[0.15, 0.22, 0.02]} />
        <meshStandardMaterial color="#d8d4cc" roughness={0.5} />
      </mesh>
      {/* rocker — tilts with state */}
      <mesh position={[0, lights ? 0.028 : -0.028, 0.014]} rotation={[lights ? 0.18 : -0.18, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.085, 0.12, 0.03]} />
        <meshStandardMaterial color="#f0ece4" roughness={0.4} />
      </mesh>
      {/* status LED */}
      <mesh position={[0, -0.085, 0.012]}>
        <circleGeometry args={[0.008, 12]} />
        <meshStandardMaterial color="#000" emissive={lights ? "#3fbf7f" : "#ff5c5c"} emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* floating dust for atmosphere                                        */
/* ------------------------------------------------------------------ */

function Dust() {
  const ref = useRef<THREE.Points>(null);
  const { positions, speeds } = useMemo(() => {
    const n = 150;
    const positions = new Float32Array(n * 3);
    const speeds = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = 0.25 + Math.random() * 2.2;
      positions[i * 3 + 2] = -2.2 + Math.random() * 5;
      speeds[i] = 0.02 + Math.random() * 0.05;
    }
    return { positions, speeds };
  }, []);

  useFrame((_, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const arr = (pts.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    for (let i = 0; i < speeds.length; i++) {
      arr[i * 3 + 1] -= speeds[i] * delta;
      if (arr[i * 3 + 1] < 0.1) arr[i * 3 + 1] = 2.4;
    }
    (pts.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.014} color="#8fa0ff" transparent opacity={0.45} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* background + fog react to light mode                                */
/* ------------------------------------------------------------------ */

function Atmosphere({ lights }: { lights: boolean }) {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    scene.background = new THREE.Color(lights ? "#101016" : "#040409");
    scene.fog = new THREE.Fog(lights ? "#101016" : "#040409", 8.5, 18);
  }, [lights, scene]);
  return null;
}

/* ------------------------------------------------------------------ */
/* the room                                                            */
/* ------------------------------------------------------------------ */

export default function Room({ onEnter, children }: { onEnter: () => void; children: ReactNode }) {
  const [entering, setEntering] = useState(false);
  const [fade, setFade] = useState(false);
  const [lights, setLights] = useState(false);
  const [pcOn, setPcOn] = useState(true);

  // PC power button lives on the tower; wire the custom event here
  useEffect(() => {
    const h = () => setPcOn((v) => !v);
    window.addEventListener("os-pc-power", h);
    return () => window.removeEventListener("os-pc-power", h);
  }, []);

  const zoom = () => {
    setEntering(true);
    setFade(true);
    window.setTimeout(onEnter, 520);
  };

  return (
    <div
      className={`fixed inset-0 z-[120] transition-opacity duration-500 ${fade ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      style={{ background: lights ? "#101016" : "#040409" }}
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [2.8, 1.85, 2.9], fov: 55 }}
        gl={{ antialias: true, toneMappingExposure: 1.25 }}
      >
        <Atmosphere lights={lights} />
        <Lighting lights={lights} />

        <Shell lights={lights} />
        <Desk />
        <Speaker position={[-1.32, 0.93, -1.92]} rotationY={0.5} />
        <Speaker position={[1.08, 0.93, -1.98]} rotationY={-0.35} />
        <Headphones />
        <Monitor onZoomStart={zoom} entering={entering}>{children}</Monitor>
        <PCTower pcOn={pcOn} />
        <GamingChair />
        <LightSwitch lights={lights} onToggle={() => setLights((v) => !v)} />
        <Dust />

        <OrbitControls
          makeDefault
          target={[0, 1.05, -1.6]}
          minDistance={1.7}
          maxDistance={6}
          minPolarAngle={0.35}
          maxPolarAngle={1.52}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>

      {!entering && (
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full border border-[rgba(139,92,255,.35)] bg-[rgba(10,8,18,.72)] backdrop-blur-md text-[12px] tracking-wide text-[#b9b2ff] select-none">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8b5cff] animate-pulse" />
          drag to look · click monitor to enter · wall switch toggles lights · PC button powers RGB · R to skip
        </div>
      )}
    </div>
  );
}
