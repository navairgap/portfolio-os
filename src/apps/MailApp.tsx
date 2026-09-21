import { useState } from "react";
import { Inbox, Send, Github, FileText } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_GITHUB, BIO_SHORT } from "../data/projects";
import { useSettings } from "../store/useSettingsStore";

export default function MailApp() {
  const name = useSettings((s) => s.displayName);
  const [view, setView] = useState<"inbox" | "compose">("inbox");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  const send = () => {
    location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject || "Hello from " + name)}&body=${encodeURIComponent(body)}`;
    setSent(true); setTimeout(() => { setSent(false); setView("inbox"); setSubject(""); setBody(""); }, 1500);
  };

  return (
    <div className="h-full flex text-[13px] text-[#f4f4f5]">
      <div className="w-44 border-r border-[rgba(255,255,255,.08)] p-2 space-y-0.5 shrink-0">
        <button onClick={() => setView("inbox")} className={`w-full flex items-center gap-2 px-2 py-2 rounded-[6px] ${view === "inbox" ? "bg-[rgba(124,156,255,.16)]" : "hover:bg-[rgba(255,255,255,.06)]"}`}><Inbox size={14} /> Inbox</button>
        <button onClick={() => setView("compose")} className={`w-full flex items-center gap-2 px-2 py-2 rounded-[6px] ${view === "compose" ? "bg-[rgba(124,156,255,.16)]" : "hover:bg-[rgba(255,255,255,.06)]"}`}><Send size={14} /> Compose</button>
        <div className="pt-3 mt-2 border-t border-[rgba(255,255,255,.08)] space-y-1">
          <a href={CONTACT_GITHUB} target="_blank" rel="noopener" className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] hover:bg-[rgba(255,255,255,.06)] text-[rgba(244,244,245,.72)]"><Github size={13} /> GitHub ↗</a>
          <button onClick={() => window.open("cv.html", "_blank")} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] hover:bg-[rgba(255,255,255,.06)] text-[rgba(244,244,245,.72)]"><FileText size={13} /> Résumé ↗</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {view === "inbox" && (
          <div>
            <button onClick={() => setView("message")} className="w-full text-left p-3 rounded-[8px] hover:bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.06)]">
              <div className="flex justify-between"><b className="text-[13px]">navairgap</b><span className="text-[11px] text-[rgba(244,244,245,.38)]">welcome</span></div>
              <div className="text-[12px] text-[rgba(244,244,245,.62)]">Thanks for visiting. If you want to reach me, click Compose.</div>
            </button>
          </div>
        )}
        {view === "message" && (
          <div className="max-w-lg">
            <h3 className="text-[15px] font-semibold">Thanks for visiting</h3>
            <div className="text-[12px] text-[rgba(244,244,245,.38)] my-2">from navairgap · just now</div>
            <p className="text-[13px] leading-[1.7] text-[rgba(244,244,245,.85)]">{BIO_SHORT} If you want to reach me, hit Compose — the Send button opens your mail client with everything pre-filled.</p>
            <button onClick={() => setView("compose")} className="mt-4 px-3 py-1.5 rounded-[6px] bg-[#7c9cff] text-black text-[12px] font-semibold">Reply</button>
          </div>
        )}
        {view === "compose" && (
          <div className="max-w-lg space-y-3">
            <div><label className="text-[11px] text-[rgba(244,244,245,.38)]">To</label>
              <input value={CONTACT_EMAIL} readOnly className="w-full h-8 px-2 mt-0.5 rounded-[6px] bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.08)] text-[#f4f4f5] opacity-70" /></div>
            <div><label className="text-[11px] text-[rgba(244,244,245,.38)]">Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Hello from your OS" className="w-full h-8 px-2 mt-0.5 rounded-[6px] bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.08)] text-[#f4f4f5] focus:outline-none focus:border-[#7c9cff]" /></div>
            <div><label className="text-[11px] text-[rgba(244,244,245,.38)]">Message</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="w-full p-2 mt-0.5 rounded-[6px] bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.08)] text-[#f4f4f5] focus:outline-none focus:border-[#7c9cff] resize-none" /></div>
            <button onClick={send} className="px-4 py-1.5 rounded-[6px] bg-[#7c9cff] text-black text-[12px] font-semibold hover:brightness-110">{sent ? "Opening mail client…" : "Send"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
