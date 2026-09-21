import { useEffect, useState } from "react";
import { idbGet, idbSet } from "../lib/persistence";

export default function StickyNoteWidget() {
  const [text, setText] = useState("");
  useEffect(() => { idbGet<string>("os.widget.note").then((t) => setText(t || "")); }, []);
  useEffect(() => { const t = setTimeout(() => idbSet("os.widget.note", text), 300); return () => clearTimeout(t); }, [text]);
  return (
    <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="sticky note…"
      className="w-full h-20 bg-transparent resize-none focus:outline-none text-[13px] text-[#fbbf24] placeholder:text-[rgba(251,191,36,.4)] leading-[1.5]" />
  );
}
