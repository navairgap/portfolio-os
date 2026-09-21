import { useEffect, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";

// DOOM via js-dos (lazy CDN). Requires network + a shareware bundle; degrades gracefully.
export default function DoomApp() {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [msg, setMsg] = useState("loading dos runtime…");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/js-dos@7.5.0/dist/js-dos.js";
        await new Promise((res, rej) => { s.onload = res; s.onerror = () => rej(new Error("network")); document.head.appendChild(s); });
        if (cancelled || !host.current) return;
        const ci = await (window as any).Dos(host.current, { style: "none" });
        setMsg("fetching shareware wad…");
        // js-dos bundles are served by the dos.zone CDN; shareware DOOM bundle (id 1 is the classic demo):
        await ci.run("https://cdn.dos.zone/custom/js-dos/doom.jsdos");
        if (!cancelled) setState("ready");
      } catch (e: any) {
        if (!cancelled) { setState("error"); setMsg(e?.message || "failed to load runtime"); }
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="flex items-center gap-2 px-2 h-7 border-b border-[rgba(255,255,255,.08)] text-[11px] text-[var(--text-secondary)]">
        <span>DOOM (emulated)</span>
        <span className="text-[var(--text-tertiary)]">arrows move · ctrl fire · space use</span>
        <button onClick={() => host.current?.requestFullscreen?.()} className="ml-auto p-1 hover:text-[var(--accent)]" title="fullscreen"><Maximize2 size={12} /></button>
      </div>
      <div className="flex-1 relative">
        <div ref={host} className="absolute inset-0" />
        {state !== "ready" && (
          <div className="absolute inset-0 grid place-items-center text-[12px] text-[var(--terminal-fg)]">
            <div className="text-center">
              {state === "loading" ? <><div className="animate-pulse mb-2">{msg}</div><div className="text-[var(--text-tertiary)]">js-dos loads from CDN — needs network</div></>
                : <><div className="text-[var(--accent)] mb-2">DOOM could not start</div><div className="text-[var(--text-tertiary)] max-w-xs">{msg} — the CDN may be unreachable. try again online.</div></>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
