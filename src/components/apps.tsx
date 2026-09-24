import { useEffect, useRef, useState } from "react";
import {
  Folder, FolderOpen, FileText, Mail as MailIcon, Send, Save, Lock,
} from "lucide-react";
import { useOS } from "../store";
import { PROJECTS, SKILLS, ABOUT, RESUME_TEXT, MAILS, BOOKMARKS, MAN_PAGES } from "../content";

/* ============================== TERMINAL ============================== */
const OK = (s: string) => `<span class="ok">${s}</span>`;
const WARN = (s: string) => `<span class="warn">${s}</span>`;
const BAD = (s: string) => `<span class="bad">${s}</span>`;

export function TerminalApp() {
  const openApp = useOS((s) => s.openApp);
  const closeTop = useOS((s) => s.closeTop);
  const [lines, setLines] = useState<string[]>([
    `NAVAIRGAP OS 3.0 — ${ABOUT.motto}`,
    "Type 'help' to list commands. Tab-completion not included (this is a website).",
    "",
  ]);
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const [cwd, setCwd] = useState("~");
  const input = useRef<HTMLInputElement>(null);
  const out = useRef<HTMLDivElement>(null);

  useEffect(() => { input.current?.focus(); out.current?.scrollTo(0, 1e6); }, [lines]);

  const prompt = () => `${ABOUT.handle}@navairgap:${cwd}$`;

  function run(raw: string) {
    const cmd = raw.trim();
    const echo = `<span class="prompt">${prompt()}</span> ${cmd.replace(/</g, "&lt;")}`;
    const outLines: string[] = [echo];
    const [c, ...args] = cmd.split(/\s+/);
    const a = args.join(" ");

    switch (c) {
      case "": break;
      case "help":
        outLines.push(
          `available commands:`,
          `  ${OK("neofetch")}   system summary (a bio, honestly)`,
          `  ${OK("ls")}        list directory    ${OK("cd <dir>")}   move around`,
          `  ${OK("cat <file>")} read a file       ${OK("open <x>")}  open app or project`,
          `  ${OK("whoami")}     the obvious       ${OK("contact")}   how to reach me`,
          `  ${OK("clear")}      wipe the screen   ${OK("exit")}      close this window`,
          `  ${OK("sudo <cmd>")} try it.           ${OK("man <app>")} a one-line manual`,
        );
        break;
      case "neofetch":
        outLines.push(
          `<span class="ok">      ◢◣     </span>  ${ABOUT.handle}<span class="warn">@</span>navairgap`,
          `<span class="ok">     ◢██◣    </span>  ───────────────────────`,
          `<span class="ok">    ◢████◣   </span>  OS:     Security × Backend Engineer`,
          `<span class="ok">   ◢◤</span><span class="warn">████</span><span class="ok">◥◣  </span>  Host:   ${ABOUT.location}`,
          `<span class="ok">  ◢◤  </span><span class="warn">██</span><span class="ok">  ◥◣ </span>  Uptime: ${ABOUT.uptime}`,
          `<span class="ok"> ◢◤        </span>  Shell:  React / TypeScript`,
          `<span class="ok">◢◤         </span>  WM:     design-minded engineering`,
          `                   CPU:    problem-solving (${WARN("98% util")})`,
          `                   Theme:  ${ABOUT.motto}`,
        );
        break;
      case "ls":
        if (cwd === "~") outLines.push("about.txt  contact.md  projects/  resume.txt");
        else if (cwd === "~/projects") outLines.push(PROJECTS.map((p) => p.id + "/").join("  "));
        else outLines.push(BAD("ls: empty"));
        break;
      case "cd":
        if (!a || a === "~") setCwd("~");
        else if (a === "projects" && cwd === "~") setCwd("~/projects");
        else if (a === ".." || a === "~") setCwd("~");
        else outLines.push(BAD(`cd: no such directory: ${a}`));
        break;
      case "cat":
        if (a === "about.txt") outLines.push(ABOUT.bio);
        else if (a === "resume.txt") outLines.push("use the Text Editor app, or 'open resume'", WARN("(it's prettier there)"));
        else if (a === "contact.md") outLines.push(`${ABOUT.email} · ${ABOUT.github}`);
        else if (a === "projects" || a === "projects/") outLines.push(PROJECTS.map((p) => `${p.name.toLowerCase()}/`).join("  "));
        else outLines.push(BAD(`cat: ${a}: no such file`));
        break;
      case "open": {
        if (!a) { outLines.push("open what? try: open gallery · open projects · open <project-id>"); break; }
        const map: Record<string, () => void> = {
          gallery: () => openApp("gallery"),
          projects: () => openApp("files", "projects"),
          resume: () => openApp("editor"),
          about: () => openApp("about"),
          mail: () => openApp("mail"),
          settings: () => openApp("settings"),
          monitor: () => openApp("monitor"),
        };
        const proj = PROJECTS.find((p) => p.id === a || p.name.toLowerCase() === a);
        if (proj) { openApp("files", proj.id); outLines.push(OK(`opening ${proj.name}…`)); }
        else if (map[a]) { map[a](); outLines.push(OK(`opening ${a}…`)); }
        else outLines.push(BAD(`open: unknown target '${a}'`));
        break;
      }
      case "whoami":
        outLines.push(`${ABOUT.handle} — ${ABOUT.motto}`);
        break;
      case "contact":
        outLines.push(`email : ${OK(ABOUT.email)}`, `github: ${OK(ABOUT.github)}`);
        break;
      case "sudo":
        outLines.push(BAD(`${ABOUT.handle} is not in the sudoers file.`) + " This incident will be reported. (nice try)");
        break;
      case "man":
        outLines.push(MAN_PAGES[a] || BAD(`no manual entry for ${a}`));
        break;
      case "rm":
        outLines.push(BAD("rm: permission denied — this desktop is write-protected by good taste."));
        break;
      case "clear":
        setLines([]); setHist((h) => [...h, cmd]); setHi(-1); return;
      case "exit":
        setHist((h) => [...h, cmd]);
        setTimeout(closeTop, 120);
        return;
      default:
        outLines.push(BAD(`command not found: ${c}`) + " — type 'help'");
    }
    setLines((l) => [...l, ...outLines]);
    setHist((h) => [...h, cmd]);
    setHi(-1);
  }

  return (
    <div className="term" onClick={() => input.current?.focus()} ref={out}>
      {lines.map((l, i) => <div className="out" key={i} dangerouslySetInnerHTML={{ __html: l || "&nbsp;" }} />)}
      <div className="row">
        <span className="prompt">{prompt()}</span>
        <input
          ref={input}
          value=""
          onChange={(e) => { const v = e.target.value; e.target.value = ""; run(v); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") { e.preventDefault(); const i = hi < 0 ? hist.length - 1 : Math.max(0, hi - 1); setHi(i); if (hist[i]) (e.target as HTMLInputElement).value = hist[i]; }
            if (e.key === "ArrowDown") { e.preventDefault(); const i = hi + 1; if (i >= hist.length) { setHi(-1); (e.target as HTMLInputElement).value = ""; } else { setHi(i); (e.target as HTMLInputElement).value = hist[i]; } }
          }}
          aria-label="terminal input"
          autoComplete="off"
        />
        <span className="cursor" />
      </div>
    </div>
  );
}

