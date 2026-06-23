# Performance improvement plan

Findings from auditing the live codebase (no build step; static HTML/CSS/JS + Firebase Realtime Database). Ordered by expected impact.

## 1. Oversized "photo-traced" land SVGs (critical, biggest win) — ✅ done

`disney.js` already identifies this exact problem in a comment (line ~656-660): SVGs with thousands of `<path>` elements are expensive to inject/animate every scroll frame, so `castle.svg` (785 KB) was converted to `castle.webp` (517 KB) and is loaded as a raster `<img>` via `RASTER_PROPS`. That fix was **never extended to the other oversized land illustrations**, which are still fetched and `innerHTML`-injected as live SVG on every scene load:

| asset | size | status |
|---|---|---|
| `haunted-mansion.svg` | 4.3 MB | live SVG, unconverted |
| `galaxys-edge.svg` | 1.8 MB | live SVG, unconverted |
| `cafe-orleans.svg` | 1.0 MB | live SVG, unconverted |
| `matterhorn.svg` | 709 KB | live SVG, unconverted |
| `space-mountain.svg` | 694 KB | live SVG, unconverted |
| `castle.svg` / `castle.webp` | 785 KB / 517 KB | already fixed (raster) |

These five files alone are ~8.5 MB of network payload and DOM/paint cost for a single mobile page. Each one parses into thousands of path nodes that get transformed/composited on every `requestAnimationFrame` in `applyMotion`/`onScroll`.

**Done:** rasterized the remaining five the same way `castle` was handled — rendered each SVG to WebP at 2x the scene's display width (matching `castle.webp`'s existing scale), added all five to `RASTER_PROPS` in `disney.js`, removed the now-unused source SVGs (plus the already-orphaned `castle.svg`), bumped `disney.js`'s cache-busting query param and the service worker's `CACHE` name so clients pick up the change.

| asset | before | after |
|---|---|---|
| `haunted-mansion` | 4.3 MB SVG | 875 KB WebP |
| `galaxys-edge` | 1.8 MB SVG | 593 KB WebP |
| `cafe-orleans` | 1.0 MB SVG | 555 KB WebP |
| `matterhorn` | 709 KB SVG | 420 KB WebP |
| `space-mountain` | 694 KB SVG | 340 KB WebP |

`assets/disney/` dropped from ~9.2 MB to ~3.4 MB. More importantly, every land scene now composites a single raster `<img>` instead of injecting and animating thousands of `<path>` nodes per scroll frame — this is the change that should actually fix the scroll jank, not just the transfer size.

Note: no headless browser was available in this environment to capture a visual before/after, so scroll-smoothness should still be spot-checked on a real device.

## 2. Service worker precache list vs. asset weight

`sw.js` precaches `disney.html`, `disney.css`, `disney.js`, etc. but not the land art (good — avoids blocking install on megabytes of SVG). After fix #1, consider adding the now-small WebP props to `CORE` so the park map is fully offline-capable on first visit, since the precache cost would become trivial.

## 3. `package.json` ships `vercel` as a runtime dependency

`vercel` is a deploy CLI, not used by the app at runtime. Listing it under `dependencies` (not `devDependencies`) means it gets installed in every environment that does `npm install` for the app, pulling in a large dependency tree for no runtime benefit. Move it to `devDependencies` or drop it entirely if deploys go through the Vercel dashboard/GitHub integration rather than the CLI.

## 4. Firebase: compat bundle + `document.write` injection

`disney.html` loads `firebase-app-compat.js` + `firebase-database-compat.js` via `document.write` (parser-blocking, and only after a synchronous IIFE check runs). The compat bundles are notably larger than the modular v9+ SDK. Switching `disney.js`'s Firebase calls to the modular API (`import { initializeApp } from "firebase/app"`, `import { getDatabase, ref, onValue } from "firebase/database"`) and loading via a regular `<script type="module">`/CDN ESM URL would cut the Firebase payload substantially and remove the `document.write` parser-blocking pattern. This is a larger refactor than #1-#3 (touches every `firebase.*` call site in `disney.js`), so it's lower priority unless Firebase load time shows up as a bottleneck in measurement.

## 5. Google Fonts: weights loaded but not all used

- `index.html` requests Syne 400/500/600/700/800 + Outfit 400/600/700/800 — 9 weight files.
- `disney.html` requests 4 separate families (Cinzel Decorative, Lobster Two incl. italic, Righteous, Nunito) at multiple weights.

Worth auditing actual `font-weight` usage in `styles.css`/`disney.css` and trimming the `@import` weight list to only what's referenced — each unused weight is a wasted font file fetch on every first visit (fonts aren't precached by the service worker either).

## 6. No minification/build step

All JS/CSS ship unminified directly from source. For a project this size (largest file `disney.js` at 56 KB raw) this is a minor win compared to #1, but a simple `esbuild`/`terser` pass before deploy (or a Vercel build step) would shave parse/transfer size for `disney.js`, `app.js`, `data.js`, `styles.css`, `disney.css` essentially for free, with no source changes required.

## Suggested order of execution

1. Rasterize the 5 remaining oversized SVGs → biggest, lowest-risk win (item 1).
2. Trim `package.json` (item 3) — trivial.
3. Audit/trim font weights (item 5) — trivial, needs a quick grep of used weights.
4. Add new raster assets to SW precache (item 2) — trivial, depends on item 1.
5. Evaluate modular Firebase SDK migration (item 4) — only if profiling still shows Firebase as a load-time bottleneck after 1-3.
6. Add a minify build step (item 6) — nice-to-have, do last since it touches deploy config.

## Verification

For each step: run Lighthouse (mobile, throttled) on `disney.html` before/after, and manually check scroll smoothness on the land scenes for the assets converted in step 1 — that's the regression this plan is most directly fixing.
