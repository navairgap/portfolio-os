import { useRef, useState } from "react";

export type SnapZone = "left" | "right" | "top" | null;

export function useWindowSnap() {
  const [zone, setZone] = useState<SnapZone>(null);
  const zoneRef = useRef<SnapZone>(null);
  const update = (cx: number, cy: number) => {
    let z: SnapZone = null;
    if (cy <= 20) z = "top";
    else if (cx <= 20) z = "left";
    else if (cx >= innerWidth - 20) z = "right";
    if (z !== zoneRef.current) { zoneRef.current = z; setZone(z); }
  };
  const clear = () => { zoneRef.current = null; setZone(null); };
  return { zone, update, clear, zoneRef };
}

export function snapRect(z: SnapZone) {
  const H = innerHeight - 32;
  if (z === "left") return { x: 0, y: 32, width: innerWidth / 2, height: H };
  if (z === "right") return { x: innerWidth / 2, y: 32, width: innerWidth / 2, height: H };
  if (z === "top") return { x: 0, y: 32, width: innerWidth, height: H };
  return null;
}
