import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, Folder, FileText, Image as ImageIcon, File, Search, LayoutGrid, List, Trash2 } from "lucide-react";
import { useFS } from "../store/useFileSystemStore";
import { parentOf, joinPath, HOME, TRASH } from "../lib/filesystem";
import { openApp } from "../system/DesktopIcons";
import { openContextMenu } from "../system/ContextMenu";
import { useFileDrag } from "../features/dragToOpen/useDragToOpen";
import type { WindowState } from "../types";

const extIcon = (name: string) => {
  if (name.endsWith(".md") || name.endsWith(".txt") || name.endsWith(".py") || name.endsWith(".c") || name.endsWith(".rs") || name.endsWith(".js")) return FileText;
  if (name.endsWith(".png") || name.endsWith(".jpg")) return ImageIcon;
  return File;
};

export default function FilesApp({ win }: { win: WindowState }) {
  const fs = useFS();
  const [cwd, setCwd] = useState<string>(win.props.path || HOME);
  const [history, setHistory] = useState<string[]>([cwd]);
  const [hi, setHi] = useState(0);
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const isTrash = cwd === TRASH;

  const entries = useMemo(() => fs.list(cwd), [fs, cwd]);
  const shown = q ? entries.filter((p) => p.split("/").pop()!.toLowerCase().includes(q.toLowerCase())) : entries;

  const nav = (p: string) => {
    const h = history.slice(0, hi + 1);
    h.push(p); setHistory(h); setHi(h.length - 1); setCwd(p); setQ("");
  };
  const back = () => { if (hi > 0) { setHi(hi - 1); setCwd(history[hi - 1]); } };
  const fwd = () => { if (hi < history.length - 1) { setHi(hi + 1); setCwd(history[hi + 1]); } };

  const open = (p: string) => {
    const n = fs.get(p);
    if (!n) return;
    if (n.type === "folder") return nav(p);
    if (p.endsWith(".pdf")) return openApp("document", { path: p }, "resume.pdf");
    if (p.endsWith(".png") || p.endsWith(".jpg")) return openApp("image", { path: p }, n.name);
    if ([".js", ".ts", ".py", ".rs", ".c", ".cpp", ".json"].some((e) => p.endsWith(e))) return openApp("code", { path: p }, n.name);
    return openApp("editor", { path: p }, n.name);
  };

  const crumbs = cwd === "/" ? ["/"] : cwd.split("/").filter(Boolean).reduce<string[]>((a, _, i, arr) => [...a, "/" + arr.slice(0, i + 1).join("/")], []);

  return (
    <div className="h-full flex flex-col text-[13px] text-[#f4f4f5]">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[rgba(255,255,255,.08)]">
        <button onClick={back} disabled={hi === 0} className="p-1.5 rounded hover:bg-[rgba(255,255,255,.08)] disabled:opacity-30"><ArrowLeft size={14} /></button>
        <button onClick={fwd} disabled={hi >= history.length - 1} className="p-1.5 rounded hover:bg-[rgba(255,255,255,.08)] disabled:opacity-30"><ArrowRight size={14} /></button>
        <button onClick={() => cwd !== "/" && nav(parentOf(cwd))} className="p-1.5 rounded hover:bg-[rgba(255,255,255,.08)]"><ArrowUp size={14} /></button>
        <div className="flex items-center gap-1 ml-1 flex-1 truncate">
          {crumbs.map((c, i) => (
            <button key={c} onClick={() => nav(c)} className="hover:underline text-[rgba(244,244,245,.72)]">
              {i > 0 && <span className="mx-1 text-[rgba(244,244,245,.38)]">/</span>}{c.split("/").pop() || "/"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-[rgba(255,255,255,.06)] rounded-[6px] px-2">
          <Search size={12} className="text-[rgba(244,244,245,.38)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search" className="bg-transparent h-7 w-28 text-[12px] focus:outline-none placeholder:text-[rgba(244,244,245,.38)]" />
        </div>
        <button onClick={() => setView(view === "grid" ? "list" : "grid")} className="p-1.5 rounded hover:bg-[rgba(255,255,255,.08)]" title="toggle view">
          {view === "grid" ? <List size={14} /> : <LayoutGrid size={14} />}
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-40 border-r border-[rgba(255,255,255,.08)] p-2 space-y-0.5 shrink-0">
          {[["Home", HOME, Folder], ["Desktop", HOME + "/Desktop", Folder], ["Documents", HOME + "/Documents", Folder], ["Projects", HOME + "/Projects", Folder], ["Downloads", HOME + "/Downloads", Folder], ["Pictures", HOME + "/Pictures", Folder], ["Trash", TRASH, Trash2]].map(([label, path, Icon]: any) => (
            <button key={path} onClick={() => nav(path)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-left ${cwd === path ? "bg-[rgba(124,156,255,.16)]" : "hover:bg-[rgba(255,255,255,.06)]"}`}>
              <Icon size={14} className="text-[rgba(244,244,245,.62)]" /> <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-3"
          onContextMenu={(e) => { e.preventDefault(); openContextMenu(e.clientX, e.clientY, [
            { label: "New Folder", action: () => fs.mkdir(joinPath(cwd, "New Folder")) },
            { label: "New File", action: () => fs.createFile(cwd, "untitled.md") },
          ]); }}>
          {isTrash && entries.length === 0 && <div className="text-center text-[rgba(244,244,245,.38)] mt-10">Trash is empty</div>}
          <div className={view === "grid" ? "grid grid-cols-[repeat(auto-fill,88px)] gap-1" : "flex flex-col gap-0.5"}>
            {shown.map((p) => {
              const n = fs.get(p)!;
              const Icon = n.type === "folder" ? Folder : extIcon(n.name);
              return (
                <button key={p} onDoubleClick={() => open(p)} title={n.name} draggable
                  onDragStart={() => useFileDrag.getState().set(p)} onDragEnd={() => useFileDrag.getState().set(null)}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); openContextMenu(e.clientX, e.clientY, [
                    { label: "Open", action: () => open(p) },
                    { label: "Rename", action: () => { const nn = prompt("Rename to:", n.name); if (nn) fs.rename(p, nn); } },
                    { label: isTrash ? "Delete Forever" : "Move to Trash", danger: true, action: () => isTrash ? (fs as any).remove(p) && fs.emptyTrash() : fs.remove(p) },
                    ...(isTrash ? [{ label: "Restore", action: () => fs.restore(p) }] : []),
                    { label: "Properties", action: () => alert(`${n.name}\nType: ${n.type}\nPath: ${p}`) },
                  ]); }}
                  className={`flex ${view === "grid" ? "flex-col items-center gap-1 p-2" : "flex-row items-center gap-2 px-2 py-1"} rounded-[8px] hover:bg-[rgba(255,255,255,.07)]`}>
                  <Icon size={view === "grid" ? 30 : 15} className={n.type === "folder" ? "text-[#7c9cff]" : "text-[rgba(244,244,245,.72)]"} />
                  <span className="text-[11.5px] text-center break-all leading-tight">{n.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
