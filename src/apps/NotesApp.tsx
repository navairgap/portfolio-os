import { useEffect, useState } from "react";
import { Plus, Trash2, StickyNote } from "lucide-react";
import { idbGet, idbSet } from "../lib/persistence";

interface Note { id: string; title: string; body: string; ts: number }

export default function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => { idbGet<Note[]>("os.notes").then((n) => { const list = n || []; setNotes(list); if (list[0]) setSel(list[0].id); }); }, []);
  useEffect(() => { idbSet("os.notes", notes); }, [notes]);

  const cur = notes.find((n) => n.id === sel);
  const update = (p: Partial<Note>) => setNotes((ns) => ns.map((n) => (n.id === sel ? { ...n, ...p, ts: Date.now() } : n)));
  const add = () => { const n: Note = { id: Math.random().toString(36).slice(2), title: "new note", body: "", ts: Date.now() }; setNotes((ns) => [n, ...ns]); setSel(n.id); };

  return (
    <div className="h-full flex text-[#f4f4f5]">
      <div className="w-44 border-r border-[rgba(255,255,255,.08)] flex flex-col shrink-0">
        <button onClick={add} className="m-2 flex items-center gap-1.5 px-2 py-1.5 rounded-[6px] bg-[rgba(124,156,255,.15)] text-[#7c9cff] text-[12px] font-semibold"><Plus size={13} /> new note</button>
        <div className="flex-1 overflow-auto px-1 pb-1 space-y-0.5">
          {notes.map((n) => (
            <div key={n.id} onClick={() => setSel(n.id)}
              className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-[6px] cursor-pointer ${sel === n.id ? "bg-[rgba(124,156,255,.14)]" : "hover:bg-[rgba(255,255,255,.05)]"}`}>
              <StickyNote size={12} className="text-[rgba(244,244,245,.38)] shrink-0" />
              <span className="text-[12px] truncate flex-1">{n.title || "untitled"}</span>
              <button onClick={(e) => { e.stopPropagation(); setNotes((ns) => ns.filter((x) => x.id !== n.id)); if (sel === n.id) setSel(null); }}
                className="opacity-0 group-hover:opacity-100 text-[rgba(244,244,245,.38)] hover:text-[#ff5c5c]"><Trash2 size={11} /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {cur ? (<>
          <input value={cur.title} onChange={(e) => update({ title: e.target.value })} placeholder="title"
            className="px-4 py-3 text-[15px] font-semibold bg-transparent border-b border-[rgba(255,255,255,.08)] focus:outline-none" />
          <textarea value={cur.body} onChange={(e) => update({ body: e.target.value })} placeholder="start typing…"
            className="flex-1 p-4 bg-transparent resize-none focus:outline-none text-[13px] leading-[1.7] text-[rgba(244,244,245,.85)]" />
        </>) : <div className="flex-1 grid place-items-center text-[rgba(244,244,245,.28)] text-[13px]">select or create a note</div>}
      </div>
    </div>
  );
}
