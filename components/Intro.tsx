"use client";

import { useEffect, useRef, useState } from "react";

/**
 * First-visit title sequence: the wordmark assembles from gold tiles, a light passes over it,
 * then the curtain lifts into the hero. Rendered on the server so the hero never flashes first;
 * skipped for returning visits in the same session and for reduced motion.
 */

const SEEN_KEY = "comtech-intro-seen";
const ASSEMBLE = 1.35, HOLD = 0.85, TOTAL = ASSEMBLE + HOLD;

declare global {
  interface Window { __lenis?: { stop: () => void; start: () => void } }
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export default function Intro() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"play" | "leave" | "done">("play");
  const [pct, setPct] = useState(0);
  const skipRef = useRef<() => void>(() => {});

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(SEEN_KEY) === "1"; } catch {}
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
      document.documentElement.dataset.intro = "done";
      window.dispatchEvent(new Event("intro:done"));
      window.__lenis?.start();
    };
    if (seen || reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time decision on mount
      setPhase("done");
      finish();
      return;
    }
    window.scrollTo(0, 0);
    window.__lenis?.stop();

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0, leaving = false, t0 = 0;
    type Tile = { x: number; y: number; sx: number; sy: number; d: number; s: number };
    let tiles: Tile[] = [];
    let W = 0, H = 0, dpr = 1, size = 0;

    const leave = () => {
      if (leaving) return;
      leaving = true;
      setPhase("leave");
      finish();
      window.setTimeout(() => setPhase("done"), 1100);
    };
    skipRef.current = leave;

    const build = async () => {
      const family = getComputedStyle(document.documentElement).getPropertyValue("--font-display-face").trim() || "sans-serif";
      try { await document.fonts.load(`600 100px ${family}`); } catch {}
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const fs = Math.min(W * 0.26, H * 0.42);
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const o = off.getContext("2d")!;
      o.font = `600 ${fs}px ${family}`;
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.letterSpacing = `${fs * 0.04}px`;
      o.fillText("COMTECH", W / 2, H / 2 - fs * 0.04);
      const data = o.getImageData(0, 0, W, H).data;
      size = Math.max(3, Math.round(fs / 62));
      tiles = [];
      for (let y = 0; y < H; y += size) {
        for (let x = 0; x < W; x += size) {
          if (data[(y * W + x) * 4 + 3] > 140) {
            const a = Math.random() * Math.PI * 2, r = (0.35 + Math.random() * 0.8) * Math.max(W, H);
            tiles.push({ x, y, sx: W / 2 + Math.cos(a) * r, sy: H / 2 + Math.sin(a) * r, d: (x / W) * 0.45 + Math.random() * 0.25, s: Math.random() });
          }
        }
      }
      t0 = performance.now();
      raf = requestAnimationFrame(draw);
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const t = (now - t0) / 1000;
      setPct(Math.min(100, Math.round((t / TOTAL) * 100)));
      ctx.clearRect(0, 0, W, H);
      const sweep = ((t - ASSEMBLE + 0.1) / HOLD) * (W * 1.4) - W * 0.2;
      for (const tl of tiles) {
        const k = easeOutExpo(Math.min(1, Math.max(0, (t - tl.d) / 0.9)));
        if (k <= 0) continue;
        const x = tl.sx + (tl.x - tl.sx) * k, y = tl.sy + (tl.y - tl.sy) * k;
        const band = Math.exp(-Math.pow((tl.x - sweep) / (W * 0.07), 2));
        const lit = 0.74 + 0.18 * tl.s + band * 0.55;
        const r = Math.min(255, 201 * lit + 60 * band), g = Math.min(255, 161 * lit + 55 * band), b = Math.min(255, 82 * lit + 40 * band);
        ctx.globalAlpha = Math.min(1, k * 1.6);
        ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
        const s = size * (0.3 + 0.52 * k);
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      if (t > TOTAL && !leaving) leave();
    };

    build();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") leave(); };
    const onWheel = () => leave();
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onWheel, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onWheel);
    };
  }, []);

  if (phase === "done") return null;
  return (
    <div className="intro" data-phase={phase} aria-hidden={phase === "leave"}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <p className="sr-only">ComTech. Infrastructure for the tokenised economy.</p>
      <div className="intro-meta" aria-hidden="true">
        <span>Zug, Switzerland</span>
        <span className="intro-tagline">Infrastructure for the tokenised economy</span>
        <span className="tabular-nums">{String(pct).padStart(3, "0")}</span>
      </div>
      <button type="button" className="intro-skip" onClick={() => skipRef.current()}>
        Skip intro
      </button>
    </div>
  );
}
