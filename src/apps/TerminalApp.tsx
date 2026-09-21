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

export default function TerminalApp({ win }: { win: WindowState }) {
  const ref = useRef<HTMLDivElement>(null);
  const fs = useFS();
  const settings = useSettings();

  useEffect(() => {
    const term = new Terminal({ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.5, cursorBlink: true, theme: { background: "#0e0e10", foreground: "#f4f4f5", cursor: "#7c9cff", selectionBackground: "rgba(124,156,255,.3)" } });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(ref.current!);
    fit.fit();

    let cwd = win.props.cwd || HOME;
    let history: string[] = JSON.parse(localStorage.getItem("os.terminal.history") || "[]");
    let hIdx = history.length;
    let input = "";
    let matrixTimer: ReturnType<typeof setInterval> | null = null;

    const prompt = () => term.write(`\x1b[1;32mnavairgap@portfolio\x1b[0m:\x1b[1;34m${cwd.replace(HOME, "~")}\x1b[0m$ `);
    const saveHist = () => localStorage.setItem("os.terminal.history", JSON.stringify(history.slice(-100)));
    const resolve = (p: string) => {
      if (!p) return cwd;
      if (p.startsWith("~")) p = HOME + p.slice(1);
      if (!p.startsWith("/")) p = joinPath(cwd, p);
      const parts = p.split("/").filter(Boolean);
      const out: string[] = [];
      for (const part of parts) { if (part === "..") out.pop(); else if (part !== ".") out.push(part); }
      return "/" + out.join("/");
    };

    const exec = (raw: string) => {
      const line = raw.trim();
      if (!line) return;
      history.push(line); hIdx = history.length; saveHist();
      const [cmd, ...args] = line.split(/\s+/);
      const arg = args.join(" ");
      const out = (s = "") => term.writeln(s);

      switch (cmd) {
        case "help": out("commands: help clear ls cd pwd cat echo mkdir touch rm whoami date uptime uname neofetch history exit\n           open <app>  projects  contact  about  sudo  matrix  cowsay  fortune  theme <dark|light>  wallpaper <1-8>\n           shutdown  reboot  ls -la"); break;
        case "clear": term.clear(); break;
        case "ls": out(fs.list(resolve(args[0] || ".")).map((p) => p.split("/").pop()).join("   ") || ""); break;
        case "cd": { const p = resolve(args[0] || "~"); const n = fs.get(p); if (n?.type === "folder") cwd = p; else out(`bash: cd: ${args[0]}: No such directory`); break; }
        case "pwd": out(cwd); break;
        case "cat": { const n = fs.get(resolve(args[0] || "")); n?.type === "file" ? out(n.content || "") : out(`cat: ${args[0]}: No such file`); break; }
        case "echo": out(arg); break;
        case "mkdir": fs.mkdir(resolve(args[0] || "untitled")); break;
        case "touch": { const p = resolve(args[0] || "untitled"); fs.createFile(parentOf(p), p.split("/").pop()!); break; }
        case "rm": { const p = resolve(args[0] || ""); if (arg === "-rf /" || arg === "-rf /*") { out("deleting everything..."); setTimeout(() => out("...just kidding. defense is offense, inverted."), 900); break; } if (fs.get(p)) fs.remove(p); else out(`rm: ${args[0]}: No such file`); break; }
        case "whoami": out("navairgap"); break;
        case "date": out(new Date().toString()); break;
        case "uptime": out(` up ${Math.floor(performance.now() / 60000)} min, 1 user, load average: 0.07, 0.03, 0.01`); break;
        case "uname": out("Linux portfolio 6.8.0-portfolio #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux"); break;
        case "neofetch": out([
          "        .--.        navairgap@portfolio",
          "       |o_o |       -------------------",
          "       |:_/ |       OS: navairgap OS 1.0 x86_64",
          "      //   \\ \\      Host: Portfolio Core i9",
          "     (|     | )     Kernel: 6.8.0-portfolio",
          "    /'\\_   _/`\\     Uptime: " + Math.floor(performance.now() / 60000) + " mins",
          "    \\___)=(___/     Shell: nsh 1.0",
          "                   DE: navairgap-shell",
          "                   WM: portfolio-wm",
          "                   Theme: bone [GTK3]",
          "                   CPU: Portfolio Core i9 @ 3.60GHz",
          "                   GPU: portfolio-drm",
          "                   Memory: " + Math.round(performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 320) + "MiB / 16384MiB",
        ].join("\n")); break;
        case "history": out(history.slice(-20).map((h, i) => `  ${i + 1}  ${h}`).join("\n")); break;
        case "exit": term.writeln("logout"); break;
        case "open": { const map: Record<string, string> = { files: "files", terminal: "terminal", editor: "editor", code: "code", browser: "browser", mail: "mail", settings: "settings", about: "about", calculator: "calculator", notes: "notes", trash: "trash" }; if (map[arg]) { out(`opening ${map[arg]}...`); openApp(map[arg]); } else out(`open: ${arg}: app not found`); break; }
        case "projects": Object.values(PROJECTS).forEach((p) => out(`\x1b[1m${p.name}\x1b[0m — ${p.desc}`)); break;
        case "contact": out(`email: ${CONTACT_EMAIL}\ngithub: ${CONTACT_GITHUB}`); break;
        case "about": out(BIO_SHORT + "\n\n" + BIO_LONG); break;
        case "sudo": out("nice try."); break;
        case "cowsay": out(COW(arg || "moo")); break;
        case "fortune": out(QUOTES[Math.floor(Math.random() * QUOTES.length)]); break;
        case "theme": if (arg === "dark" || arg === "light") { settings.set({ theme: arg }); out(`theme set to ${arg}`); } else out("usage: theme <dark|light>"); break;
        case "wallpaper": { const n = parseInt(arg); if (n >= 1 && n <= WALLPAPERS.length) { settings.set({ wallpaper: n - 1 }); out(`wallpaper set to ${WALLPAPERS[n - 1].name}`); } else out(`usage: wallpaper <1-${WALLPAPERS.length}>`); break; }
        case "matrix": {
          out("wake up, navairgap. the matrix has you.");
          let i = 0;
          matrixTimer = setInterval(() => {
            const cols = 60;
            let line = "";
            for (let c = 0; c < cols; c++) line += Math.random() < .5 ? "0" : "1";
            out(`\x1b[32m${line}\x1b[0m`);
            if (++i >= 40 && matrixTimer) { clearInterval(matrixTimer); matrixTimer = null; out("\nwelcome back to reality."); }
          }, 80);
          break;
        }
        case "shutdown": case "poweroff": useSessionPhase("shutdown"); break;
        case "reboot": useSessionPhase("restart"); break;
        default: out(`bash: ${cmd}: command not found — try 'help'`);
      }
    };

    // lazy import avoidance: session store access via dynamic require would complicate; use window event
    function useSessionPhase(p: string) { dispatchEvent(new CustomEvent("os-power", { detail: p })); out(p === "restart" ? "rebooting..." : "powering off..."); }

    const sub = term.onData((d) => {
      if (matrixTimer) return;
      const code = d.charCodeAt(0);
      if (code === 13) { term.write("\r\n"); const line = input; input = ""; exec(line); if (line.trim() !== "exit") prompt(); }
      else if (code === 127) { if (input.length) { input = input.slice(0, -1); term.write("\b \b"); } }
      else if (code === 12) { term.clear(); prompt(); }
      else if (code === 3) { term.write("^C\r\n"); input = ""; prompt(); }
      else if (code === 9) {
        const cmds = ["help","clear","ls","cd","pwd","cat","echo","mkdir","touch","rm","whoami","date","uptime","uname","neofetch","history","exit","open","projects","contact","about","sudo","matrix","cowsay","fortune","theme","wallpaper","shutdown","reboot"];
        if (!input.includes(" ")) { const m = cmds.filter((c) => c.startsWith(input)); if (m.length === 1) { term.write(m[0].slice(input.length)); input = m[0]; } }
        else { const [c, partial] = input.split(" "); if (c === "cd" || c === "cat" || c === "rm" || c === "ls") { const r = resolve(partial || ""); const dir = fs.get(r)?.type === "folder" ? r : parentOf(r); const m = fs.list(dir).map((p) => p.split("/").pop()!).filter((n) => n.startsWith((partial || "").split("/").pop()!)); if (m.length === 1) { const add = m[0].slice((partial || "").split("/").pop()!.length); term.write(add + (fs.get(joinPath(dir, m[0]))?.type === "folder" ? "/" : " ")); input += add + " "; } } }
      }
      else if (code === 27 && d === "\x1b[A") { if (hIdx > 0) { hIdx--; term.write(`\r\x1b[2K${""}`); redraw(history[hIdx]); } }
      else if (code === 27 && d === "\x1b[B") { if (hIdx < history.length - 1) { hIdx++; redraw(history[hIdx]); } else { hIdx = history.length; redraw(""); } }
      else if (code >= 32 || code === 32) { input += d; term.write(d); }
    });
    let promptLen = 0;
    const redraw = (s: string) => { term.write(`\r\x1b[2K`); prompt(); promptLen = cwd.length; input = s; term.write(s); };

    term.writeln("navairgap OS terminal — type 'help' for commands");
    prompt();

    const onResize = () => fit.fit();
    addEventListener("resize", onResize);
    return () => { sub.dispose(); term.dispose(); removeEventListener("resize", onResize); if (matrixTimer) clearInterval(matrixTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} className="h-full w-full p-2" />;
}
