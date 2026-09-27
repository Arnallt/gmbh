"use client";

import { useEffect, useRef } from "react";

/**
 * Gold cursor: a dot that tracks the pointer exactly and a ring that follows with a soft lag.
 * The ring grows over interactive elements, thins to a caret over text fields, and tightens on press.
 * Primary and ghost buttons are gently magnetic. Fine pointers only; off for reduced motion.
 */

const INTERACTIVE = "a, button, [role='switch'], select, label, summary, .metal-chip, .swatch";
const TEXT = "input:not([type='radio']):not([type='checkbox']), textarea";
const MAGNETIC = ".btn-primary, .btn-ghost";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    const dot = dotRef.current!, ring = ringRef.current!;
    const root = document.documentElement;
    root.dataset.cursor = "on";

    const pos = { x: -100, y: -100 }, ringPos = { x: -100, y: -100 };
    let magnet: HTMLElement | null = null;
    let raf = 0;

    const setState = (s: string) => { if (ring.dataset.state !== s) ring.dataset.state = s; };

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      ring.dataset.visible = dot.dataset.visible = "true";
      const t = e.target as Element | null;
      if (!t?.closest) return;
      if (t.closest(TEXT)) setState("text");
      else if (t.closest(INTERACTIVE)) setState("link");
      else setState("idle");

      const m = t.closest<HTMLElement>(MAGNETIC);
      if (magnet && magnet !== m) {
        magnet.style.removeProperty("--mx");
        magnet.style.removeProperty("--my");
      }
      magnet = m;
      if (m) {
        const r = m.getBoundingClientRect();
        m.style.setProperty("--mx", `${(e.clientX - (r.left + r.width / 2)) * 0.22}px`);
        m.style.setProperty("--my", `${(e.clientY - (r.top + r.height / 2)) * 0.3}px`);
      }
    };
    const onLeave = () => { ring.dataset.visible = dot.dataset.visible = "false"; };
    const onDown = () => ring.classList.add("is-down");
    const onUp = () => ring.classList.remove("is-down");

    const tick = () => {
      raf = requestAnimationFrame(tick);
      ringPos.x += (pos.x - ringPos.x) * 0.18;
      ringPos.y += (pos.y - ringPos.y) * 0.18;
      dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      delete root.dataset.cursor;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden="true">
      <div ref={ringRef} className="cursor-ring" data-state="idle" data-visible="false"><span /></div>
      <div ref={dotRef} className="cursor-dot" data-visible="false"><span /></div>
    </div>
  );
}
