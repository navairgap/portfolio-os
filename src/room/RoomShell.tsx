import { wallpaperTexture } from "./textures/wallpaper";
import { woodTexture } from "./textures/wood";

export default function RoomShell() {
  const wp = wallpaperTexture(), wood = woodTexture();
  return (<>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[12, 12]} /><meshStandardMaterial map={wood} roughness={0.9} /></mesh>
    <mesh position={[0, 3, -6]}><planeGeometry args={[12, 6]} /><meshStandardMaterial map={wp} /></mesh>
    <mesh position={[-6, 3, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[12, 6]} /><meshStandardMaterial map={wp} /></mesh>
    <mesh position={[6, 3, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[12, 6]} /><meshStandardMaterial map={wp} /></mesh>
    <mesh position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[12, 12]} /><meshStandardMaterial color="#141419" /></mesh>
  </>);
}
