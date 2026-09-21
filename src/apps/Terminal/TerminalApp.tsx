import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import "xterm/css/xterm.css";
import { useFS } from "../../store/useFileSystemStore";
import { joinPath, HOME, parentOf } from "../../lib/filesystem";
import { useSettings } from "../../store/useSettingsStore";
import { PROJECTS, BIO_SHORT, CONTACT_EMAIL, CONTACT_GITHUB, BIO_LONG } from "../../data/projects";
import { WALLPAPERS } from "../../data/wallpapers";
import { openApp } from "../../system/DesktopIcons";
import { buildFastfetch } from "./FastfetchBanner";
import { osfx } from "../../lib/operatorSounds";
import type { WindowState } from "../../types";

const R = "\x1b[0m", DIM = "\x1b[2m", B = "\x1b[1m", RED = "\x1b[38;5;196m", GREEN = "\x1b[38;5;46m", YELLOW = "\x1b[38;5;220m", CYAN = "\x1b[38;5;51m", GRAY = "\x1b[38;5;245m", WHITE = "\x1b[97m";
const QUOTES = ["rm -rf doubt", "there are only two hard things: cache invalidation, naming, and off-by-one errors.", "defense is offense, inverted.", "the best security tool is honest about what it doesn't do.", "grep is a lifestyle."];
const COW = (t: string) => ` ${"_".repeat(t.length + 2)}\n< ${t} >\n ${"-".repeat(t.length + 2)}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`;
const COMMANDS = ["ls","cd","pwd","cat","echo","mkdir","touch","rm","mv","cp","grep","head","tail","wc","find","which","whoami","hostname","date","uptime","uname","df","free","ps","kill","top","history","clear","exit","man","help","neofetch","fastfetch","projects","about","contact","theme","wallpaper","open","cowsay","uwu","fortune","matrix","sudo","ssh","apt","pkg","ask"];
const MAN: Record<string, string> = { ls: "ls [-la] [path] — list directory", cd: "cd [path] — change directory", cat: "cat <file> — print file", grep: "grep [-i] <pat> <file> — search", find: "find <pattern> — find files", rm: "rm [-rf] <path> — remove", cp: "cp <src> <dst> — copy", mv: "mv <src> <dst> — move/rename", head: "head [-n N] <file>", tail: "tail [-n N] <file>", wc: "wc <file> — count", ps: "ps — list processes", kill: "kill <pid> — close window", apt: "apt <list|install|remove|update>", ask: 'ask "question" — AI assistant' };

