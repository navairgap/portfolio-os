import { useEffect, useState } from "react";
import { Delete, History } from "lucide-react";

export default function CalculatorApp() {
  const [expr, setExpr] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [showHist, setShowHist] = useState(true);
  const press = (k: string) => {
    if (k === "C") return setExpr("");
    if (k === "⌫") return setExpr((e) => e.slice(0, -1));
    if (k === "±") return setExpr((e) => (e.startsWith("-") ? e.slice(1) : "-" + e));
    if (k === "=") {
      try {
        const v = Function(`"use strict";return (${expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/%/g, "/100")})`)();
        if (typeof v === "number" && isFinite(v)) { setHist((h) => [`${expr} = ${v}`, ...h].slice(0, 30)); setExpr(String(Math.round(v * 1e10) / 1e10)); }
        else setExpr("Error");
      } catch { setExpr("Error"); }
      return;
    }
    setExpr((e) => (e === "Error" ? k : e + k));
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/[0-9.+\-*/%]/.test(e.key)) setExpr((x) => (x === "Error" ? e.key : x + e.key));
      if (e.key === "Enter") press("=");
      if (e.key === "Backspace") press("⌫");
      if (e.key === "Escape") press("C");
    };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expr]);
  const keys = ["C", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", "0", ".", "⌫", "="];
  return (
    <div className="h-full flex text-[#f4f4f5]">
      <div className="flex-1 flex flex-col p-3">
        <div className="h-16 flex items-end justify-end px-2 text-[28px] font-mono truncate">{expr || "0"}</div>
        <div className="grid grid-cols-4 gap-1.5 mt-2 flex-1">
          {keys.map((k) => (
            <button key={k} onClick={() => press(k)}
              className={`rounded-[8px] text-[16px] font-medium transition-colors
                ${k === "=" ? "bg-[#7c9cff] text-black" : ["÷", "×", "-", "+"].includes(k) ? "bg-[rgba(124,156,255,.15)] text-[#7c9cff]" : k === "C" ? "text-[#ff5c5c] bg-[rgba(255,92,92,.1)]" : "bg-[rgba(255,255,255,.06)] hover:bg-[rgba(255,255,255,.1)]"}`}>
              {k === "⌫" ? <Delete size={15} className="mx-auto" /> : k}
            </button>
          ))}
        </div>
      </div>
      {showHist && (
        <div className="w-44 border-l border-[rgba(255,255,255,.08)] p-2 overflow-auto">
          <div className="flex justify-between items-center text-[11px] text-[rgba(244,244,245,.38)] mb-2"><span>history</span>
            <button onClick={() => setShowHist(false)}><History size={11} /></button></div>
          {hist.length === 0 && <div className="text-[11px] text-[rgba(244,244,245,.28)]">empty</div>}
          {hist.map((h, i) => <button key={i} onClick={() => setExpr(h.split(" = ")[0])} className="w-full text-left text-[11px] font-mono text-[rgba(244,244,245,.62)] hover:text-white py-1 truncate">{h}</button>)}
        </div>
      )}
    </div>
  );
}
