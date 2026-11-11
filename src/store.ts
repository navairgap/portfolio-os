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

// Window z-indices keep growing as windows are raised, so they are
// renormalized before they can climb past the desktop chrome (panel, dock,
// and menus all use z-index 60+).
const Z_FLOOR = 10;
const Z_CEILING = 50;

function renormalizeZ(windows: AppWindow[]): { windows: AppWindow[]; zTop: number } {
  const sorted = [...windows].sort((left, right) => left.z - right.z);
  let z = Z_FLOOR;
  const out = sorted.map((w) => ({ ...w, z: ++z }));
  return { windows: out, zTop: z };
}

function readBootedFlag(): boolean {
  try {
    return typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem("os.booted") === "1";
  } catch {
    // Storage can be disabled by browser privacy settings or sandbox policy.
    return false;
  }
}

function persistBootedFlag(): void {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("os.booted", "1");
    }
  } catch {
    // The desktop should remain usable even when session storage is unavailable.
  }
}

// Appearance preferences survive a reload; every restored value is re-run
// through the same validation the setters apply.
const PREFS_KEY = "os.prefs";

interface Prefs {
  dark?: boolean;
  accent?: string;
  wallpaper?: number;
}

function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    const out: Prefs = {};
    if (typeof parsed.dark === "boolean") out.dark = parsed.dark;
    if (typeof parsed.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(parsed.accent)) out.accent = parsed.accent.toUpperCase();
    if (typeof parsed.wallpaper === "number" && Number.isSafeInteger(parsed.wallpaper) && parsed.wallpaper >= 0 && parsed.wallpaper < 4) out.wallpaper = parsed.wallpaper;
    return out;
  } catch {
    // Corrupt or unavailable storage just means defaults.
    return {};
  }
}

function persistPrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Storage can be disabled (privacy mode); never break the desktop over it.
  }
}

const prefs = readPrefs();

