import { useRef } from "react";
import * as THREE from "three";

export interface CamMode { pos: [number, number, number]; target: [number, number, number] }
export const MODES: Record<"desk" | "room", CamMode> = {
  desk: { pos: [0, 1.35, 0.4], target: [0, 1.25, -1.2] },
  room: { pos: [2.6, 2.4, 2.8], target: [0, 1.1, -1.4] },
};

// simple animated transition between modes (ease [0.4,0,0.2,1], 800ms)
export function useCameraModes() {
  const anim = useRef<{ from: THREE.Vector3; to: THREE.Vector3; fromT: THREE.Vector3; toT: THREE.Vector3; t0: number } | null>(null);
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const flyTo = (camera: THREE.PerspectiveCamera, mode: CamMode) => {
    anim.current = {
      from: camera.position.clone(), to: new THREE.Vector3(...mode.pos),
      fromT: new THREE.Vector3().copy(camera.userData.target || new THREE.Vector3(0, 1, 0)),
      toT: new THREE.Vector3(...mode.target), t0: performance.now(),
    };
  };
  const tick = (camera: THREE.PerspectiveCamera, controls: { target: THREE.Vector3; update: () => void } | null) => {
    const a = anim.current;
    if (!a) return;
    const t = Math.min(1, (performance.now() - a.t0) / 800);
    const e = ease(t);
    camera.position.lerpVectors(a.from, a.to, e);
    const tgt = new THREE.Vector3().lerpVectors(a.fromT, a.toT, e);
    if (controls) { controls.target.copy(tgt); controls.update(); }
    else camera.lookAt(tgt);
    camera.userData.target = tgt;
    if (t >= 1) anim.current = null;
  };
  return { flyTo, tick };
}
