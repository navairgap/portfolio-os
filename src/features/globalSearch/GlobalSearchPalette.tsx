import { useMemo, useState } from "react";
import { AppWindow, FileText, Settings as SettingsIcon, TerminalSquare, FolderGit2, Search } from "lucide-react";
import { APPS } from "../../registry/appRegistry";
import { isInstalled } from "../../lib/packages/packageManager";
import { useFS } from "../../store/useFileSystemStore";
import { HOME } from "../../lib/filesystem";
import { PROJECTS } from "../../data/projects";
import { openApp } from "../../system/DesktopIcons";

export interface Result { group: string; icon: any; title: string; sub?: string; run: () => void }
const COMMANDS = ["help","ls","cd","cat","neofetch","projects","matrix","cowsay","fortune","apt","ask","theme","wallpaper","tree","sudo"];

function fuzzy(q: string, s: string): number {
  q = q.toLowerCase(); s = s.toLowerCase();
  if (!q) return 0;
  if (s.includes(q)) return 100 - s.indexOf(q);
  let i = 0, score = 0;
  for (const c of s) { if (c === q[i]) { i++; score += 2; } }
  return i === q.length ? score : 0;
}

export function useSearchResults(q: string): Result[] {
  const fs = useFS();
  return useMemo(() => {
    if (!q.trim()) return [];
    const out: Result[] = [];
    for (const a of APPS) if (isInstalled(a.id)) { const sc = fuzzy(q, a.title); if (sc) out.push({ group: "Applications", icon: AppWindow, title: a.title, sub: a.id, run: () => openApp(a.id) }); }
    for (const [path, node] of Object.entries(fs.tree)) {
      if (!path.startsWith(HOME)) continue;
      const name = node.name;
      const sc = Math.max(fuzzy(q, name), node.content ? fuzzy(q, node.content.slice(0, 400)) : 0);
      if (sc) out.push({ group: "Files", icon: FileText, title: name, sub: path.replace(HOME, "~"), run: () => openApp(node.type === "folder" ? "files" : "editor", node.type === "folder" ? { path } : { path }, name) });
    }
    const TABS = [["appearance","Appearance"],["display","Display"],["sound","Sound"],["network","Network"],["users","Users"],["datetime","Date & Time"],["notifications","Notifications"],["keyboard","Keyboard"],["storage","Storage"],["about","About"]];
    for (const [id, label] of TABS) if (fuzzy(q, label)) out.push({ group: "Settings", icon: SettingsIcon, title: label, sub: "open Settings tab", run: () => openApp("settings", { tab: id }, "Settings") });
    for (const c of COMMANDS) if (fuzzy(q, c)) out.push({ group: "Terminal commands", icon: TerminalSquare, title: c, sub: "run in new terminal", run: () => openApp("terminal", { run: c }, "Terminal") });
    for (const [k, p] of Object.entries(PROJECTS)) if (fuzzy(q, k) || fuzzy(q, p.name)) out.push({ group: "Projects", icon: FolderGit2, title: p.name, sub: p.desc.slice(0, 60), run: () => openApp("editor", { path: `${HOME}/Projects/${k}/README.md` }, "README.md") });
    const order: Record<string, number> = { Applications: 0, Files: 1, Settings: 2, "Terminal commands": 3, Projects: 4 };
    return out.sort((a, b) => order[a.group] - order[b.group]).slice(0, 24);
  }, [q, fs]);
}

export function SearchInput({ q, setQ, onEnter, inputRef }: any) {
  return (
    <div className="flex items-center gap-3 px-4 h-12 rounded-[12px] bg-[rgba(35,35,40,.9)] border border-[rgba(255,255,255,.16)]">
      <Search size={16} className="text-[rgba(244,244,245,.62)]" />
      <input id="launcher-input" ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onEnter}
        placeholder="search apps, files, settings, commands, projects"
        className="flex-1 bg-transparent text-[14px] text-[#f4f4f5] placeholder:text-[rgba(244,244,245,.38)] focus:outline-none" />
    </div>
  );
}
