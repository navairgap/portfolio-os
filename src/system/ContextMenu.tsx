import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface MenuItem { label: string; action?: () => void; disabled?: boolean; danger?: boolean; sep?: boolean }
interface MenuState { x: number; y: number; items: MenuItem[] }

let openFn: ((m: MenuState | null) => void) | null = null;
export function openContextMenu(x: number, y: number, items: MenuItem[]) { openFn?.({ x, y, items }); }

export default function ContextMenu() {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { openFn = setMenu; return () => { openFn = null; }; }, []);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMenu(null); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    addEventListener("mousedown", close); addEventListener("keydown", esc);
    addEventListener("blur", () => setMenu(null));
    return () => { removeEventListener("mousedown", close); removeEventListener("keydown", esc); };
  }, [menu]);

  if (!menu) return null;
  const x = Math.min(menu.x, innerWidth - 210), y = Math.min(menu.y, innerHeight - menu.items.length * 32 - 16);
  return (
    <AnimatePresence>
      <motion.div ref={ref} role="menu" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .1 }}
        className="fixed z-[180] w-52 rounded-[8px] bg-[rgba(20,20,24,.95)] backdrop-blur-xl border border-[rgba(255,255,255,.08)] shadow-[0_8px_24px_rgba(0,0,0,.4)] p-1.5"
        style={{ left: x, top: y }}>
        {menu.items.map((it, i) => it.sep ? <div key={i} className="my-1 h-px bg-[rgba(255,255,255,.08)]" /> : (
          <button key={i} role="menuitem" disabled={it.disabled} onClick={() => { setMenu(null); it.action?.(); }}
            className={`w-full text-left px-3 py-[7px] rounded-[6px] text-[13px] font-medium
              ${it.disabled ? "text-[rgba(244,244,245,.28)]" : it.danger ? "text-[#ff5c5c] hover:bg-[rgba(255,92,92,.12)]" : "text-[#f4f4f5] hover:bg-[rgba(255,255,255,.08)]"}`}>
            {it.label}
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
