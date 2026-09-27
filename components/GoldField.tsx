"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * A physically-shaded sheet of gold leaf, rendered in a single fragment shader.
 * `resolveRef` (0..1) quantises the continuous sheet into a lattice of
 * individually lit tiles: physical value becoming programmable units.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uMouseAmt;
uniform float uResolve;
uniform float uCells;
uniform vec2 uFocus;
uniform float uZoom;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm3(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 3; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}

// Thin foil: a slow, broad drape plus a fine, nearly static crinkle.
float height(vec2 p) {
  float t = uTime * 0.035;
  float drape = fbm3(p * 0.75 + vec2(t, -t * 0.6));
  float wave = sin(p.x * 1.6 + p.y * 0.5 + drape * 5.0 + t * 3.0) * 0.5 + 0.5;
  float crinkle = fbm3(p * 4.0 + drape * 1.5) * 0.008;
  float fold = fbm3(p * 2.2 - vec2(t * 0.5, t)) * 0.12;
  float h = drape * 0.55 + wave * 0.35 + fold + crinkle;
  float d = distance(p, uMouse);
  h += uMouseAmt * 0.035 * sin(d * 20.0 - uTime * 2.4) * exp(-d * 4.5);
  return h;
}

// Deep bronze through gold to pale leaf, continuous.
vec3 ramp(float x) {
  vec3 c0 = vec3(0.035, 0.026, 0.014);
  vec3 c1 = vec3(0.24, 0.155, 0.055);
  vec3 c2 = vec3(0.66, 0.47, 0.19);
  vec3 c3 = vec3(0.93, 0.69, 0.32);
  vec3 c4 = vec3(1.0, 0.87, 0.58);
  x = clamp(x, 0.0, 1.0);
  if (x < 0.25) return mix(c0, c1, x / 0.25);
  if (x < 0.55) return mix(c1, c2, (x - 0.25) / 0.3);
  if (x < 0.82) return mix(c2, c3, (x - 0.55) / 0.27);
  return mix(c3, c4, (x - 0.82) / 0.18);
}

float shade(vec2 q) {
  float e = 0.004;
  float h0 = height(q);
  vec2 g = vec2(height(q + vec2(e, 0.0)) - h0, height(q + vec2(0.0, e)) - h0) / e;
  vec3 n = normalize(vec3(-g * 0.55, 1.0));
  vec3 rf = reflect(vec3(0.0, 0.0, -1.0), n);
  float t = uTime * 0.035;
  // Studio of strip softboxes: their reflections become flowing ribbons on the folds.
  float drift = 0.08 * sin(t * 2.0);
  float bands = smoothstep(0.07, 0.012, abs(rf.x + 0.32 + drift - 0.15 * rf.y));
  bands += 0.75 * smoothstep(0.08, 0.015, abs(rf.y - 0.36 - rf.x * 0.2));
  bands += 0.45 * smoothstep(0.12, 0.025, abs(rf.x - 0.42 + drift));
  float sky = 0.13 + 0.3 * smoothstep(-0.8, 0.8, rf.y + rf.x * 0.3);
  bands += 0.35 * smoothstep(0.3, 0.08, abs(rf.y + 0.25 + rf.x * 0.4));
  float fres = pow(1.0 - n.z, 2.5) * 0.45;
  return sky + bands * 0.72 + fres;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = frag / uRes.y * 1.5 * uZoom;

  // Strict orthogonal lattice.
  float s = 1.5 * uZoom / uCells;
  vec2 id = floor(p / s);
  vec2 local = fract(p / s);
  vec2 center = (id + 0.5) * s;
  vec2 cu = center / (1.5 * uZoom);
  float order = (cu.x / aspect) * 0.65 + (1.0 - cu.y) * 0.35 + hash(id) * 0.06;
  float r = clamp((uResolve * 1.45 - order * 0.45 - 0.02) / 0.55, 0.0, 1.0);
  r = r * r * (3.0 - 2.0 * r);

  float I = shade(mix(p, center, r));
  vec3 col = ramp(I);

  // Crisp token edges: constant 1.5px gutter and a fine top-left highlight.
  float cellPx = s * uRes.y / (1.5 * uZoom);
  vec2 px = local * cellPx;
  vec2 pxFar = (1.0 - local) * cellPx;
  float g = 1.5;
  float inside = step(g, px.x) * step(g, px.y) * step(g, pxFar.x) * step(g, pxFar.y);
  float whole = step(center.x + s * 0.5, aspect * 1.5 * uZoom) * step(center.y + s * 0.5, 1.5 * uZoom);
  float hi = ((1.0 - step(g + 1.0, px.x)) + (1.0 - step(g + 1.0, pxFar.y))) * whole;
  col = mix(col, col * inside + ramp(min(I + 0.25, 1.0)) * clamp(hi, 0.0, 1.0) * inside * 0.35, r);
  col += vec3(0.9, 0.7, 0.35) * sin(r * 3.14159) * 0.12;

  // Melt into the obsidian ground.
  vec3 bg = vec3(0.043, 0.039, 0.031);
  vec2 c = (uv - uFocus) * vec2(aspect, 1.0);
  float vig = smoothstep(1.3, 0.2, length(c));
  col = mix(bg, col, vig);
  col += (hash(frag + fract(uTime)) - 0.5) * 0.02;
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(sh));
    return null;
  }
  return sh;
}

