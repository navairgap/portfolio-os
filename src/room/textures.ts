import * as THREE from "three";

export function starfieldTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = 512; c.height = 256;
  const x = c.getContext("2d")!;
  x.fillStyle = "#04060d"; x.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 400; i++) {
    const b = Math.random();
    x.fillStyle = `rgba(${200 + b * 55},${200 + b * 55},255,${0.3 + b * 0.7})`;
    x.fillRect(Math.random() * 512, Math.random() * 256, b > 0.93 ? 2 : 1, b > 0.93 ? 2 : 1);
  }
  const t = new THREE.CanvasTexture(c);
  return t;
}

export function posterTexture(lines: string[], color = "#ff2b2b", bg = "#101014"): THREE.CanvasTexture {
  const c = document.createElement("canvas"); c.width = 256; c.height = 384;
  const x = c.getContext("2d")!;
  x.fillStyle = bg; x.fillRect(0, 0, 256, 384);
  x.strokeStyle = "rgba(255,255,255,.2)"; x.strokeRect(8, 8, 240, 368);
  x.fillStyle = color; x.font = "bold 34px monospace"; x.textAlign = "center";
  lines.forEach((l, i) => x.fillText(l, 128, 150 + i * 44));
  x.fillStyle = "rgba(255,255,255,.4)"; x.font = "12px monospace";
  x.fillText("· 1996 ·", 128, 350);
  return new THREE.CanvasTexture(c);
}
