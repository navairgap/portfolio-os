import { makeCanvasTexture } from "./makeCanvasTexture";
export const nightSkyTexture = () => makeCanvasTexture(512, 384, (x) => {
  const g = x.createLinearGradient(0, 0, 0, 384);
  g.addColorStop(0, "#0a0e27"); g.addColorStop(1, "#050510");
  x.fillStyle = g; x.fillRect(0, 0, 512, 384);
  for (let i = 0; i < 200; i++) { x.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.8})`; x.fillRect(Math.random() * 512, Math.random() * 300, 1.5, 1.5); }
  const mg = x.createRadialGradient(400, 80, 4, 400, 80, 40);
  mg.addColorStop(0, "rgba(240,240,220,1)"); mg.addColorStop(0.4, "rgba(240,240,220,.5)"); mg.addColorStop(1, "rgba(240,240,220,0)");
  x.fillStyle = mg; x.beginPath(); x.arc(400, 80, 40, 0, 7); x.fill();
  x.fillStyle = "#02030a";
  let bx = 0;
  while (bx < 512) { const bw = 20 + Math.random() * 40, bh = 40 + Math.random() * 90; x.fillRect(bx, 384 - bh, bw, bh); bx += bw + 4; }
});
