import { create } from "zustand";

interface SnapRect { x: number; y: number; width: number; height: number }
interface SnapState { rect: SnapRect | null; set: (r: SnapRect | null) => void }
export const useSnapPreview = create<SnapState>((set) => ({ rect: null, set: (rect) => set({ rect }) }));

export default function SnapPreview() {
  const rect = useSnapPreview((s) => s.rect);
  if (!rect) return null;
  return (
    <div className="fixed z-[140] rounded-[4px] pointer-events-none transition-all duration-150"
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height, background: "color-mix(in srgb, var(--accent) 20%, transparent)", border: "1px solid var(--accent)" }} />
  );
}
