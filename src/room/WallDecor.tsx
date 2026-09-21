import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { nightSkyTexture } from "./textures/nightSky";
import { posterTexture } from "./textures/poster";
import { clockTexture } from "./textures/clock";

export default function WallDecor() {
  const hour = useRef<HTMLDivElement | null>(null);
  const minute = useRef<any>(null);
  useFrame(() => {
    const d = new Date();
    if (minute.current) minute.current.rotation.z = -(d.getMinutes() / 60) * Math.PI * 2;
    const h = (hour.current as any)?.rotation;
  });
  return (<>
    <group position={[-2.6, 2.6, -5.97]}>
      <mesh><planeGeometry args={[1.5, 1.2]} /><meshBasicMaterial map={nightSkyTexture()} /></mesh>
      {[[0, 0.62, 1.6, 0.05], [0, -0.62, 1.6, 0.05], [-0.78, 0, 0.05, 1.3], [0.78, 0, 0.05, 1.3]].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x as number, y as number, 0.01]}><boxGeometry args={[w as number, h as number, 0.04]} /><meshStandardMaterial color="#2a2420" /></mesh>
      ))}
    </group>
    <mesh position={[2.2, 2.7, -5.97]}><planeGeometry args={[0.6, 0.9]} /><meshBasicMaterial map={posterTexture("SENTINEL WIFI", "#ff2b2b")} /></mesh>
    <mesh position={[3.2, 2.5, -5.97]} rotation={[0, 0, -0.04]}><planeGeometry args={[0.6, 0.9]} /><meshBasicMaterial map={posterTexture("AIRGAP OS", "#00ff9c")} /></mesh>
    <group position={[0.6, 3.6, -5.96]}>
      <mesh><circleGeometry args={[0.15, 24]} /><meshBasicMaterial map={clockTexture()} /></mesh>
      <mesh ref={minute as any} position={[0, 0, 0.004]}><boxGeometry args={[0.012, 0.11, 0.004]} /><meshBasicMaterial color="#1a1a1e" /></mesh>
      <mesh position={[0, 0, 0.006]} rotation={[0, 0, -2]}><boxGeometry args={[0.014, 0.075, 0.004]} /><meshBasicMaterial color="#7a1a1a" /></mesh>
    </group>
  </>);
}
