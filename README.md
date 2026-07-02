# California Road Trip 2026 🌅

A mobile-first, shareable itinerary site for our July 16–26, 2026 family trip.
Before the trip it shows a **countdown** ("Your trip starts in N days!"). During
the trip it opens straight to **today's** schedule. A fixed bottom bar shows the
current day and lets you swipe / tap between days.

The **entire itinerary is encrypted** and sits behind a **shared family passcode**
(see [Privacy & passcode](#privacy--passcode)).

## Privacy & passcode

The site is public on the web, so anything shipped in plain text could be read by
anyone who opens "View Source." So **the whole trip is encrypted**:

- **Everything is encrypted** — schedule, food, links, tips, *and* confirmation
  numbers. They ship to the web only as ciphertext in `data.enc.js`; without the
  passcode it's unreadable gibberish. The only thing public is the countdown's trip
  name + dates (in `config.js`), which aren't sensitive.
- **A passcode screen** unlocks the itinerary. Enter it once and that device stays
  unlocked forever (the passcode is cached in the browser's `localStorage`) — no
  re-login. There's a small **"🔓 Lock this device"** button at the bottom of each
  day to clear it.

**The current passcode is `california2026`** — a placeholder. Change it before you
share the link:

```bash
node encrypt.mjs YOUR-NEW-PASSCODE   # regenerates data.enc.js + config.js, then redeploy
```

Then share `YOUR-NEW-PASSCODE` with the family (text/WhatsApp, not on the site).

## How to edit the trip

1. Edit **[`data.js`](data.js)** (schedule, food, links, tips) and/or
   **[`secrets.plain.json`](secrets.plain.json)** (confirmation numbers).
2. Re-encrypt so the website picks up the change:
   ```bash
   node encrypt.mjs california2026     # use your real passcode
   ```
3. Redeploy (or just refresh, if testing locally).

> Because the whole site is encrypted, **every** content change needs that one
> `node encrypt.mjs` step — it regenerates `data.enc.js` (encrypted) and `config.js`
> (the public countdown). Full editing notes are in the comments at the top of
> `data.js`.

**Link shortcuts** — add one of these to any location:

| Add this to an item | What it does |
|---|---|
| `map: "Splash Cafe Pismo Beach"` | Opens that place in Google Maps |
| `trail: "Mist Trail Yosemite"` | Opens that hike on AllTrails |
| `url: "https://anything.com"` | Opens that exact link |

**Timed schedule bullets** — each schedule line is either plain text or has a time:

```js
"Walk the pier at sunset"                          // no time label
{ time: "9:00 AM", text: "Rope drop at the park" } // clock time
{ time: "Afternoon", text: "Beach day" }           // general time
```

Each day always has the same sections: **Day → Schedule → Locations → Links →
Tips** (plus collapsible confirmation numbers). Day colors come from
the `theme` field: `anaheim` (blue) · `pismo` (yellow) · `bigsur` (orange) ·
`yosemite` (green) · `sf` (red).

### Editing remotely via Claude
Dispatch Claude with a message like *"In data.js, move the Cracked Crab dinner from
Day 4 to Day 5, then re-encrypt"* and it can make the change and run the encrypt
step for you.

## Files

| File | Purpose | Deployed? |
|---|---|---|
| `data.js` | **The trip content (schedule, food, links, tips). Edit this.** | **no** |
| `secrets.plain.json` | **Confirmation numbers, in plain text. Edit this.** | **no** |
| `encrypt.mjs` | Encrypts the above into `data.enc.js` + `config.js`. | no |
| `data.enc.js` | The whole itinerary, encrypted (auto-generated). | yes |
| `config.js` | Public countdown info: trip name + dates (auto-generated). | yes |
| `index.html` | Page shell | yes |
| `styles.css` | Look & feel (rounded, bright). Color themes at the bottom. | yes |
| `app.js` | Renders days, countdown, passcode, navigation. Rarely edited. | yes |

## Run it locally

It's a plain static site — no build step. Either open `index.html` directly, or:

```bash
npx serve .        # then open the printed http://localhost:3000
```

Tip: add `#day-8` to the URL to jump straight to a specific day (great for sharing).

## Deploy to Vercel (Hobby / free)

No framework, no build — Vercel serves these files as-is.

Run `node encrypt.mjs <passcode>` first so `data.enc.js` / `config.js` are current.

**Option B (CLI) is recommended** because it honors `.vercelignore` and won't
upload your plaintext `data.js` / `secrets.plain.json`:

```bash
npm i -g vercel
cd Calitinerary26
vercel            # first run links/creates the project
vercel --prod     # publish to the public URL
```

**Option A — drag & drop:** Go to <https://vercel.com/new> and drag the folder in.
⚠ Dashboard uploads ignore `.vercelignore`, so **delete `data.js` and
`secrets.plain.json` first** (they're the plaintext source — the site runs on the
encrypted `data.enc.js`) or you'll publish the trip in the clear.

When the **Framework Preset** is asked, choose **Other**. Leave Build Command and
Output Directory empty (root is the output). Share the resulting URL with the family.
