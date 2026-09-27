# ComTech: Infrastructure for the Tokenised Economy

Marketing site for ComTech GmbH (Zug, Switzerland). A single long page with a cinematic title sequence, a live WebGL gold-leaf hero, and a continuous scroll-driven 3D journey.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

Requires Node.js 20+.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, three.js, Lenis.

Next.js 16 has breaking changes from earlier versions; see `AGENTS.md`.

## Structure

```
app/
  layout.tsx          fonts (Imbue display, Geist body), metadata, smooth scroll
  page.tsx            section order
  globals.css         design tokens and component styles
components/
  Intro.tsx           title sequence (once per session, skippable)
  Transformation.tsx  hero + asset chain (pinned)
  GoldField.tsx       gold-leaf fragment shader
  Nav.tsx, ContactForm.tsx, SmoothScroll.tsx, icons.tsx
  fx/Cursor.tsx       gold cursor + magnetic buttons
  fx/TextFx.tsx       headline reveals and decoding labels
  journey/            pinned chapters, copy, chapter index
  world/              three.js world (all 3D scenes), lazy-loaded
lib/journey.ts        shared scroll state between chapters and the 3D world
scripts/capture.mjs   dev-only screenshot tool (headless Edge)
```

## How the 3D journey works

Each chapter is a tall section with a sticky viewport. `useScene()` publishes its scroll progress `p` (0–1) and visibility `v` (0–1). One fixed three.js renderer poses the matching scene from those values each frame, so scrolling back rewinds it exactly. Rendering pauses when no scene is visible.

To add a chapter, register a scene with `addScene(id, build)` in `components/world/JourneyWorld.tsx`, add a `<Chapter scene={id}>` in `components/journey/Chapters.tsx`, and place it in `app/page.tsx`.

## Configuration

- **Contact form:** set `FORM_ENDPOINT` in `components/ContactForm.tsx`. Until then, the form shows that enquiries open shortly.
- **Logo:** `Wordmark` in `components/Nav.tsx` is a text placeholder.

## Accessibility

- Reduced motion skips the intro, disables the cursor and text effects, and freezes idle 3D motion.
- All copy is real text, and the 3D canvases are decorative.
- Keyboard focus is visible throughout.

## Deploy

The site is a static export (`output: "export"`), published to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`.

- **Live URL:** https://arnallt.github.io/gmbh/
- **One-time setup:** in the repo, go to Settings → Pages → Build and deployment → Source, and choose **GitHub Actions**.
- **Base path:** the workflow sets `PAGES_BASE_PATH` (`/gmbh`). Leave it unset for local dev or for hosting at a domain root.
