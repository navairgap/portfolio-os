import { useState } from "react";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { useSettings } from "../store/useSettingsStore";
import { SKILL_GROUPS } from "../data/skills";
import { BIO_SHORT, BIO_LONG } from "../data/projects";

const NEOFETCH: [string, string][] = [
  ["OS", "navairgap OS 1.0 x86_64"],
  ["Host", "Portfolio Core i9"],
  ["Kernel", "6.8.0-portfolio"],
  ["Uptime", "since you arrived"],
  ["Shell", "nsh 1.0"],
  ["Resolution", `${screen.width}x${screen.height}`],
  ["DE", "navairgap-shell"],
  ["WM", "portfolio-wm"],
  ["Theme", "bone [GTK3]"],
  ["Icons", "lucide"],
  ["Terminal", "xterm.js"],
  ["CPU", "Portfolio Core i9 @ 3.60GHz"],
  ["GPU", "portfolio-drm"],
  ["Memory", "all of it, eventually"],
];

export default function AboutApp() {
  const s = useSettings();
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="h-full overflow-auto text-[#f4f4f5] p-5">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-[#232328] border border-[rgba(255,255,255,.16)] grid place-items-center overflow-hidden shrink-0">
          {s.avatar ? <img src={s.avatar} className="w-full h-full object-cover" alt="" /> : <span className="text-[26px] text-[#7c9cff] font-semibold">n</span>}
        </div>
        <div>
          <h2 className="text-[17px] font-semibold">{s.displayName}</h2>
          <div className="text-[13px] text-[rgba(244,244,245,.62)]">Defensive Security × Backend</div>
          <div className="text-[12px] text-[rgba(244,244,245,.38)] flex items-center gap-1 mt-0.5"><MapPin size={11} /> Remote</div>
          <p className="text-[13px] text-[rgba(244,244,245,.85)] mt-3 max-w-md leading-[1.7]">{BIO_SHORT}</p>
          <button onClick={() => setExpanded(!expanded)} className="mt-2 text-[12px] text-[#7c9cff] flex items-center gap-1 hover:underline">
            {expanded ? <><ChevronUp size={12} /> less</> : <><ChevronDown size={12} /> more about me</>}
          </button>
          {expanded && <p className="text-[13px] text-[rgba(244,244,245,.72)] mt-2 max-w-md leading-[1.7]">{BIO_LONG}</p>}
        </div>
      </div>
      <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[rgba(244,244,245,.38)] mt-6 mb-2">System capabilities</h3>
      <div className="grid grid-cols-2 gap-1 max-w-lg">
        {NEOFETCH.map(([k, v]) => (
          <div key={k} className="flex gap-2 text-[12px]"><b className="text-[#7c9cff] w-20 shrink-0">{k}</b><span className="text-[rgba(244,244,245,.72)] truncate">{v}</span></div>
        ))}
      </div>
      <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[rgba(244,244,245,.38)] mt-6 mb-2">Languages & systems</h3>
      <div className="flex flex-wrap gap-1.5 max-w-lg">
        {SKILL_GROUPS.flatMap((g) => g.rows).map(([n, p]) => (
          <span key={n} className="px-2 py-1 rounded-[6px] bg-[rgba(255,255,255,.06)] text-[12px] text-[rgba(244,244,245,.85)]">{n} · {p}</span>
        ))}
      </div>
    </div>
  );
}
