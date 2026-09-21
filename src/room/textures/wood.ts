import { makeCanvasTexture } from "./makeCanvasTexture";
export const woodTexture = () => makeCanvasTexture(512, 512, (x) => {
  x.fillStyle = "#6b4a2b"; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 50; i++) { x.strokeStyle = `rgba(40,25,12,${0.1 + Math.random() * 0.2})`; x.lineWidth = 1 + Math.random() * 2; x.beginPath(); const gx = Math.random() * 512; x.moveTo(gx, 0); x.bezierCurveTo(gx + 20, 170, gx - 20, 340, gx, 512); x.stroke(); }
  for (let p = 0; p < 5; p++) { x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(0, p * 102, 512, 3); }
  for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`; x.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); }
}, [4, 4]);
