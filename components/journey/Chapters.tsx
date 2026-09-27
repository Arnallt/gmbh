"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import Chapter, { Ticks } from "./Chapter";
import { Arrow } from "../icons";
import { Decode, RevealText } from "../fx/TextFx";
import { clamp, METALS, setWorldMetal, useScene, type MetalId } from "@/lib/journey";

const beat = (p: number, n: number) => Math.min(n - 1, Math.floor(p * n));

/* ── Three ways in ─────────────────────────────────────────────────────────── */

const PILLARS = [
  { name: "Platform", promise: "Bring assets on-chain. Build nothing.", href: "#process", cta: "How we deliver" },
  { name: "Technology", promise: "Your brand. Your clients. Our engine.", href: "#architecture", cta: "See the architecture" },
  { name: "Precious metals", promise: "Physical value, made digital.", href: "#precious-metals", cta: "Why gold" },
];

export function PillarsChapter() {
  return (
    <Chapter id="platform" scene="pillars" chapter="Three ways in" height="340vh" label="Three ways in">
      {(p) => {
        const i = beat(p, 3);
        const x = PILLARS[i];
        return (
          <>
            <RevealText className="h-chapter" lines={["One infrastructure.", "Three ways in."]} />
            <ul className="sr-only">
              {PILLARS.map((pl) => <li key={pl.name}>{pl.name}: {pl.promise}</li>)}
            </ul>
            <div className="mt-8" aria-hidden="true">
              <Ticks count={3} active={i} label={x.name} />
              <div key={i} className="beat-in mt-6">
                <p className="text-[clamp(1.35rem,2.2vw,1.75rem)] font-light leading-[1.15] tracking-[-0.02em] text-bone">{x.promise}</p>
              </div>
            </div>
            <a href={x.href} className="link-arrow mt-6">{x.cta} <Arrow /></a>
          </>
        );
      }}
    </Chapter>
  );
}

/* ── Architecture ──────────────────────────────────────────────────────────── */

const LAYERS = [
  { name: "Your brand" },
  { name: "APIs" },
  { name: "Tokenisation engine" },
  { name: "Smart contracts" },
  { name: "Blockchain networks" },
];

export function StackChapter() {
  return (
    <Chapter id="architecture" scene="stack" chapter="Architecture" height="300vh" label="How the infrastructure fits together">
      {(p) => {
        const built = Math.floor(clamp(p / 0.72) * 5.4 - 0.4); // index of the most recently landed layer, bottom-up
        return (
          <>
            <RevealText className="h-chapter" lines={["Your brand on top.", "Ours underneath."]} />
            <ol className="mt-8 border-b border-line">
              {LAYERS.map((l, i) => {
                const bottomUp = LAYERS.length - 1 - i;
                const state = bottomUp < built ? "done" : bottomUp === built ? "active" : "next";
                return (
                  <li key={l.name} className="layer-row" data-state={state}>
                    <span className="text-[0.975rem]">{l.name}</span>
                  </li>
                );
              })}
            </ol>
          </>
        );
      }}
    </Chapter>
  );
}

/* ── Gold ──────────────────────────────────────────────────────────────────── */

const GOLD_BEATS = [
  { h: "We started with the hardest asset.", b: "Physical. Heavy. Done for real." },
  { h: "Then made it programmable.", b: "Every unit traceable to the metal." },
  { h: "Now, any asset.", b: "Metals, real estate, credit, funds." },
];

