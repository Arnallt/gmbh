"use client";

import { useRef, type ReactNode } from "react";
import { useScene, type SceneId } from "@/lib/journey";
import { Decode } from "../fx/TextFx";

/**
 * A pinned chapter: a tall section whose sticky viewport overlays the shared 3D world.
 * Children receive scroll progress (0..1) through the chapter.
 */
export default function Chapter({
  id,
  scene,
  chapter,
  height,
  label,
  children,
}: {
  id: string;
  scene: SceneId;
  chapter: string;
  height: string;
  label: string;
  children: (p: number) => ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const p = useScene(scene, ref);
  return (
    <section ref={ref} id={id} data-chapter={chapter} aria-label={label} className="relative" style={{ height }}>
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="scene-scrim" aria-hidden="true" />
        <div className="wrap relative flex h-full items-end pb-10 pt-24 md:items-center md:pb-0">
          <div className="w-full max-w-[31rem]">{children(p)}</div>
        </div>
      </div>
    </section>
  );
}

/** Progress ticks for a chapter with discrete beats. */
export function Ticks({ count, active, label }: { count: number; active: number; label: string }) {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <div className="flex gap-1.5">
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={`h-px w-7 transition-colors duration-500 ${i <= active ? "bg-gold-soft" : "bg-line-strong"}`} />
        ))}
      </div>
      <Decode
        className="font-mono text-[0.72rem] tabular-nums text-dim"
        text={`${String(active + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")} · ${label}`}
      />
    </div>
  );
}
