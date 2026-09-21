import { useEffect, useState } from "react";
import { Send, Globe } from "lucide-react";
import { loadLS, saveLS } from "../../lib/persistence";

interface Entry { name: string; msg: string; url?: string; ts: number }
const SPAM = ["crypto", "casino", "viagra", "loan", "lottery", "click here", "free money"];
const KEY = "os.guestbook";
const LAST = "os.guestbook.last";

const rel = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + " minutes ago";
  if (s < 86400) return Math.floor(s / 3600) + " hours ago";
  return Math.floor(s / 86400) + " days ago";
};

export default function GuestbookApp() {
  const [entries, setEntries] = useState<Entry[]>(() => loadLS<Entry[]>(KEY, []));
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [url, setUrl] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [captcha, setCaptcha] = useState({ a: 3, b: 4 });
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("");

  const submit = () => {
    setStatus("");
    if (website) return; // honeypot
    if (!name.trim() || !msg.trim()) return setStatus("fill in name and message");
    if ((msg.match(/https?:\/\//g) || []).length > 3) return setStatus("too many links");
    if (SPAM.some((w) => msg.toLowerCase().includes(w))) return setStatus("message looks like spam");
    if (parseInt(answer) !== captcha.a + captcha.b) return setStatus("wrong captcha");
    const last = Number(localStorage.getItem(LAST) || 0);
    if (Date.now() - last < 5 * 60 * 1000) return setStatus("one post per 5 minutes — try again soon");
    const e: Entry = { name: name.trim().slice(0, 40), msg: msg.trim().slice(0, 500), url: url.trim() || undefined, ts: Date.now() };
    const list = [e, ...entries].slice(0, 100);
    setEntries(list); saveLS(KEY, list, 0);
    localStorage.setItem(LAST, String(Date.now()));
    setName(""); setMsg(""); setUrl(""); setAnswer("");
    setCaptcha({ a: 1 + Math.floor(Math.random() * 9), b: 1 + Math.floor(Math.random() * 9) });
    setStatus("posted — thanks!");
  };

  return (
    <div className="h-full flex flex-col text-[#f4f4f5]">
      <div className="px-3 py-2 text-[11px] text-[#fbbf24] bg-[rgba(251,191,36,.08)] border-b border-[rgba(251,191,36,.2)] flex items-center gap-2">
        <Globe size={11} /> demo mode — entries stored locally. configure a backend for persistence.
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {entries.map((e, i) => (
          <div key={i} className="rounded-[10px] bg-[rgba(255,255,255,.04)] border border-[rgba(255,255,255,.07)] p-3">
            <div className="flex items-baseline gap-2">
              <b className="text-[13px]">{e.name}</b>
              {e.url && <a href={e.url} target="_blank" rel="noopener" className="text-[11px] text-[#7c9cff] hover:underline truncate max-w-[180px]">{e.url.replace(/^https?:\/\//, "")}</a>}
              <span className="ml-auto text-[10.5px] text-[rgba(244,244,245,.38)]">{rel(e.ts)}</span>
            </div>
            <div className="text-[12.5px] text-[rgba(244,244,245,.85)] mt-1 leading-relaxed">{e.msg}</div>
          </div>
        ))}
        {!entries.length && <div className="text-center text-[rgba(244,244,245,.28)] py-8">be the first to sign</div>}
      </div>
      <div className="border-t border-[rgba(255,255,255,.08)] p-3 grid grid-cols-[1fr_2fr_1fr] gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="name" className="h-8 px-2 rounded-[6px] bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.08)] text-[12px] focus:outline-none focus:border-[#7c9cff]" />
        <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="message" className="h-8 px-2 rounded-[6px] bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.08)] text-[12px] focus:outline-none focus:border-[#7c9cff]" />
        <div className="flex gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="website (optional)" className="flex-1 h-8 px-2 rounded-[6px] bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.08)] text-[12px] focus:outline-none focus:border-[#7c9cff]" />
        </div>
        <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[rgba(244,244,245,.5)]">{captcha.a} + {captcha.b} =</span>
          <input value={answer} onChange={(e) => setAnswer(e.target.value)} className="w-12 h-8 px-2 rounded-[6px] bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.08)] text-[12px] focus:outline-none focus:border-[#7c9cff]" />
        </div>
        <button onClick={submit} className="h-8 px-3 rounded-[6px] bg-[#7c9cff] text-black text-[12px] font-semibold flex items-center gap-1.5 justify-center"><Send size={12} /> sign</button>
        {status && <span className="text-[11px] text-[#fbbf24] self-center col-span-3">{status}</span>}
      </div>
    </div>
  );
}
