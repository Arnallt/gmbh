"use client";

import { useEffect, useRef, useState } from "react";
import GoldField from "./GoldField";
import { Arrow } from "./icons";
import { Decode } from "./fx/TextFx";

const STAGES = [
  { name: "Physical metal", line: "Real, allocated value." },
  { name: "Vault & custodian", line: "Held by specialist partners." },
  { name: "Verification", line: "Reconciled against the asset." },
  { name: "Tokenisation", line: "Minted on authorised issuer instructions." },
  { name: "Digital token", line: "Programmable. Traceable." },
  { name: "Transfer", line: "At the speed of software." },
  { name: "Redemption", line: "Back to the physical." },
];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export default function Transformation() {
  const sectionRef = useRef<HTMLElement>(null);
  const resolveRef = useRef(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    let last = -1;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const p = clamp(-rect.top / Math.max(span, 1));
      resolveRef.current = clamp((p - 0.18) / 0.6);
      if (Math.abs(p - last) > 0.002) {
        last = p;
        setProgress(p);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const heroOut = clamp((progress - 0.04) / 0.1);
  const chainIn = clamp((progress - 0.14) / 0.06) * (1 - clamp((progress - 0.8) / 0.04));
  const stage = Math.min(STAGES.length - 1, Math.floor(clamp((progress - 0.16) / 0.62) * STAGES.length));
  const outro = clamp((progress - 0.84) / 0.06);

  return (
    <section ref={sectionRef} id="origin" data-chapter="Origin" className="relative z-[1] h-[360svh] bg-obsidian md:h-[420vh]" aria-label="Introduction">
      <div className="sticky top-0 h-svh overflow-hidden">
        <GoldField resolveRef={resolveRef} className="gold-field absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgb(11_10_8/0.7),transparent_16%),linear-gradient(to_top,var(--color-obsidian)_6%,rgb(11_10_8/0.75)_38%,transparent_62%)] md:bg-[linear-gradient(to_bottom,rgb(11_10_8/0.7),transparent_16%),linear-gradient(to_top,var(--color-obsidian)_4%,transparent_48%)]" />
        <div className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(to_right,rgb(11_10_8/0.9)_0,rgb(11_10_8/0.82)_30rem,transparent_42rem)] md:block" />

        {/* Hero */}
        <div
          className="absolute inset-x-0 bottom-0 px-5 pb-10 md:px-10 md:pb-16"
          style={{ opacity: 1 - heroOut, transform: `translateY(${heroOut * -24}px)`, visibility: heroOut >= 1 ? "hidden" : "visible" }}
        >
          <div className="mx-auto max-w-[88rem]">
            <h1 className="hero-title font-display text-[clamp(4.25rem,10.5vw,9rem)] font-[250] leading-[0.88] tracking-[-0.012em] text-bone">
              <span className="line"><span>Infrastructure for the</span></span>
              <span className="line"><span>tokenised economy.</span></span>
            </h1>
            <div className="mt-8 flex flex-col gap-8 md:mt-10 md:flex-row md:items-end md:justify-between">
              <p className="hero-rise max-w-[46ch] text-[1.0625rem] leading-relaxed text-ash md:text-lg" style={{ ["--d" as string]: "0.55s" }}>
                Real-world assets, made programmable. Under your brand.
              </p>
              <div className="hero-rise flex flex-wrap items-center gap-3" style={{ ["--d" as string]: "0.7s" }}>
                <a href="#contact" className="btn-primary">
                  Talk to our team <Arrow />
                </a>
                <a href="#platform" className="btn-ghost">
                  Explore the platform
                </a>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-line pt-4 font-mono text-[0.75rem] text-dim md:mt-10">
              <span className="hidden items-center gap-2 md:flex">
                <span className="scroll-cue" aria-hidden="true" />
                Scroll
              </span>
              <span>Zug, Switzerland</span>
            </div>
          </div>
        </div>

        {/* The chain */}
        <div
          className="absolute inset-0 flex items-end px-5 pb-10 md:items-center md:px-10 md:pb-0"
          style={{ opacity: chainIn, visibility: chainIn <= 0 ? "hidden" : "visible" }}
        >
          <div className="mx-auto grid w-full max-w-[88rem] gap-6 md:grid-cols-[minmax(0,26rem)_1fr]">
            <div className="rounded-[2px] bg-[rgb(11_10_8/0.55)] p-5 backdrop-blur-md md:bg-transparent md:p-0 md:backdrop-blur-none">
              <h2 className="font-display text-[clamp(2.4rem,4vw,3.6rem)] font-[280] leading-[0.95] tracking-[-0.01em] text-bone">
                From metal to token, <span className="text-gold-soft">without losing the thread.</span>
              </h2>
              <ol className="mt-6 hidden space-y-0 md:block">
                {STAGES.map((s, i) => (
                  <li
                    key={s.name}
                    className="chain-step"
                    data-state={i < stage ? "done" : i === stage ? "active" : "next"}
                  >
                    <span className="font-mono text-[0.72rem] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span>{s.name}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 md:hidden">
                <div className="flex gap-1" aria-hidden="true">
                  {STAGES.map((s, i) => (
                    <span key={s.name} className={`h-px flex-1 ${i <= stage ? "bg-gold" : "bg-line-strong"}`} />
                  ))}
                </div>
                <p className="mt-3 font-mono text-[0.75rem] text-gold-soft">
                  <Decode text={`${String(stage + 1).padStart(2, "0")} / 07 · ${STAGES[stage].name}`} />
                </p>
              </div>
              <p key={stage} className="stage-line mt-3 max-w-[38ch] text-[0.975rem] leading-relaxed text-ash md:mt-8 md:text-base">
                {STAGES[stage].line}
              </p>
            </div>
          </div>
        </div>

        {/* Outro */}
        <div
          className="absolute inset-x-0 bottom-0 px-5 pb-12 md:px-10 md:pb-16"
          style={{ opacity: outro, visibility: outro <= 0 ? "hidden" : "visible" }}
        >
          <p className="mx-auto max-w-[88rem] font-display text-[clamp(3rem,8vw,7rem)] font-[250] leading-[0.9] tracking-[-0.01em] text-bone">
            Physical value.
            <br />
            <span className="text-gold-soft">Programmable precision.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
