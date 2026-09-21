import { useEffect, useState } from "react";

export default function BSOD({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const i = setInterval(() => setPct((p) => { if (p >= 100) { clearInterval(i); setDone(true); return 100; } return p + 4; }), 120);
    const key = () => done && onDone();
    addEventListener("keydown", key); addEventListener("click", key);
    return () => { clearInterval(i); removeEventListener("keydown", key); removeEventListener("click", key); };
  }, [done, onDone]);
  return (
    <div className="fixed inset-0 z-[500] bg-[#1e3a8a] text-white font-mono flex flex-col items-center justify-center gap-6 select-none">
      <div className="text-[96px] leading-none">:(</div>
      <div className="max-w-xl text-center text-[15px] leading-relaxed">
        A problem has been detected and the portfolio has been shut down to prevent damage to your eyeballs.
        <div className="mt-6 text-left text-[13px]">
          TECHNICAL_INFORMATION:<br />*** STOP: 0x000000FF (PORTFOLIO_TOO_GOOD)<br />*** nsh.exe — sanity not found
        </div>
      </div>
      <div className="w-72 h-2 bg-[rgba(255,255,255,.2)]"><div className="h-full bg-white transition-all" style={{ width: pct + "%" }} /></div>
      {done && <div className="text-[14px] animate-pulse">Just kidding. Your files are safe. Press any key to continue.</div>}
    </div>
  );
}
