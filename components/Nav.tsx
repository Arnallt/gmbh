"use client";

import { useEffect, useState } from "react";
import { Arrow, Close, Menu } from "./icons";

const LINKS = [
  { href: "#platform", label: "Platform" },
  { href: "#architecture", label: "Technology" },
  { href: "#precious-metals", label: "Precious Metals" },
  { href: "#process", label: "Solutions" },
  { href: "#institutional", label: "Institutional" },
];

export function Wordmark({ className = "" }: { className?: string }) {
  // Placeholder wordmark until the ComTech logo file is supplied.
  return (
    <span className={`font-medium tracking-[0.32em] text-bone ${className}`}>
      COMTECH
    </span>
  );
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="nav" data-scrolled={scrolled || open}>
      <div className="mx-auto flex h-16 max-w-[88rem] items-center justify-between px-5 md:px-10">
        <a href="#top" className="text-[0.8125rem]" aria-label="ComTech, back to top" onClick={() => setOpen(false)}>
          <Wordmark />
        </a>
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-8 text-[0.875rem] text-ash">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a className="nav-link" href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <a href="#contact" className="btn-primary btn-sm hidden sm:inline-flex">
            Contact <Arrow />
          </a>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center text-bone lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <Close /> : <Menu />}
          </button>
        </div>
      </div>
      <div id="mobile-menu" className="mobile-menu lg:hidden" data-open={open} hidden={!open}>
        <ul className="px-5 pb-8 pt-2">
          {[...LINKS, { href: "#contact", label: "Contact" }].map((l) => (
            <li key={l.href} className="border-b border-line">
              <a href={l.href} className="flex items-center justify-between py-4 text-2xl font-light tracking-[-0.02em] text-bone" onClick={() => setOpen(false)}>
                {l.label} <Arrow className="text-gold" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
