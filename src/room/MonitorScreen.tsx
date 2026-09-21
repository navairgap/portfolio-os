import { Html } from "@react-three/drei";
import { useWindows } from "../store/useWindowStore";
import { useSettings } from "../store/useSettingsStore";
import { WALLPAPERS } from "../data/wallpapers";
import { APPS } from "../registry/appRegistry";

// READ-ONLY live preview of the real OS state, rendered on the CRT.
function ScreenPreview({ onEnter }: { onEnter: () => void }) {
  const { windows, activeWorkspace } = useWindows();
  const s = useSettings();
  const wp = WALLPAPERS[s.wallpaper] || WALLPAPERS[0];
  const VW = 1280, VH = 800;
  const clock = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return (
    <div onClick={onEnter} title="click to take the desk"
      style={{ width: VW, height: VH, background: "#000", color: "#e6e6e6", fontFamily: "JetBrains Mono, monospace", position: "relative", overflow: "hidden", cursor: "pointer" }}>
      <div style={{ position: "absolute", inset: 0, background: wp.css.includes("gradient") ? "#0a0a0c" : "#050507" }} />
      {s.wallpaper === 9 && <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,255,156,.12) 0 2px, transparent 2px 5px)" }} />}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 24, background: "rgba(5,5,7,.85)", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 10, padding: "0 10px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>
        <span style={{ color: "#ff2b2b" }}>█</span>
        <span style={{ color: "rgba(230,230,230,.4)" }}>[ workspace {activeWorkspace + 1} ]</span>
        <span style={{ marginLeft: "auto", color: "#00ff9c" }}>{clock}</span>
      </div>
      {windows.filter((w) => w.workspaceId === activeWorkspace && !w.isMinimized).map((w) => {
        const app = APPS.find((a) => a.id === w.appId);
        return (
          <div key={w.id} style={{
            position: "absolute", left: (w.x / innerWidth) * VW * 0.8 + 20, top: (w.y / innerHeight) * VH * 0.7 + 30,
            width: Math.max(90, (w.width / innerWidth) * VW * 0.62), height: Math.max(60, (w.height / innerHeight) * VH * 0.6),
            background: "#0b0b0e", border: `1px solid ${w.isFocused ? "#ff2b2b" : "rgba(255,255,255,.12)"}`,
            borderLeft: `3px solid ${w.isFocused ? "#ff2b2b" : "rgba(255,255,255,.2)"}`,
          }}>
            <div style={{ height: 20, background: "#131317", borderBottom: "1px solid rgba(255,255,255,.04)", fontSize: 10, padding: "3px 6px", textTransform: "uppercase", letterSpacing: ".06em", color: w.isFocused ? "#ff2b2b" : "rgba(230,230,230,.4)" }}>{app?.title || w.title}</div>
            <div style={{ padding: 6, fontSize: 10, color: "rgba(230,230,230,.35)" }}>{w.appId === "terminal" ? "navairgap@blackarch:~$ █" : ""}</div>
          </div>
        );
      })}
      {!windows.length && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 13, color: "rgba(230,230,230,.35)" }}>desktop idle — click to take the desk</div>}
      <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "rgba(255,43,43,.8)", textTransform: "uppercase", letterSpacing: ".2em" }}>click to take control</div>
    </div>
  );
}

// Beige CRT monitor; the screen is an Html plane displaying the live preview.
export default function MonitorScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <group position={[0, 1.18, -1.55]} rotation={[0, 0, 0]}>
      {/* monitor body */}
      <mesh position={[0, 0, -0.14]}>
        <boxGeometry args={[1.36, 1.02, 0.5]} />
        <meshStandardMaterial color="#c8c0b0" roughness={0.75} />
      </mesh>
      {/* bezel */}
      <mesh position={[0, 0, 0.12]}>
        <boxGeometry args={[1.3, 0.96, 0.06]} />
        <meshStandardMaterial color="#b8b0a0" roughness={0.7} />
      </mesh>
      {/* screen surface */}
      <mesh position={[0, 0.02, 0.16]}>
        <boxGeometry args={[1.12, 0.78, 0.02]} />
        <meshStandardMaterial color="#050505" roughness={0.35} metalness={0.1} emissive="#0a0f0a" emissiveIntensity={0.4} />
      </mesh>
      {/* stand */}
      <mesh position={[0, -0.62, -0.16]}>
        <boxGeometry args={[0.5, 0.16, 0.4]} />
        <meshStandardMaterial color="#c8c0b0" roughness={0.8} />
      </mesh>
      {/* power LED */}
      <mesh position={[0.52, -0.42, 0.16]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color="#00ff9c" emissive="#00ff9c" emissiveIntensity={2} />
      </mesh>
      {/* Html screen (slightly inside bezel, curved illusion via scale) */}
      <Html transform occlude position={[0, 0.02, 0.175]} scale={0.088} zIndexRange={[10, 0]}>
        <ScreenPreview onEnter={onEnter} />
      </Html>
      {/* subtle glass reflection */}
      <mesh position={[-0.28, 0.24, 0.168]} rotation={[0, 0, -0.5]}>
        <planeGeometry args={[0.5, 0.08]} />
        <meshBasicMaterial color="rgba(255,255,255,0.05)" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}
