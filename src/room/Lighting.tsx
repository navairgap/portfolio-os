import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Lighting({ screenPos }: { screenPos: [number, number, number] }) {
  const lamp = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => { if (lamp.current) lamp.current.intensity = 2.5 + Math.sin(clock.elapsedTime * 7) * 0.06; });
  return (<>
    <ambientLight color="#1a1a22" intensity={0.15} />
    <pointLight ref={lamp} position={[screenPos[0] + 0.7, screenPos[1] + 0.5, screenPos[2] + 0.4]} color="#ffb06b" intensity={2.5} distance={5} decay={2} castShadow shadow-mapSize={[1024, 1024]} />
    <pointLight position={[screenPos[0], screenPos[1], screenPos[2] + 0.2]} color="#7c9cff" intensity={1.2} distance={2.5} decay={2} />
  </>);
}
