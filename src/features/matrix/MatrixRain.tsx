import { useEffect, useRef, useState } from "react";

export default function MatrixRain({ wallpaper = false, accent = "#3fbf7f", onPrompt }: { wallpaper?: boolean; accent?: string; onPrompt?: (set: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const c = ref.current!;
    c.width = innerWidth; c.height = innerHeight;
    const x = c.getContext("2d")!;
    const cols = Math.floor(c.width / 16);
    const drops = Array.from({ length: cols }, () => Math.random() * -50);
    const glyphs = "01アイウエオカキクケコサシスセソ<>[]{}$#";
    let raf = 0;
    const tick = () => {
      x.fillStyle = wallpaper ? "rgba(10,10,10,.1)" : "rgba(10,10,10,.14)";
      x.fillRect(0, 0, c.width, c.height);
      x.font = "14px monospace";
      for (let i = 0; i < cols; i++) {
        x.fillStyle = Math.random() < .03 ? "#ff5c5c" : accent;
        x.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * 16, drops[i] * 16);
        if (drops[i] * 16 > c.height && Math.random() > .975) drops[i] = 0;
        drops[i]++;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    let t2: ReturnType<typeof setTimeout>;
    if (!wallpaper) t2 = setTimeout(() => setShowPrompt(true), 5000);
    return () => { cancelAnimationFrame(raf); clearTimeout(t2); };
  }, [wallpaper, accent]);

  return (
    <div className={`fixed inset-0 z-[400] pointer-events-auto transition-opacity duration-700 ${fading ? "opacity-0" : "opacity-100"}`} style={{ background: "transparent" }}
      onClick={() => { if (wallpaper || showPrompt) return; setFading(true); setTimeout(onPrompt?.bind(null, false), 700); }}>
      <canvas ref={ref} className="absolute inset-0" />
      {!wallpaper && showPrompt && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4 px-5 py-3 rounded-[12px] bg-[rgba(20,20,24,.9)] border border-[rgba(255,255,255,.14)] backdrop-blur">
          <span className="text-[13px] text-[#f4f4f5]">Set as wallpaper?</span>
          <button className="px-3 py-1 rounded-[6px] bg-[#7c9cff] text-black text-[12px] font-semibold" onClick={() => onPrompt?.(true)}>Yes</button>
          <button className="px-3 py-1 rounded-[6px] bg-[rgba(255,255,255,.1)] text-[#f4f4f5] text-[12px]" onClick={() => { setFading(true); setTimeout(() => onPrompt?.(false), 700); }}>No</button>
        </div>
      )}
    </div>
  );
}
