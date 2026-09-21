import { Trash2, RotateCcw, Eraser } from "lucide-react";
import { useFS } from "../store/useFileSystemStore";
import { TRASH } from "../lib/filesystem";

export default function TrashApp() {
  const fs = useFS();
  const entries = fs.list(TRASH);
  return (
    <div className="h-full flex flex-col text-[13px] text-[#f4f4f5] p-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[12px] text-[rgba(244,244,245,.62)]">{entries.length} item{entries.length === 1 ? "" : "s"}</span>
        <button onClick={fs.emptyTrash} className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[rgba(255,92,92,.12)] text-[#ff5c5c] text-[12px] font-semibold hover:bg-[rgba(255,92,92,.2)]"><Eraser size={12} /> Empty Trash</button>
      </div>
      <div className="flex-1 overflow-auto">
        {entries.length === 0 && <div className="text-center text-[rgba(244,244,245,.28)] mt-10">Trash is empty</div>}
        <div className="grid grid-cols-[repeat(auto-fill,88px)] gap-1">
          {entries.map((p) => (
            <div key={p} className="group flex flex-col items-center gap-1 p-2 rounded-[8px] hover:bg-[rgba(255,255,255,.07)] relative">
              <Trash2 size={28} className="text-[rgba(244,244,245,.5)]" />
              <span className="text-[11px] text-center break-all leading-tight">{p.split("/").pop()}</span>
              <div className="absolute inset-0 hidden group-hover:flex items-center justify-center gap-1.5 bg-[rgba(14,14,16,.85)] rounded-[8px]">
                <button onClick={() => fs.restore(p)} title="restore" className="p-1.5 rounded bg-[rgba(255,255,255,.1)] hover:bg-[rgba(255,255,255,.2)]"><RotateCcw size={13} /></button>
                <button onClick={() => { fs.restore(p); fs.remove(p); fs.emptyTrash(); }} title="delete forever" className="p-1.5 rounded bg-[rgba(255,92,92,.2)] hover:bg-[rgba(255,92,92,.35)] text-[#ff5c5c]"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
