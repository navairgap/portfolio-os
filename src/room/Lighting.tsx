import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Lighting({ screenPos }: { screenPos: [number, number, number] }) {
  const lamp = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => { if (lamp.current) lamp.current.intensity = 2.5 + Math.sin(clock.elapsedTime * 7) * 0.06; });
  return (<>
    <ambientLight color="#40404c" intensity={0.55} />
    <directionalLight position={[-3, 4, -2]} intensity={0.5} color="#7c8aa8" />
    <pointLight ref={lamp} position={[screenPos[0] + 0.7, screenPos[1] + 0.5, screenPos[2] + 0.4]} color="#ffb06b" intensity={30} distance={9} decay={2} castShadow shadow-mapSize={[512, 512]} />
    <pointLight position={[screenPos[0], screenPos[1], screenPos[2] + 0.2]} color="#8fb8ff" intensity={9} distance={4} decay={2} />
  </>);
}
