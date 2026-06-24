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

## 2. Service worker precache list vs. asset weight — ✅ done

`sw.js` precached `disney.html`, `disney.css`, `disney.js`, etc. but not the land art. Now that fix #1 made those WebPs small (340 KB-875 KB each, ~3.3 MB total), added all six to `CORE` (with the same `?v=1` query the runtime fetch uses, so cache keys match) so the park map is fully offline-capable after first visit — worthwhile for a PWA meant to be used inside the park where cell service is spotty.

## 3. `package.json` ships `vercel` as a runtime dependency — ✅ done

Moved `vercel` from `dependencies` to `devDependencies` and regenerated `package-lock.json` (`npm install --package-lock-only`) so the ~390 transitive packages it pulls in are correctly flagged `"dev": true` and won't install in a production-only install.

Side finding, not acted on: the `firebase` npm package also isn't imported anywhere — `disney.html` loads Firebase via the CDN compat `<script>` tags, not the npm package. It may be intentionally kept for tooling not visible in this repo; flagging rather than removing since that wasn't part of this plan and removing a dependency blind is riskier than leaving an unused one.

## 4. Firebase: compat bundle + `document.write` injection — deferred

`disney.html` loads `firebase-app-compat.js` + `firebase-database-compat.js` via `document.write` (parser-blocking, and only after a synchronous IIFE check runs). The compat bundles are notably larger than the modular v9+ SDK. Switching `disney.js`'s Firebase calls to the modular API (`import { initializeApp } from "firebase/app"`, `import { getDatabase, ref, onValue } from "firebase/database"`) and loading via a regular `<script type="module">`/CDN ESM URL would cut the Firebase payload substantially and remove the `document.write` parser-blocking pattern.

**Not done in this pass**: this touches every `firebase.*` call site in `disney.js` (real-time party/quest sync), and there is no headless browser available in this environment to verify sync still works after the rewrite. Recommend doing this with the ability to actually run the app and test multi-device sync, not blind.

## 5. Google Fonts: weights loaded but not all used — ✅ done

Audited actual `font-weight` usage against each requested family:
- `index.html`: Syne was requested at 400/500/600/700/800 but every Syne rule in `styles.css` uses only 600/700/800 — 400 and 500 were dead weight. Trimmed to `wght@600;700;800`. Outfit's 400/600/700/800 all confirmed in use (400 is the implicit body-text weight).
- `disney.html`: Cinzel Decorative's 700/900 are both used — no change. Righteous has only one weight — no change. Lobster Two was requested with an italic variant (`1,700`) that's never used anywhere (`font-style: italic` doesn't appear in `disney.css`) — dropped. Nunito was requested at 400/600/700/800 but 600 is never used (only 400 implicit, 700, 800 — the only `font-weight: 900` rules in the file are Cinzel Decorative, not Nunito) — dropped 600.

Result: 9→7 font weight files for `index.html`, 9→8 for `disney.html`.

## 6. No minification/build step — deferred

All JS/CSS ship unminified directly from source. Adding this means introducing an actual build step (`esbuild`/`terser` + a `vercel.json` build command or framework config) in a project that currently deploys as zero-config static files.

**Not done in this pass**: changing the deploy pipeline isn't verifiable without an actual deploy, and there's no way to test a broken `vercel.json`/build command from this environment. Given it's the lowest-impact item on this list (largest file is 56 KB raw), recommend doing this as its own change with a real deploy/preview to confirm before merging.

## Suggested order of execution

1. ~~Rasterize the 5 remaining oversized SVGs~~ — done.
2. ~~Trim `package.json`~~ — done.
3. ~~Audit/trim font weights~~ — done.
4. ~~Add new raster assets to SW precache~~ — done.
5. Evaluate modular Firebase SDK migration — deferred, needs a real browser to verify sync.
6. Add a minify build step — deferred, needs a real deploy to verify.

## Verification

For each step: run Lighthouse (mobile, throttled) on `disney.html` before/after, and manually check scroll smoothness on the land scenes for the assets converted in step 1 — that's the regression this plan is most directly fixing.
