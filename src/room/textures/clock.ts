import { makeCanvasTexture } from "./makeCanvasTexture";
export const clockTexture = () => makeCanvasTexture(128, 128, (x) => {
  x.fillStyle = "#d8d2c4"; x.beginPath(); x.arc(64, 64, 60, 0, 7); x.fill();
  x.fillStyle = "#1a1a1e"; x.font = "bold 14px monospace"; x.textAlign = "center";
  for (let h = 1; h <= 12; h++) x.fillText(String(h), 64 + Math.sin(h / 12 * Math.PI * 2) * 46, 69 - Math.cos(h / 12 * Math.PI * 2) * 46);
});
