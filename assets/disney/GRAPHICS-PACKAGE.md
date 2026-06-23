# A Park Day — Graphics Package

Everything you can illustrate to upgrade the Disneyland guide. The site already runs on
flat placeholder SVGs; you replace them **file-for-file** (same names) and it just works.

---

## 0. How the art is used (read first)

- Each **land = a full-screen scene**. The land's **foreground prop** (one SVG) stands on the
  ground and **fills the screen**: as you scroll it rises and grows gently, then **exits**
  off-screen (left / right / up / fade) so there are never hard edges.
- **Sizing is automatic and aspect-aware.** The prop is bottom-anchored and *contained* into a
  box that's ~**94% of screen height** tall and up to ~**150vw** wide (`preserveAspectRatio`
  is forced to `xMidYMax meet` in code). Practical consequence:
  - **Draw the art to FILL its viewBox.** Empty margins = a smaller-looking prop.
  - **Portrait / squarish viewBoxes cover the most** (they're limited by height → full-tall).
    A very **wide** viewBox sits **shorter** (it's limited by width). So: tall things (castle,
    mountain, mansion) → tall viewBox; wide vistas (esplanade, a skyline) → wide viewBox, and
    expect them to occupy the lower part of the screen.
- There's already a **procedural distant horizon** behind every prop, tinted to the land — so a
  separate `-bg` file is **not** required. One foreground file per land is all the engine loads
  (filenames are listed below; replace **file-for-file**, same name).
- The code fades the **bottom ~22%** of the prop to transparent (a mask), so you don't need to
  feather the bottom — just don't put important detail in the lowest 22%.
- A few scenes layer **two props** (see Morning Sweep) or use the **bespoke Main Street walk**
  (see §4) — those are wired in code; the table tells you which files feed them.

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
  number: in `disney.html` change the `?v=N` on the css/js/data tags (currently `?v=11`) to the
  next number, and bump the matching `.svg?v=N` in `disney.js`'s `loadBackdrops` so the new art
  isn't served from cache.

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

**Guests** (badge/pip colors): `g1 #ffb43d` · `g2 #ff6f9c` · `g3 #5ec8e0` · `g4 #8ad17a` · `g5 #b48cff` · `g6 #ff7a59`
**Stamp inks** (by type): ride `#2f8f63` · food `#b9542f` · show `#7a4fb0` · move `#3a6ea5`
· lightning-lane(action) `#c79a2e` · virtual-queue(deadline) `#c0344f`

## 3. Land art — per scene

One file per land (exact name in **file**). The **viewBox** column is the current placeholder's
box and the recommended proportion — keep roughly that shape so the auto-sizing fills the screen
(see §0: tall box → tall on screen, wide box → wide/short). **exit** = the direction the prop
leaves the screen as you scroll out of the land. Fill the box; the bottom ~22% fades.

| Land | file | viewBox | exit | suggested `anim-` groups |
|---|---|---|---|---|
| Rope Drop (castle) | `castle.svg` | 800×1000 | left | `anim-flag`, `anim-twinkle`, `anim-glow` |
| Morning Sweep ① | `space-mountain.svg` | 800×600 | up (lifts off ~40%) | `anim-star`, `anim-glow` (+ orbit, §5) |
| Morning Sweep ② | `matterhorn.svg` | 700×800 | left | `anim-snow`, `anim-twinkle` |
| New Orleans Sq | `haunted-mansion.svg` | 700×800 | left | `anim-ghost`, `anim-window` |
| WoC Virtual Queue | `nos-lantern.svg` | 700×800 | fade | `anim-glow` |
| Lunch (Cafe Orleans) | `cafe-orleans.svg` | 800×600 | right | `anim-lantern` |
| Galaxy's Edge | `galaxys-edge.svg` | 820×760 | left | `anim-lights`, `anim-steam`, `anim-glow` (+ orbit) |
| Hop to DCA | `esplanade.svg` | 820×680 | up | `anim-flag`, `anim-glow` |
| DCA Afternoon (Cars) | `cars-land.svg` | 900×600 | right | `anim-neon`, `anim-car` |
| Dinner (Pixar Pier) | `pixar-pier.svg` | 800×700 | left | `anim-wheel`, `anim-coaster` |
| Wind-Down (Avengers) | `avengers.svg` | 700×800 | right | `anim-window`, `anim-beam` (+ orbit) |
| Position (Paradise Bay) | `paradise-bay.svg` | 900×600 | fade | `anim-water`, `anim-fountain` |
| World of Color | `world-of-color.svg` | 900×600 | up | `anim-fountain`, `anim-color` |
| Hop Back (night castle) | reuses `castle.svg` | — | left | — |
| Night Session | `fireworks.svg` | 600×600 | fade | `anim-burst` |

> **The castle (`castle.svg`) is the day's signature reveal.** It is *not* shown in the overture
> anymore — you scroll down and first see it at **Rope Drop**, then it returns at night for the
> **Hop Back**. Same file both times (day vs. night is just the sky), so keep it readable on a
> dark sky too.

> **Morning Sweep is a two-prop scene:** Space Mountain holds for the first ~40% then lifts
> straight up (rocket exit); the **Matterhorn** rises in behind it and carries the rest of the
> scene. Both are normal files — the sequencing lives in `disney-data.js` (`meta.landmark2` +
> `meta.leave`). To add a second prop to another land, copy that pattern.
>
> **No `-bg`/`-fg` split anymore.** The distant horizon is procedural; just deliver the one
> named file per land. Want a real painted distant layer instead of the procedural one? Ping me
> and I'll add a `-bg` slot back (it's a small loader change).

