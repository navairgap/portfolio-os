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

  useFrame(({ clock }, dt) => {
    idle.current += dt;
    const c = controls.current as any;
    if (!c || mode !== "desk") return;
    const t = clock.elapsedTime;
    const bob = idle.current > 5 && !matchMedia("(prefers-reduced-motion: reduce)").matches ? Math.sin(t * (Math.PI * 2) / 4) * 0.005 : 0;
    const pan = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1;
    const cx = Math.sin(mouse.current.x * 3 * Math.PI / 180) * 0.9;
    const cy = -mouse.current.y * 3 * Math.PI / 180 * 0.6;
    c.azimuthAngle = cx * pan;
    c.polarAngle = Math.PI / 2 - 0.12 + cy * pan;
    c.setPosition(DESK()[0] + bob, DESK()[1] + bob, DESK()[2], false);
  });
  return <CameraControls ref={controls as any} makeDefault enabled={false} minDistance={0.3} maxDistance={9} />;
}
