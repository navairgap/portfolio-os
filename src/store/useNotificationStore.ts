import { create } from "zustand";
import type { OSNotification } from "../types";

interface NState {
  list: OSNotification[];
  push: (n: Omit<OSNotification, "id" | "ts">) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}
export const useNotifications = create<NState>((set) => ({
  list: [],
  push: (n) => set((s) => ({ list: [{ ...n, id: Math.random().toString(36).slice(2), ts: Date.now() }, ...s.list].slice(0, 50) })),
  dismiss: (id) => set((s) => ({ list: s.list.filter((n) => n.id !== id) })),
  clear: () => set({ list: [] }),
}));
