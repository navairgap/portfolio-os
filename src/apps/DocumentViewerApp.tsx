import { Download, Printer } from "lucide-react";
import { SKILL_GROUPS, EXPLORING } from "../data/skills";
import { BIO_SHORT, CONTACT_EMAIL, CONTACT_GITHUB, PROJECTS } from "../data/projects";

const MD = `# navairgap
**Defensive Security × Backend** — Remote

${BIO_SHORT}

## Projects
${Object.values(PROJECTS).map((p) => `- **${p.name}** — ${p.desc}`).join("\n")}

## Skills
${SKILL_GROUPS.map((g) => `- ${g.label}: ${g.rows.map((r) => r[0]).join(", ")}`).join("\n")}
- EXPLORING: ${EXPLORING}

## Contact
- ${CONTACT_EMAIL}
- ${CONTACT_GITHUB}
`;

export default function DocumentViewerApp() {
  const download = () => {
    const blob = new Blob([MD], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "navairgap-resume.md"; a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="h-full flex flex-col bg-[#3a3a3f]">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#232328] border-b border-[rgba(255,255,255,.08)]">
        <span className="text-[12px] text-[rgba(244,244,245,.62)]">resume.pdf</span>
        <div className="ml-auto flex gap-1.5">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[rgba(255,255,255,.08)] text-[12px] text-[#f4f4f5] hover:bg-[rgba(255,255,255,.14)]"><Printer size={12} /> Print / PDF</button>
          <button onClick={download} className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#7c9cff] text-black text-[12px] font-semibold"><Download size={12} /> .md</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6 grid place-items-start justify-center">
        <div id="resume-doc" className="bg-white text-[#18181b] w-[640px] max-w-full rounded-[4px] shadow-[0_10px_40px_rgba(0,0,0,.4)] p-10 text-[13px] leading-[1.65]">
          <h1 className="text-[24px] font-bold tracking-tight">navairgap</h1>
          <div className="text-[#555] mb-4">Defensive Security × Backend · Remote · {CONTACT_EMAIL}</div>
          <p className="mb-4">{BIO_SHORT}</p>
          <h2 className="text-[14px] font-bold uppercase tracking-wide mt-5 mb-2 border-b border-[#ddd] pb-1">Projects</h2>
          {Object.values(PROJECTS).map((p) => (
            <div key={p.name} className="mb-2.5"><b>{p.name}</b> — <span className="text-[#444]">{p.desc}</span></div>
          ))}
          <h2 className="text-[14px] font-bold uppercase tracking-wide mt-5 mb-2 border-b border-[#ddd] pb-1">Skills</h2>
          {SKILL_GROUPS.map((g) => <div key={g.label} className="mb-1"><b className="w-28 inline-block">{g.label}</b> {g.rows.map((r) => r[0]).join(", ")}</div>)}
          <div><b className="w-28 inline-block">EXPLORING</b> {EXPLORING}</div>
          <h2 className="text-[14px] font-bold uppercase tracking-wide mt-5 mb-2 border-b border-[#ddd] pb-1">Links</h2>
          <div>{CONTACT_GITHUB}</div>
        </div>
      </div>
    </div>
  );
}
