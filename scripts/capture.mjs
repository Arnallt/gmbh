// Dev-only: capture screenshots of the running dev server with headless Edge over CDP.
// Usage: node scripts/capture.mjs <outDir> [url]
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2] ?? ".impeccable/review";
const url = process.argv[3] ?? "http://localhost:3000/";
mkdirSync(outDir, { recursive: true });

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const port = 9333;
const edge = spawn(EDGE, [
  "--headless=new", `--remote-debugging-port=${port}`, "--no-first-run", "--hide-scrollbars",
  "--enable-webgl", "--ignore-gpu-blocklist", "--user-data-dir=" + join(process.env.TEMP, "cdp-edge-prof"), "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 40 && !target; i++) {
  await sleep(250);
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    target = list.find((t) => t.type === "page");
  } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;

async function shot(name, clip) {
  const res = await send("Page.captureScreenshot", { format: "png", ...(clip ? { clip, captureBeyondViewport: true } : {}) });
  writeFileSync(join(outDir, name), Buffer.from(res.result.data, "base64"));
  console.log("wrote", name);
}

const plans = JSON.parse(process.env.PLANS ?? "null") ?? [
  { name: "desktop", w: 1440, h: 900, mobile: false, stops: [0, 0.3, 0.55, 0.8] , full: true },
  { name: "mobile", w: 390, h: 844, mobile: true, stops: [0, 0.4, 0.8], full: true },
];

await send("Page.enable");
if (process.env.FULL) {
  const sz = JSON.parse(process.env.FULL);
  await send("Emulation.setDeviceMetricsOverride", { width: sz.w, height: sz.h, deviceScaleFactor: 1, mobile: sz.mobile });
  await send("Page.navigate", { url });
  await sleep(6000);
  const total = await evalJs(`document.documentElement.scrollHeight`);
  await shot(`${sz.name}.png`, { x: 0, y: 0, width: sz.w, height: total, scale: 1 });
  ws.close(); edge.kill(); process.exit(0);
}
if (process.env.INTRO) {
  const sz = JSON.parse(process.env.INTRO);
  await send("Emulation.setDeviceMetricsOverride", { width: sz.w, height: sz.h, deviceScaleFactor: 1, mobile: sz.mobile });
  await send("Page.navigate", { url });
  const t0 = Date.now();
  for (const at of [700, 1300, 1900, 2500, 3000, 4200]) {
    await sleep(Math.max(0, at - (Date.now() - t0)));
    await shot(`${sz.name}-intro-${at}.png`);
  }
  ws.close(); edge.kill(); process.exit(0);
}
if (process.env.CHAPTERS) {
  const sizes = JSON.parse(process.env.CHAPTERS);
  for (const sz of sizes) {
    await send("Emulation.setDeviceMetricsOverride", { width: sz.w, height: sz.h, deviceScaleFactor: 1, mobile: sz.mobile });
    await send("Page.navigate", { url });
    await sleep(5000);
    const chapters = await evalJs(`[...document.querySelectorAll('[data-chapter]')].map(e => ({ name: e.dataset.chapter, top: e.getBoundingClientRect().top + scrollY, h: e.offsetHeight }))`);
    for (const c of chapters) {
      const pinned = c.h > sz.h * 1.5;
      for (const s of pinned ? (sz.stops ?? [0.12, 0.5, 0.9]) : [0]) {
        const y = Math.round(c.top + (pinned ? (c.h - sz.h) * s : 0));
        await evalJs(`window.scrollTo(0, ${y})`);
        await sleep(1500);
        await shot(`${sz.name}-${c.name.replace(/\W+/g, "_")}-${Math.round(s * 100)}.png`);
      }
    }
  }
  ws.close(); edge.kill(); process.exit(0);
}
for (const p of plans) {
  await send("Emulation.setDeviceMetricsOverride", { width: p.w, height: p.h, deviceScaleFactor: 1, mobile: p.mobile });
  await send("Page.navigate", { url });
  await sleep(4500);
  const sectionH = await evalJs(`document.querySelector('section[aria-label=Introduction]').offsetHeight - innerHeight`);
  for (const s of p.stops) {
    await evalJs(`window.scrollTo(0, ${Math.round(sectionH * s)})`);
    await sleep(1400);
    await shot(`${p.name}-hero-${Math.round(s * 100)}.png`);
  }
  if (p.full) {
    const total = await evalJs(`document.documentElement.scrollHeight`);
    const heroEnd = await evalJs(`document.querySelector('section[aria-label=Introduction]').offsetHeight`);
    // Walk the rest of the page so InView reveals fire, then capture it in one tall frame.
    for (let y = heroEnd; y < total; y += p.h * 0.8) { await evalJs(`window.scrollTo(0, ${y})`); await sleep(250); }
    await sleep(1800);
    await evalJs(`window.scrollTo(0, 0)`);
    await shot(`${p.name}.png`, { x: 0, y: heroEnd, width: p.w, height: total - heroEnd, scale: 1 });
  }
}
ws.close();
edge.kill();
process.exit(0);
