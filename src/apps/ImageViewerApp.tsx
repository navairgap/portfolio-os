import { useState } from "react";
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, Maximize2 } from "lucide-react";
import type { WindowState } from "../types";

const GLYPH_ART = `
 ██████╗ █████╗ ████████╗
██╔════╝██╔══██╗╚══██╔══╝
██║     ███████║   ██║
██║     ██╔══██║   ██║
╚██████╗██║  ██║   ██║
 ╚═════╝╚═╝  ╚═╝   ╚═╝`;

export default function ImageViewerApp({ win }: { win: WindowState }) {
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const name = ((win.props.path as string) || "avatar.png").split("/").pop()!;
  return (
    <div className="h-full flex flex-col bg-[#0a0a0c] text-[#f4f4f5]">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[rgba(255,255,255,.08)]">
        <span className="text-[12px] text-[rgba(244,244,245,.62)]">{name}</span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.max(.2, z - .2))} className="p-1.5 rounded hover:bg-[rgba(255,255,255,.08)]"><ZoomOut size={13} /></button>
          <span className="text-[11px] w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(5, z + .2))} className="p-1.5 rounded hover:bg-[rgba(255,255,255,.08)]"><ZoomIn size={13} /></button>
          <button onClick={() => { setZoom(1); setRot(0); }} className="p-1.5 rounded hover:bg-[rgba(255,255,255,.08)]"><Maximize2 size={13} /></button>
          <button onClick={() => setRot((r) => r - 90)} className="p-1.5 rounded hover:bg-[rgba(255,255,255,.08)]"><RotateCcw size={13} /></button>
          <button onClick={() => setRot((r) => r + 90)} className="p-1.5 rounded hover:bg-[rgba(255,255,255,.08)]"><RotateCw size={13} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto grid place-items-center">
        <pre className="text-[#cdc4ba] transition-transform duration-200 select-none" style={{ transform: `scale(${zoom}) rotate(${rot}deg)` }}>{GLYPH_ART}</pre>
      </div>
    </div>
  );
}
