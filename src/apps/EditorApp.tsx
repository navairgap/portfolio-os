import { useEffect, useMemo, useState } from "react";
import { marked } from "marked";
import { Save, FolderOpen, FilePlus, Eye, Pencil } from "lucide-react";
import MarkdownView from "../system/MarkdownView";
import { pickFile } from "../system/FilePicker";
import { useFS } from "../store/useFileSystemStore";
import { openApp } from "../system/DesktopIcons";
import type { WindowState } from "../types";

interface Tab { path: string; content: string; saved: string }

export default function EditorApp({ win }: { win: WindowState }) {
  const fs = useFS();
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const p = win.props.path as string | undefined;
    if (p && fs.get(p)) return [{ path: p, content: fs.get(p)!.content || "", saved: fs.get(p)!.content || "" }];
    return [{ path: "/home/navairgap/untitled.md", content: "", saved: "" }];
  });
  const [active, setActive] = useState(0);
  const [preview, setPreview] = useState(false);
  const tab = tabs[active];
  const dirty = tab.content !== tab.saved;
  const isMd = tab.path.endsWith(".md");

  const setTab = (t: Partial<Tab>) => setTabs((ts) => ts.map((x, i) => (i === active ? { ...x, ...t } : x)));
  const save = () => {
    if (!fs.exists(tab.path)) fs.createFile("/home/navairgap", tab.path.split("/").pop()!);
    fs.writeFile(tab.path, tab.content);
    setTab({ saved: tab.content });
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.ctrlKey && e.key.toLowerCase() === "s") { e.preventDefault(); save(); } };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);
  const html = useMemo(() => (isMd ? marked.parse(tab.content, { async: false }) : ""), [tab.content, isMd]);

  return (
    <div className="h-full flex flex-col text-[13px] text-[#f4f4f5]">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[rgba(255,255,255,.08)]">
        <button onClick={() => setTabs((ts) => [...ts, { path: "/home/navairgap/untitled.md", content: "", saved: "" }])} className="p-1.5 rounded hover:bg-[rgba(255,255,255,.08)]" title="new"><FilePlus size={14} /></button>
        <button onClick={async () => { const p = await pickFile(); if (p) openApp("editor", { path: p }, p.split("/").pop()!); }} className="p-1.5 rounded hover:bg-[rgba(255,255,255,.08)]" title="open file…"><FolderOpen size={14} /></button>
        <button onClick={save} className="p-1.5 rounded hover:bg-[rgba(255,255,255,.08)]" title="save (ctrl+s)"><Save size={14} /></button>
        {isMd && (
          <button onClick={() => setPreview(!preview)} className="p-1.5 rounded hover:bg-[rgba(255,255,255,.08)] ml-2" title="toggle preview">
            {preview ? <Pencil size={14} /> : <Eye size={14} />}
          </button>
        )}
        <span className="ml-auto text-[12px] text-[rgba(244,244,245,.38)]">{tab.content.split("\n").length} lines · {tab.content.length} chars</span>
      </div>
      <div className="flex border-b border-[rgba(255,255,255,.08)] overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={`px-3 py-1.5 text-[12px] flex items-center gap-1.5 border-r border-[rgba(255,255,255,.08)] ${i === active ? "bg-[rgba(255,255,255,.05)]" : "opacity-60"}`}>
            {t.path.split("/").pop()}{t.content !== t.saved && <i className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />}
            {tabs.length > 1 && <span onClick={(e) => { e.stopPropagation(); setTabs((ts) => ts.filter((_, j) => j !== i)); if (active >= tabs.length - 1) setActive(Math.max(0, tabs.length - 2)); }} className="ml-1 opacity-60 hover:opacity-100">×</span>}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden relative">
        {preview ? (
          <div className="h-full overflow-auto p-4"><MarkdownView md={tab.content} /></div>
        ) : (
          <textarea value={tab.content} onChange={(e) => setTab({ content: e.target.value })} spellCheck={false}
            className="w-full h-full bg-transparent p-3 resize-none focus:outline-none font-mono text-[13px] leading-[1.6] text-[#f4f4f5]" />
        )}
      </div>
    </div>
  );
}
