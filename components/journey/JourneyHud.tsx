"use client";

import { useEffect, useState } from "react";

type Mark = { id: string; name: string; el: HTMLElement };

/** A film-scrubber style chapter index on the right edge (desktop). */
export default function JourneyHud() {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("[data-chapter]")];
    const list = els.map((el, i) => ({ id: el.id || `chapter-${i}`, name: el.dataset.chapter!, el }));
    list.forEach((m) => { if (!m.el.id) m.el.id = m.id; });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the DOM once after mount
    setMarks(list);
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const mid = window.innerHeight * 0.5;
      let idx = 0;
      list.forEach((m, i) => { if (m.el.getBoundingClientRect().top <= mid) idx = i; });
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setActive((a) => (a === idx ? a : idx));
      setProgress((p) => { const n = window.scrollY / Math.max(max, 1); return Math.abs(n - p) > 0.002 ? n : p; });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!marks.length) return null;
  return (
    <nav aria-label="Chapters" className="hud" data-hidden={progress < 0.02}>
      <span className="hud-track" aria-hidden="true"><span className="hud-fill" style={{ transform: `scaleY(${progress})` }} /></span>
      <ol>
        {marks.map((m, i) => (
          <li key={m.id}>
            <a href={`#${m.id}`} data-on={i === active} aria-current={i === active ? "step" : undefined}>
              <span className="hud-label">{m.name}</span>
              <span className="hud-dot" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
