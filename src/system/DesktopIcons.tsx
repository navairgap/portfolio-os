import { useState } from "react";
import { Folder, FileText, FolderOpen, Mail } from "lucide-react";
import { useWindows } from "../store/useWindowStore";
import { openContextMenu } from "./ContextMenu";
import { DESKTOP } from "../lib/filesystem";
import { useFS } from "../store/useFileSystemStore";
import { APPS } from "../registry/appRegistry";
import { useFileDrag } from "../features/dragToOpen/useDragToOpen";

export function openApp(appId: string, props: Record<string, any> = {}, title?: string) {
  const app = APPS.find((a) => a.id === appId)!;
  const { openWindow, windows, focusWindow, activeWorkspace } = useWindows.getState();
  const existing = windows.find((w) => w.appId === appId && w.workspaceId === activeWorkspace && JSON.stringify(w.props) === JSON.stringify(props));
  if (existing) { focusWindow(existing.id); return; }
  const w = app.defaultSize.width, h = app.defaultSize.height;
  openWindow({
    appId, title: title || app.title,
    x: Math.max(20, (innerWidth - w) / 2 + (Math.random() * 90 - 45)),
    y: Math.max(40, (innerHeight - h) / 3 + (Math.random() * 70 - 35)),
    width: w, height: h, isResizable: app.resizable, minWidth: app.minSize.width, minHeight: app.minSize.height,
    workspaceId: activeWorkspace, props,
  });
}

export default function DesktopIcons() {
  const [sel, setSel] = useState<string | null>(null);
  const fs = useFS();
  const icons = fs.list(DESKTOP);

  const dbl = (name: string) => {
    if (name === "Home") openApp("files", { path: "/home/navairgap" });
    else if (name === "Projects") openApp("files", { path: "/home/navairgap/Projects" });
    else if (name === "README.md") openApp("editor", { path: "/home/navairgap/Desktop/README.md" });
    else if (name === "Contact") openApp("mail");
    else { const p = DESKTOP + "/" + name; const n = fs.get(p); if (n?.type === "folder") openApp("files", { path: p }); else openApp("editor", { path: p }); }
  };

  return (
    <div className="absolute left-4 top-12 flex flex-col gap-1 z-[90]" onClick={() => setSel(null)}>
      {icons.map((p) => {
        const name = fs.get(p)?.name || p.split("/").pop()!;
        const Icon = name === "README.md" ? FileText : name === "Contact" ? Mail : name === "Home" || name === "Projects" ? FolderOpen : Folder;
        return (
          <button key={p} onClick={(e) => { e.stopPropagation(); setSel(p); }} onDoubleClick={() => dbl(name)} draggable
            onDragStart={() => useFileDrag.getState().set(p)} onDragEnd={() => useFileDrag.getState().set(null)}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); openContextMenu(e.clientX, e.clientY, [
              { label: "Open", action: () => dbl(name) },
              { label: "Rename", disabled: true },
              { label: "Properties", action: () => openApp("about") },
            ]); }}
            className={`w-20 flex flex-col items-center gap-1 p-2 rounded-[8px] text-[11px] text-[#f4f4f5]
              ${sel === p ? "bg-[rgba(124,156,255,.2)]" : "hover:bg-[rgba(255,255,255,.06)]"}`}>
            <Icon size={26} className="text-[rgba(244,244,245,.85)]" />
            <span className="text-center leading-tight break-all">{name}</span>
          </button>
        );
      })}
    </div>
  );
}
