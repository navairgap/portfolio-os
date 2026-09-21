import { create } from "zustand";
import type { OSPhase } from "../types";

interface SState {
  phase: OSPhase;
  setPhase: (p: OSPhase) => void;
  launcherOpen: boolean;
  setLauncherOpen: (v: boolean) => void;
  overviewOpen: boolean;
  setOverviewOpen: (v: boolean) => void;
  menu: string | null; // 'power' | 'wifi' | 'volume' | 'battery' | 'bell' | null
  setMenu: (m: string | null) => void;
  altTab: boolean;
  setAltTab: (v: boolean) => void;
}
export const useSession = create<SState>((set) => ({
  phase: "boot",
  setPhase: (p) => set({ phase: p }),
  launcherOpen: false,
  setLauncherOpen: (v) => set({ launcherOpen: v }),
  overviewOpen: false,
  setOverviewOpen: (v) => set({ overviewOpen: v }),
  menu: null,
  setMenu: (m) => set({ menu: m }),
  altTab: false,
  setAltTab: (v) => set({ altTab: v }),
}));