export const useOS = create<OSState>((set, get) => ({
  phase: "boot",
  workspace: 0,
  dark: prefs.dark ?? true,
  accent: prefs.accent ?? "#F5A623",
  wallpaper: prefs.wallpaper ?? 0,
  windows: [],
  focused: null,
  zTop: 10,
  booted: readBootedFlag(),

  setPhase: (p) => {
    if (p === "desktop") persistBootedFlag();
    set({ phase: p });
  },
  setWorkspace: (w) => {
    if (!Number.isInteger(w) || w < 0 || w > 2) return;
    set({ workspace: w });
  },
  toggleTheme: () => {
    set((s) => ({ dark: !s.dark }));
    persistPrefs({ dark: get().dark, accent: get().accent, wallpaper: get().wallpaper });
  },
  setAccent: (a) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(a)) return;
    set({ accent: a.toUpperCase() });
    persistPrefs({ dark: get().dark, accent: get().accent, wallpaper: get().wallpaper });
  },
  setWallpaper: (w) => {
    // Desktop.tsx defines exactly four bundled wallpaper variants.
    if (!Number.isSafeInteger(w) || w < 0 || w >= 4) return;
    set({ wallpaper: w });
    persistPrefs({ dark: get().dark, accent: get().accent, wallpaper: get().wallpaper });
  },

  openApp: (appId, payload) => {
    const s = get();
    // focus existing window of same app+payload (restores if minimized) — never duplicate
    const existing = s.windows.find((w) => w.appId === appId && w.payload === payload);
    if (existing) {
      get().focusWindow(existing.id);
      const ws = workspaceOf(appId);
      if (get().workspace !== ws) set({ workspace: ws });
      return;
    }
    const meta = APP_META[appId];
    if (!meta) return;
    spawnOffset = (spawnOffset + 1) % 6;
    const id = nextId++;
    const nextZ = s.zTop + 1;
    const { windows: base, zTop } = nextZ >= Z_CEILING ? renormalizeZ(s.windows) : { windows: s.windows, zTop: s.zTop };
    const win: AppWindow = {
      id, appId, title: payload ? `${meta.title} — ${payload}` : meta.title,
      x: Math.max(20, 120 + spawnOffset * 30 - meta.w / 2),
      y: 90 + spawnOffset * 26,
      width: meta.w, height: meta.h,
      z: zTop + 1, minimized: false, maximized: false, snap: null, payload,
    };
    set({ windows: [...base, win], focused: id, zTop: zTop + 1, workspace: workspaceOf(appId) });
  },

  closeWindow: (id) => set((s) => {
    const wins = s.windows.filter((w) => w.id !== id);
    const nextFocused = [...wins]
      .filter((w) => !w.minimized)
      .sort((a, b) => b.z - a.z)[0];
    return {
      windows: wins,
      focused: s.focused === id ? (nextFocused?.id ?? null) : s.focused,
    };
  }),
  focusWindow: (id) => set((s) => {
    // A stale window id must never leave focused pointing at a missing window.
    if (!s.windows.some((w) => w.id === id)) return {};
    const nextZ = s.zTop + 1;
    if (nextZ >= Z_CEILING) {
      const { windows, zTop } = renormalizeZ(s.windows);
      return {
        focused: id,
        zTop,
        windows: windows.map((w) => (w.id === id ? { ...w, z: zTop, minimized: false } : w)),
      };
    }
    return {
      focused: id,
      zTop: nextZ,
      windows: s.windows.map((w) => (w.id === id ? { ...w, z: nextZ, minimized: false } : w)),
    };
  }),
  minimizeWindow: (id) => set((s) => {
    const windows = s.windows.map((w) =>
      w.id === id ? { ...w, minimized: true } : w
    );
    if (s.focused !== id) return { windows };
    const nextFocused = windows
      .filter((w) => !w.minimized)
      .sort((left, right) => right.z - left.z)[0];
    return { windows, focused: nextFocused?.id ?? null };
  }),
  toggleMaximize: (id) => set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)) })),
  setGeom: (id, g) => set((s) => {
    const safe: Partial<Pick<AppWindow, "x" | "y" | "width" | "height" | "snap" | "maximized">> = {};
    if (g.x !== undefined && Number.isFinite(g.x)) safe.x = g.x;
    if (g.y !== undefined && Number.isFinite(g.y)) safe.y = g.y;
    if (g.width !== undefined && Number.isFinite(g.width)) safe.width = Math.max(280, g.width);
    if (g.height !== undefined && Number.isFinite(g.height)) safe.height = Math.max(200, g.height);
    if (g.snap === null || g.snap === "left" || g.snap === "right") safe.snap = g.snap;
    if (typeof g.maximized === "boolean") safe.maximized = g.maximized;
    if (Object.keys(safe).length === 0) return {};
    return { windows: s.windows.map((w) => (w.id === id ? { ...w, ...safe } : w)) };
  }),

  cycleWindows: () => set((s) => {
    const open = s.windows.filter((w) => !w.minimized);
    if (open.length < 2) return {};
    const idx = open.findIndex((w) => w.id === s.focused);
    const nxt = open[(idx + 1) % open.length];
    const nextZ = s.zTop + 1;
    if (nextZ >= Z_CEILING) {
      const { windows, zTop } = renormalizeZ(s.windows);
      return {
        focused: nxt.id,
        zTop,
        windows: windows.map((w) => (w.id === nxt.id ? { ...w, z: zTop } : w)),
      };
    }
    return { focused: nxt.id, zTop: nextZ, windows: s.windows.map((w) => (w.id === nxt.id ? { ...w, z: nextZ } : w)) };
  }),
  closeTop: () => { const s = get(); if (s.focused != null) s.closeWindow(s.focused); },
}));

export const APP_ORDER: AppId[] = ["terminal", "files", "about", "gallery", "editor", "monitor", "mail", "browser", "settings"];

// Which workspace each app lives on: 0 work, 1 gallery, 2 contact.
const WORKSPACE_OF: Partial<Record<AppId, 0 | 1 | 2>> = {
  gallery: 1,
  mail: 2,
};

export function workspaceOf(appId: AppId): 0 | 1 | 2 {
  return WORKSPACE_OF[appId] ?? 0;
}
