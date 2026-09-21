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
        className="fixed z-[180] w-56 bg-black border border-[var(--border-strong)] p-1"
        style={{ left: x, top: y }}>
        {menu.items.map((it, i) => it.sep ? <div key={i} className="my-1 text-[10px] text-[var(--text-tertiary)] leading-none px-3 select-none">{"─".repeat(24)}</div> : (
          <button key={i} role="menuitem" disabled={it.disabled} onClick={() => { setMenu(null); it.action?.(); }}
            className={`w-full text-left px-3 py-[6px] text-[12px] uppercase tracking-[.04em]
              ${it.disabled ? "text-[var(--text-tertiary)] opacity-40" : "text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-black"}`}>
            {it.label}
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
