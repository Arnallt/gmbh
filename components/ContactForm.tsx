"use client";

import { useState, type FormEvent } from "react";
import { Arrow } from "./icons";

// Set this when the enquiries inbox / CRM endpoint is available.
const FORM_ENDPOINT: string | null = null;

const ASSETS = ["Precious metals", "Real estate", "Private credit", "Funds", "Commodities", "Not sure yet"];

type State = "idle" | "sending" | "sent" | "error";

export default function ContactForm() {
  const [state, setState] = useState<State>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!FORM_ENDPOINT) return;
    setState("sending");
    try {
      const res = await fetch(FORM_ENDPOINT, { method: "POST", body: new FormData(form) });
      if (!res.ok) throw new Error(String(res.status));
      setState("sent");
      form.reset();
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="border-t border-gold pt-8" role="status">
        <p className="text-2xl font-light tracking-[-0.02em] text-bone">Thank you. We&rsquo;ll be in touch shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-x-8 gap-y-7 sm:grid-cols-2" noValidate={false}>
      <Field label="Name" name="name" autoComplete="name" required />
      <Field label="Work email" name="email" type="email" autoComplete="email" spellCheck={false} required />
      <Field label="Institution" name="company" autoComplete="organization" required />
      <div>
        <label htmlFor="asset" className="block text-[0.875rem] text-ash">What would you like to tokenise?</label>
        <select id="asset" name="asset" className="field mt-2" defaultValue="">
          <option value="" disabled>Select an asset class</option>
          {ASSETS.map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="message" className="block text-[0.875rem] text-ash">What are you looking to build? <span className="text-dim">(optional)</span></label>
        <textarea id="message" name="message" rows={3} className="field mt-2 resize-y" />
      </div>
      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" className="btn-primary self-start" disabled={!FORM_ENDPOINT || state === "sending"}>
          {!FORM_ENDPOINT ? "Enquiries opening shortly" : state === "sending" ? "Sending…" : "Request a conversation"} {FORM_ENDPOINT && <Arrow />}
        </button>
        <p className="text-[0.875rem] text-dim" role="status" aria-live="polite">
          {!FORM_ENDPOINT && "Enquiries open shortly."}
          {state === "error" && <span className="text-[#e58b7b]">Something went wrong sending your request. Please try again.</span>}
        </p>
      </div>
    </form>
  );
}

function Field({ label, name, ...rest }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="block text-[0.875rem] text-ash">{label}</label>
      <input id={name} name={name} className="field mt-2" {...rest} />
    </div>
  );
}
