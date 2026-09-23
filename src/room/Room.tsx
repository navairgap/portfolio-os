import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, RoundedBox, useCursor } from "@react-three/drei";
import gsap from "gsap";
import type { ReactNode } from "react";

/*
 * navairgap OS — gaming room (fully procedural, no external models)
 * Every object sits on a clean grid; the OS runs in the monitor.
 */

type V3 = [number, number, number];

/* ------------------------------------------------------------------ */
/* canvas textures                                                     */
/* ------------------------------------------------------------------ */

function makeWoodTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#3a2a1c";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? "#412e1e" : "#352517";
    g.fillRect(0, i * 64, 512, 62);
    g.strokeStyle = "rgba(0,0,0,.35)";
    g.strokeRect(-1, i * 64, 514, 63);
    for (let j = 0; j < 30; j++) {
      g.strokeStyle = `rgba(20,12,6,${0.05 + Math.random() * 0.09})`;
      const y = i * 64 + Math.random() * 62;
      g.beginPath();
      g.moveTo(0, y);
      g.bezierCurveTo(150, y + 4, 350, y - 4, 512, y + 2);
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makePosterTexture(title: string, sub: string, accent: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 384; c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#101018";
  g.fillRect(0, 0, 384, 512);
  g.strokeStyle = accent;
  g.lineWidth = 5;
  g.strokeRect(14, 14, 356, 484);
  g.textAlign = "center";
  g.fillStyle = accent;
  g.font = "700 44px monospace";
  g.fillText(title, 192, 220);
  g.fillStyle = "#8a8aa0";
  g.font = "400 24px monospace";
  g.fillText(sub, 192, 280);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeNeonTexture(text: string, color: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, 1024, 256);
  g.font = "700 110px monospace";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = color;
  g.shadowBlur = 40;
  g.fillStyle = color;
  g.fillText(text, 512, 130);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeCityTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#0a0a1e");
  grad.addColorStop(1, "#251a3a");
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 256);
  // buildings
  for (let i = 0; i < 18; i++) {
    const w = 18 + Math.random() * 30;
    const h = 40 + Math.random() * 130;
    const x = i * 29;
    g.fillStyle = "#050510";
    g.fillRect(x, 256 - h, w, h);
    // lit windows
    for (let wy = 256 - h + 6; wy < 250; wy += 12) {
      for (let wx = x + 3; wx < x + w - 4; wx += 9) {
        if (Math.random() > 0.55) {
          g.fillStyle = Math.random() > 0.8 ? "#ffb066" : "#3fd0ff";
          g.fillRect(wx, wy, 4, 5);
        }
      }
    }
  }
  // moon
  g.fillStyle = "#e8e4ff";
  g.beginPath();
  g.arc(430, 46, 20, 0, Math.PI * 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------------------------------------------ */
/* constants                                                           */
/* ------------------------------------------------------------------ */

const NEON = { purple: "#8b5cff", pink: "#ff2bd6", red: "#ff2b3a", blue: "#3d6bff", green: "#2fbf71" };

/* desk anchor — everything derives from this */
const DESK_POS: V3 = [0, 0.75, -2.2];       // desk center
const MONITOR_POS: V3 = [0, 1.46, -2.52];   // screen center
const SCREEN_W = 1.52, SCREEN_H = 0.86;
const CHAIR_POS: V3 = [0, 0, -1.15];        // chair center, faces desk (+... toward -z)
const CAM_POS: V3 = [0.4, 1.75, 0.6];       // default camera
const LOOK_AT: V3 = [0, 1.2, -2.2];         // orbit target

/* ------------------------------------------------------------------ */
/* small helpers                                                       */
/* ------------------------------------------------------------------ */

function NeonStrip({ p, s, c, i = 2.2, r = [0, 0, 0] }: { p: V3; s: V3; c: string; i?: number; r?: V3 }) {
  return (
    <mesh position={p} rotation={r}>
      <boxGeometry args={s} />
      <meshStandardMaterial color="#000" emissive={c} emissiveIntensity={i} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* room shell (walls, floor, ceiling, window, posters, sign)           */
/* ------------------------------------------------------------------ */

function Shell({ night }: { night: boolean }) {
  const wood = useMemo(() => makeWoodTexture(), []);
  const posterA = useMemo(() => makePosterTexture("DEFENSE IS", "OFFENSE, INVERTED", "#8b5cff"), []);
  const posterB = useMemo(() => makePosterTexture("1337", "root@blackarch", "#ff2bd6"), []);
  const neon = useMemo(() => makeNeonTexture("NAV ◢", NEON.purple), []);
  const city = useMemo(() => makeCityTexture(), []);

  const wallColor = night ? "#26262e" : "#d9d5cc";
  const floorTint = night ? "#8a8a8a" : "#e6dccd";
  const ceilColor = night ? "#1c1c22" : "#cfccc4";

  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial map={wood} color={floorTint} roughness={0.7} />
      </mesh>
      {/* rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1.1]} receiveShadow>
        <circleGeometry args={[1.35, 48]} />
        <meshStandardMaterial color={night ? "#1a1430" : "#7a74a8"} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, -1.1]}>
        <ringGeometry args={[1.28, 1.35, 48]} />
        <meshStandardMaterial color="#000" emissive={NEON.pink} emissiveIntensity={1.1} side={THREE.DoubleSide} />
      </mesh>

      {/* back wall (behind desk) */}
      <mesh position={[0, 1.6, -3]} receiveShadow>
        <planeGeometry args={[8, 3.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} />
      </mesh>
      {/* left wall */}
      <mesh position={[-3.2, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[7, 3.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} />
      </mesh>
      {/* right wall */}
      <mesh position={[3.2, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[7, 3.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} />
      </mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.2, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color={ceilColor} roughness={1} />
      </mesh>

      {/* window with night city (right wall) */}
      <group position={[3.18, 1.7, 0.6]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[1.7, 1.15]} />
          <meshStandardMaterial map={city} emissiveMap={city} emissive={night ? "#ffffff" : "#666"} emissiveIntensity={night ? 0.9 : 0.25} />
        </mesh>
        <mesh>
          <boxGeometry args={[1.82, 1.27, 0.06]} />
          <meshStandardMaterial color="#15151c" />
        </mesh>
        {/* frame bars */}
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[0.04, 1.15, 0.02]} />
          <meshStandardMaterial color="#15151c" />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[1.7, 0.04, 0.02]} />
          <meshStandardMaterial color="#15151c" />
        </mesh>
      </group>

      {/* posters (left wall) */}
      <mesh position={[-3.18, 1.7, 0.9]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.6, 0.8]} />
        <meshStandardMaterial map={posterA} roughness={0.9} />
      </mesh>
      <mesh position={[-3.18, 1.6, 1.8]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.6, 0.8]} />
        <meshStandardMaterial map={posterB} roughness={0.9} />
      </mesh>

      {/* neon sign above desk */}
      <mesh position={[0, 2.45, -2.96]}>
        <planeGeometry args={[1.15, 0.29]} />
        <meshStandardMaterial color="#000" emissive="#ffffff" emissiveMap={neon} emissiveIntensity={night ? 2.2 : 0.7} />
      </mesh>
      <pointLight position={[0, 2.3, -2.6]} color={NEON.purple} intensity={night ? 0.7 : 0.15} distance={3} decay={2} />

      {/* ceiling LED strips */}
      <NeonStrip p={[0, 3.14, -2.96]} s={[6, 0.02, 0.02]} c={NEON.blue} i={night ? 1.4 : 0.3} />
      <NeonStrip p={[-3.14, 3.14, 0]} s={[0.02, 0.02, 6]} c={NEON.purple} i={night ? 1.1 : 0.25} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* lighting rig                                                        */
/* ------------------------------------------------------------------ */

function Lights({ night }: { night: boolean }) {
  return (
    <>
      <ambientLight intensity={night ? 0.32 : 0.75} />
      <hemisphereLight args={night ? ["#2a2440", "#0c0c10", 0.5] : ["#cfd6ff", "#8a8478", 0.85]} />
      {/* main ceiling light */}
      <mesh position={[0, 3.17, -0.6]}>
        <boxGeometry args={[1.4, 0.04, 0.5]} />
        <meshStandardMaterial color="#000" emissive="#fff6e8" emissiveIntensity={night ? 0.15 : 2.4} />
      </mesh>
      <pointLight
        position={[0, 2.95, -0.6]}
        color="#fff2df"
        intensity={night ? 0.15 : 1.6}
        distance={11}
        decay={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />
      {/* warm fill from the entrance */}
      <pointLight position={[1.8, 2.2, 2.2]} color="#ffd9b0" intensity={night ? 0.3 : 0.5} distance={9} decay={2} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* desk + peripherals — all aligned to DESK_POS                        */
/* ------------------------------------------------------------------ */

function Desk({ night }: { night: boolean }) {
  const [dx, dy, dz] = DESK_POS;
  return (
    <group>
      {/* top: 2.0 x 0.06 x 0.8 at desk height */}
      <mesh position={[dx, dy, dz]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.06, 0.8]} />
        <meshStandardMaterial color={night ? "#241a12" : "#8a6242"} roughness={0.45} metalness={0.05} />
      </mesh>
      {/* legs */}
      {[-0.93, 0.93].map((ox) => (
        <mesh key={ox} position={[dx + ox, dy / 2 - 0.02, dz]} castShadow>
          <boxGeometry args={[0.07, dy - 0.04, 0.7]} />
          <meshStandardMaterial color={night ? "#1a130d" : "#6e4c30"} roughness={0.65} />
        </mesh>
      ))}
      {/* pink under-glow */}
      <NeonStrip p={[dx, dy - 0.045, dz + 0.39]} s={[1.9, 0.014, 0.014]} c={NEON.pink} i={night ? 1.5 : 0.3} />

      {/* keyboard — big enough to read, centered-left */}
      <mesh position={[dx - 0.18, dy + 0.045, dz + 0.26]} rotation={[0, 0.04, 0]} castShadow>
        <boxGeometry args={[0.5, 0.028, 0.18]} />
        <meshStandardMaterial color="#141419" roughness={0.55} />
      </mesh>
      <mesh position={[dx - 0.18, dy + 0.061, dz + 0.26]} rotation={[0, 0.04, 0]}>
        <boxGeometry args={[0.46, 0.005, 0.14]} />
        <meshStandardMaterial color="#000" emissive={NEON.purple} emissiveIntensity={night ? 0.7 : 0.15} />
      </mesh>
      {/* mousepad + mouse */}
      <mesh position={[dx + 0.35, dy + 0.034, dz + 0.24]}>
        <boxGeometry args={[0.42, 0.008, 0.4]} />
        <meshStandardMaterial color="#101014" roughness={0.95} />
      </mesh>
      <mesh position={[dx + 0.35, dy + 0.056, dz + 0.2]} castShadow>
        <boxGeometry args={[0.065, 0.032, 0.105]} />
        <meshStandardMaterial color="#1c1c22" roughness={0.4} />
      </mesh>
      {/* controller on a stand, desk right */}
      <group position={[dx - 0.68, dy + 0.05, dz + 0.26]} rotation={[0, 0.5, 0]}>
        <RoundedBox args={[0.19, 0.034, 0.105]} radius={0.014} castShadow>
          <meshStandardMaterial color="#15151b" roughness={0.55} />
        </RoundedBox>
        {[-0.048, 0.048].map((ox) => (
          <mesh key={ox} position={[ox, 0.024, -0.012]}>
            <cylinderGeometry args={[0.013, 0.013, 0.012, 12]} />
            <meshStandardMaterial color="#2a2a32" roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 0.022, -0.034]}>
          <boxGeometry args={[0.05, 0.007, 0.018]} />
          <meshStandardMaterial color="#000" emissive={NEON.purple} emissiveIntensity={night ? 0.9 : 0.2} />
        </mesh>
      </group>
      {/* moon lamp, front-right corner of desk */}
      <mesh position={[dx + 0.85, dy + 0.16, dz + 0.35]}>
        <sphereGeometry args={[0.08, 24, 24]} />
        <meshStandardMaterial color="#000" emissive="#ffb066" emissiveIntensity={2.4} />
      </mesh>
      <mesh position={[dx + 0.85, dy + 0.05, dz + 0.35]}>
        <cylinderGeometry args={[0.035, 0.055, 0.06, 16]} />
        <meshStandardMaterial color="#1c1c22" roughness={0.5} />
      </mesh>
      <pointLight position={[dx + 0.85, dy + 0.3, dz + 0.4]} color="#ffb066" intensity={night ? 0.6 : 0.15} distance={2.6} decay={2} />
      {/* headphones on stand, back-left */}
      <group position={[dx - 0.82, dy + 0.03, dz - 0.2]} rotation={[0, 0.6, 0]}>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.012, 0.055, 0.2, 12]} />
          <meshStandardMaterial color="#1a1a20" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.23, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.085, 0.014, 12, 24, Math.PI]} />
          <meshStandardMaterial color="#1c1c22" roughness={0.6} />
        </mesh>
        {[-0.085, 0.085].map((ox) => (
          <mesh key={ox} position={[ox, 0.148, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.055, 0.055, 0.034, 20]} />
            <meshStandardMaterial color="#18181e" roughness={0.55} />
          </mesh>
        ))}
        {[-0.104, 0.104].map((ox) => (
          <mesh key={ox} position={[ox, 0.148, 0]} rotation={[0, Math.PI / 2, 0]}>
            <ringGeometry args={[0.04, 0.052, 20]} />
            <meshStandardMaterial color="#000" emissive={NEON.pink} emissiveIntensity={night ? 1.5 : 0.3} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* PC tower on the FLOOR, right of desk — with working power button    */
/* ------------------------------------------------------------------ */

function PCTower({ night, on, onToggle }: { night: boolean; on: boolean; onToggle: () => void }) {
  const rgbMat = useRef<THREE.MeshStandardMaterial>(null);
  const innerLight = useRef<THREE.PointLight>(null);
  const hub = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  useFrame(({ clock }, delta) => {
    if (!on) return;
    const h = (clock.elapsedTime * 0.12) % 1;
    rgbMat.current?.emissive.setHSL(h, 1, 0.55);
    innerLight.current?.color.setHSL(h, 1, 0.6);
    if (hub.current) hub.current.rotation.z -= 3.2 * delta;
  });

  return (
    <group position={[0.78, 0.78, -2.28]} rotation={[0, -0.25, 0]}>
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.34, 0.76, 0.62]} />
        <meshStandardMaterial color="#121218" metalness={0.55} roughness={0.45} />
      </mesh>
      {/* power button on top */}
      <mesh
        position={[0.09, 0.765, 0.16]}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.026, 0.026, 0.012, 20]} />
        <meshStandardMaterial color="#000" emissive={on ? "#3fbf7f" : "#55555e"} emissiveIntensity={on ? 2 : 0.7} />
      </mesh>
      {/* 3 front fans */}
      {[0.2, 0.4, 0.6].map((y) => (
        <group key={y} position={[0, y, 0.313]}>
          <mesh>
            <ringGeometry args={[0.05, 0.075, 24]} />
            <meshStandardMaterial ref={y === 0.4 ? rgbMat : undefined} color="#000" emissive="#ff2bd6" emissiveIntensity={on ? 2.1 : 0} side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            <circleGeometry args={[0.05, 24]} />
            <meshStandardMaterial color="#07070a" roughness={0.8} />
          </mesh>
          {y === 0.4 && (
            <group ref={hub}>
              {[0, 1, 2].map((b) => (
                <mesh key={b} rotation={[0, 0, (b * Math.PI) / 3]}>
                  <boxGeometry args={[0.082, 0.014, 0.004]} />
                  <meshStandardMaterial color="#1c1c24" roughness={0.6} />
                </mesh>
              ))}
            </group>
          )}
        </group>
      ))}
      {/* glass side + glowing guts */}
      <mesh position={[0.171, 0.38, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.58, 0.7]} />
        <meshStandardMaterial color="#0a0c12" metalness={0.9} roughness={0.12} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0.14, 0.44, 0]}>
        <boxGeometry args={[0.02, 0.48, 0.32]} />
        <meshStandardMaterial color="#000" emissive="#2bd6ff" emissiveIntensity={on ? 1 : 0} />
      </mesh>
      <mesh position={[0.14, 0.18, -0.1]}>
        <boxGeometry args={[0.12, 0.05, 0.28]} />
        <meshStandardMaterial color="#101016" roughness={0.4} />
      </mesh>
      <pointLight ref={innerLight} position={[0.1, 0.44, 0]} color="#ff2bd6" intensity={on ? 0.85 : 0} distance={1.7} decay={2} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* gaming chair — tucked under desk facing the monitor                 */
/* ------------------------------------------------------------------ */

function Chair() {
  return (
    <group position={CHAIR_POS} rotation={[0, Math.PI + 0.12, 0]}>
      {/* 5-star base */}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i * Math.PI * 2) / 5;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <mesh position={[0.2, 0.065, 0]} rotation={[0, 0, 0.16]} castShadow>
              <boxGeometry args={[0.42, 0.03, 0.05]} />
              <meshStandardMaterial color="#141419" metalness={0.55} roughness={0.4} />
            </mesh>
            <mesh position={[0.38, 0.042, 0]}>
              <sphereGeometry args={[0.034, 12, 12]} />
              <meshStandardMaterial color="#0f0f13" roughness={0.5} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.24, 16]} />
        <meshStandardMaterial color="#1e1e24" metalness={0.65} roughness={0.3} />
      </mesh>
      {/* seat */}
      <RoundedBox args={[0.52, 0.1, 0.5]} radius={0.03} position={[0, 0.42, 0]} castShadow>
        <meshStandardMaterial color="#18181f" roughness={0.75} />
      </RoundedBox>
      <RoundedBox args={[0.48, 0.055, 0.44]} radius={0.026} position={[0, 0.485, 0.01]}>
        <meshStandardMaterial color="#c11430" roughness={0.8} />
      </RoundedBox>
      {/* backrest */}
      <group position={[0, 0.52, -0.26]} rotation={[-0.13, 0, 0]}>
        <RoundedBox args={[0.48, 0.76, 0.105]} radius={0.04} position={[0, 0.4, 0]} castShadow>
          <meshStandardMaterial color="#18181f" roughness={0.75} />
        </RoundedBox>
        <RoundedBox args={[0.42, 0.62, 0.055]} radius={0.028} position={[0, 0.38, 0.042]}>
          <meshStandardMaterial color="#c11430" roughness={0.8} />
        </RoundedBox>
        <RoundedBox args={[0.28, 0.12, 0.085]} radius={0.035} position={[0, 0.82, 0.02]}>
          <meshStandardMaterial color="#c11430" roughness={0.8} />
        </RoundedBox>
        <RoundedBox args={[0.3, 0.13, 0.095]} radius={0.045} position={[0, 0.1, 0.055]}>
          <meshStandardMaterial color="#141419" roughness={0.9} />
        </RoundedBox>
        <NeonStrip p={[-0.235, 0.4, 0.02]} s={[0.011, 0.7, 0.011]} c={NEON.red} i={1.7} />
        <NeonStrip p={[0.235, 0.4, 0.02]} s={[0.011, 0.7, 0.011]} c={NEON.red} i={1.7} />
      </group>
      {/* armrests */}
      {[-0.29, 0.29].map((x) => (
        <group key={x} position={[x, 0, 0.02]}>
          <mesh position={[0, 0.53, 0]}>
            <boxGeometry args={[0.05, 0.028, 0.22]} />
            <meshStandardMaterial color="#131318" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.445, 0]}>
            <boxGeometry args={[0.04, 0.15, 0.04]} />
            <meshStandardMaterial color="#131318" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* shelves on the left wall                                            */
/* ------------------------------------------------------------------ */

function Shelves() {
  return (
    <group>
      {[
        { y: 1.6, z: -0.6 },
        { y: 2.05, z: 0.35 },
      ].map(({ y, z }) => (
        <group key={y}>
          <mesh position={[-3.0, y, z]} castShadow>
            <boxGeometry args={[0.4, 0.03, 0.9]} />
            <meshStandardMaterial color="#241b13" roughness={0.6} />
          </mesh>
          {Array.from({ length: 7 }).map((_, i) => (
            <mesh key={i} position={[-3.0, y + 0.1, z - 0.34 + i * 0.105]} rotation={[0, (i % 2 ? 0.04 : -0.03), 0]}>
              <boxGeometry args={[0.16, 0.17, 0.05]} />
              <meshStandardMaterial color={["#2c2c46", "#462c3a", "#2c4638", "#463f2c"][i % 4]} roughness={0.7} />
            </mesh>
          ))}
          <NeonStrip p={[-3.0, y - 0.028, z + 0.42]} s={[0.36, 0.012, 0.012]} c={NEON.blue} i={1.2} />
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* wall light switch (right wall near entrance)                        */
/* ------------------------------------------------------------------ */

function LightSwitch({ night, onToggle }: { night: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  return (
    <group position={[3.17, 1.3, 1.6]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh>
        <boxGeometry args={[0.14, 0.2, 0.02]} />
        <meshStandardMaterial color="#e2ded6" roughness={0.5} />
      </mesh>
      <mesh
        position={[0, night ? 0.026 : -0.026, 0.014]}
        rotation={[night ? 0.16 : -0.16, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.08, 0.11, 0.03]} />
        <meshStandardMaterial color="#f2eee6" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.078, 0.012]}>
        <circleGeometry args={[0.008, 12]} />
        <meshStandardMaterial color="#000" emissive={night ? "#ff5c5c" : "#3fbf7f"} emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* the monitor with your OS inside                                     */
/* ------------------------------------------------------------------ */

function Monitor({ night, onZoomStart, entering, children }: { night: boolean; onZoomStart: () => void; entering: boolean; children: ReactNode }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as { enabled: boolean } | null;

  const click = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (entering) return;
    onZoomStart();
    if (controls) controls.enabled = false;
    gsap.to(camera.position, { x: MONITOR_POS[0], y: MONITOR_POS[1], z: MONITOR_POS[2] + 1.05, duration: 1.5, ease: "power3.inOut" });
    gsap.to(camera, {
      fov: 30, duration: 1.5, ease: "power3.inOut",
      onUpdate: () => (camera as THREE.PerspectiveCamera).updateProjectionMatrix(),
    });
  };

  return (
    <group position={MONITOR_POS}>
      <group
        onClick={click}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        {/* bezel */}
        <mesh castShadow>
          <boxGeometry args={[SCREEN_W + 0.1, SCREEN_H + 0.1, 0.05]} />
          <meshStandardMaterial color="#191922" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* RGB back glow */}
        <mesh position={[0, 0, -0.034]}>
          <boxGeometry args={[SCREEN_W + 0.04, SCREEN_H + 0.04, 0.012]} />
          <meshStandardMaterial color="#000" emissive="#8b5cff" emissiveIntensity={night ? 1.5 : 0.4} />
        </mesh>
        {/* screen backlight — reads as "display on" even when content is dark */}
        <mesh position={[0, 0, 0.026]}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshBasicMaterial color="#0b1220" />
        </mesh>
        {/* power LED on the bottom bezel */}
        <mesh position={[0, -(SCREEN_H + 0.1) / 2 + 0.018, 0.027]}>
          <circleGeometry args={[0.009, 12]} />
          <meshStandardMaterial color="#000" emissive="#4da3ff" emissiveIntensity={2.4} />
        </mesh>
        {/* the OS */}
        <Html transform position={[0, 0, 0.031]} scale={SCREEN_W / 1024} zIndexRange={[16777271, 0]}>
          <div style={{ width: 1024, height: 592, overflow: "hidden", background: "#000", position: "relative" }}>
            {children}
            {/* live indicator */}
            <div style={{ position: "absolute", top: 6, right: 10, color: "#2fbf71",
                          font: "700 13px monospace", zIndex: 99999, pointerEvents: "none" }}>● OS</div>
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 99999,
                          background: "repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 3px)" }} />
          </div>
        </Html>
      </group>
      {/* stand to desk surface */}
      <mesh position={[0, -(SCREEN_H + 0.1) / 2 - 0.14, -0.02]} castShadow>
        <boxGeometry args={[0.1, 0.28, 0.05]} />
        <meshStandardMaterial color="#101014" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, -(SCREEN_H + 0.1) / 2 - 0.3, 0.03]} castShadow>
        <boxGeometry args={[0.42, 0.024, 0.28]} />
        <meshStandardMaterial color="#1c1c26" metalness={0.65} roughness={0.3} />
      </mesh>
      {/* screen glow */}
      <pointLight position={[0, -0.3, 0.9]} color="#9db8ff" intensity={night ? 1.5 : 0.4} distance={5} decay={2} />
      <ambientLight intensity={0.5} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* floating dust                                                       */
/* ------------------------------------------------------------------ */

function Dust({ night }: { night: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, speeds } = useMemo(() => {
    const n = 140;
    const positions = new Float32Array(n * 3);
    const speeds = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 5.5;
      positions[i * 3 + 1] = 0.2 + Math.random() * 2.6;
      positions[i * 3 + 2] = -2.8 + Math.random() * 5;
      speeds[i] = 0.02 + Math.random() * 0.045;
    }
    return { positions, speeds };
  }, []);
  useFrame((_, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const arr = (pts.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    for (let i = 0; i < speeds.length; i++) {
      arr[i * 3 + 1] -= speeds[i] * delta;
      if (arr[i * 3 + 1] < 0.08) arr[i * 3 + 1] = 2.8;
    }
    (pts.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.013} color="#8fa0ff" transparent opacity={night ? 0.5 : 0.15} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* the room                                                            */
/* ------------------------------------------------------------------ */

export default function Room({ onEnter, children }: { onEnter: () => void; children: ReactNode }) {
  const [entering, setEntering] = useState(false);
  const [fade, setFade] = useState(false);
  const [night, setNight] = useState(true);
  const [pcOn, setPcOn] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "l" && !entering) setNight((v) => !v);
      if (k === "p" && !entering) setPcOn((v) => !v);
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
      style={{ background: night ? "#05050a" : "#b8b4aa" }}
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: CAM_POS, fov: 55, near: 0.1, far: 40 }}
        gl={{ antialias: true, toneMappingExposure: 1.15 }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color(night ? "#05050a" : "#b8b4aa");
          scene.fog = new THREE.Fog(night ? "#05050a" : "#b8b4aa", 9, 22);
        }}
      >
        <Lights night={night} />
        <Shell night={night} />
        <Desk night={night} />
        <PCTower night={night} on={pcOn} onToggle={() => setPcOn((v) => !v)} />
        <Chair />
        <Shelves />
        <Monitor night={night} onZoomStart={zoom} entering={entering}>{children}</Monitor>
        <LightSwitch night={night} onToggle={() => setNight((v) => !v)} />
        <Dust night={night} />
        <OrbitControls
          makeDefault
          target={LOOK_AT}
          minDistance={1.2}
          maxDistance={5.5}
          minPolarAngle={0.45}
          maxPolarAngle={1.6}
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
          drag to look · click monitor to enter · wall switch / L = lights · PC button / P = RGB · R to skip
        </div>
      )}
    </div>
  );
}
