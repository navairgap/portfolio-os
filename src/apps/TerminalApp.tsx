import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { useFS } from "../store/useFileSystemStore";
import { joinPath, HOME, parentOf } from "../lib/filesystem";
import { useSettings } from "../store/useSettingsStore";
import { PROJECTS, BIO_SHORT, CONTACT_EMAIL, CONTACT_GITHUB, BIO_LONG } from "../data/projects";
import { WALLPAPERS } from "../data/wallpapers";
import { openApp } from "../system/DesktopIcons";
import type { WindowState } from "../types";

const QUOTES = [
  "rm -rf doubt",
  "there are only two hard things: cache invalidation, naming, and off-by-one errors.",
  "defense is offense, inverted.",
  "it works on my machine — because my machine is this machine.",
  "the best security tool is honest about what it doesn't do.",
];
const COW = (t: string) => ` ${"_".repeat(t.length + 2)}\n< ${t} >\n ${"-".repeat(t.length + 2)}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`;
const B = "\x1b[1m", DIM = "\x1b[2m", RESET = "\x1b[0m", BLUE = "\x1b[38;5;110m", GREEN = "\x1b[38;5;114m", YELLOW = "\x1b[38;5;179m", RED = "\x1b[38;5;203m", CYAN = "\x1b[38;5;116m", GREY = "\x1b[38;5;244m";

