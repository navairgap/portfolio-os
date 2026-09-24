import { create } from "zustand";

export type AppId =
  | "terminal" | "files" | "about" | "gallery" | "editor"
  | "monitor" | "mail" | "browser" | "settings";

export interface AppWindow {
  id: number;
  appId: AppId;
  title: string;
  x: number; y: number;
  width: number; height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  snap?: "left" | "right" | null;
  payload?: string;
}

interface OSState {
  phase: "boot" | "login" | "desktop";
  workspace: number;             // 0 work, 1 gallery, 2 contact
  dark: boolean;
  accent: string;
  wallpaper: number;
  windows: AppWindow[];
  focused: number | null;
  zTop: number;
  booted: boolean;

  setPhase: (p: "boot" | "login" | "desktop") => void;
  setWorkspace: (w: number) => void;
  toggleTheme: () => void;
  setAccent: (a: string) => void;
  setWallpaper: (w: number) => void;

  openApp: (appId: AppId, payload?: string) => void;
  closeWindow: (id: number) => void;
  focusWindow: (id: number) => void;
  minimizeWindow: (id: number) => void;
  toggleMaximize: (id: number) => void;
  setGeom: (id: number, g: Partial<Pick<AppWindow, "x" | "y" | "width" | "height" | "snap" | "maximized">>) => void;
  cycleWindows: () => void;
  closeTop: () => void;
}

const APP_META: Record<AppId, { title: string; w: number; h: number }> = {
  terminal: { title: "Terminal", w: 640, h: 420 },
  files: { title: "Files", w: 720, h: 460 },
  about: { title: "About This System", w: 640, h: 480 },
  gallery: { title: "Image Viewer", w: 780, h: 520 },
  editor: { title: "Text Editor — resume.txt", w: 640, h: 520 },
  monitor: { title: "System Monitor", w: 560, h: 440 },
  mail: { title: "Mail", w: 780, h: 500 },
  browser: { title: "Web", w: 760, h: 520 },
  settings: { title: "Settings", w: 640, h: 480 },
};

let nextId = 1;
let spawnOffset = 0;

export const useOS = create<OSState>((set, get) => ({
  phase: "boot",
  workspace: 0,
  dark: true,
  accent: "#F5A623",
  wallpaper: 0,
  windows: [],
  focused: null,
  zTop: 10,
  booted: typeof sessionStorage !== "undefined" && sessionStorage.getItem("os.booted") === "1",

  setPhase: (p) => {
    if (p === "desktop" && typeof sessionStorage !== "undefined") sessionStorage.setItem("os.booted", "1");
    set({ phase: p });
  },
  setWorkspace: (w) => set({ workspace: w }),
  toggleTheme: () => set((s) => ({ dark: !s.dark })),
  setAccent: (a) => set({ accent: a }),
  setWallpaper: (w) => set({ wallpaper: w }),

  openApp: (appId, payload) => {
    const s = get();
    // focus existing window of same app+payload on this workspace
    const existing = s.windows.find((w) => w.appId === appId && !w.minimized && w.payload === payload);
    if (existing) { get().focusWindow(existing.id); return; }
    const meta = APP_META[appId];
    spawnOffset = (spawnOffset + 1) % 6;
    const id = nextId++;
    const win: AppWindow = {
      id, appId, title: payload ? `${meta.title}` : meta.title,
      x: Math.max(20, 120 + spawnOffset * 30 - meta.w / 2),
      y: 90 + spawnOffset * 26,
      width: meta.w, height: meta.h,
      z: s.zTop + 1, minimized: false, maximized: false, snap: null, payload,
    };
    set({ windows: [...s.windows, win], focused: id, zTop: s.zTop + 1 });
  },

  closeWindow: (id) => set((s) => {
    const wins = s.windows.filter((w) => w.id !== id);
    return { windows: wins, focused: s.focused === id ? (wins.length ? wins[wins.length - 1].id : null) : s.focused };
  }),
  focusWindow: (id) => set((s) => ({
    focused: id, zTop: s.zTop + 1,
    windows: s.windows.map((w) => (w.id === id ? { ...w, z: s.zTop + 1, minimized: false } : w)),
  })),
  minimizeWindow: (id) => set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)) })),
  toggleMaximize: (id) => set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)) })),
  setGeom: (id, g) => set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, ...g } : w)) })),

  cycleWindows: () => set((s) => {
    const open = s.windows.filter((w) => !w.minimized);
    if (open.length < 2) return {};
    const idx = open.findIndex((w) => w.id === s.focused);
    const nxt = open[(idx + 1) % open.length];
    return { focused: nxt.id, zTop: s.zTop + 1, windows: s.windows.map((w) => (w.id === nxt.id ? { ...w, z: s.zTop + 1 } : w)) };
  }),
  closeTop: () => { const s = get(); if (s.focused != null) s.closeWindow(s.focused); },
}));

export const APP_ORDER: AppId[] = ["terminal", "files", "about", "gallery", "editor", "monitor", "mail", "browser", "settings"];
