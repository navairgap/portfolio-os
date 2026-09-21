import { useEffect, useRef } from "react";
import { CameraControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

export default function CameraRig({ mode, screenPos, chairPos }: { mode: "desk" | "room"; screenPos: [number, number, number]; chairPos: [number, number, number] }) {
  const controls = useRef<CameraControls | null>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const idle = useRef(0);
  const first = useRef(true);

  useEffect(() => {
    const h = (e: MouseEvent) => { mouse.current = { x: (e.clientX / innerWidth - 0.5) * 2, y: (e.clientY / innerHeight - 0.5) * 2 }; idle.current = 0; };
    addEventListener("mousemove", h);
    return () => removeEventListener("mousemove", h);
  }, []);

  const DESK = (): [number, number, number] => {
    const dir: [number, number, number] = [chairPos[0] - screenPos[0], 0, chairPos[2] - screenPos[2]];
    const len = Math.hypot(dir[0], dir[2]) || 1;
    const nx = dir[0] / len, nz = dir[2] / len;
    return [chairPos[0] + nx * 0.35, 1.6, chairPos[2] + nz * 0.35];
  };
  const ROOM: [number, number, number] = [screenPos[0] + (chairPos[0] - screenPos[0]) * 1.9, 2.6, screenPos[2] + (chairPos[2] - screenPos[2]) * 1.9];

  useEffect(() => {
    const c = controls.current as any; if (!c) return;
    const tgt = screenPos;
    const p = mode === "desk" ? DESK() : ROOM;
    if (first.current) { c.setLookAt(p[0], p[1], p[2], tgt[0], tgt[1], tgt[2], false); first.current = false; return; }
    c.setLookAt(p[0], p[1], p[2], tgt[0], tgt[1], tgt[2], true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, screenPos[0], screenPos[1], screenPos[2]]);

  const par = useRef({ x: 0, y: 0 });
  useFrame(({ clock }, dt) => {
    const c = controls.current as any;
    if (!c) return;
    idle.current += dt;
    const t = clock.elapsedTime;
    const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bob = !rm && idle.current > 5 && mode === "desk" ? Math.sin(t * (Math.PI * 2) / 4) * 0.004 : 0;
    const k = Math.min(1, dt * 6);
    const amp = rm ? 0 : mode === "desk" ? 0.14 : 0.3;
    par.current.x += (mouse.current.x * amp - par.current.x) * k;
    par.current.y += (-mouse.current.y * amp * 0.6 - par.current.y) * k;
    const base = mode === "desk" ? DESK() : ROOM;
    c.setPosition(base[0] + par.current.x, base[1] + par.current.y + bob, base[2], false);
  });
  return <CameraControls ref={controls as any} makeDefault enabled={false} minDistance={0.3} maxDistance={9} />;
}
