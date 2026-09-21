import { makeCanvasTexture } from "./makeCanvasTexture";
export const posterTexture = (title: string, color: string) => makeCanvasTexture(256, 384, (x) => {
  x.fillStyle = "#101014"; x.fillRect(0, 0, 256, 384);
  x.strokeStyle = "rgba(255,255,255,.15)"; x.strokeRect(6, 6, 244, 372);
  x.fillStyle = color; x.font = "bold 30px monospace"; x.textAlign = "center";
  title.split(" ").forEach((w, i) => x.fillText(w, 128, 150 + i * 40));
  x.font = "12px monospace"; x.fillStyle = "rgba(255,255,255,.35)"; x.fillText("· est 1996 ·", 128, 350);
  x.save(); x.beginPath(); x.arc(128, 80, 26, 0, 7); x.strokeStyle = color; x.lineWidth = 3; x.stroke(); x.restore();
});
