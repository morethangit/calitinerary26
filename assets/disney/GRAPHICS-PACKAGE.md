# A Park Day — Graphics Package

Everything you can illustrate to upgrade the Disneyland guide. The site already runs on
flat placeholder SVGs; you replace them **file-for-file** (same names) and it just works.

---

## 0. How the art is used (read first)

- Each **land = a full-screen scene**. As you scroll a land, its art **parallaxes** (near
  pieces move faster than far pieces), grows, then **exits** off-screen so there are never
  hard edges. That's why each land wants **2–3 layered files**, not one flat picture.
- Layers per land: **`<land>-bg.svg`** (distant), optional **`<land>-mid.svg`**, and
  **`<land>-fg.svg`** (nearest/biggest). If you only make one, name it `<land>-fg.svg`.
  A single flat `<land>.svg` also still works (no parallax) — but layers are the magic.
- The code already fades the **bottom ~22%** of every layer to transparent (a mask), so you
  don't need to feather the bottom — just don't put important detail in the lowest 22%.

## 1. Global rules

- **Format:** SVG. Convert text to outlines. Flat fills (gradients OK, keep them simple).
- **Export (Illustrator):** File → Export → Export As → SVG, **Styling: Presentation
  Attributes**, **Object IDs: Layer Names**, Decimal 2, Minify on. (Object IDs = Layer Names
  is what preserves your `anim-` group names.)