## 4. The overture (opening logo)

The opening is just a **Disneyland logo** centered over the dawn sky with the "A Park Day"
title and the Main Street tunnel quote. As you scroll, the logo lifts and fades and you descend
into **Rope Drop**, where the castle is revealed for the first time.

| Piece | file | viewBox | how it moves |
|---|---|---|---|
| Logo | `disneyland-logo.svg` | ~560×270 (wide wordmark) | centered ~30% down; breathes up a touch and fades out as you scroll |

- Deliver it **transparent**, centered in the viewBox, sized to read on a light dawn sky (it gets
  a soft drop-shadow in code). It is **not** edge-masked, so it can bleed to the artboard edges.
- The current file is a placeholder wordmark (`Disneyland` + "PLACEHOLDER LOGO"). Replace it
  file-for-file. Convert any text to outlines on export.

> The old Main Street walk (two building rows + a train-station tunnel) was removed — those files
> (`mainstreet-left/right.svg`, `train-station.svg`) are gone. The castle now lives only at Rope
> Drop and the night Hop Back (see §3).

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

## 7b. Party character icons (onboarding picker)

Each party member picks a **character glyph** + a **completion color** on the one-time intro
("Make it yours") and can change it later in **Settings → Edit our party**. The glyph shows in
their badge everywhere (stamp sheet, leaderboard, Our Day cards) and the color is what fills
their progress bars.

These currently ship as **simple placeholder line-glyphs** in the `ICONS` map in `disney.js`
(`CHAR_ICONS` lists which ones the picker offers, in order). Replace them with real character
art the same way as everything else — same icon id, **24×24 viewBox**, line/stroke style to
match the rest of the set (`fill:none; stroke:currentColor`), single color (the badge tints
the background, the glyph inherits a dark ink). Current ids:

- `mickey`, `minnie`, `castle`, `slipper`, `balloon`, `lantern`, `rocket`, `pumpkin`,
  `mermaid`, `sword`, `crown`, `star`.

To add/remove options, edit the `CHAR_ICONS` array (label + id) and add the matching path to
`ICONS`. To change the default swatches, edit `COLOR_CHOICES` / `DEFAULT_COLORS`.

## 8. Priority order

1. `disneyland-logo` — the very first thing guests see (overture).
2. `castle` — the signature reveal at Rope Drop; reappears at night for the Hop Back.
3. The official **Lightning Lane logo** + category icons.
4. The remaining land props (any order; each improves its scene independently).
5. `orbit`, intro splash, marker/sparkle — flair.