export default function TerminalApp({ win }: { win: WindowState }) {
  const ref = useRef<HTMLDivElement>(null);
  const fs = useFS();
  const settings = useSettings();

  useEffect(() => {
    const term = new Terminal({
      fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.5, cursorBlink: true,
      theme: { background: "#0e0e10", foreground: "#f4f4f5", cursor: "#7c9cff", selectionBackground: "rgba(124,156,255,.3)", brightBlue: "#7c9cff" },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(ref.current!);
    fit.fit();

    let cwd = win.props.cwd || HOME;
    let history: string[] = JSON.parse(localStorage.getItem("os.terminal.history") || "[]");
    let hIdx = history.length;
    let input = "";
    let matrixTimer: ReturnType<typeof setInterval> | null = null;

    const prompt = () => term.write(`${GREEN}navairgap@portfolio${RESET}:${BLUE}${cwd.replace(HOME, "~")}${RESET}$ `);
    const saveHist = () => localStorage.setItem("os.terminal.history", JSON.stringify(history.slice(-200)));
    const resolve = (p?: string) => {
      if (!p || p === ".") return cwd;
      if (p.startsWith("~")) p = HOME + p.slice(1);
      if (!p.startsWith("/")) p = joinPath(cwd, p);
      const parts = p.split("/").filter(Boolean);
      const out: string[] = [];
      for (const part of parts) { if (part === "..") out.pop(); else if (part !== ".") out.push(part); }
      return "/" + out.join("/");
    };
    const flags = (args: string[]) => args.filter((a) => a.startsWith("-")).join("").replace(/-/g, "");
    const paths = (args: string[]) => args.filter((a) => !a.startsWith("-"));
    const fmtSize = (n: string) => (n.content ? n.content.length : 4096);
    const lsOut = (dir: string, f: string) => {
      const node = fs.get(dir);
      if (!node || node.type !== "folder") { term.writeln(`${RED}ls: cannot access '${paths([dir]).pop() || dir}': No such directory${RESET}`); return; }
      const long = f.includes("l"), all = f.includes("a") || long;
      const items = fs.list(dir).filter((p) => all || !p.split("/").pop()!.startsWith("."));
      if (!items.length) return;
      if (!long) { term.writeln(items.map((p) => { const n = fs.get(p)!; return n.type === "folder" ? `${BLUE}${B}${n.name}${RESET}` : n.name; }).join("   ")); return; }
      term.writeln(`${GREY}total ${items.length}${RESET}`);
      for (const p of items) {
        const n = fs.get(p)!;
        const size = n.type === "folder" ? 4096 : fmtSize(n);
        const date = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" }).replace(",", "");
        const perms = n.type === "folder" ? "drwxr-xr-x" : "-rw-r--r--";
        const name = n.type === "folder" ? `${BLUE}${B}${n.name}${RESET}` : n.name;
        term.writeln(`${perms} navairgap navairgap ${String(size).padStart(8)} ${date} ${name}`);
      }
    };
    const treeOut = (dir: string, prefix = "", depth = 0) => {
      if (depth > 4) return;
      const items = fs.list(dir);
      items.forEach((p, i) => {
        const n = fs.get(p)!, last = i === items.length - 1;
        const name = n.type === "folder" ? `${BLUE}${B}${n.name}${RESET}` : n.name;
        term.writeln(`${prefix}${last ? "└──" : "├──"} ${name}`);
        if (n.type === "folder") treeOut(p, prefix + (last ? "    " : "│   "), depth + 1);
      });
    };

    const exec = (raw: string) => {
      const line = raw.trim();
      if (!line) return;
      history.push(line); hIdx = history.length; saveHist();
      const parts = line.split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1);
      const f = flags(args);
      const ps = paths(args);
      const target = resolve(ps[0]);
      const out = (s = "") => term.writeln(s);

      switch (cmd) {
        case "help": out(`${B}navairgap shell${RESET} — commands:
  ${CYAN}ls${RESET} [-la] [dir]   ${CYAN}cd${RESET} dir            ${CYAN}pwd${RESET}          ${CYAN}cat${RESET} file
  ${CYAN}echo${RESET} text       ${CYAN}mkdir${RESET} dir        ${CYAN}touch${RESET} file   ${CYAN}rm${RESET} file
  ${CYAN}tree${RESET} [dir]      ${CYAN}df${RESET} / ${CYAN}free${RESET}      ${CYAN}env${RESET}          ${CYAN}history${RESET}
  ${CYAN}open${RESET} <app>     ${CYAN}projects${RESET}        ${CYAN}contact${RESET}      ${CYAN}about${RESET}
  ${CYAN}neofetch${RESET}       ${CYAN}theme${RESET} d|l       ${CYAN}wallpaper${RESET} n   ${CYAN}matrix${RESET} ${CYAN}cowsay${RESET} ${CYAN}fortune${RESET}
  ${CYAN}sudo${RESET}            ${CYAN}shutdown${RESET}        ${CYAN}reboot${RESET}       ${CYAN}clear${RESET} ${CYAN}exit${RESET}`); break;
        case "clear": term.clear(); break;
        case "ls": lsOut(ps[0] ? target : cwd, f); break;
        case "cd": { const n = fs.get(ps[0] ? target : HOME); if (n?.type === "folder") cwd = ps[0] ? target : HOME; else term.writeln(`${RED}bash: cd: ${ps[0]}: No such directory${RESET}`); break; }
        case "pwd": out(cwd); break;
        case "cat": { const n = fs.get(target); n?.type === "file" ? out(n.content || "") : term.writeln(`${RED}cat: ${ps[0]}: No such file${RESET}`); break; }
        case "echo": out(parts.slice(1).join(" ").replace(/^["']|["']$/g, "")); break;
        case "mkdir": fs.mkdir(target); break;
        case "touch": { fs.createFile(parentOf(target), target.split("/").pop()!); break; }
        case "rm": {
          if (args.join(" ") === "-rf /" || args.join(" ") === "-rf /*") { out(`${RED}deleting everything...${RESET}`); setTimeout(() => out(`${YELLOW}...just kidding. defense is offense, inverted.${RESET}`), 900); break; }
          if (fs.get(target)) fs.remove(target); else term.writeln(`${RED}rm: ${ps[0]}: No such file${RESET}`);
          break;
        }
        case "tree": { const n = fs.get(ps[0] ? target : cwd); if (n?.type === "folder") { out(`${CYAN}${ps[0] ? target : cwd}${RESET}`); treeOut(ps[0] ? target : cwd); } else out(`${RED}tree: not a directory${RESET}`); break; }
        case "df": out(`Filesystem      Size  Used Avail Use% Mounted on\n/dev/portfolio  128G  2.4G  126G   2% /`); break;
        case "free": out(`              total        used        free\nMem:       16384000     ${String(Math.round((performance.memory?.usedJSHeapSize || 3e8) / 1024)).padStart(8)}   16000000\nSwap:       2097152           0    2097152`); break;
        case "env": out(`HOME=${HOME}\nUSER=navairgap\nSHELL=/usr/bin/nsh\nEDITOR=nano\nPATH=/usr/local/bin:/usr/bin:/bin\nTHEME=${settings.theme}`); break;
        case "hostname": out("portfolio"); break;
        case "id": out("uid=1000(navairgap) gid=1000(navairgap) groups=1000(navairgap),4(adm),27(sudo)"); break;
        case "whoami": out("navairgap"); break;
        case "date": out(new Date().toString()); break;
        case "uptime": out(` up ${Math.floor(performance.now() / 60000)} min, 1 user, load average: 0.07, 0.03, 0.01`); break;
        case "uname": out("Linux portfolio 6.8.0-portfolio #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux"); break;
        case "neofetch": out([
          ` ${CYAN}    .--.    ${RESET}  ${B}navairgap@portfolio${RESET}`,
          ` ${CYAN}   |o_o |   ${RESET}  -------------------`,
          ` ${CYAN}   |:_/ |   ${RESET}  OS: navairgap OS 1.0 x86_64`,
          ` ${CYAN}  //   \\ \\  ${RESET}  Host: Portfolio Core i9`,
          ` ${CYAN} (|     | ) ${RESET}  Kernel: 6.8.0-portfolio`,
          ` ${CYAN}/'\\_   _/\`\\\\${RESET}  Uptime: ${Math.floor(performance.now() / 60000)} mins`,
          ` ${CYAN}\\___)=(___/${RESET}  Shell: nsh 1.0 · DE: navairgap-shell · WM: portfolio-wm`,
          "                   Theme: bone [GTK3] · Terminal: xterm.js",
          "                   CPU: Portfolio Core i9 @ 3.60GHz · GPU: portfolio-drm",
          `                   Memory: ${Math.round((performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 320))}MiB / 16384MiB`,
        ].join("\n")); break;
        case "history": out(history.slice(-20).map((h, i) => `  ${String(i + 1).padStart(4)}  ${h}`).join("\n")); break;
        case "exit": term.writeln("logout"); break;
        case "open": { const map: Record<string, string> = { files: "files", terminal: "terminal", editor: "editor", code: "code", browser: "browser", mail: "mail", settings: "settings", about: "about", calculator: "calculator", notes: "notes", trash: "trash" }; if (map[ps[0]]) { out(`opening ${CYAN}${map[ps[0]]}${RESET}...`); openApp(map[ps[0]]); } else term.writeln(`${RED}open: ${ps[0]}: app not found${RESET}`); break; }
        case "projects": Object.values(PROJECTS).forEach((p) => out(`${YELLOW}${B}${p.name}${RESET} — ${p.desc}`)); break;
        case "contact": out(`email: ${CYAN}${CONTACT_EMAIL}${RESET}\ngithub: ${CYAN}${CONTACT_GITHUB}${RESET}`); break;
        case "about": out(BIO_SHORT + "\n\n" + BIO_LONG); break;
        case "sudo": out(`${RED}navairgap is not in the sudoers file. this incident will be reported.${RESET}`); break;
        case "cowsay": out(COW(ps.join(" ") || "moo")); break;
        case "fortune": out(QUOTES[Math.floor(Math.random() * QUOTES.length)]); break;
        case "theme": if (ps[0] === "dark" || ps[0] === "light") { settings.set({ theme: ps[0] as any }); out(`theme set to ${ps[0]}`); } else out(`usage: theme <${CYAN}dark${RESET}|${CYAN}light${RESET}>`); break;
        case "wallpaper": { const n = parseInt(ps[0]); if (n >= 1 && n <= WALLPAPERS.length) { settings.set({ wallpaper: n - 1 }); out(`wallpaper set to ${YELLOW}${WALLPAPERS[n - 1].name}${RESET}`); } else out(`usage: wallpaper <1-${WALLPAPERS.length}>`); break; }
        case "matrix": {
          out(`${GREEN}wake up, navairgap. the matrix has you.${RESET}`);
          let i = 0;
          matrixTimer = setInterval(() => {
            let line = "";
            for (let c = 0; c < 60; c++) line += Math.random() < .5 ? "0" : "1";
            out(`\x1b[32m${line}\x1b[0m`);
            if (++i >= 40 && matrixTimer) { clearInterval(matrixTimer); matrixTimer = null; out(`\n${GREEN}welcome back to reality.${RESET}`); }
          }, 80);
          break;
        }
        case "shutdown": case "poweroff": dispatchEvent(new CustomEvent("os-power", { detail: "shutdown" })); out("powering off..."); break;
        case "reboot": dispatchEvent(new CustomEvent("os-power", { detail: "restart" })); out("rebooting..."); break;
        default: term.writeln(`${RED}bash: ${cmd}: command not found${RESET} — try ${CYAN}help${RESET}`);
      }
    };

    const redraw = (s: string) => { term.write("\r\x1b[2K"); prompt(); input = s; term.write(s); };
    const sub = term.onData((d) => {
      if (matrixTimer) return;
      const code = d.charCodeAt(0);
      if (code === 13) { term.write("\r\n"); const line = input; input = ""; exec(line); if (line.trim() !== "exit") prompt(); }
      else if (code === 127) { if (input.length) { input = input.slice(0, -1); term.write("\b \b"); } }
      else if (code === 12) { term.clear(); prompt(); }
      else if (code === 3) { term.write("^C\r\n"); input = ""; prompt(); }
      else if (code === 9) {
        const cmds = ["help","clear","ls","cd","pwd","cat","echo","mkdir","touch","rm","tree","df","free","env","hostname","id","whoami","date","uptime","uname","neofetch","history","exit","open","projects","contact","about","sudo","matrix","cowsay","fortune","theme","wallpaper","shutdown","reboot"];
        if (!input.includes(" ")) {
          const m = cmds.filter((c) => c.startsWith(input));
          if (m.length === 1) { term.write(m[0].slice(input.length) + " "); input = m[0] + " "; }
          else if (m.length > 1) { term.write("\r\n" + m.join("   ") + "\r\n"); prompt(); term.write(input); }
        } else {
          const [c, partial] = input.split(" ");
          if (["cd", "cat", "rm", "ls", "mkdir", "touch", "tree"].includes(c)) {
            const r = resolve(partial || "");
            const dir = fs.get(r)?.type === "folder" ? r : parentOf(r);
            const base = (partial || "").split("/").pop()!;
            const m = fs.list(dir).map((p) => p.split("/").pop()!).filter((n) => n.startsWith(base));
            if (m.length === 1) {
              const add = m[0].slice(base.length);
              const isDir = fs.get(joinPath(dir, m[0]))?.type === "folder";
              term.write(add + (isDir ? "/" : " "));
              input += add + " ";
            }
          }
        }
      }
      else if (d === "\x1b[A") { if (hIdx > 0) { hIdx--; redraw(history[hIdx]); } }
      else if (d === "\x1b[B") { if (hIdx < history.length - 1) { hIdx++; redraw(history[hIdx]); } else { hIdx = history.length; redraw(""); } }
      else if (code >= 32) { input += d; term.write(d); }
    });

    term.writeln([
      ` ${CYAN}┌─┐┌─┐┌┐┌┌─┐┬─┐${RESET}`,
      ` ${CYAN}│││├─┤││││  ├┬┘${RESET}   ${B}navairgap shell${RESET} ${GREY}v1.0${RESET}`,
      ` ${CYAN}└┴┘┴ ┴┘└┘└─┘┴└─${RESET}   type ${CYAN}help${RESET} for commands · ${CYAN}projects${RESET} · ${CYAN}neofetch${RESET}`,
      "",
    ].join("\r\n"));
    prompt();

    const onResize = () => fit.fit();
    addEventListener("resize", onResize);
    return () => { sub.dispose(); term.dispose(); removeEventListener("resize", onResize); if (matrixTimer) clearInterval(matrixTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} className="h-full w-full p-2" />;
}
