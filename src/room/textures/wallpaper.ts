import { makeCanvasTexture } from "./makeCanvasTexture";
export const wallpaperTexture = () => makeCanvasTexture(512, 512, (x) => {
  x.fillStyle = "#3a3532"; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2000; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; x.fillRect(Math.random() * 512, Math.random() * 512, 1, 1); }
  x.fillStyle = "rgba(0,0,0,.06)";
  for (let s = 0; s < 512; s += 32) x.fillRect(s, 0, 1, 512);
}, [2, 1]);
