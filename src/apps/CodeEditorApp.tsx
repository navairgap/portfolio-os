import { useEffect, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, lineNumbers, highlightActiveLine, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle, indentOnInput } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { markdown } from "@codemirror/lang-markdown";
import { Play, Square } from "lucide-react";
import { useFS } from "../store/useFileSystemStore";
import type { WindowState } from "../types";

function langFor(path: string) {
  if (path.endsWith(".py")) return python();
  if (path.endsWith(".md")) return markdown();
  return javascript({ jsx: path.endsWith(".jsx"), typescript: path.endsWith(".ts") || path.endsWith(".tsx") });
}

let pyodidePromise: Promise<any> | null = null;
function loadPyodide(): Promise<any> {
  if (!pyodidePromise) {
    pyodidePromise = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
      s.onload = async () => { try { res(await (window as any).loadPyodide()); } catch (e) { rej(e); } };
      s.onerror = () => rej(new Error("failed to load Pyodide (network)"));
      document.head.appendChild(s);
    });
  }
  return pyodidePromise;
}

export default function CodeEditorApp({ win }: { win: WindowState }) {
  const fs = useFS();
  const path = (win.props.path as string) || "/home/navairgap/untitled.js";
  const isPy = path.endsWith(".py");
  const [output, setOutput] = useState("");
  const [outH, setOutH] = useState(120);
  const [running, setRunning] = useState(false);
  const viewRef = useRef<EditorView | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const pyodideRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const initial = fs.get(path)?.content ?? "";
    const state = EditorState.create({
      doc: initial,
      extensions: [
        lineNumbers(), history(), bracketMatching(), indentOnInput(), highlightActiveLine(),
        syntaxHighlighting(defaultHighlightStyle),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab, { key: "Ctrl-Enter", run: () => { run(); return true; } }]),
        langFor(path),
        EditorView.updateListener.of((u) => { if (u.docChanged) fs.writeFile(path, u.state.doc.toString()); }),
        EditorView.theme({ "&": { height: "100%", fontSize: "13px", backgroundColor: "#0e0e10" }, ".cm-content": { fontFamily: "'JetBrains Mono', monospace", color: "#f4f4f5" }, ".cm-gutters": { backgroundColor: "#131316", color: "rgba(244,244,245,.38)", border: "none" }, ".cm-activeLine": { backgroundColor: "rgba(255,255,255,.04)" }, ".cm-cursor": { borderLeftColor: "#7c9cff" } }),
      ],
    });
    const view = new EditorView({ state, parent: hostRef.current! });
    viewRef.current = view;
    return () => { stop(); view.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const print = (s: string, err = false) => setOutput((o) => o + (err ? `<span style="color:#ff5c5c">${s}</span>\n` : s + "\n"));

  const stop = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    iframeRef.current?.remove(); iframeRef.current = null;
    setRunning(false);
  };

  const run = async () => {
    if (running) return;
    const code = viewRef.current?.state.doc.toString() || "";
    setOutput(""); setRunning(true);
    if (!isPy) {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.setAttribute("sandbox", "allow-scripts");
      iframeRef.current = iframe;
      const lines: string[] = [];
      const handler = (e: MessageEvent) => { if (e.source === iframe.contentWindow && e.data?.type === "log") lines.push(e.data.line); };
      addEventListener("message", handler);
      iframe.srcdoc = `<script>
        const send=(t,l)=>parent.postMessage({type:"log",line:l},"*");
        console.log=(...a)=>send(0,a.map(x=>typeof x==="object"?JSON.stringify(x):String(x)).join(" "));
        console.error=(...a)=>send(1,"Error: "+a.join(" "));
        onerror=(m,s,ln)=>{send(1,m+(ln?(" (line "+ln+")"):""));parent.postMessage({type:"done"},"*");};
        try{ ${code} ; parent.postMessage({type:"done"},"*"); }catch(e){ send(1,(e&&e.message)||String(e)); parent.postMessage({type:"done"},"*"); }
      <\/script>`;
      document.body.appendChild(iframe);
      await new Promise<void>((res) => {
        const t = setTimeout(() => { print("(killed — 3s timeout)"); res(); }, 3000);
        timerRef.current = t;
        const done = (e: MessageEvent) => { if (e.source === iframe.contentWindow && e.data?.type === "done") { clearTimeout(t); removeEventListener("message", done); res(); } };
        addEventListener("message", done);
      });
      removeEventListener("message", handler);
      lines.forEach((l) => print(l));
      if (!lines.length && !output) print("(no output)");
      iframe.remove(); iframeRef.current = null;
      setRunning(false);
    } else {
      try {
        print("loading python runtime…");
        if (!pyodideRef.current) pyodideRef.current = await loadPyodide();
        const py = pyodideRef.current;
        setOutput("");
        py.setStdout({ batched: (s: string) => print(s) });
        py.setStderr({ batched: (s: string) => print(s, true) });
        timerRef.current = setTimeout(() => { print("(killed — 3s timeout)"); setRunning(false); }, 3000);
        await py.runPythonAsync(code);
        if (timerRef.current) clearTimeout(timerRef.current);
      } catch (e: any) {
        print("Error: " + (e?.message || e), true);
      }
      setRunning(false);
    }
  };

  const drag = (e: React.PointerEvent) => {
    const startY = e.clientY, startH = outH;
    const mv = (ev: PointerEvent) => setOutH(Math.max(48, Math.min(innerHeight - 200, startH + (startY - ev.clientY))));
    const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); };
    addEventListener("pointermove", mv); addEventListener("pointerup", up);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-[rgba(255,255,255,.08)]">
        <span className="text-[12px] text-[rgba(244,244,245,.62)] font-mono">{path.split("/").pop()}</span>
        <span className="text-[11px] text-[rgba(244,244,245,.38)]">autosaved · Ctrl+Enter to run</span>
        {running
          ? <button onClick={stop} className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#ff5c5c] text-black text-[12px] font-semibold"><Square size={11} /> Stop</button>
          : <button onClick={run} className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#7c9cff] text-black text-[12px] font-semibold hover:brightness-110"><Play size={12} /> Run</button>}
      </div>
      <div ref={hostRef} className="flex-1 overflow-hidden" style={{ height: `calc(100% - ${outH + 30}px)` }} />
      <div className="h-[5px] cursor-row-resize bg-[rgba(255,255,255,.08)] hover:bg-[rgba(124,156,255,.4)] transition-colors" onPointerDown={drag} />
      <div className="bg-[#0a0a0c] overflow-auto" style={{ height: outH }}>
        <div className="flex justify-between px-2 pt-1.5 text-[11px] text-[rgba(244,244,245,.38)]"><span>output {isPy ? "· python (pyodide)" : "· js (sandboxed iframe)"}</span>{output && <button onClick={() => setOutput("")}>clear</button>}</div>
        <pre className="px-2 pb-2 font-mono text-[12px] text-[#4ade80] whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: output.replace(/&/g, "&amp;").replace(/</g, "&lt;") }} />
      </div>
    </div>
  );
}
