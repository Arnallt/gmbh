"use client";

import { useEffect, useRef, type ElementType } from "react";

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Runs `cb` once, the first time `el` is sufficiently on screen. */
function onceVisible(el: Element, cb: () => void, threshold = 0.35) {
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      cb();
      io.disconnect();
    }
  }, { threshold });
  io.observe(el);
  return () => io.disconnect();
}

/**
 * A headline whose words rise through a mask, line by line, the first time it enters view.
 * `lines` are rendered as separate lines; wrap an entry in {accent} to set it in pale gold.
 */
export function RevealText({
  as: Tag = "h2",
  lines,
  className = "",
}: {
  as?: ElementType;
  lines: (string | { accent: string })[];
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current!;
    document.documentElement.dataset.fx = "on";
    if (reducedMotion()) {
      el.dataset.shown = "true";
      return;
    }
    return onceVisible(el, () => { el.dataset.shown = "true"; });
  }, []);

  const flat = lines.map((l) => (typeof l === "string" ? l : l.accent));
  let w = 0;
  return (
    <Tag ref={ref} className={className} data-reveal="">
      <span className="sr-only">{flat.join(" ")}</span>
      <span aria-hidden="true">
        {lines.map((l, li) => {
          const accent = typeof l !== "string";
          return (
            <span key={li} className={`block ${accent ? "text-gold-soft" : ""}`}>
              {flat[li].split(" ").map((word, wi) => (
                <span key={wi}>
                  <span className="rw"><span style={{ ["--w" as string]: w++ }}>{word}</span></span>{" "}
                </span>
              ))}
            </span>
          );
        })}
      </span>
    </Tag>
  );
}

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/·—#";

/**
 * Monospace label that "decodes" from scrambled glyphs, left to right, when it first appears
 * and again whenever its text changes. Keyed by text so React never fights the animation.
 */
export function Decode({ text, className = "" }: { text: string; className?: string }) {
  return <DecodeInner key={text} text={text} className={className} />;
}

function DecodeInner({ text, className }: { text: string; className: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current!;
    if (reducedMotion()) return;
    let raf = 0;
    const run = () => {
      const start = performance.now();
      const dur = Math.min(900, 260 + text.length * 22);
      const step = (now: number) => {
        const k = Math.min(1, (now - start) / dur);
        const shown = Math.floor(k * text.length);
        let out = text.slice(0, shown);
        for (let i = shown; i < text.length; i++) {
          out += text[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        el.textContent = out;
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const stop = onceVisible(el, run, 0.1);
    return () => {
      stop();
      cancelAnimationFrame(raf);
      el.textContent = text;
    };
  }, [text]);
  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
