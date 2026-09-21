// WebGL animated wallpaper: slow simplex-noise fluid gradient following the accent color.
let canvas: HTMLCanvasElement | null = null, gl: WebGLRenderingContext | null = null, prog: WebGLProgram | null = null, raf = 0, startT = 0, running = false;

const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
const FRAG = `precision mediump float;uniform float t;uniform vec2 r;uniform vec3 acc;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
void main(){vec2 uv=gl_FragCoord.xy/r;vec2 q=uv*vec2(r.x/r.y,1.);
float f1=fbm(q*1.6+vec2(t*.03,t*.02));
float f2=fbm(q*2.2-vec2(t*.02,t*.025)+f1*1.4);
float f3=fbm(q*1.2+vec2(-t*.015,t*.01)+f2);
vec3 base=vec3(.055,.055,.065);
vec3 c=mix(base,acc*.5,smoothstep(.3,.9,f1));
c=mix(c,acc*.28,smoothstep(.4,.95,f2)*.8);
c=mix(c,vec3(.9),smoothstep(.6,.98,f3)*.18);
float d=distance(uv,vec2(.5));c*=smoothstep(.95,.3,d)*.9+.1;
gl_FragColor=vec4(c,1.);}`;

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  return [parseInt(m.slice(0, 2), 16) / 255, parseInt(m.slice(2, 4), 16) / 255, parseInt(m.slice(4, 6), 16) / 255];
}

export function mountShaderWallpaper(host: HTMLElement, accent: string) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  stopShaderWallpaper();
  canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
  host.prepend(canvas);
  gl = canvas.getContext("webgl", { antialias: false }) as WebGLRenderingContext | null;
  if (!gl) return () => { canvas?.remove(); };
  const compile = (type: number, src: string) => { const s = gl!.createShader(type)!; gl!.shaderSource(s, src); gl!.compileShader(s); return s; };
  prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uT = gl.getUniformLocation(prog, "t"), uR = gl.getUniformLocation(prog, "r"), uA = gl.getUniformLocation(prog, "acc");
  const [ar, ag, ab] = hexToRgb(accent);
  startT = performance.now(); running = true;
  const dpr = Math.min(devicePixelRatio, 1.5);
  const resize = () => { canvas!.width = host.clientWidth * dpr; canvas!.height = host.clientHeight * dpr; gl!.viewport(0, 0, canvas!.width, canvas!.height); };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(host);
  const vis = () => { if (document.hidden) { cancelAnimationFrame(raf); } else if (running) loop(); };
  document.addEventListener("visibilitychange", vis);
  const loop = () => {
    if (!running || !gl) return;
    gl.uniform1f(uT, (performance.now() - startT) / 1000);
    gl.uniform2f(uR, canvas!.width, canvas!.height);
    gl.uniform3f(uA, ar, ag, ab);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(loop);
  };
  loop();
  return () => { stopShaderWallpaper(); ro.disconnect(); document.removeEventListener("visibilitychange", vis); };
}
export function stopShaderWallpaper() { running = false; cancelAnimationFrame(raf); canvas?.remove(); canvas = null; gl = null; }
