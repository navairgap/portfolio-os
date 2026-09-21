import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Manual camera: no CameraControls dependency. Mode lerp + mouse parallax + idle bob.
export default function CameraRig({ mode, screenPos, chairPos }: { mode: "desk" | "room"; screenPos: [number, number, number]; chairPos: [number, number, number] }) {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const par = useRef({ x: 0, y: 0 });
  const idle = useRef(0);
  const anim = useRef<{ from: THREE.Vector3; to: THREE.Vector3; t0: number } | null>(null);
  const cur = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { mouse.current = { x: (e.clientX / innerWidth - 0.5) * 2, y: (e.clientY / innerHeight - 0.5) * 2 }; idle.current = 0; };
    addEventListener("mousemove", h);
    return () => removeEventListener("mousemove", h);
  }, []);

  const dir = new THREE.Vector3(chairPos[0] - screenPos[0], 0, chairPos[2] - screenPos[2]).normalize();
  const DESK = new THREE.Vector3(chairPos[0] + dir.x * 0.4, 1.5, chairPos[2] + dir.z * 0.4);
  const ROOM = new THREE.Vector3(screenPos[0] + dir.x * -2.6 + 0.6, 2.4, screenPos[2] + dir.z * -2.6);

  useEffect(() => {
    const target = mode === "desk" ? DESK : ROOM;
    if (!cur.current) { cur.current = target.clone(); camera.position.copy(target); return; }
    anim.current = { from: cur.current.clone(), to: target.clone(), t0: performance.now() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useFrame(({ clock }, dt) => {
    idle.current += dt;
    const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const base = mode === "desk" ? DESK : ROOM;
    const t = clock.elapsedTime;
    const bob = !rm && idle.current > 5 && mode === "desk" ? Math.sin(t * (Math.PI * 2) / 4) * 0.004 : 0;
    const k = Math.min(1, dt * 5);
    const amp = rm ? 0 : mode === "desk" ? 0.12 : 0.28;
    par.current.x += (mouse.current.x * amp - par.current.x) * k;
    par.current.y += (-mouse.current.y * amp * 0.6 - par.current.y) * k;
    let target = base.clone().add(new THREE.Vector3(par.current.x, par.current.y + bob, 0));
    const a = anim.current;
    if (a) {
      const p = Math.min(1, (performance.now() - a.t0) / 800);
      target = new THREE.Vector3().lerpVectors(a.from, a.to, ease(p)).add(new THREE.Vector3(par.current.x, par.current.y, 0));
      if (p >= 1) anim.current = null;
    }
    if (!cur.current) cur.current = target.clone();
    cur.current.lerp(target, Math.min(1, dt * 8));
    camera.position.copy(cur.current);
    camera.lookAt(screenPos[0], screenPos[1], screenPos[2]);
  });
  return null;
}