export default function GoldField({
  resolveRef,
  cells,
  focus = [0.62, 0.55],
  className,
}: {
  resolveRef: RefObject<number>;
  cells?: number;
  focus?: [number, number];
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    delete canvas.dataset.fallback;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) {
      canvas.dataset.fallback = "true";
      return;
    }
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      canvas.dataset.fallback = "true";
      return;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes"), uTime = u("uTime"), uMouse = u("uMouse"),
      uMouseAmt = u("uMouseAmt"), uResolve = u("uResolve"), uCells = u("uCells"), uFocus = u("uFocus"), uZoom = u("uZoom");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    let scale = 1;
    let w = 0, h = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const small = rect.width < 768;
      scale = Math.min(window.devicePixelRatio || 1, 1.5) * (small ? 0.85 : 0.95);
      w = Math.max(1, Math.round(rect.width * scale));
      h = Math.max(1, Math.round(rect.height * scale));
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uCells, cells ?? (small ? 11 : 16));
      gl.uniform1f(uZoom, small && focus[0] !== 0.5 ? 1.5 : 1.0);
      gl.uniform2f(uFocus, small && focus[0] !== 0.5 ? 0.55 : focus[0], small && focus[0] !== 0.5 ? 0.74 : focus[1]);
      needsFrame = true;
    };

    // Pointer, in shader space (units of height * 1.5, origin bottom-left).
    const mouse = { x: 0, y: 0, tx: 0, ty: 0, amt: 0, target: 0 };
    const onMove = (ev: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.tx = ((ev.clientX - rect.left) / rect.height) * 1.5;
      mouse.ty = ((rect.bottom - ev.clientY) / rect.height) * 1.5;
      mouse.target = 1;
    };
    const onLeave = () => { mouse.target = 0; };
    if (!coarse) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    }

    let needsFrame = true;
    let lastResolve = -1;
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let raf = 0;
    const start = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const resolve = resolveRef.current ?? 0;
      const still = reduced.matches;
      const box = canvas.getBoundingClientRect();
      if (document.hidden || box.bottom <= 0 || box.top >= window.innerHeight) return;
      if (still && !needsFrame && Math.abs(resolve - lastResolve) < 0.001) return;
      needsFrame = false;
      lastResolve = resolve;

      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;
      mouse.amt += (mouse.target - mouse.amt) * 0.04;

      gl.uniform1f(uTime, still ? 12.0 : 12.0 + (now - start) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uMouseAmt, still ? 0 : mouse.amt);
      gl.uniform1f(uResolve, resolve);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolveRef, cells]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
