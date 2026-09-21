import { useEffect, useRef, useState } from "react";
import { Play, Shuffle, Grid3x3, BarChart3, MousePointer2 } from "lucide-react";

type Step = { type: "cmp" | "swap" | "write"; a: number; b: number; arr: number[] };
const N = 48;

function record(base: number[]): { steps: Step[]; sort: (a: number[]) => void } {
  const steps: Step[] = [];
  return {
    steps,
    sort(arr) {
      const cmp = (i: number, j: number) => { steps.push({ type: "cmp", a: i, b: j, arr: [...arr] }); return arr[i] - arr[j]; };
      const swap = (i: number, j: number) => { [arr[i], arr[j]] = [arr[j], arr[i]]; steps.push({ type: "swap", a: i, b: j, arr: [...arr] }); };
      const write = (i: number, v: number) => { arr[i] = v; steps.push({ type: "write", a: i, b: i, arr: [...arr] }); };
      (record as any)._alg(arr, cmp, swap, write);
    },
  };
}
const ALGORITHMS: Record<string, { label: string; fn: (a: number[], cmp: any, swap: any, write: any) => void }> = {
  bubble: { label: "Bubble", fn: (a, _c, s) => { for (let i = 0; i < a.length; i++) for (let j = 0; j < a.length - i - 1; j++) if (_c(j, j + 1) > 0) s(j, j + 1); } },
  selection: { label: "Selection", fn: (a, c, s) => { for (let i = 0; i < a.length; i++) { let m = i; for (let j = i + 1; j < a.length; j++) if (c(j, m) < 0) m = j; s(i, m); } } },
  insertion: { label: "Insertion", fn: (a, c, s) => { for (let i = 1; i < a.length; i++) { let j = i; while (j > 0 && c(j - 1, j) > 0) { s(j - 1, j); j--; } } } },
  quick: { label: "Quick", fn: (a, c, s) => { const qs = (lo: number, hi: number) => { if (lo >= hi) return; const p = a[hi]; let i = lo; for (let j = lo; j < hi; j++) if (c(j, hi) < 0) { s(i, j); i++; } s(i, hi); qs(lo, i - 1); qs(i + 1, hi); }; qs(0, a.length - 1); } },
  merge: { label: "Merge", fn: (a, _c, _s, w) => { const ms = (lo: number, hi: number) => { if (hi - lo < 1) return; const mid = (lo + hi) >> 1; ms(lo, mid); ms(mid + 1, hi); const tmp: number[] = []; let i = lo, j = mid + 1; while (i <= mid && j <= hi) tmp.push(a[i] <= a[j] ? a[i++] : a[j++]); while (i <= mid) tmp.push(a[i++]); while (j <= hi) tmp.push(a[j++]); tmp.forEach((v, k) => w(lo + k, v)); }; ms(0, a.length - 1); } },
  heap: { label: "Heap", fn: (a, c, s) => { const n = a.length; const heapify = (r: number, sz: number) => { let l = r; const L = 2 * r + 1, R = 2 * r + 2; if (L < sz && c(L, l) > 0) l = L; if (R < sz && c(R, l) > 0) l = R; if (l !== r) { s(r, l); heapify(l, sz); } }; for (let i = (n >> 1) - 1; i >= 0; i--) heapify(i, n); for (let i = n - 1; i > 0; i--) { s(0, i); heapify(0, i); } } },
};

