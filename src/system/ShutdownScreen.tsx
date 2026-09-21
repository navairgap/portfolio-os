import { useEffect, useRef, useState } from "react";

export default function ShutdownScreen({ mode, onReboot }: { mode: "shutdown" | "restart"; onReboot: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [halted, setHalted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const msgs = [
      "systemd[1]: Stopped target Graphical Interface",
      "systemd[1]: Stopped Session 2 of user navairgap",
      "systemd[1]: Stopped User Manager for UID 1000",
      "systemd[1]: Stopped Network Manager",
      "systemd[1]: Unmounted /home",
      "systemd[1]: Reached target Unmounting File Systems",
      mode === "restart" ? "systemd[1]: Rebooting ..." : "systemd[1]: Powering off ...",
    ];
    const timers = msgs.map((m, i) => setTimeout(() => {
      setLines((p) => [...p, m]);
      requestAnimationFrame(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; });
    }, i * 260));
    timers.push(setTimeout(() => setHalted(true), msgs.length * 260 + 700));
    return () => timers.forEach(clearTimeout);
  }, [mode]);

  return (
    <div className="fixed inset-0 bg-black z-[200] font-mono text-[13px] text-[#8a8a90]"
      onClick={() => halted && onReboot()}>
      {!halted ? (
        <div ref={ref} className="absolute inset-8 overflow-hidden">
          {lines.map((l, i) => <div key={i}>[{i}] {l}</div>)}
          <span className="animate-pulse">_</span>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
          <div className="text-[#f4f4f5]">
            {mode === "restart" ? "restarting ..." : "System halted. It's now safe to close this tab."}
          </div>
          <button onClick={onReboot}
            className="px-4 py-2 rounded-[6px] bg-[#232328] border border-[rgba(255,255,255,.16)] text-[#f4f4f5] text-[13px] hover:bg-[#2c2c33]">
            reboot
          </button>
        </div>
      )}
    </div>
  );
}
