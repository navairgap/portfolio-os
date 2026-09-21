import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Globe, Star } from "lucide-react";

const BOOKMARKS = [
  ["GitHub", "https://github.com/navairgap"],
  ["SentinelWiFi", "https://github.com/navairgap/SentinelWiFi"],
  ["banter", "https://github.com/navairgap/banter"],
  ["Email", "mailto:nav54877@gmail.com"],
];

export default function BrowserApp() {
  const [url, setUrl] = useState("");
  const [current, setCurrent] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const go = (u: string) => {
    if (!u) return;
    if (!/^https?:\/\//.test(u) && !u.startsWith("mailto:")) u = "https://" + u;
    const h = hist.slice(0, hi + 1); h.push(u); setHist(h); setHi(h.length - 1);
    setCurrent(u); setUrl(u);
  };
  const nav = (d: -1 | 1) => { const n = hi + d; if (n >= 0 && n < hist.length) { setHi(n); setCurrent(hist[n]); setUrl(hist[n]); } };

  return (
    <div className="h-full flex flex-col text-[13px]">
      <div className="flex items-center gap-1.5 px-2 py-2 border-b border-[rgba(255,255,255,.08)]">
        <button onClick={() => nav(-1)} className="p-1.5 rounded hover:bg-[rgba(255,255,255,.08)] disabled:opacity-30" disabled={hi <= 0}><ArrowLeft size={14} /></button>
        <button onClick={() => nav(1)} className="p-1.5 rounded hover:bg-[rgba(255,255,255,.08)] disabled:opacity-30" disabled={hi >= hist.length - 1}><ArrowRight size={14} /></button>
        <button onClick={() => current && go(current)} className="p-1.5 rounded hover:bg-[rgba(255,255,255,.08)]"><RotateCw size={13} /></button>
        <form className="flex-1 flex items-center gap-2 px-3 h-8 rounded-[8px] bg-[rgba(255,255,255,.06)] border border-[rgba(255,255,255,.08)]"
          onSubmit={(e) => { e.preventDefault(); go(url); }}>
          <Globe size={13} className="text-[rgba(244,244,245,.38)]" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="search or type a URL"
            className="flex-1 bg-transparent text-[#f4f4f5] focus:outline-none placeholder:text-[rgba(244,244,245,.38)]" />
        </form>
      </div>
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-[rgba(255,255,255,.08)]">
        <Star size={11} className="text-[rgba(244,244,245,.38)]" />
        {BOOKMARKS.map(([name, u]) => (
          <button key={name} onClick={() => go(u)} className="text-[12px] text-[rgba(244,244,245,.62)] hover:text-white">{name}</button>
        ))}
      </div>
      <div className="flex-1 relative bg-white">
        {current && !current.startsWith("mailto:") ? (
          <iframe src={current} title="browser" className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
        ) : (
          <div className="absolute inset-0 bg-[#0e0e10] flex flex-col items-center justify-center gap-6 text-[#f4f4f5]">
            <div className="text-center">
              <Globe size={40} className="mx-auto text-[rgba(244,244,245,.38)] mb-3" />
              <div className="text-[16px] font-semibold">navairgap browser</div>
              <div className="text-[12px] text-[rgba(244,244,245,.38)] mt-1">some sites refuse to render in iframes — that's the web, not a bug</div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); go(url); }} className="w-72">
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="search or type a URL" autoFocus
                className="w-full h-10 px-4 rounded-[10px] bg-[rgba(255,255,255,.06)] border border-[rgba(255,255,255,.12)] text-[#f4f4f5] focus:outline-none focus:border-[#7c9cff] text-center" />
            </form>
            <div className="flex gap-5">
              {BOOKMARKS.map(([name, u]) => (
                <button key={name} onClick={() => go(u)} className="text-[12px] text-[rgba(244,244,245,.62)] hover:text-white">{name}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
