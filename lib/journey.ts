"use client";

import { useEffect, useState, type RefObject } from "react";

export type SceneId = "pillars" | "stack" | "gold" | "process" | "ecosystem" | "contact";
export type MetalId = "Au" | "Ag" | "Pt" | "Pd";

/** Physically based base reflectance (linear sRGB). */
export const METALS: Record<MetalId, { name: string; rgb: [number, number, number] }> = {
  Au: { name: "Gold", rgb: [1.0, 0.71, 0.29] },
  Ag: { name: "Silver", rgb: [0.972, 0.96, 0.915] },
  Pt: { name: "Platinum", rgb: [0.672, 0.637, 0.585] },
  Pd: { name: "Palladium", rgb: [0.733, 0.697, 0.652] },
};

/**
 * Shared, mutable state between the DOM chapters and the WebGL world.
 * p: progress through a pinned chapter (0..1). v: how much of it is on screen (0..1).
 */
export const journey = {
  scenes: {} as Partial<Record<SceneId, { p: number; v: number }>>,
  metal: "Au" as MetalId,
};

export function setWorldMetal(m: MetalId) {
  journey.metal = m;
}

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Tracks a chapter's scroll progress, publishes it to the world, and returns it for the DOM. */
export function useScene(id: SceneId, ref: RefObject<HTMLElement | null>) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    let last = -1;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const prog = clamp(-r.top / Math.max(r.height - vh, 1));
      const v = Math.min(clamp(1 - r.top / vh), clamp(r.bottom / vh));
      journey.scenes[id] = { p: prog, v };
      if (Math.abs(prog - last) > 0.0015) {
        last = prog;
        setP(prog);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      journey.scenes[id] = { p: 0, v: 0 };
    };
  }, [id, ref]);
  return p;
}