/* ============================== FILES ============================== */
export function FilesApp({ initial }: { initial?: string }) {
  const openApp = useOS((s) => s.openApp);
  const [sel, setSel] = useState<string | null>(initial === "projects" ? null : initial || null);
  const [view, setView] = useState<"home" | "projects">(initial === "projects" ? "projects" : "home");

  if (sel) {
    const p = PROJECTS.find((x) => x.id === sel)!;
    return (
      <div className="fdetail">
        <button onClick={() => setSel(null)} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text2)" }}>← back</button>
        <h3>{p.name}</h3>
        <p>{p.desc}</p>
        <div className="chips">{p.stack.map((s) => <span key={s}>{s}</span>)}</div>
        <a href={p.repo} target="_blank" rel="noopener">repo ↗</a>
        {p.demo && <a href={p.demo}>live ↗</a>}
      </div>
    );
  }

  return (
    <div className="files">
      <div className="side">
        <div className={view === "home" ? "on" : ""} onClick={() => { setView("home"); setSel(null); }}>Home</div>
        <div className={view === "projects" ? "on" : ""} onClick={() => { setView("projects"); setSel(null); }}>Projects</div>
        <div onClick={() => openApp("editor")}>Documents</div>
      </div>
      <div className="main">
        {view === "home" ? (
          <div className="fgrid">
            <button className="ffolder" onDoubleClick={() => openApp("files", "projects")} onClick={() => setView("projects")}>
              <Folder size={40} color="#8b5cff" /> Projects
            </button>
            <button className="ffolder" onClick={() => openApp("editor")}><FileText size={40} color="#F5A623" /> resume.txt</button>
            <button className="ffolder" onClick={() => openApp("about")}><FileText size={40} color="#6FCF97" /> about-me.txt</button>
          </div>
        ) : (
          <div className="fgrid">
            {PROJECTS.map((p) => (
              <button className="ffolder" key={p.id} onClick={() => setSel(p.id)}>
                <FolderOpen size={40} color={p.color} /> {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== ABOUT ============================== */
export function AboutApp() {
  return (
    <div className="about">
      <div className="pic">◢</div>
      <div style={{ flex: 1 }}>
        <h3>{ABOUT.name}</h3>
        <div className="mono">@{ABOUT.handle} · {ABOUT.location}</div>
        <p style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.7, color: "var(--text2)" }}>{ABOUT.bio}</p>
        <div className="kv">
          <b>OS</b><span>security × backend engineer</span>
          <b>UPTIME</b><span>{ABOUT.uptime}</span>
          <b>SHELL</b><span>react / typescript</span>
          <b>WM</b><span>design-minded engineering</span>
          <b>MOTTO</b><span style={{ color: "var(--amber)" }}>{ABOUT.motto}</span>
        </div>
      </div>
    </div>
  );
}

/* ============================== MONITOR ============================== */
export function MonitorApp() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick((t) => t + 1), 1400); return () => clearInterval(i); }, []);
  return (
    <div>
      <div className="htop"><span>tasks: <b>{SKILLS.length}</b> running</span><span>load avg: 0.9{tick % 10}</span><span>mem: <b>committed</b></span></div>
      <div className="proc">
        <div className="h"><span>PROCESS</span><span>CPU%</span><span>MEM%</span><span></span></div>
        {SKILLS.map((s, i) => {
          const j = Math.min(100, Math.max(2, s.cpu + ((tick * (i + 3)) % 7) - 3));
          return (
            <div className="r" key={s.proc}>
              <span>{s.proc}</span><span>{j.toFixed(0)}</span><span>{s.mem}</span>
              <span className="bar"><i style={{ width: j + "%" }} /></span>
            </div>
          );
        })}
      </div>
      <div className="htop" style={{ borderTop: "1px solid var(--line)", borderBottom: "none" }}>
        <span>note: skills measured in htop units. uptime guaranteed.</span>
      </div>
    </div>
  );
}

/* ============================== MAIL ============================== */
export function MailApp() {
  const [sel, setSel] = useState(MAILS[0].id);
  const [composing, setComposing] = useState(false);
  const [sent, setSent] = useState(false);
  const mail = MAILS.find((m) => m.id === sel)!;

  return (
    <div className="mail">
      <div className="col">
        <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
          <button onClick={() => setComposing(true)} style={{ display: "flex", gap: 8, alignItems: "center", background: "var(--amber)", color: "#161616", fontWeight: 700, padding: "7px 12px", borderRadius: 8, fontSize: 12 }}>
            <MailIcon size={13} /> Compose
          </button>
        </div>
        <div style={{ padding: "8px 12px", fontSize: 11, color: "var(--text2)" }}>Inbox</div>
        {MAILS.map((m) => (
          <div className={`item ${sel === m.id && !composing ? "on" : ""}`} key={m.id} onClick={() => { setSel(m.id); setComposing(false); setSent(false); }}>
            <div className="s">{m.from}</div>
            <div className="m">{m.subject}</div>
          </div>
        ))}
      </div>
      <div className="col" style={{ display: composing ? "none" : "block" }}>
        {MAILS.map((m) => (
          <div className={`item ${sel === m.id ? "on" : ""}`} key={m.id} onClick={() => setSel(m.id)}>
            <div className="s">{m.subject}</div>
            <div className="m">{m.time}</div>
          </div>
        ))}
      </div>
      <div className="read" style={{ display: composing ? "none" : "block" }}>
        <h4>{mail.subject}</h4>
        <div className="from">from: {mail.from} · {mail.time}</div>
        <p>{mail.body}</p>
      </div>
      {composing && (
        <form className="compose" onSubmit={(e) => { e.preventDefault(); setSent(true); setTimeout(() => { setComposing(false); setSent(false); }, 1600); }}>
          <div style={{ fontSize: 12, color: "var(--text2)" }}>New message — opens your mail client. No data stored, obviously.</div>
          <input required placeholder="your email" type="email" />
          <input placeholder="subject" defaultValue="Hello navairgap" />
          <textarea required rows={7} placeholder="say something worth encrypting…" />
          {sent ? <div style={{ color: "var(--green)", fontSize: 12 }}>handing off to your mail client…</div>
            : <button type="submit"><Send size={13} style={{ verticalAlign: -2 }} /> send via mailto</button>}
        </form>
      )}
    </div>
  );
}

/* ============================== EDITOR ============================== */
export function EditorApp() {
  const [dirty, setDirty] = useState(false);
  const dl = () => {
    const b = new Blob([RESUME_TEXT], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = "navairgap-resume.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="editor">
      <div className="menu">
        <button onClick={dl}><Save size={13} style={{ verticalAlign: -2 }} /> Export as .txt</button>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text2)", alignSelf: "center" }}>{dirty ? "modified" : "resume.txt — read-only-ish"}</span>
      </div>
      <textarea defaultValue={RESUME_TEXT} onChange={() => setDirty(true)} spellCheck={false} aria-label="resume text" />
    </div>
  );
}

/* ============================== WEB ============================== */
export function WebApp() {
  return (
    <div className="web">
      <div className="bar2">
        <button aria-label="back"><ChevronLeftIcon /></button>
        <div className="addr"><Lock size={11} /> https://navairgap.github.io — verified</div>
      </div>
      <div className="bm">
        {BOOKMARKS.map((b) => <a key={b.label} href={b.url} target="_blank" rel="noopener">◆ {b.label}</a>)}
      </div>
      <div className="page">
        <h3>// field notes</h3>
        <p>On building honeypot-lite: the best bait is a service that answers just slightly wrong. Attackers fingerprint fast — your fake SSH banner has to be boring. Boring is believable.</p>
        <h3>// why CI-grep</h3>
        <p>Every claim in a README should be machine-checked. If the badge is green, the claim is true. If it's not checked, it's marketing.</p>
        <h3>// on CTFs</h3>
        <p>A weekend CTF is a compressed semester: recon, exploitation, failure, writeup. The writeup is the part that compounds.</p>
      </div>
    </div>
  );
}
function ChevronLeftIcon() { return <span style={{ fontSize: 14 }}>‹</span>; }

/* ============================== SETTINGS ============================== */
export function SettingsApp() {
  const { dark, toggleTheme, accent, setAccent, wallpaper, setWallpaper } = useOS();
  const [pane, setPane] = useState<"appearance" | "wallpaper" | "about">("appearance");
  const ACCENTS = ["#F5A623", "#6FCF97", "#8b5cff", "#3fa9f5", "#ff2b3a"];
  return (
    <div className="settings">
      <div className="side">
        <button className={pane === "appearance" ? "on" : ""} onClick={() => setPane("appearance")}>Appearance</button>
        <button className={pane === "wallpaper" ? "on" : ""} onClick={() => setPane("wallpaper")}>Wallpaper</button>
        <button className={pane === "about" ? "on" : ""} onClick={() => setPane("about")}>About</button>
      </div>
      <div className="pane">
        {pane === "appearance" && (
          <>
            <h3>Appearance</h3>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>THEME</div>
              <button onClick={toggleTheme} style={{ border: "1px solid var(--line)", padding: "9px 16px", borderRadius: 8 }}>
                {dark ? "🌙 dark" : "☀️ light"} — click to switch
              </button>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>ACCENT</div>
              <div className="swatches">
                {ACCENTS.map((a) => (
                  <button key={a} className={accent === a ? "on" : ""} style={{ background: a }} aria-label={"accent " + a} onClick={() => setAccent(a)} />
                ))}
              </div>
            </div>
          </>
        )}
        {pane === "wallpaper" && (
          <>
            <h3>Wallpaper</h3>
            <div className="wallthumbs">
              {["wp0", "wp1", "wp2", "wp3"].map((w, i) => (
                <button key={w} className={`wallpaper ${w} ${wallpaper === i ? "on" : ""}`} style={{ border: wallpaper === i ? "2px solid var(--amber)" : "1px solid var(--line)" }} onClick={() => setWallpaper(i)} aria-label={"wallpaper " + (i + 1)} />
              ))}
            </div>
          </>
        )}
        {pane === "about" && <AboutApp />}
      </div>
    </div>
  );
}

/* ============================== GALLERY ============================== */
const PALETTES = [
  ["#F5A623", "#1E1F22"], ["#6FCF97", "#101418"], ["#8b5cff", "#0e0c14"],
  ["#ff2b3a", "#16100f"], ["#3fa9f5", "#0d1218"], ["#F5A623", "#12251a"],
];
function art(i: number): string {
  const [fg, bg] = PALETTES[i % PALETTES.length];
  const c = document.createElement("canvas");
  c.width = 480; c.height = 300;
  const g = c.getContext("2d")!;
  g.fillStyle = bg; g.fillRect(0, 0, 480, 300);
  let seed = i * 997 + 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  g.strokeStyle = fg; g.globalAlpha = 0.85;
  for (let j = 0; j < 26; j++) {
    g.lineWidth = 1 + rnd() * 3;
    g.globalAlpha = 0.25 + rnd() * 0.6;
    g.beginPath();
    if (rnd() > 0.5) {
      const y = rnd() * 300;
      g.moveTo(0, y); g.lineTo(480, y + (rnd() - 0.5) * 120);
    } else {
      const x = rnd() * 480;
      g.moveTo(x, 0); g.lineTo(x + (rnd() - 0.5) * 120, 300);
    }
    g.stroke();
  }
  g.globalAlpha = 0.9;
  g.font = "700 26px JetBrains Mono";
  g.fillStyle = fg;
  g.fillText("ART_" + String(i + 1).padStart(2, "0"), 18, 34);
  return c.toDataURL();
}
export function GalleryApp() {
  const [sel, setSel] = useState<number | null>(null);
  const [arts] = useState(() => Array.from({ length: 8 }, (_, i) => ({ src: art(i), cap: `generative study #${i + 1} — signal/${i % 2 ? "noise" : "structure"}` })));
  return (
    <div className="gal">
      {sel === null ? (
        <div className="gthumbs">
          {arts.map((a, i) => (
            <button key={i} style={{ backgroundImage: `url(${a.src})` }} onClick={() => setSel(i)} aria-label={"artwork " + (i + 1)} />
          ))}
        </div>
      ) : (
        <div className="gview">
          <canvas ref={(el) => {
            if (!el) return;
            const img = new Image();
            img.onload = () => { el.width = img.width; el.height = img.height; el.getContext("2d")!.drawImage(img, 0, 0); };
            img.src = arts[sel].src;
          }} />
          <div className="cap">{arts[sel].cap} · ←/→ to browse · Esc to close</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="clink" onClick={() => setSel((sel + arts.length - 1) % arts.length)}>← prev</button>
            <button className="clink" onClick={() => setSel(null)}>grid</button>
            <button className="clink" onClick={() => setSel((sel + 1) % arts.length)}>next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