export function GoldChapter() {
  const [metal, setMetal] = useState<MetalId>("Au");
  const pick = (m: MetalId) => {
    setMetal(m);
    setWorldMetal(m);
  };
  return (
    <Chapter id="precious-metals" scene="gold" chapter="Precious metals" height="340vh" label="Precious metals experience">
      {(p) => {
        const i = p < 0.3 ? 0 : p < 0.72 ? 1 : 2;
        return (
          <>
            <ul className="sr-only">{GOLD_BEATS.map((g) => <li key={g.h}>{g.h} {g.b}</li>)}</ul>
            <div key={i} className="beat-in" aria-hidden="true">
              <h2 className="h-chapter">{GOLD_BEATS[i].h}</h2>
              <p className="mt-6 text-lg leading-relaxed text-ash">{GOLD_BEATS[i].b}</p>
            </div>
            <fieldset className="mt-9">
              <legend className="sr-only">Change the metal</legend>
              <div className="mt-3 flex gap-2">
                {(Object.keys(METALS) as MetalId[]).map((m) => (
                  <label key={m} className="metal-chip" data-on={metal === m}>
                    <input type="radio" name="metal" className="sr-only" checked={metal === m} onChange={() => pick(m)} />
                    <span className="font-display text-2xl font-[300]">{m}</span>
                    <span className="text-[0.75rem] text-dim">{METALS[m].name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        );
      }}
    </Chapter>
  );
}

/* ── Process ───────────────────────────────────────────────────────────────── */

const STEPS = [
  { name: "Discover", body: "Your asset. Your goal." },
  { name: "Design", body: "Architecture shaped to the asset." },
  { name: "Build", body: "Contracts, APIs, infrastructure." },
  { name: "Deploy", body: "Live, with your partners." },
  { name: "Manage", body: "Supported, within our scope." },
];

export function ProcessChapter() {
  return (
    <Chapter id="process" scene="process" chapter="Process" height="460vh" label="Tokenisation as a service">
      {(p) => {
        const x = clamp(p * 1.04) * 4;
        const seg = Math.min(3, Math.floor(x));
        const f = clamp((x - seg - 0.3) / 0.65);
        const tt = x >= 4 ? 1 : (seg + f * f * (3 - 2 * f)) / 4;
        const i = Math.round(tt * 4);
        const s = STEPS[i];
        return (
          <>
            <RevealText className="h-chapter" lines={["Idea to live.", "One team."]} />
            <ol className="sr-only">{STEPS.map((st) => <li key={st.name}>{st.name}: {st.body}</li>)}</ol>
            <div className="mt-10" aria-hidden="true">
              <Ticks count={5} active={i} label="Our process" />
              <div key={i} className="beat-in mt-6">
                <p className="font-display text-[clamp(4rem,8vw,7rem)] font-[200] leading-[0.85] tracking-[-0.01em] text-bone">{s.name}</p>
                <p className="mt-4 text-ash">{s.body}</p>
              </div>
            </div>
          </>
        );
      }}
    </Chapter>
  );
}

/* ── Ecosystem ─────────────────────────────────────────────────────────────── */

const AUDIENCES = [
  { name: "Banks", body: "Digital assets, without building the stack." },
  { name: "Asset managers", body: "Familiar structures, on-chain." },
  { name: "Corporates", body: "Receivables and commodities, tokenised." },
  { name: "FinTechs", body: "Tokenised assets through our APIs." },
];

export function EcosystemChapter() {
  return (
    <Chapter id="institutional" scene="ecosystem" chapter="Ecosystem" height="320vh" label="Who we work with">
      {(p) => {
        const i = beat(p, 4);
        return (
          <>
            <RevealText className="h-chapter" lines={["At the centre", "of it all."]} />
            <ul className="sr-only">{AUDIENCES.map((a) => <li key={a.name}>{a.name}: {a.body}</li>)}</ul>
            <div className="mt-9" aria-hidden="true">
              <Ticks count={4} active={i} label="Built for" />
              <div key={i} className="beat-in mt-5">
                <p className="text-xl font-light tracking-[-0.015em] text-bone">{AUDIENCES[i].name}</p>
                <p className="mt-2 leading-relaxed text-ash">{AUDIENCES[i].body}</p>
              </div>
            </div>
          </>
        );
      }}
    </Chapter>
  );
}

/* ── Swiss statement: kinetic type ─────────────────────────────────────────── */

const LINE = "Precise about what we do. And what we don’t.".split(" ");

export function SwissChapter() {
  const ref = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);
  useScrollProgress(ref, setP);
  const shown = p * (LINE.length + 3);
  return (
    <section ref={ref} data-chapter="Precision" className="relative h-[220vh] bg-obsidian" aria-label="Our approach">
      <div className="sticky top-0 flex h-svh items-center overflow-hidden">
        <div className="wrap w-full">
          <h2 className="max-w-[14ch] font-display text-[clamp(4rem,12vw,11rem)] font-[250] leading-[0.86] tracking-[-0.012em]">
            <span className="sr-only">{LINE.join(" ")}</span>
            <span aria-hidden="true">
              {LINE.map((w, i) => (
                <span key={i}>
                  <span className="kinetic-word" style={{ ["--k" as string]: clamp(shown - i) }}>{w}</span>{" "}
                </span>
              ))}
            </span>
          </h2>
          <div className="mt-12 grid gap-6 transition-opacity duration-700 md:grid-cols-[1fr_minmax(0,30rem)]" style={{ opacity: clamp((shown - LINE.length) / 2) }}>
            <span />
            <div>
              <p className="font-mono text-[0.75rem] leading-relaxed text-dim">
                <Decode text="ComTech GmbH · CHE-351.239.228" /><br />
                <Decode text="Bahnhofstrasse 27, 6300 Zug, Switzerland" />
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function useScrollProgress(ref: RefObject<HTMLElement | null>, set: (p: number) => void) {
  useEffect(() => {
    let raf = 0, last = -1;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const prog = clamp(-r.top / Math.max(r.height - window.innerHeight, 1));
      if (Math.abs(prog - last) > 0.002) { last = prog; set(prog); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref, set]);
}

/* ── Contact: registers the drifting-token scene ───────────────────────────── */

export function ContactScene({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useScene("contact", ref);
  return (
    <section ref={ref} id="contact" data-chapter="Contact" className="section relative border-t border-line">
      <div className="contact-scrim" aria-hidden="true" />
      {children}
    </section>
  );
}
