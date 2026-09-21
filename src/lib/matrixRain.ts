// Canvas matrix rain: 30fps overlay, 15fps wallpaper. Pauses when hidden. No reduced-motion.
export function matrixRain(canvas: HTMLCanvasElement, opts: { fps?: number; accent?: string } = {}): () => void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const ctx = canvas.getContext("2d")!;
  const fps = opts.fps || 30;
  let cols = 0, drops: number[] = [], raf = 0, last = 0, running = true;
  const glyphs = "アイウエオカキクケコサシスセソ0123456789ABCDEF<>[]{}$#";
  const resize = () => {
    canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
    cols = Math.floor(canvas.width / 16);
    drops = Array.from({ length: cols }, () => Math.random() * -40);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
  resize();
  addEventListener("resize", resize);
  const vis = () => { running = !document.hidden; if (running) raf = requestAnimationFrame(tick); };
  document.addEventListener("visibilitychange", vis);
  const frame = 1000 / fps;
  const tick = (t: number) => {
    raf = requestAnimationFrame(tick);
    if (!running || t - last < frame) return;
    last = t;
    ctx.fillStyle = "rgba(0,0,0,0.06)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "14px monospace";
    for (let i = 0; i < cols; i++) {
      const red = Math.random() < 0.02;
      ctx.fillStyle = red ? "#ff2b2b" : Math.random() < 0.12 ? "#e6e6e6" : "#00ff9c";
      ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * 16, drops[i] * 16);
      if (drops[i] * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 0.5 + (i % 5) * 0.18;
    }
  };
  raf = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); document.removeEventListener("visibilitychange", vis); };
}
