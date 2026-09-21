import { useEffect, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, lineNumbers, highlightActiveLine, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle, indentOnInput } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { markdown } from "@codemirror/lang-markdown";
import { Play } from "lucide-react";
import { useFS } from "../store/useFileSystemStore";
import type { WindowState } from "../types";

function langFor(path: string) {
  if (path.endsWith(".py")) return python();
  if (path.endsWith(".md")) return markdown();
  return javascript({ jsx: path.endsWith(".jsx"), typescript: path.endsWith(".ts") || path.endsWith(".tsx") });
}

export default function CodeEditorApp({ win }: { win: WindowState }) {
  const fs = useFS();
  const path = (win.props.path as string) || "/home/navairgap/untitled.js";
  const [output, setOutput] = useState("");
  const [showOut, setShowOut] = useState(false);
  const viewRef = useRef<EditorView | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initial = fs.get(path)?.content ?? "";
    const state = EditorState.create({
      doc: initial,
      extensions: [
        lineNumbers(), history(), bracketMatching(), indentOnInput(),
        highlightActiveLine(), syntaxHighlighting(defaultHighlightStyle),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        langFor(path),
        EditorView.updateListener.of((u) => { if (u.docChanged) fs.writeFile(path, u.state.doc.toString()); }),
        EditorView.theme({ "&": { height: "100%", fontSize: "13px", backgroundColor: "#0e0e10" }, ".cm-content": { fontFamily: "'JetBrains Mono', monospace", color: "#f4f4f5" }, ".cm-gutters": { backgroundColor: "#131316", color: "rgba(244,244,245,.38)", border: "none" }, ".cm-activeLine": { backgroundColor: "rgba(255,255,255,.04)" }, ".cm-cursor": { borderLeftColor: "#7c9cff" } }),
      ],
    });
    const view = new EditorView({ state, parent: hostRef.current! });
    viewRef.current = view;
    return () => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const run = () => {
    const code = viewRef.current?.state.doc.toString() || "";
    setShowOut(true);
    if (!path.endsWith(".js")) { setOutput("Run is only supported for JavaScript files."); return; }
    try {
      const logs: string[] = [];
      const fn = new Function("console", `"use strict";\n${code}`);
      fn({ log: (...a: any[]) => logs.push(a.map((x) => typeof x === "object" ? JSON.stringify(x) : String(x)).join(" ")) });
      setOutput(logs.join("\n") || "(no output)");
    } catch (err: any) {
      setOutput("Error: " + err.message);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-[rgba(255,255,255,.08)]">
        <span className="text-[12px] text-[rgba(244,244,245,.62)] font-mono">{path.split("/").pop()}</span>
        <span className="text-[11px] text-[rgba(244,244,245,.38)]">autosaved</span>
        <button onClick={run} className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#7c9cff] text-black text-[12px] font-semibold hover:brightness-110"><Play size={12} /> Run</button>
      </div>
      <div ref={hostRef} className="flex-1 overflow-hidden" />
      {showOut && (
        <div className="h-32 border-t border-[rgba(255,255,255,.08)] bg-[#0a0a0c] p-2 overflow-auto">
          <div className="flex justify-between text-[11px] text-[rgba(244,244,245,.38)] mb-1"><span>output</span><button onClick={() => setShowOut(false)}>close</button></div>
          <pre className="font-mono text-[12px] text-[#4ade80] whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  );
}
