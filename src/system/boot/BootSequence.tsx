import { useEffect, useRef, useState } from "react";
import { BIOS_LINES, KERNEL_LINES, ASCII_LOGO } from "./bootData";
import { matrixRain } from "../../lib/matrixRain";
import { osfx } from "../../lib/operatorSounds";
import { useSettings } from "../../store/useSettingsStore";

export default function BootSequence({ onDone }: { onDone: () => void }) {
  const s = useSettings();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const skipFull = s.bootFull === "never" || (s.bootFull === "first" && !!localStorage.getItem("os.bootedOnce"));
  const [phase, setPhase] = useState(skipFull ? 5 : 0);
  const [lines, setLines] = useState<string[]>([]);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [count, setCount] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stopRain = useRef<(() => void) | null>(null);
  const done = useRef(false);
  const finish = () => { if (done.current) return; done.current = true; localStorage.setItem("os.bootedOnce", "1"); stopRain.current?.(); onDone(); };

  // ambient sounds
  useEffect(() => { if (s.bootSound && phase === 1) osfx.bootStart(); }, [phase, s.bootSound]);

  // matrix rain on login phase
  useEffect(() => {
    if (phase === 5 && s.loginMatrix && canvasRef.current) stopRain.current = matrixRain(canvasRef.current, { fps: 30 });
    return () => { stopRain.current?.(); };
  }, [phase, s.loginMatrix]);

  // global clock for login
  const [clock, setClock] = useState("");
  useEffect(() => {
    const f = () => { const d = new Date(); const p = (n: number) => String(n).padStart(2, "0"); setClock(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} UTC${d.getTimezoneOffset() <= 0 ? "+" : "-"}${p(Math.abs(d.getTimezoneOffset()) / 60 | 0)}:${p(Math.abs(d.getTimezoneOffset()) % 60)}`); };
    const i = setInterval(f, 1000); f();
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const D = reduced ? 0.02 : 1;
    if (phase === 0) timers.push(setTimeout(() => setPhase(1), 500 * D));
    if (phase === 1) {
      BIOS_LINES.forEach((l, i) => timers.push(setTimeout(() => { setLines((p) => [...p, l]); if (i % 3 === 0) osfx.kernelTick(); }, i * 80 * D)));
      timers.push(setTimeout(() => setPhase(2), (BIOS_LINES.length * 80 + 400) * D));
    }
    if (phase === 2) {
      const iv = setInterval(() => setCount((c) => { if (c <= 1) { clearInterval(iv); setPhase(3); return 0; } return c - 1; }), 1000 * D);
      timers.push(setTimeout(() => setPhase(3), 3300 * D));
      const key = () => { clearInterval(iv); setPhase(3); };
      addEventListener("keydown", key);
      timers.push(setTimeout(() => removeEventListener("keydown", key), 3400 * D) as any);
    }
    if (phase === 3) {
      KERNEL_LINES.forEach((l, i) => timers.push(setTimeout(() => {
        setLines((p) => [...p, l]);
        if (i % 3 === 0) osfx.kernelTick();
        requestAnimationFrame(() => { const el = document.getElementById("boot-log"); if (el) el.scrollTop = el.scrollHeight; });
      }, i * 25 * D)));
      timers.push(setTimeout(() => setPhase(4), (KERNEL_LINES.length * 25 + 500) * D));
    }
    if (phase === 4) timers.push(setTimeout(() => setPhase(5), 1500 * D));
    if (phase === 6) timers.push(setTimeout(finish, 500 * D));
    return () => timers.forEach((t) => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const esc = () => { if (phase < 5) { setPhase(5); } };

  const login = () => {
    if (msg === "authenticating...") return;
    if (pw === "guest") localStorage.setItem("os.guest", "1");
    setMsg("authenticating...");
    osfx.loginOk();
    setTimeout(() => setPhase(6), 400);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black text-[#e6e6e6] font-mono text-[13px]" onKeyDown={(e) => e.key === "Escape" && esc()}>
      {phase > 0 && phase < 2 && (
        <div className="absolute left-6 top-6 leading-[1.5]">
          {lines.map((l, i) => <div key={i} className={i === lines.length - 1 ? "" : "text-[#8a8a8a]"}>{l}</div>)}
          {phase === 1 && <span className="animate-[blink_1s_steps(1)_infinite] text-[#00ff9c]">█</span>}
          {phase >= 1 && <div className="absolute bottom-6 right-6 text-[11px] text-[#555] fixed">[ press ESC to skip ]</div>}
        </div>
      )}
      {phase === 0 && <span className="absolute left-6 top-6 animate-[blink_1s_steps(1)_infinite] text-[#00ff9c]">█</span>}

      {phase === 2 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
          <pre className="text-[#7a1a1a] leading-[1.15] text-center">{ASCII_LOGO}</pre>
          <div className="space-y-1 text-[13px]">
            <div className="bg-[#ff2b2b] text-black px-3 py-1">BlackArch Linux 2026.09.01</div>
            <div className="text-[#8a8a8a] px-3 py-1">Advanced options for BlackArch Linux</div>
            <div className="text-[#8a8a8a] px-3 py-1">Memory test (memtest86+)</div>
          </div>
          <div className="fixed bottom-6 right-6 text-[#8a8a8a]">Booting in {count}...</div>
        </div>
      )}

      {phase === 3 && (
        <div id="boot-log" className="absolute inset-6 overflow-hidden text-[12px] text-[#8a8a8a] leading-[1.45]">
          {lines.map((l, i) => <div key={i}>{l}</div>)}
          <span className="animate-[blink_1s_steps(1)_infinite]">█</span>
        </div>
      )}

      {phase === 4 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <pre className="text-[#ff2b2b] leading-[1.15] text-center" style={s.chromaticAberration && !reduced ? { textShadow: "1px 0 #00ffff, -1px 0 #ff2b2b" } : {}}>{ASCII_LOGO.split("\n").slice(0, 19).join("\n")}</pre>
          <div className="text-[28px] tracking-[0.4em] text-[#e6e6e6] mt-2">BLACKARCH</div>
          <div className="text-[12px] tracking-[0.3em] uppercase text-[#8a8a8a]">operator edition</div>
          <div className="h-px w-64 bg-[#ff2b2b] origin-center" style={{ animation: "grow 0.4s ease-out forwards" }} />
          <style>{`@keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
        </div>
      )}

      {phase === 5 && (
        <div className="absolute inset-0">
          {s.loginMatrix && <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />}
          {!s.loginMatrix && <div className="absolute inset-0 bg-[#050507]" />}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <pre className="text-[#ff2b2b] text-[10px] leading-[1.1] mb-4">{"  ▄▄▄\n █▀▀▀█\n  ▀▄▄▀"}</pre>
            <div className="text-[13px] tracking-[0.2em] text-[#e6e6e6]">BLACKARCH LINUX 6.12.4</div>
            <div className="text-[12px] text-[#8a8a8a] mt-1 mb-6">operator@blackarch</div>
            <form onSubmit={(e) => { e.preventDefault(); login(); }} className="flex items-center gap-2 text-[13px]">
              <span className="text-[#ff2b2b]">password:</span>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus
                className="bg-transparent border-0 outline-none text-[#e6e6e6] w-40" />
              <span className="animate-[blink_1s_steps(1)_infinite] text-[#00ff9c]">█</span>
            </form>
            <div className="text-[11px] text-[#8a8a8a] mt-2 h-4">{msg || "[ enter ] authenticate"}</div>
          </div>
          <div className="absolute bottom-4 left-5 text-[11px] text-[#8a8a8a]">{clock}</div>
          <div className="absolute bottom-4 right-5 text-[11px] text-[#8a8a8a]">tty1 · secure</div>
          <div className="fixed bottom-4 right-24 text-[11px] text-[#555]">[ esc to skip ]</div>
        </div>
      )}

      {phase === 6 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-[13px] text-[#00ff9c] animate-pulse">loading profile...</div>
        </div>
      )}
    </div>
  );
}