const shuffle = (a: number[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const randArr = () => shuffle(Array.from({ length: N }, (_, i) => i + 1));

// ---------- pathfinding ----------
const GW = 30, GH = 16;
type Cell = { r: number; c: number };
const key = (r: number, c: number) => r * GW + c;
function findPath(algo: string, walls: Set<number>, start: Cell, end: Cell): { visited: number[]; path: number[] } {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const inB = (r: number, c: number) => r >= 0 && c >= 0 && r < GH && c < GW;
  const visited: number[] = [];
  const prev = new Map<number, number>();
  const h = (r: number, c: number) => Math.abs(r - end.r) + Math.abs(c - end.c);
  if (algo === "bfs") {
    const q: Cell[] = [start]; const seen = new Set([key(start.r, start.c)]);
    while (q.length) {
      const cur = q.shift()!;
      visited.push(key(cur.r, cur.c));
      if (cur.r === end.r && cur.c === end.c) break;
      for (const [dr, dc] of dirs) { const r = cur.r + dr, c = cur.c + dc; const k = key(r, c); if (inB(r, c) && !walls.has(k) && !seen.has(k)) { seen.add(k); prev.set(k, key(cur.r, cur.c)); q.push({ r, c }); } }
    }
  } else if (algo === "dfs") {
    const stack: Cell[] = [start]; const seen = new Set([key(start.r, start.c)]);
    while (stack.length) {
      const cur = stack.pop()!;
      visited.push(key(cur.r, cur.c));
      if (cur.r === end.r && cur.c === end.c) break;
      for (const [dr, dc] of dirs) { const r = cur.r + dr, c = cur.c + dc; const k = key(r, c); if (inB(r, c) && !walls.has(k) && !seen.has(k)) { seen.add(k); prev.set(k, key(cur.r, cur.c)); stack.push({ r, c }); } }
    }
  } else {
    const open: { r: number; c: number; f: number }[] = [{ ...start, f: h(start.r, start.c) }];
    const gs = new Map<number, number>([[key(start.r, start.c), 0]]);
    const seen = new Set<number>();
    while (open.length) {
      open.sort((a, b) => a.f - b.f);
      const cur = open.shift()!;
      const k = key(cur.r, cur.c);
      if (seen.has(k)) continue;
      seen.add(k); visited.push(k);
      if (cur.r === end.r && cur.c === end.c) break;
      for (const [dr, dc] of dirs) {
        const r = cur.r + dr, c = cur.c + dc, nk = key(r, c);
        if (!inB(r, c) || walls.has(nk) || seen.has(nk)) continue;
        const ng = (gs.get(k) ?? 0) + 1;
        if (ng < (gs.get(nk) ?? Infinity)) { gs.set(nk, ng); prev.set(nk, k); open.push({ r, c, f: ng + h(r, c) }); }
      }
    }
  }
  const path: number[] = [];
  let cur = key(end.r, end.c);
  if (!prev.has(cur) && cur !== key(start.r, start.c)) return { visited, path };
  while (cur !== key(start.r, start.c)) { path.unshift(cur); cur = prev.get(cur)!; }
  return { visited, path };
}

function Sorting({ speed, running, setRunning }: any) {
  const [algo, setAlgo] = useState("quick");
  const [arr, setArr] = useState(randArr);
  const [hot, setHot] = useState<[-1, -1] | number[]>([-1, -1]);
  const [stats, setStats] = useState({ cmp: 0, swp: 0 });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const run = () => {
    if (running) return;
    setRunning(true); setStats({ cmp: 0, swp: 0 });
    (record as any)._alg = ALGORITHMS[algo].fn;
    const a = [...arr];
    const { steps } = record(a);
    record.prototype; // noop
    const rec = { steps: [] as Step[] } as any;
    const cmp = (i: number, j: number) => { rec.steps.push({ type: "cmp", a: i, b: j }); return a[i] - a[j]; };
    const swap = (i: number, j: number) => { [a[i], a[j]] = [a[j], a[i]]; rec.steps.push({ type: "swap", a: i, b: j }); };
    const write = (i: number, v: number) => { a[i] = v; rec.steps.push({ type: "write", a: i, b: i }); };
    ALGORITHMS[algo].fn(a, cmp, swap, write);
    const steps2 = rec.steps as Step[];
    let i = 0, cmpC = 0, swpC = 0;
    timer.current = setInterval(() => {
      if (i >= steps2.length) { clearInterval(timer.current!); timer.current = null; setArr([...a]); setHot([-2, -2]); setRunning(false); return; }
      const s = steps2[i++];
      setHot([s.a, s.b]);
      setArr((prev) => { const n = [...prev]; if (s.type === "write") n[s.a] = a[s.a]; else [n[s.a], n[s.b]] = [n[s.b], n[s.a]]; return n; });
      if (s.type === "cmp") cmpC++; else swpC++;
      setStats({ cmp: cmpC, swp: swpC });
    }, Math.max(4, 110 - speed));
  };
  const reshuffle = () => { if (timer.current) clearInterval(timer.current); timer.current = null; setRunning(false); setHot([-1, -1]); setArr(randArr()); setStats({ cmp: 0, swp: 0 }); };

  return (
    <div className="flex-1 flex flex-col p-3 min-h-0">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <select value={algo} onChange={(e) => setAlgo(e.target.value)} disabled={running} className="h-7 px-2 rounded-[6px] bg-[#232328] border border-[rgba(255,255,255,.08)] text-[12px]">
          {Object.entries(ALGORITHMS).map(([id, a]) => <option key={id} value={id}>{a.label}</option>)}
        </select>
        <button onClick={run} disabled={running} className="flex items-center gap-1 px-2.5 h-7 rounded-[6px] bg-[#7c9cff] text-black text-[12px] font-semibold disabled:opacity-40"><Play size={11} /> sort</button>
        <button onClick={reshuffle} className="flex items-center gap-1 px-2.5 h-7 rounded-[6px] bg-[rgba(255,255,255,.08)] text-[12px]"><Shuffle size={11} /> shuffle</button>
        <span className="ml-auto text-[11px] text-[rgba(244,244,245,.45)]">comparisons {stats.cmp} · writes {stats.swp}</span>
      </div>
      <div className="flex-1 flex items-end gap-[2px] min-h-0">
        {arr.map((v, i) => (
          <div key={i} className="flex-1 rounded-t-[2px] transition-colors duration-75"
            style={{ height: `${(v / N) * 100}%`, background: hot[0] === i || hot[1] === i ? "#ff5c5c" : v === i + 1 && hot[0] === -2 ? "#4ade80" : "#7c9cff" }} />
        ))}
      </div>
    </div>
  );
}

function Pathfinding({ speed, running, setRunning }: any) {
  const [algo, setAlgo] = useState("astar");
  const [walls, setWalls] = useState<Set<number>>(() => new Set());
  const [start, setStart] = useState<Cell>({ r: 7, c: 3 });
  const [end, setEnd] = useState<Cell>({ r: 7, c: 26 });
  const [visitedShow, setVisitedShow] = useState<Set<number>>(new Set());
  const [pathShow, setPathShow] = useState<number[]>([]);
  const [tool, setTool] = useState<"wall" | "start" | "end">("wall");
  const drawing = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clearTimers, []);
  const cellDown = (r: number, c: number) => {
    if (running) return;
    const k = key(r, c);
    if (tool === "start") return setStart({ r, c });
    if (tool === "end") return setEnd({ r, c });
    drawing.current = true;
    setWalls((w) => { const n = new Set(w); n.has(k) ? n.delete(k) : n.add(k); return n; });
  };
  const cellEnter = (r: number, c: number) => { if (drawing.current && !running) setWalls((w) => new Set(w).add(key(r, c))); };

  const run = () => {
    if (running) return;
    clearTimers(); setRunning(true);
    setVisitedShow(new Set()); setPathShow([]);
    const { visited, path } = findPath(algo, walls, start, end);
    visited.forEach((k, i) => timers.current.push(setTimeout(() => setVisitedShow((s) => new Set(s).add(k)), i * Math.max(6, 60 - speed))));
    const t0 = visited.length * Math.max(6, 60 - speed) + 100;
    path.forEach((k, i) => timers.current.push(setTimeout(() => setPathShow((p) => [...p, k]), t0 + i * 40)));
    timers.current.push(setTimeout(() => setRunning(false), t0 + path.length * 40 + 50));
  };
  const clear = () => { clearTimers(); setRunning(false); setWalls(new Set()); setVisitedShow(new Set()); setPathShow([]); };

  const hint = { wall: "drag to draw walls", start: "click to place start", end: "click to place end" }[tool];
  return (
    <div className="flex-1 flex flex-col p-3 min-h-0">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <select value={algo} onChange={(e) => setAlgo(e.target.value)} disabled={running} className="h-7 px-2 rounded-[6px] bg-[#232328] border border-[rgba(255,255,255,.08)] text-[12px]">
          <option value="astar">A*</option><option value="bfs">BFS</option><option value="dfs">DFS</option>
        </select>
        {[["wall", "Walls"], ["start", "Start"], ["end", "End"]].map(([id, l]) => (
          <button key={id} onClick={() => setTool(id as any)} className={`px-2.5 h-7 rounded-[6px] text-[12px] ${tool === id ? "bg-[#7c9cff] text-black" : "bg-[rgba(255,255,255,.08)]"}`}>{l}</button>
        ))}
        <button onClick={run} disabled={running} className="flex items-center gap-1 px-2.5 h-7 rounded-[6px] bg-[#4ade80] text-black text-[12px] font-semibold disabled:opacity-40"><Play size={11} /> find path</button>
        <button onClick={clear} className="px-2.5 h-7 rounded-[6px] bg-[rgba(255,255,255,.08)] text-[12px]">clear</button>
        <span className="ml-auto text-[11px] text-[rgba(244,244,245,.45)]">{hint}</span>
      </div>
      <div className="flex-1 grid gap-[2px] select-none touch-none" style={{ gridTemplateColumns: `repeat(${GW}, 1fr)` }}
        onPointerUp={() => (drawing.current = false)} onPointerLeave={() => (drawing.current = false)}>
        {Array.from({ length: GW * GH }).map((_, k) => {
          const r = Math.floor(k / GW), c = k % GW;
          const isS = r === start.r && c === start.c, isE = r === end.r && c === end.c;
          const bg = isS ? "#4ade80" : isE ? "#ff5c5c" : pathShow.includes(k) ? "#fbbf24" : visitedShow.has(k) ? "rgba(124,156,255,.55)" : walls.has(k) ? "#3f3f46" : "rgba(255,255,255,.07)";
          return <div key={k} onPointerDown={() => cellDown(r, c)} onPointerEnter={() => cellEnter(r, c)}
            className="rounded-[2px]" style={{ background: bg, aspectRatio: "1" }} />;
        })}
      </div>
    </div>
  );
}

export default function AlgorithmVisualizerApp() {
  const [mode, setMode] = useState<"sort" | "path">("sort");
  const [speed, setSpeed] = useState(60);
  const [running, setRunning] = useState(false);
  return (
    <div className="h-full flex flex-col text-[#f4f4f5]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[rgba(255,255,255,.08)]">
        {[["sort", "Sorting", BarChart3], ["path", "Pathfinding", Grid3x3]].map(([id, l, Icon]: any) => (
          <button key={id} onClick={() => !running && setMode(id)}
            className={`flex items-center gap-1.5 px-2.5 h-7 rounded-[6px] text-[12px] ${mode === id ? "bg-[rgba(124,156,255,.18)] text-[#7c9cff]" : "bg-[rgba(255,255,255,.05)]"}`}>
            <Icon size={12} /> {l}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <MousePointer2 size={11} className="text-[rgba(244,244,245,.4)]" />
          <input type="range" min={1} max={100} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="w-24 accent-[#7c9cff]" />
        </div>
      </div>
      {mode === "sort" ? <Sorting speed={speed} running={running} setRunning={setRunning} /> : <Pathfinding speed={speed} running={running} setRunning={setRunning} />}
    </div>
  );
}