- **Movement:** wrap any part that should move in a **group named `anim-…`** (see each
  asset's suggested groups). The code animates anything whose id starts with `anim-`
  (spin/flicker/sway/ripple/glow). Everything else stays still — fine.
- **Anchoring:** draw each land piece **standing on the bottom edge** of its artboard.
- **Safe zone:** keep key detail within the center 80% horizontally (outer edges may crop on
  narrow phones) and above the bottom 22% (that band fades out).
- **Color:** use the land's accent + the time-of-day sky (swatches below) so pieces sit in
  the scene. Background pieces should be lower-contrast/cooler (they're "far").
- **Drop-in:** put files in `assets/disney/`, keep the exact filename, then bump the cache
  number: in `disney.html` change `?v=7` → `?v=8` (etc.) on the css/js/data tags.

## 2. Color swatches

**Time-of-day sky** (top→bottom gradient per phase — the code interpolates between them):

| Phase | Top | Bottom |
|---|---|---|
| dawn | `#f9c8a0` | `#b58fd6` |
| morning | `#bfe3ff` | `#8ec5ff` |
| midday | `#cdecff` | `#7fb7ff` |
| golden | `#ffd29b` | `#ff7e5a` |
| dusk | `#6f6db0` | `#2b2350` |
| night | `#0b1330` | `#05060f` |

**Land accent** (used for that scene's tint, signs, glow):

| Land | Accent |
|---|---|
| Rope Drop | `#c67a5e` |
| Morning Sweep | `#d4943f` |
| New Orleans Square | `#8a6cc0` |
| Galaxy's Edge | `#2f9fb0` |
| Park Hop | `#9a8cff` |
| DCA Afternoon (Cars) | `#e0612f` |
| Dinner | `#e0a13f` |
| Twilight / Position | `#6a6ad6` |
| World of Color | `#34c0e0` |
| Night Session | `#9a4bef` |

**Guests** (badge/pip colors): `g1 #ffb43d` · `g2 #ff6f9c` · `g3 #5ec8e0` · `g4 #8ad17a`
**Stamp inks** (by type): ride `#2f8f63` · food `#b9542f` · show `#7a4fb0` · move `#3a6ea5`
· lightning-lane(action) `#c79a2e` · virtual-queue(deadline) `#c0344f`

## 3. Land art — per scene

Each row: the land, its **fg artboard** (px), **exit** direction (how it leaves the screen),
and suggested **`anim-` groups**. Make a matching `-bg.svg` (wide + short, e.g. 1200×520,
distant silhouette) for parallax. fg depth = 1.0, bg depth ≈ 0.35 (handled in code).

| Land | fg file | fg viewBox | exit | suggested `anim-` groups |
|---|---|---|---|---|
| Rope Drop (castle) | `castle-fg.svg` | 800×1000 | left | `anim-flag`, `anim-twinkle`, `anim-glow` |
| Morning Sweep | `space-mountain-fg.svg` | 800×600 | right | `anim-star`, `anim-glow` (+ orbit, §5) |
| New Orleans Sq | `haunted-mansion-fg.svg` | 700×800 | left | `anim-ghost`, `anim-window` |
| WoC Virtual Queue | `nos-lantern-fg.svg` | 700×800 | fade | `anim-glow` |
| Lunch (Cafe Orleans) | `cafe-orleans-fg.svg` | 800×600 | right | `anim-lantern` |
| Galaxy's Edge | `galaxys-edge-fg.svg` | 900×600 | left | `anim-lights`, `anim-steam` (+ orbit) |
| Hop to DCA | `esplanade-fg.svg` | 900×500 | up | `anim-glow` |
| DCA Afternoon (Cars) | `cars-land-fg.svg` | 900×600 | right | `anim-neon`, `anim-car` |
| Dinner (Pixar Pier) | `pixar-pier-fg.svg` | 800×700 | left | `anim-wheel`, `anim-coaster` |
| Wind-Down (Avengers) | `avengers-fg.svg` | 700×800 | right | `anim-window`, `anim-beam` (+ orbit) |
| Position (Paradise Bay) | `paradise-bay-fg.svg` | 900×600 | fade | `anim-water`, `anim-fountain` |
| World of Color | `world-of-color-fg.svg` | 900×600 | up | `anim-fountain`, `anim-color` |
| Hop Back (night castle) | reuses `castle` | — | left | — |
| Night Session | `fireworks-fg.svg` | 600×600 | fade | `anim-burst` |

> Note: today these are single files named without `-fg` (e.g. `castle.svg`). When you add a
> `-fg`/`-bg` pair, **also rename or remove the old single file** so it doesn't win. (Tell me
> and I'll flip the loader to prefer layered names — 1-line change.)

## 4. Main Street (the overture)

Three pieces compose the opening "walk in," each its own file & exit:

| Piece | file | viewBox | exit | `anim-` |
|---|---|---|---|---|
| Left building row | `mainstreet-left.svg` | 420×1200 | left | `anim-lamp` |
| Right building row | `mainstreet-right.svg` | 420×1200 | right | `anim-lamp` |
| Train station + tunnel | `train-station.svg` | 900×500 | up | `anim-smoke` |
| Castle (distant focal pt) | `castle.svg` | 800×1000 | left | `anim-flag`, `anim-twinkle` |

## 5. Orbiting decoration (Tomorrowland / Batuu / Avengers)

A small element the viewport passes that **slowly spins**. File: `orbit.svg`, viewBox
240×240, transparent. Keep it roughly centered so it spins from its middle. Used in Morning
Sweep, Galaxy's Edge, Wind-Down. (Currently a procedural ringed planet — replace to taste.)

## 6. Small UI art

| File | viewBox / px | Notes |
|---|---|---|
| `marker.svg` (optional) | 64×64 | "you are here" sparkle/pin; code can also do procedural |
| `sparkle.svg` (optional) | 48×48 | white star for bursts (procedural fallback exists) |
| `app-icon.svg` | 512×512 | PWA / home-screen icon (exists; replace if you want) |
| Intro splash art (optional) | full-bleed | a hero illustration behind "A Park Day" on the one-time intro |

## 7. Iconography (you offered to source these)

Replace the inline line-icons with a consistent set. Deliver as **SVG, 24×24 viewBox,
single color** (drawn so `currentColor` works — no baked fill), so the app can tint them.

- **Official Lightning Lane logo** — for the "Booked" / LL category (`lightning`).
- Category icons: `ride`, `show`, `dining`(food), `move`(walk/transport), `vq`(virtual
  queue), `star`.
- Chrome icons (optional): `map`, `gear`, `bell`, `sound`, `chevron-up`, `chevron-down`,
  `pin`, `close`, `book`, `party`, `info`, `sparkle`, `motion`.

If you give me the files, I'll swap them into the `ICONS` set (they currently live inline in
`disney.js`). For the official LL logo (full color), send it as its own `ll-logo.svg` and
I'll special-case it.

## 8. Priority order

1. `castle` (fg+bg) — it's the first thing guests see and reappears at night.
2. `mainstreet-left` / `mainstreet-right` / `train-station` — the opening sequence.
3. The official **Lightning Lane logo** + category icons.
4. The remaining land `-fg`/`-bg` pairs (any order; each improves its scene independently).
5. `orbit`, intro splash, marker/sparkle — flair.
