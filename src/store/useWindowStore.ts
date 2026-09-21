import { create } from "zustand";
import type { WindowState } from "../types";
import { saveLS, loadLS } from "../lib/persistence";

interface WState {
  windows: WindowState[];
  activeWorkspace: number;
  zCounter: number;
  openWindow: (w: Omit<WindowState, "id" | "zIndex" | "isFocused" | "isMinimized" | "isMaximized">) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, x: number, y: number, w: number, h: number) => void;
  setWorkspace: (ws: number) => void;
  closeAll: () => void;
}

const persistSession = (windows: WindowState[], ws: number) =>
  saveLS("os.session", {
    windows: windows.map((w) => ({ ...w, isFocused: false, zIndex: 0 })),
    activeWorkspace: ws,
  });

export const useWindows = create<WState>((set, get) => ({
  windows: [],
  activeWorkspace: 0,
  zCounter: 10,

  openWindow: (w) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => {
      const z = s.zCounter + 1;
      const win: WindowState = {
        ...w, id, zIndex: z, isFocused: true, isMinimized: false, isMaximized: false,
      };
      const windows = [...s.windows.map((o) => ({ ...o, isFocused: false })), win];
      persistSession(windows, s.activeWorkspace);
      return { windows, zCounter: z };
    });
    return id;
  },
  closeWindow: (id) =>
    set((s) => {
      const windows = s.windows.filter((w) => w.id !== id);
      persistSession(windows, s.activeWorkspace);
      return { windows };
    }),
  focusWindow: (id) =>
    set((s) => {
      const z = s.zCounter + 1;
      const windows = s.windows.map((w) => ({ ...w, isFocused: w.id === id, isMinimized: w.id === id ? false : w.isMinimized, zIndex: w.id === id ? z : w.zIndex }));
      persistSession(windows, s.activeWorkspace);
      return { windows, zCounter: z };
    }),
  minimizeWindow: (id) =>
    set((s) => {
      const windows = s.windows.map((w) => (w.id === id ? { ...w, isMinimized: true, isFocused: false } : w));
      persistSession(windows, s.activeWorkspace);
      return { windows };
    }),
  restoreWindow: (id) => get().focusWindow(id),
  toggleMaximize: (id) =>
    set((s) => {
      const windows = s.windows.map((w) => {
        if (w.id !== id) return w;
        if (w.isMaximized) return { ...w, isMaximized: false, ...(w.prevRect || {}) };
        return { ...w, isMaximized: true, prevRect: { x: w.x, y: w.y, width: w.width, height: w.height }, x: 0, y: 0, width: innerWidth, height: innerHeight - 32 };
      });
      persistSession(windows, s.activeWorkspace);
      return { windows };
    }),
  moveWindow: (id, x, y) => set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)) })),
  resizeWindow: (id, x, y, width, height) => set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, x, y, width, height } : w)) })),
  setWorkspace: (ws) =>
    set((s) => {
      persistSession(s.windows, ws);
      return { activeWorkspace: ws };
    }),
  closeAll: () => { persistSession([], 0); set({ windows: [], activeWorkspace: 0 }); },
}));

export function restoreSession() {
  const s = loadLS<{ windows: WindowState[]; activeWorkspace: number } | null>("os.session", null);
  if (!s) return;
  useWindows.setState({ windows: s.windows.map((w, i) => ({ ...w, isFocused: false, zIndex: i + 1 })), activeWorkspace: s.activeWorkspace, zCounter: s.windows.length + 1 });
}
