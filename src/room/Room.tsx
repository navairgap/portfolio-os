import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import gsap from "gsap";
import { useWindows } from "../store/useWindowStore";
import { useSettings } from "../store/useSettingsStore";
import { WALLPAPERS } from "../data/wallpapers";
import { APPS } from "../registry/appRegistry";

const MODEL_URL = (import.meta as any).env?.BASE_URL + "models/room2.glb";
const CAM_POS = { x: 1.009028643133046, y: 0.5463638814987481, z: 0.4983449671971262 };

/* live desktop painted to a canvas → screen texture */
function drawOS(x: CanvasRenderingContext2D, W: number, H: number) {
  const s = useSettings.getState();
  const { windows, activeWorkspace } = useWindows.getState();
  const wp = WALLPAPERS[s.wallpaper] || WALLPAPERS[0];
  x.fillStyle = wp.css.includes("gradient") ? "#0a0a0c" : "#050507";
  x.fillRect(0, 0, W, H);
  x.fillStyle = "rgba(5,5,7,.85)"; x.fillRect(0, 0, W, 22);
  x.fillStyle = "#ff2b2b"; x.font = "bold 11px monospace"; x.fillText("█", 10, 15);
  x.fillStyle = "rgba(230,230,230,.4)"; x.fillText(`[ workspace ${activeWorkspace + 1} ]`, 26, 15);
  x.fillStyle = "#00ff9c"; x.textAlign = "right";
  x.fillText(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), W - 10, 15);
  x.textAlign = "left";
  const scale = Math.min(W / innerWidth, H / innerHeight);
  for (const w of windows.filter((w) => w.workspaceId === activeWorkspace && !w.isMinimized)) {
    const wx = (w.x / innerWidth) * W * 0.82 + 16, wy = (w.y / innerHeight) * H * 0.7 + 26;
    const ww = Math.max(70, (w.width / innerWidth) * W * 0.6), wh = Math.max(48, (w.height / innerHeight) * H * 0.58);
    x.fillStyle = "#0b0b0e"; x.fillRect(wx, wy, ww, wh);
    x.strokeStyle = w.isFocused ? "#ff2b2b" : "rgba(255,255,255,.14)"; x.strokeRect(wx, wy, ww, wh);
    x.fillStyle = "#131317"; x.fillRect(wx, wy, ww, 18);
    x.fillStyle = w.isFocused ? "#ff2b2b" : "rgba(230,230,230,.4)";
    x.font = "10px monospace"; x.fillText((APPS.find((a) => a.id === w.appId)?.title || w.title).toUpperCase(), wx + 6, wy + 13);
    if (w.appId === "terminal") { x.fillStyle = "rgba(0,255,156,.6)"; x.fillText("navairgap@blackarch:~$ █", wx + 6, wy + 34); }
  }
  if (!windows.length) {
    x.fillStyle = "rgba(230,230,230,.35)"; x.font = "13px monospace"; x.textAlign = "center";
    x.fillText("desktop idle — click to take the desk", W / 2, H / 2); x.textAlign = "left";
  }
  x.fillStyle = "rgba(255,43,43,.75)"; x.font = "10px monospace"; x.textAlign = "center";
  x.fillText("CLICK TO TAKE CONTROL", W / 2, H - 10); x.textAlign = "left";
  // scanlines
  x.fillStyle = "rgba(255,255,255,.02)";
  for (let y = 0; y < H; y += 3) x.fillRect(0, y, W, 1);
}