export default function TerminalApp({ win }: { win: WindowState }) {
  const ref = useRef<HTMLDivElement>(null);
  const fs = useFS();
  const settings = useSettings();
  const t0 = useRef(Date.now());

  useEffect(() => {
    const term = new Terminal({
      fontFamily: "'JetBrains Mono', monospace", fontSize: settings.fontSize === "small" ? 12 : settings.fontSize === "large" ? 14 : 13,
      lineHeight: 1.4, cursorBlink: settings.showSeconds !== undefined,
      cursorStyle: (settings as any).cursorStyle === "bar" ? "bar" : (settings as any).cursorStyle === "underline" ? "underline" : "block",
      theme: { background: "#000000", foreground: "#00ff9c", cursor: "#00ff9c", selectionBackground: "rgba(255,43,43,.3)", black: "#050507", red: "#ff2b2b", green: "#00ff9c", yellow: "#ffb800", blue: "#4d9fff", magenta: "#ff2bd6", cyan: "#00e5ff", white: "#e6e6e6", brightBlack: "#7d7d7d" },
    });
    const fit = new FitAddon();
    term.loadAddon(fit); term.loadAddon(new WebLinksAddon());
    term.open(ref.current!); fit.fit();

    let cwd = win.props.cwd || HOME;
    let history: string[] = JSON.parse(localStorage.getItem("os.terminal.history") || "[]");
    let hIdx = history.length;
    let buf = "", cursor = 0;
    let matrixTimer: ReturnType<typeof setInterval> | null = null;
    const guest = () => !!localStorage.getItem("os.guest");

    const promptStr = () => {
      const p = cwd.replace(HOME, "~");
      if (settings.promptStyle === "minimal") return `${GREEN}$${R} `;
      if (settings.promptStyle === "plain") return `> `;
      return `${RED}navairgap@blackarch${R}:${WHITE}${p}${R}$ `;
    };
    const prompt = () => term.write(promptStr());
    const saveHist = () => localStorage.setItem("os.terminal.history", JSON.stringify(history.slice(-500)));
    const resolve = (p?: string) => {
      if (!p || p === ".") return cwd;
      if (p.startsWith("~")) p = HOME + p.slice(1);
      if (!p.startsWith("/")) p = joinPath(cwd, p);
      const out: string[] = [];
      for (const part of p.split("/").filter(Boolean)) { if (part === "..") out.pop(); else if (part !== ".") out.push(part); }
      return "/" + out.join("/");
    };
    const render = () => term.write(`\r\x1b[2K${promptStr()}${buf}`);
    const uptime = () => { const m = Math.floor((Date.now() - t0.current) / 60000); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} hours, ${m % 60} mins`; };

    const exec = (raw: string) => {
      const line = raw.trim();
      if (!line) return;
      history.push(line); hIdx = history.length; saveHist();
      const parts = line.split(/\s+/);
      const cmd = parts[0], args = parts.slice(1);
      const flags = args.filter((a) => a.startsWith("-")).join("").replace(/-/g, "");
      const ps = args.filter((a) => !a.startsWith("-"));
      const target = resolve(ps[0]);
      const out = (s = "") => term.writeln(s);
      const err = (s: string) => { term.writeln(`${RED}${s}${R}`); osfx.error(); };
      const ok = () => osfx.termOk();

      switch (cmd) {
        case "help": out(`${CYAN}commands${R}: ${COMMANDS.join(" ")}`); ok(); break;
        case "clear": term.clear(); break;
        case "ls": {
          const node = fs.get(ps[0] ? target : cwd);
          if (!node || node.type !== "folder") { err(`ls: cannot access '${ps[0]}': No such directory`); break; }
          const items = fs.list(ps[0] ? target : cwd).filter((p) => flags.includes("a") || !p.split("/").pop()!.startsWith("."));
          if (!flags.includes("l")) { out(items.map((p) => { const n = fs.get(p)!; return n.type === "folder" ? `${RED}${B}${n.name}/${R}` : n.name; }).join("   ")); ok(); break; }
          out(`${GRAY}total ${items.length}${R}`);
          for (const p of items) { const n = fs.get(p)!; out(`-rw-r--r-- navairgap navairgap ${String((n.content || "").length || 4096).padStart(8)} Jan 01 00:00 ${n.type === "folder" ? RED + B + n.name + "/" + R : n.name}`); }
          ok(); break;
        }
        case "cd": { const n = fs.get(ps[0] ? target : HOME); if (n?.type === "folder") cwd = ps[0] ? target : HOME; else err(`bash: cd: ${ps[0]}: No such directory`); break; }
        case "pwd": out(cwd); ok(); break;
        case "cat": { const n = fs.get(target); if (n?.type === "file") out(n.content || ""); else err(`cat: ${ps[0]}: No such file`); ok(); break; }
        case "echo": {
          const raw2 = parts.slice(1).join(" ");
          const m = raw2.match(/^(.*)>(>?)\s*(\S+)$/);
          if (m) { const text = m[1].trim().replace(/^["']|["']$/g, "") + "\n"; const p = resolve(m[3]); const n = fs.get(p); if (n?.type === "file") fs.writeFile(p, m[2] ? (n.content || "") + text : text); else fs.createFile(parentOf(p), p.split("/").pop()!) && fs.writeFile(p, text); ok(); break; }
          out(raw2.replace(/^["']|["']$/g, "")); ok(); break;
        }
        case "mkdir": fs.mkdir(target); ok(); break;
        case "touch": { fs.createFile(parentOf(target), target.split("/").pop()!); ok(); break; }
        case "rm": {
          if (args.join(" ") === "-rf /" || args.join(" ") === "-rf /*") { let i = 0; const t = setInterval(() => { out(`${RED}deleting ${"█".repeat(i)}${"░".repeat(20 - i)} ${i * 5}%${R}`); if (++i > 20) { clearInterval(t); out(`${GREEN}just kidding.${R}`); } }, 60); break; }
          if (fs.get(target)) { fs.remove(target); ok(); } else err(`rm: ${ps[0]}: No such file`);
          break;
        }
        case "mv": { const dst = resolve(ps[1]); const n = fs.get(target); if (!n) { err(`mv: ${ps[0]}: No such file`); break; } fs.rename(target, dst.split("/").pop()!); ok(); break; }
        case "cp": { const n = fs.get(target); if (n?.type === "file") { const dst = resolve(ps[1]); fs.createFile(parentOf(dst), dst.split("/").pop()!); fs.writeFile(dst, n.content || ""); ok(); } else err(`cp: ${ps[0]}: No such file`); break; }
        case "grep": { const n = fs.get(resolve(ps[1])); if (n?.content) { const pat = new RegExp(ps[0], flags.includes("i") ? "i" : ""); const hits = n.content.split("\n").filter((l) => pat.test(l)); hits.length ? out(hits.join("\n")) : out(`${GRAY}(no matches)${R}`); ok(); } else err(`grep: ${ps[1]}: No such file`); break; }
        case "head": case "tail": { const n = fs.get(target); if (n?.content) { const lines = n.content.split("\n"); const k = parseInt(ps[1] || "") || 10; out((cmd === "head" ? lines.slice(0, k) : lines.slice(-k)).join("\n")); ok(); } else err(`${cmd}: ${ps[0]}: No such file`); break; }
        case "wc": { const n = fs.get(target); if (n?.content) { const c = n.content; out(`${c.split("\n").length} ${c.split(/\s+/).filter(Boolean).length} ${c.length} ${ps[0]}`); ok(); } else err(`wc: ${ps[0]}: No such file`); break; }
        case "find": { const hits = Object.keys(fs.tree).filter((p) => p.includes(ps[0] || "")).slice(0, 20); out(hits.join("\n") || `${GRAY}(nothing found)${R}`); ok(); break; }
        case "which": out(COMMANDS.includes(ps[0]) ? `/usr/bin/${ps[0]}` : `${ps[0]} not found`); ok(); break;
        case "whoami": out(guest() ? `${RED}guest (you're not navairgap)${R}` : "navairgap"); ok(); break;
        case "hostname": out("blackarch"); ok(); break;
        case "ssh": out("Connection refused."); ok(); break;
        case "date": out(new Date().toString()); ok(); break;
        case "uptime": out(` up ${uptime()}`); ok(); break;
        case "uname": out(args.includes("-r") ? "6.12.4-blackarch" : "Linux blackarch 6.12.4-blackarch #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux"); ok(); break;
        case "df": out(`Filesystem      Size  Used Avail Use% Mounted on\n/dev/nvme0n1p1  2.0T  412G  1.5T  22% /`); ok(); break;
        case "free": out(`               total        used        free\nMem:        65536000    12698000    52838000\nSwap:        8388608           0     8388608`); ok(); break;
        case "ps": case "top": {
          const { windows } = (window as any).__winStore || {};
          import("../../store/useWindowStore").then(({ useWindows }) => {
            const list = useWindows.getState().windows;
            out("  PID TTY          TIME CMD");
            list.forEach((w) => { let h = 0; for (const c of w.id) h = (h * 31 + c.charCodeAt(0)) % 32768; out(`${String(h + 1000).padStart(5)} pts/0    00:00:0${list.indexOf(w) % 9} ${w.title.toLowerCase().replace(/\s/g, "-")}`); });
          });
          ok(); break;
        }
        case "kill": { import("../../store/useWindowStore").then(({ useWindows }) => { const pid = parseInt(ps[0]); const w = useWindows.getState().windows.find((w) => { let h = 0; for (const c of w.id) h = (h * 31 + c.charCodeAt(0)) % 32768; return h + 1000 === pid; }); if (w) { useWindows.getState().closeWindow(w.id); out(`${GRAY}killed ${pid}${R}`); } else err(`kill: ${pid}: No such process`); }); break; }
        case "history": out(history.slice(-30).map((h, i) => `  ${String(i + 1).padStart(4)}  ${h}`).join("\n")); break;
        case "exit": term.writeln("logout"); osfx.close(); setTimeout(() => import("../../store/useWindowStore").then(({ useWindows }) => useWindows.getState().closeWindow(win.id)), 300); break;
        case "man": out(MAN[ps[0]] || `${GRAY}no manual entry for ${ps[0]}${R}`); ok(); break;
        case "neofetch": case "fastfetch": term.writeln(buildFastfetch(uptime())); ok(); break;
        case "open": { const map: Record<string, string> = { files: "files", terminal: "terminal", editor: "editor", code: "code", browser: "browser", mail: "mail", settings: "settings", about: "about", calculator: "calculator", notes: "notes", trash: "trash", algoviz: "algoviz", music: "music", doom: "doom" }; if (map[ps[0]]) { out(`opening ${CYAN}${map[ps[0]]}${R}...`); openApp(map[ps[0]]); } else err(`open: ${ps[0]}: app not found`); ok(); break; }
        case "projects": Object.values(PROJECTS).forEach((p) => out(`${YELLOW}${B}${p.name}${R} — ${p.desc}`)); ok(); break;
        case "contact": out(`email: ${CYAN}${CONTACT_EMAIL}${R}\ngithub: ${CYAN}${CONTACT_GITHUB}${R}`); ok(); break;
        case "about": out(BIO_SHORT + "\n\n" + BIO_LONG); ok(); break;
        case "sudo": {
          if (ps[0] === "su") { out(`${GRAY}[ sudo ] password for navairgap:${R} `); setTimeout(() => out(`${RED}nice try. this incident has been logged.${R}`), 2000); break; }
          if (args.join(" ") === "rm -rf /") { dispatchEvent(new Event("os-bsod")); out(`${RED}deleting system...${R}`); break; }
          out(`${GRAY}[ sudo ] password for navairgap:${R} `);
          setTimeout(() => { out(`${RED}navairgap is not in the sudoers file. This incident has been reported.${R}`); osfx.error(); }, 1500);
          break;
        }
        case "cowsay": out(COW(ps.join(" ") || "moo")); ok(); break;
        case "uwu": out((ps.join(" ") || "hello").replace(/[rl]/g, "w").replace(/[RL]/g, "W") + " uwu"); ok(); break;
        case "fortune": out(QUOTES[Math.floor(Math.random() * QUOTES.length)]); ok(); break;
        case "theme": if (ps[0] === "dark" || ps[0] === "light") { settings.set({ theme: ps[0] as any }); out(`theme set to ${ps[0]}`); ok(); } else out(`usage: theme <${CYAN}dark${R}|${CYAN}light${R}>`); break;
        case "wallpaper": { const n = parseInt(ps[0]); if (n >= 1 && n <= WALLPAPERS.length) { settings.set({ wallpaper: n - 1 }); out(`wallpaper set to ${YELLOW}${WALLPAPERS[n - 1].name}${R}`); ok(); } else out(`usage: wallpaper <1-${WALLPAPERS.length}>`); break; }
        case "matrix": { out(`${GREEN}wake up, operator. the matrix has you.${R}`); let i = 0; matrixTimer = setInterval(() => { let l = ""; for (let c = 0; c < 56; c++) l += Math.random() < .5 ? "0" : "1"; out(`\x1b[32m${l}\x1b[0m`); if (++i >= 40 && matrixTimer) { clearInterval(matrixTimer); matrixTimer = null; out(`\n${GREEN}welcome back.${R}`); } }, 80); break; }
        case "shutdown": case "poweroff": dispatchEvent(new CustomEvent("os-power", { detail: "shutdown" })); out("powering off..."); break;
        case "reboot": dispatchEvent(new CustomEvent("os-power", { detail: "restart" })); out("rebooting..."); break;
        default: err(`bash: ${cmd}: command not found — try ${CYAN}help${R}`);
      }
    };

    // banner
    if (settings.showFastfetch) term.writeln(buildFastfetch(uptime()));
    if (win.props.run) setTimeout(() => { exec(String(win.props.run)); }, 300);

    const sub = term.onData((d) => {
      if (matrixTimer) return;
      osfx.key();
      const code = d.charCodeAt(0);
      const ctrl = d === "\x01" ? "A" : d === "\x05" ? "E" : d === "\x15" ? "U" : d === "\x0b" ? "K" : d === "\x17" ? "W" : null;
      if (code === 13) { term.write("\r\n"); const l = buf; buf = ""; cursor = 0; exec(l); if (l.trim() !== "exit") prompt(); }
      else if (ctrl === "A") { cursor = 0; render(); }
      else if (ctrl === "E") { cursor = buf.length; render(); }
      else if (ctrl === "U") { buf = buf.slice(cursor); cursor = 0; render(); }
      else if (ctrl === "K") { buf = buf.slice(0, cursor); render(); }
      else if (ctrl === "W") { const m = buf.slice(0, cursor).match(/(.*\s)?(\S+)\s*$/); if (m) { buf = buf.slice(0, cursor - m[2].length) + buf.slice(cursor); cursor -= m[2].length; render(); } }
      else if (code === 127) { if (cursor > 0) { buf = buf.slice(0, cursor - 1) + buf.slice(cursor); cursor--; term.write("\b \b"); } }
      else if (d === "\x1b[D") { if (cursor > 0) { cursor--; term.write("\x1b[D"); } }
      else if (d === "\x1b[C") { if (cursor < buf.length) { cursor++; term.write("\x1b[C"); } }
      else if (d === "\x1b[A") { if (hIdx > 0) { hIdx--; buf = history[hIdx]; cursor = buf.length; render(); } }
      else if (d === "\x1b[B") { if (hIdx < history.length - 1) { hIdx++; buf = history[hIdx]; } else { hIdx = history.length; buf = ""; } cursor = buf.length; render(); }
      else if (code === 12) { term.clear(); prompt(); }
      else if (code === 3) { term.write("^C\r\n"); buf = ""; cursor = 0; prompt(); }
      else if (code === 9) {
        if (!buf.includes(" ")) {
          const m = COMMANDS.filter((c) => c.startsWith(buf));
          if (m.length === 1) { buf = m[0] + " "; cursor = buf.length; render(); }
          else if (m.length > 1) { term.write("\r\n" + m.join("   ") + "\r\n"); prompt(); term.write(buf); }
        } else {
          const [c, partial] = buf.split(" ");
          if (["cd", "cat", "rm", "ls", "mkdir", "touch", "grep", "head", "tail", "wc", "cp", "mv"].includes(c)) {
            const r = resolve(partial || "");
            const dir = fs.get(r)?.type === "folder" ? r : parentOf(r);
            const base = (partial || "").split("/").pop()!;
            const m = fs.list(dir).map((p) => p.split("/").pop()!).filter((n) => n.startsWith(base));
            if (m.length === 1) { const add = m[0].slice(base.length); buf += add; cursor = buf.length; render(); }
          }
        }
      }
      else if (code >= 32) { buf = buf.slice(0, cursor) + d + buf.slice(cursor); cursor++; term.write(d + buf.slice(cursor) ? buf.slice(cursor) + "\x1b[" + (buf.length - cursor) + "D" : ""); }
    });
    prompt();

    const onResize = () => fit.fit();
    addEventListener("resize", onResize);
    return () => { sub.dispose(); term.dispose(); removeEventListener("resize", onResize); if (matrixTimer) clearInterval(matrixTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} className="h-full w-full p-1.5" />;
}
