import { useEffect, useRef, useState } from "react";
import { useFS } from "../../store/useFileSystemStore";
import { joinPath, parentOf, HOME } from "../../lib/filesystem";

export default function RecoveryShell({ onExit }: { onExit: () => void }) {
  const [lines, setLines] = useState<string[]>([
    "navairgap OS recovery mode",
    "You are in recovery mode. The graphical interface has not started.",
    "Type 'exit' to continue booting. Type 'help' for commands.",
    "",
  ]);
  const [input, setInput] = useState("");
  const fs = useFS();
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView(); }, [lines]);

  const run = () => {
    const line = input; setInput("");
    const [cmd, ...args] = line.trim().split(/\s+/);
    const out = (s: string) => setLines((l) => [...l, s]);
    out(`root@portfolio:~# ${line}`);
    switch (cmd) {
      case "help": out("commands: ls cd cat pwd fsck systemctl exit"); break;
      case "ls": out(fs.list(HOME).map((p) => p.split("/").pop()).join("   ")); break;
      case "cd": break;
      case "cat": { const n = fs.get(joinPath(HOME, args[0] || "")); out(n?.content || "No such file"); break; }
      case "pwd": out("/root"); break;
      case "fsck": {
        out("fsck from util-linux 2.40");
        let i = 0;
        const t = setInterval(() => { out(`checking portfolio0: ${i * 12}%`); if (++i > 8) { clearInterval(t); out("portfolio0: clean, 42/65536 files, 1337/262144 blocks"); } }, 200);
        break;
      }
      case "systemctl": {
        if (args[0] === "status") out("● portfolio.target — active (running)");
        else if (args[0] === "restart") out("restarting services ... done");
        else out("usage: systemctl <status|restart>");
        break;
      }
      case "exit": onExit(); break;
      case "": break;
      default: out(`recovery-shell: ${cmd}: command not found`);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black text-[#f4f4f5] font-mono text-[13px] p-6 overflow-auto" onClick={(e) => (e.target as HTMLElement).querySelector?.("input") || undefined}>
      {lines.map((l, i) => <div key={i}>{l}</div>)}
      <div className="flex">
        <span>root@portfolio:~# </span>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()} autoFocus
          className="flex-1 bg-transparent border-0 outline-none text-[#f4f4f5] font-mono ml-1" />
      </div>
      <div ref={endRef} />
    </div>
  );
}
