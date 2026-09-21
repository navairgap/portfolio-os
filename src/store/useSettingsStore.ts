import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SettingsState } from "../types";

const prefersLight = matchMedia("(prefers-color-scheme: light)").matches;

export const useSettings = create<SettingsState & { set: (p: Partial<SettingsState>) => void }>()(
  persist(
    (set) => ({
      theme: prefersLight ? "light" : "dark",
      accent: "#7c9cff",
      wallpaper: 0,
      fontSize: "medium",
      animations: true,
      brightness: 100,
      nightLight: false,
      scale: 100,
      volume: 40,
      muted: false,
      startupSound: true,
      uiSounds: true,
      wifi: true,
      ethernet: false,
      displayName: "navairgap",
      avatar: null,
      hour12: false,
      showSeconds: false,
      dnd: false,
      skipBoot: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      powerDrain: true,
      widgets: { clock: true, weather: true, stats: false, note: true, now: false },
      aiKey: "",
      bootFull: "first",
      bootSound: true,
      loginMatrix: true,
      autoTerminal: true,
      showFastfetch: true,
      promptStyle: "blackarch",
      crtOverlay: true,
      chromaticAberration: true,
      sleepTimeout: "never",
      set: (p) => set(p),
    }),
    { name: "os.settings" }
  )
);

export function applySettings(s: SettingsState) {
  const r = document.documentElement;
  const theme = s.theme === "auto" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : s.theme;
  r.dataset.theme = theme;
  r.style.setProperty("--accent", s.accent);
  const fs = s.fontSize === "small" ? 12.5 : s.fontSize === "large" ? 15 : 14;
  r.style.fontSize = fs + "px";
  const filters: string[] = [];
  if (s.brightness < 100) filters.push(`brightness(${s.brightness}%)`);
  if (s.nightLight) filters.push("sepia(.25) hue-rotate(-15deg)");
  r.style.filter = filters.join(" ");
  (r.style as any).zoom = s.scale / 100;
  r.classList.toggle("no-anim", !s.animations);
  let crt = document.getElementById("crt-overlay");
  if (s.crtOverlay) {
    if (!crt) { crt = document.createElement("div"); crt.id = "crt-overlay"; document.body.appendChild(crt); }
  } else crt?.remove();
}