export default function Room({ onEnter }: { onEnter: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [ticks, setTicks] = useState(0);
  const [msg, setMsg] = useState("loading model…");

  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b0b12");
    const camera = new THREE.PerspectiveCamera(75, el.clientWidth / el.clientHeight, 0.01, 1000);
    camera.position.set(CAM_POS.x * 1.28, CAM_POS.y * 1.28 + 0.15, CAM_POS.z * 1.28);
    camera.lookAt(0, 0.9, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.9, 0);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.9;
    controls.maxDistance = 1.6;
    controls.minAzimuthAngle = 0.2;
    controls.maxAzimuthAngle = Math.PI * 0.78;
    controls.minPolarAngle = 0.3;
    controls.maxPolarAngle = Math.PI / 2;

    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    const dir = new THREE.DirectionalLight(0xffffff, 1.6);
    dir.position.set(3, 5, 3);
    dir.castShadow = true;
    dir.shadow.mapSize.set(512, 512);
    const dir2 = new THREE.DirectionalLight(0x8899aa, 0.4);
    dir2.position.set(-3, 2, -2);
    scene.add(amb, dir, dir2);

    // OS canvas → screen texture
    const osCanvas = document.createElement("canvas");
    osCanvas.width = 1024; osCanvas.height = 768;
    const osCtx = osCanvas.getContext("2d")!;
    const osTex = new THREE.CanvasTexture(osCanvas);
    osTex.colorSpace = THREE.SRGBColorSpace;

    const ray = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    let screenMesh: THREE.Mesh | null = null;
    let switchMesh: THREE.Mesh | null = null;
    let bookMesh: THREE.Mesh | null = null;
    let focusFlight: { pos: THREE.Vector3; look: THREE.Vector3 } | null = null;
    const dummy = new THREE.Object3D();

    let lightsOn = true;
    let raf = 0, frames = 0, lastDraw = 0, disposed = false;

    new GLTFLoader().load(MODEL_URL, (gltf) => {
      if (disposed) return;
      const model = gltf.scene;
      scene.add(model);
      model.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        if (m.name !== "Wall") { m.castShadow = true; m.receiveShadow = true; }
        if (/^Stand/.test(m.name) && !screenMesh) screenMesh = m;
        if (/^Switch/.test(m.name) && !switchMesh) switchMesh = m;
        if (/^Book/.test(m.name) && !bookMesh) bookMesh = m;
      });
      // fallback screen detection: flat panel
      if (!screenMesh) {
        const box = new THREE.Box3(), s = new THREE.Vector3();
        model.traverse((o) => {
          const m = o as THREE.Mesh;
          if (!m.isMesh || screenMesh) return;
          box.setFromObject(m); box.getSize(s);
          if (Math.min(s.x, s.y, s.z) < 0.03 && Math.max(s.x, s.z) > 0.3) screenMesh = m;
        });
      }
      if (screenMesh) {
        // paint OS onto the screen mesh's material
        const sm = screenMesh as THREE.Mesh;
        sm.material = new THREE.MeshBasicMaterial({ map: osTex });
        const box = new THREE.Box3().setFromObject(sm);
        const c = box.getCenter(new THREE.Vector3());
        const sz = box.getSize(new THREE.Vector3());
        const thin = Math.min(sz.x, sz.y, sz.z);
        const front = new THREE.Vector3(CAM_POS.x - c.x, 0, CAM_POS.z - c.z).normalize();
        // slightly enlarge the screen mesh toward the viewer so the texture covers the bezel
        sm.scale.multiplyScalar(1.0);
        setMsg(`screen: ${sm.name} · ${thin.toFixed(2)}m thin`);
      } else setMsg("screen not found");
      // fly-in
      controls.enabled = false;
      gsap.to(camera.position, { ...CAM_POS, duration: 1.6, ease: "power3.out" });
      gsap.to(camera.rotation, { x: -0.8310687859940357, y: 0.9380973951104649, z: 0.7243388791233853, duration: 1.6, ease: "power3.out", onUpdate: () => { controls.update(); }, onComplete: () => { controls.enabled = true; } });
    }, undefined, (e) => setMsg("model failed: " + e));

    const fly = (pos: THREE.Vector3, look: THREE.Vector3, done?: () => void) => {
      dummy.position.copy(pos); dummy.lookAt(look);
      controls.enabled = false;
      gsap.to(camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: 1.5, ease: "power3.inOut" });
      gsap.to(camera.rotation, { x: dummy.rotation.x, y: dummy.rotation.y, z: dummy.rotation.z, duration: 1.5, ease: "power3.inOut", onUpdate: () => { controls.update(); }, onComplete: () => { controls.enabled = true; done?.(); } });
    };

    const onClick = (e: MouseEvent) => {
      ptr.x = (e.clientX / el.clientWidth) * 2 - 1;
      ptr.y = -(e.clientY / el.clientHeight) * 2 + 1;
      ray.setFromCamera(ptr, camera);
      const hits = ray.intersectObjects(scene.children, true);
      if (!hits.length) return;
      const hit = hits[0].object as THREE.Mesh;
      if (screenMesh && (hit === screenMesh || hit === hits[0].object && /Stand|Cube\.002/.test(hit.name))) {
        const box = new THREE.Box3().setFromObject(screenMesh!);
        const c = box.getCenter(new THREE.Vector3());
        const front = new THREE.Vector3(CAM_POS.x - c.x, 0, CAM_POS.z - c.z).normalize();
        fly(c.clone().addScaledVector(front, 0.32).add(new THREE.Vector3(0, 0.02, 0)), c, onEnter);
      } else if (switchMesh && hit === switchMesh) {
        lightsOn = !lightsOn;
        gsap.to(amb, { intensity: lightsOn ? 0.7 : 0.15, duration: 0.6 });
        gsap.to(dir, { intensity: lightsOn ? 1.6 : 0.3, duration: 0.6 });
        gsap.to(scene.background as THREE.Color, { r: lightsOn ? 0.04 : 0.01, g: lightsOn ? 0.04 : 0.01, b: lightsOn ? 0.07 : 0.03, duration: 0.6 });
      } else if (bookMesh && hit === bookMesh) {
        const c = new THREE.Box3().setFromObject(bookMesh!).getCenter(new THREE.Vector3());
        fly(c.clone().add(new THREE.Vector3(0.05, 0.42, 0.28)), c.clone());
      }
    };
    el.addEventListener("click", onClick);

    const loop = () => {
      if (disposed) return;
      raf = requestAnimationFrame(loop);
      frames++;
      if (performance.now() - lastDraw > 120) { lastDraw = performance.now(); drawOS(osCtx, osCanvas.width, osCanvas.height); osTex.needsUpdate = true; }
      controls.update();
      renderer.render(scene, camera);
      if (frames % 30 === 0) setTicks(frames);
    };
    loop();

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    addEventListener("resize", onResize);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onEnter(); };
    addEventListener("keydown", onKey);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
      removeEventListener("keydown", onKey);
      el.removeEventListener("click", onClick);
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[120] bg-black flex flex-col">
      <div ref={host} className="flex-1" />
      <div className="absolute top-3 left-4 text-[11px] uppercase tracking-[.15em] text-[var(--text-tertiary)] space-x-3 pointer-events-none">
        <span><b className="text-[var(--accent)]">drag</b> look · <b className="text-[var(--accent)]">scroll</b> zoom · click: monitor / switch / book</span>
        <span>frames: <b className="text-[var(--terminal-fg)]">{ticks}</b></span>
        <span>{msg}</span>
      </div>
      <div className="absolute top-3 right-4">
        <button onClick={onEnter} className="px-3 py-1 bg-[var(--accent)] text-black text-[11px] font-bold uppercase">take the desk (esc)</button>
      </div>
    </div>
  );
}
