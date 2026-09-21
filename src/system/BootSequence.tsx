import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const POST = [
  "NAVAIRGAP BIOS v2.4.1",
  "CPU: Portfolio Core i9 @ 3.60GHz",
  "Memory Test: 16384MB OK",
  "Detecting drives ... 1 found",
  "Booting from /dev/portfolio ...",
];
const LOADER = ["Loading kernel modules ...", "Mounting filesystem ...", "Starting display manager ..."];
const KERNEL = [
  "[    0.000000] Linux version 6.8.0-portfolio",
  "[    0.000142] Command line: root=/dev/portfolio quiet",
  "[    0.002341] Memory: 16384MB available",
  "[    0.015672] NET: Registered PF_INET protocol family",
  "[    0.038291] input: Portfolio Keyboard as /devices/platform/portfolio/input0",
  "[    0.062114] [drm] Initialized portfolio-drm 1.0.0",
  "[    0.087451] portfolio-drm: fb0: portfolio-drm frame buffer device",
  "[    0.104223] systemd[1]: Reached target Graphical Interface",
  "[    0.131048] audit: type=1334 audit(1726843200.000:2): module loaded",
  "[    0.158812] loop: module loaded",
  "[    0.181133] EXT4-fs (portfolio0): mounted filesystem with ordered data mode",
  "[    0.204455] systemd[1]: Started Journal Service",
  "[    0.228910] systemd[1]: Reached target Local File Systems",
  "[    0.251277] input: Portfolio Mouse as /devices/platform/portfolio/input1",
  "[    0.273018] snd_hda_intel: bound to portfolio-audio",
  "[    0.295540] systemd[1]: Starting Network Manager...",
  "[    0.317166] NetworkManager[420]: starting (version 1.46.0)",
  "[    0.338802] iwlwifi: loaded firmware version 77.2df8986f.0",
  "[    0.360441] Bluetooth: Core ver 2.22",
  "[    0.381973] systemd[1]: Started Network Manager",
  "[    0.403311] systemd[1]: Reached target Network",
  "[    0.424558] systemd[1]: Starting Display Manager...",
  "[    0.445809] gdm[512]: Successfully connected to display server",
  "[    0.466971] systemd[1]: Started Display Manager",
  "[    0.488133] systemd[1]: Reached target Multi-User System",
  "[    0.509294] systemd[1]: Startup finished in 509ms.",
  "[    0.530456] portfolio-greeter: listening on /dev/tty1",
  "[    0.551618] gnome-session[640]: initializing desktop environment",
  "[    0.572781] systemd[1]: Started User Manager for UID 1000",
  "[    0.593943] pulseaudio[700]: configured default sink: portfolio-analog-stereo",
  "[    0.615105] systemd[1]: Reached target Sound Card",
  "[    0.636267] gnome-shell[688]: loading extensions",
  "[    0.657430] systemd[1]: Started navairgap OS session",
  "[    0.678592] gnome-shell[688]: desktop ready",
  "[    0.699754] systemd[1]: Reached target Graphical Interface",
];

export default function BootSequence({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  const [loaderText, setLoaderText] = useState("");
  const [bar, setBar] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const skip = useRef(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const done = () => { if (!skip.current) { skip.current = true; onDone(); } };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // phase 1: POST
    POST.forEach((l, i) => timers.push(setTimeout(() => setLines((p) => [...p, l]), reduced ? 0 : i * 150)));
    timers.push(setTimeout(() => setPhase(1), reduced ? 100 : POST.length * 150 + 300));

    // phase 2: loader
    LOADER.forEach((l, i) => timers.push(setTimeout(() => setLoaderText(l), reduced ? 100 : 1600 + i * 300)));
    const barStart = reduced ? 100 : 1600;
    for (let i = 0; i <= 20; i++) timers.push(setTimeout(() => setBar(i * 5), barStart + i * (reduced ? 2 : 45)));
    timers.push(setTimeout(() => setPhase(2), reduced ? 300 : 2600));

    // phase 3: kernel
    const kStart = reduced ? 400 : 2650;
    KERNEL.forEach((l, i) => timers.push(setTimeout(() => {
      setLines((p) => [...p, l]);
      requestAnimationFrame(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; });
    }, kStart + i * (reduced ? 8 : 30))));
    timers.push(setTimeout(done, kStart + KERNEL.length * (reduced ? 8 : 30) + 400));

    const key = () => done();
    addEventListener("keydown", key);
    return () => { timers.forEach(clearTimeout); removeEventListener("keydown", key); };
  }, [onDone]);

  return (
    <motion.div exit={{ opacity: 0 }} transition={{ duration: .5 }}
      className="fixed inset-0 bg-black text-[#f4f4f5] font-mono text-[13px] z-[200]" onClick={() => !skip.current && (skip.current = true) || onDone()}>
      {phase < 2 && (
        <div className="absolute left-6 top-6">
          {lines.slice(0, phase === 0 ? undefined : POST.length).map((l, i) => (
            <div key={i} className={phase === 0 && i === lines.length - 1 ? "" : "text-[#9a9aa0]"}>{l}</div>
          ))}
          {phase === 0 && <span className="animate-pulse">_</span>}
        </div>
      )}
      {phase === 1 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
          <pre className="text-[#cdc4ba] text-center leading-[1.3]">{`┌─┐┌─┐┌┐┌┌─┐┬─┐
│││├─┤││││  ├┬┘
└┴┘┴ ┴┘└┘└─┘┴└─
O S`}</pre>
          <div className="w-64 h-[3px] bg-[#26262c]"><div className="h-full bg-[#cdc4ba]" style={{ width: bar + "%" }} /></div>
          <div className="text-[12px] text-[#8a8a90]">{loaderText}</div>
        </div>
      )}
      {phase === 2 && (
        <div ref={logRef} className="absolute inset-6 overflow-hidden text-[12px] text-[#8a8a90] leading-[1.5]">
          {lines.map((l, i) => <div key={i}>{l}</div>)}
          <span className="animate-pulse text-[#f4f4f5]">_</span>
        </div>
      )}
    </motion.div>
  );
}
