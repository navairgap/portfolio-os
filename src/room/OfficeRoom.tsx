import { useMemo, useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Identifies meshes at runtime from world transforms (no hardcoded positions).
interface Found {
  monitor: THREE.Mesh | null;
  chair: THREE.Object3D | null;
  center: THREE.Vector3;
  monitorCenter: THREE.Vector3;
  chairCenter: THREE.Vector3;
  front: THREE.Vector3;
  screenW: number; screenH: number; screenPos: THREE.Vector3;
}

function analyze(scene: THREE.Object3D): Found {
  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  let chair: THREE.Object3D | null = null;
  scene.traverse((o) => { if (!chair && /SANDALI|chair/i.test(o.name)) chair = o; });
  const chairBox = chair ? new THREE.Box3().setFromObject(chair!) : null;
  const chairCenter = chairBox ? chairBox.getCenter(new THREE.Vector3()) : new THREE.Vector3(0, 0.5, 2);

  // monitor: tallest mesh (taller-than-wide) outside the chair group, in the upper half
  let monitor: THREE.Mesh | null = null, best = -1;
  const mb = new THREE.Box3(), v = new THREE.Vector3(), s = new THREE.Vector3();
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    if (chair && (m === chair || chair!.getObjectById(m.id))) return;
    mb.setFromObject(m); mb.getCenter(v); mb.getSize(s);
    if (s.y > s.x && v.y > center.y * 0.8 && s.y > best && s.length() < box.getSize(new THREE.Vector3()).length() * 0.6) { best = s.y; monitor = m; }
  });
  let monitorCenter = new THREE.Vector3(0, 1.2, 0), screenW = 0.3, screenH = 0.22, screenPos = new THREE.Vector3(0, 1.2, 0), front = new THREE.Vector3(0, 0, 1);
  if (monitor) {
    mb.setFromObject(monitor);
    monitorCenter = mb.getCenter(new THREE.Vector3());
    const size = mb.getSize(new THREE.Vector3());
    front = new THREE.Vector3(chairCenter.x - monitorCenter.x, 0, chairCenter.z - monitorCenter.z).normalize();
    const half = Math.abs(size.x * front.x) + Math.abs(size.z * front.z);
    screenPos = monitorCenter.clone().addScaledVector(front, half / 2 + 0.004);
    const perp = new THREE.Vector3(-front.z, 0, front.x);
    screenW = Math.abs(size.x * perp.x) + Math.abs(size.z * perp.z);
    screenH = size.y * 0.74;
    screenW *= 0.94;
    screenPos.y = monitorCenter.y + size.y * 0.06;
  }
  return { monitor, chair, center, monitorCenter, chairCenter, front, screenW, screenH, screenPos };
}

export default function OfficeRoom({ children }: { children: (f: Found) => React.ReactNode }) {
  const { scene } = useGLTF("/models/office-computer.glb");
  const wrap = useRef<THREE.Group>(null);
  const [norm, setNorm] = useState<{ pos: [number, number, number]; scale: number } | null>(null);
  const found = useMemo(() => analyze(scene), [scene]);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const scale = 2.2 / Math.max(size.x, size.z); // desk ~2.2m across
    setNorm({ pos: [-c.x * scale, -box.min.y * scale, -c.z * scale], scale });
  }, [scene]);

  // dim the monitor's baked texture slightly so the black screen plane reads as "off" bezel
  useEffect(() => {
    scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && (m.material as THREE.MeshStandardMaterial)?.map) { (m.material as THREE.MeshStandardMaterial).roughness = 0.8; } });
  }, [scene]);

  useFrame(() => { /* keep matrixWorld fresh for Html */ });

  if (!norm) return null;
  return (
    <group ref={wrap} position={norm.pos} scale={norm.scale}>
      <primitive object={scene} />
      {children(found)}
    </group>
  );
}
useGLTF.preload("/models/office-computer.glb");
