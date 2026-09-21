import { Html } from "@react-three/drei";
import { useWindows } from "../store/useWindowStore";
import { useSettings } from "../store/useSettingsStore";
import { WALLPAPERS } from "../data/wallpapers";
import { APPS } from "../registry/appRegistry";
import type { Found } from "./OfficeRoom";
import * as THREE from "three";

function ScreenPreview({ onEnter }: { onEnter: () => void }) {
  const { windows, activeWorkspace } = useWindows();
  const s = useSettings();
  const wp = WALLPAPERS[s.wallpaper] || WALLPAPERS[0];
  const VW = 1024, VH = 768;
  const clock = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return (
    <div onClick={onEnter} title="click to take the desk"
      style={{ width: VW, height: VH, background: "#000", color: "#e6e6e6", fontFamily: "JetBrains Mono, monospace", position: "relative", overflow: "hidden", cursor: "pointer" }}>
      <div style={{ position: "absolute", inset: 0, background: wp.css.includes("gradient") ? "#0a0a0c" : "#050507" }} />
      {s.wallpaper === 9 && <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,255,156,.12) 0 2px, transparent 2px 5px)" }} />}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 22, background: "rgba(5,5,7,.85)", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 10, padding: "0 10px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>
        <span style={{ color: "#ff2b2b" }}>█</span>
        <span style={{ color: "rgba(230,230,230,.4)" }}>[ workspace {activeWorkspace + 1} ]</span>
        <span style={{ marginLeft: "auto", color: "#00ff9c" }}>{clock}</span>
      </div>
      {windows.filter((w) => w.workspaceId === activeWorkspace && !w.isMinimized).map((w) => {
        const app = APPS.find((a) => a.id === w.appId);
        return (
          <div key={w.id} style={{
            position: "absolute", left: (w.x / innerWidth) * VW * 0.8 + 20, top: (w.y / innerHeight) * VH * 0.7 + 26,
            width: Math.max(80, (w.width / innerWidth) * VW * 0.62), height: Math.max(56, (w.height / innerHeight) * VH * 0.6),
            background: "#0b0b0e", border: `1px solid ${w.isFocused ? "#ff2b2b" : "rgba(255,255,255,.12)"}`, borderLeft: `3px solid ${w.isFocused ? "#ff2b2b" : "rgba(255,255,255,.2)"}`,
          }}>
            <div style={{ height: 18, background: "#131317", borderBottom: "1px solid rgba(255,255,255,.04)", fontSize: 10, padding: "2px 6px", textTransform: "uppercase", letterSpacing: ".06em", color: w.isFocused ? "#ff2b2b" : "rgba(230,230,230,.4)" }}>{app?.title || w.title}</div>
            <div style={{ padding: 6, fontSize: 10, color: "rgba(230,230,230,.35)" }}>{w.appId === "terminal" ? "navairgap@blackarch:~$ █" : ""}</div>
          </div>
        );
      })}
      {!windows.length && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 13, color: "rgba(230,230,230,.35)" }}>desktop idle — click to take the desk</div>}
      <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "rgba(255,43,43,.8)", textTransform: "uppercase", letterSpacing: ".2em" }}>click to take control</div>
      {/* CSS scanlines + CRT inner shade */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 3px)" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: "inset 0 0 60px rgba(0,0,0,.55)" }} />
    </div>
  );
}

// Black plane hiding the baked Windows wallpaper + <Html transform occlude> OS preview.
export default function MonitorScreen({ found, onEnter }: { found: Found; onEnter: () => void }) {
  const { screenPos, front, screenW, screenH } = found;
  return (
    <group position={screenPos.toArray()}>
      <mesh>
        <planeGeometry args={[screenW, screenH]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <group quaternion={new THREE_QuatFromDir(front)}>
        <Html transform occlude position={[0, 0, 0.002]} scale={screenW / 1024} zIndexRange={[10, 0]}>
          <ScreenPreview onEnter={onEnter} />
        </Html>
      </group>
    </group>
  );
}
// build a quaternion facing `dir` (plane +z toward dir)
function THREE_QuatFromDir(dir: THREE.Vector3): THREE.Quaternion {
  return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
}
