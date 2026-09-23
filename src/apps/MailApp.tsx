import { useState } from "react";
import { Inbox, Send, Github, FileText } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_GITHUB, BIO_SHORT } from "../data/projects";
import { useSettings } from "../store/useSettingsStore";
import { useNotifications } from "../store/useNotificationStore";

const LAST_SEND = "os.mail.last";

export default function MailApp() {
  const name = useSettings((s) => s.displayName);
  const [view, setView] = useState<"inbox" | "message" | "compose">("inbox");
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [a, setA] = useState(2 + Math.floor(Math.random() * 7));
  const [b, setB] = useState(1 + Math.floor(Math.random() * 7));
  const [ans, setAns] = useState("");
  const [hp, setHp] = useState("");

  const reset = () => { setSubject(""); setBody(""); setAns(""); setA(1 + Math.floor(Math.random() * 9)); setB(1 + Math.floor(Math.random() * 9)); setView("inbox"); };

  const send = async () => {
    if (hp) return;
    const last = Number(localStorage.getItem(LAST_SEND) || 0);
    if (Date.now() - last < 60000) { useNotifications.getState().push({ appId: "mail", title: "Rate limit", body: "one send per minute" }); return; }
    if (parseInt(ans) !== a + b) { useNotifications.getState().push({ appId: "mail", title: "Check the captcha", body: "math looks off" }); return; }
    if (!body.trim()) return;
    setSending(true);
    localStorage.setItem(LAST_SEND, String(Date.now()));
    const endpoint = (import.meta as any).env?.VITE_FORMSPREE_ENDPOINT as string | undefined;
    let ok = false;
    if (endpoint) {
      try {
        const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ from, subject: subject || "Hello from " + name, message: body, _gotcha: hp }) });
        ok = r.ok;
      } catch { ok = false; }
    }
    setSending(false);
    if (ok) { useNotifications.getState().push({ appId: "mail", title: "Message sent", body: "thanks for reaching out" }); reset(); }
    else {
      location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent((subject || "Hello from " + name) + (from ? ` (reply: ${from})` : ""))}&body=${encodeURIComponent(body)}`;
      useNotifications.getState().push({ appId: "mail", title: "Opening mail client", body: "relay not configured — using mailto fallback" });
      reset();
    }
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
          <button onClick={() => setView("message")} className="w-full text-left p-3 rounded-[8px] hover:bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.06)]">
            <div className="flex justify-between"><b className="text-[13px]">navairgap</b><span className="text-[11px] text-[rgba(244,244,245,.38)]">welcome</span></div>
            <div className="text-[12px] text-[rgba(244,244,245,.62)]">Thanks for visiting. If you want to reach me, click Compose.</div>
          </button>
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
            <div><label className="text-[11px] text-[rgba(244,244,245,.38)]">From (optional, for reply-to)</label>
              <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="you@example.com" className="w-full h-8 px-2 mt-0.5 rounded-[6px] bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.08)] text-[#f4f4f5] focus:outline-none focus:border-[#7c9cff]" /></div>
            <div><label className="text-[11px] text-[rgba(244,244,245,.38)]">Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Hello from your OS" className="w-full h-8 px-2 mt-0.5 rounded-[6px] bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.08)] text-[#f4f4f5] focus:outline-none focus:border-[#7c9cff]" /></div>
            <div><label className="text-[11px] text-[rgba(244,244,245,.38)]">Message</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} className="w-full p-2 mt-0.5 rounded-[6px] bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.08)] text-[#f4f4f5] focus:outline-none focus:border-[#7c9cff] resize-none" /></div>
            <input value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[rgba(244,244,245,.5)]">{a} + {b} =</span>
              <input value={ans} onChange={(e) => setAns(e.target.value)} className="w-12 h-8 px-2 rounded-[6px] bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.08)] text-[12px] focus:outline-none focus:border-[#7c9cff]" />
              <button onClick={send} disabled={sending} className="px-4 py-1.5 rounded-[6px] bg-[#7c9cff] text-black text-[12px] font-semibold disabled:opacity-50 flex items-center gap-1.5">
                {sending ? <><i className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Sending…</> : <><Send size={12} /> Send</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
