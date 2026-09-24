# Thomas Nguyen — sketchbook portfolio

Astro 7 (static) + Tailwind v4 + GSAP/ScrollTrigger + Rough.js + rough-notation + perfect-freehand + Lenis.

## Commands
- `npm run dev` — dev server on :4321
- `npm run build` — static build to `dist/`
- `npx tsc --noEmit -p .` — typecheck
- `npm run sync:projects -- --days 7` — pull recently-committed public repos from GitHub (needs `gh` auth),
  download README media into `public/projects/<repo>/`, write `src/content/projects.json`.
  Hand edits to `title`, `blurb`, `tags`, `doodle`, `hidden`, `order` survive re-syncs.
  Media files that already exist are skipped — add `--force` to re-download (e.g. after a repo's README video changes).
- Deploy: `vercel deploy --prod --yes` (project `thomas-portfolio`, live at https://thomas-portfolio-ruby.vercel.app)

## Where things live
- Content: `src/content/portfolio.ts` (profile, jobs, clubs, education, skills, project doodles), `src/content/projects.json`
- Sketch engine (build-time Rough.js): `src/lib/doodles.ts` (shapes, 100×100), `src/lib/sketch.ts`,
  `src/components/Doodle.astro` (3-seed line boil, `draw` = ink on scroll), `SketchBox.astro` (rough borders)
- Characters (Thomas + the band: clawd, muse, codex, grok, openclaw): `src/lib/characters.ts`. Parts have a `slot`
  (`face` / `acc` / `inst`); `<Character id mini expr="wink" acc={["party","coffee"]} />` swaps the face, swaps hats,
  drops instruments, and adds props generated from each character's anchors (eyes, mouth, top, hand).
  The playing band lives in the hero: `src/components/BandStage.astro` (CSS beat via `--beat`) + `src/scripts/band.ts`.
- Claude Code hobby section: `src/components/sections/ClaudeCode.astro` + `src/scripts/claude.ts` — one GSAP timeline
  (steps 0–11) scrubbed by a pinned ScrollTrigger on desktop, played once on smaller screens, jumped to the end
  for reduced motion. State changes use reversible `tl.set(el, { attr: { "data-on": … } })` so scrubbing back rewinds.
  `gsap.matchMedia` only fires when a condition matches, so every viewport case must be listed.
- Motion: `src/scripts/*.ts` — `main.ts` boots everything; `hero.ts` (pencil writes the name), `timeline.ts`
  (scroll-drawn spine + pencil), `mindmap.ts` (skills branches), `pad.ts` (doodle-on-page), `contact.ts`

## Repo & README media
- GitHub: https://github.com/duc-minh-droid/thomas-portfolio (public). README media lives in `docs/media/`.
- Re-record: don't use Playwright `recordVideo` (Chrome's screencast only delivers ~540px frames). Instead drive the
  walkthrough while a parallel loop saves `page.screenshot()` JPEGs at 1280×800 (~17fps), then encode with ffmpeg
  (`-framerate 16.8`). Use animated WebP (`libwebp_anim`) for README clips: GIFs of scrolling paper grain are 5–10×
  bigger. ffmpeg comes from `imageio-ffmpeg` in a throwaway venv (not installed globally).

## Rules
- Only `public/Thomas_Nguyen_CV.pdf` (phone redacted) is published. Root `Profile.pdf` / `Thomas_Nguyen_CV.pdf`
  are private and excluded via `.gitignore` + `.vercelignore` — never move them into `public/`.
- `html.motion` is set pre-paint when reduced motion is off; CSS pre-hides animated bits only under it.
- Use `style="stroke:var(--x)"` (not SVG attributes) for CSS-var colours; measure layout with `offset*`, not
  `getBoundingClientRect`, when elements may be mid-reveal.
- Screenshots from Playwright go in `.playwright-mcp/` (git-ignored).
