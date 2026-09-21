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

// --- upgraded: corners + preview store integration ---
import { useSnapPreview } from "../features/snapPreview/SnapPreview";

export type SnapZone2 = "left" | "right" | "top" | "tl" | "tr" | "bl" | "br" | null;

export function zoneRect(z: SnapZone2): { x: number; y: number; width: number; height: number } | null {
  const H = innerHeight - 32, W = innerWidth, hw = W / 2, hh = H / 2;
  switch (z) {
    case "left": return { x: 0, y: 32, width: hw, height: H };
    case "right": return { x: hw, y: 32, width: hw, height: H };
    case "top": return { x: 0, y: 32, width: W, height: H };
    case "tl": return { x: 0, y: 32, width: hw, height: hh };
    case "tr": return { x: hw, y: 32, width: hw, height: hh };
    case "bl": return { x: 0, y: 32 + hh, width: hw, height: hh };
    case "br": return { x: hw, y: 32 + hh, width: hw, height: hh };
    default: return null;
  }
}

export function updateSnap2(cx: number, cy: number): SnapZone2 {
  const W = innerWidth, H = innerHeight - 32;
  let z: SnapZone2 = null;
  const corner = 90;
  if (cy <= corner && cx <= corner) z = "tl";
  else if (cy <= corner && cx >= W - corner) z = "tr";
  else if (cy >= H + 32 - corner && cx <= corner) z = "bl";
  else if (cy >= H + 32 - corner && cx >= W - corner) z = "br";
  else if (cy <= 20) z = "top";
  else if (cx <= 20) z = "left";
  else if (cx >= W - 20) z = "right";
  useSnapPreview.getState().set(z ? zoneRect(z) : null);
  return z;
}
export function clearSnap2() { useSnapPreview.getState().set(null); }
