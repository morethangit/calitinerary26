# California Road Trip 2026 🌅

A mobile-first, shareable itinerary site for our July 16–26, 2026 family trip.
Before the trip it shows a **countdown** ("Your trip starts in N days!"). During
the trip it opens straight to **today's** schedule. A fixed bottom bar shows the
current day and lets you swipe / tap between days.

## How to edit the trip

**Everything lives in [`data.js`](data.js).** You don't need to touch anything
else. Open it, change the text between the `"quotes"`, and save. The site rebuilds
itself instantly. Full editing instructions are in the comments at the top of that
file, including the link shortcuts:

| Add this to an item | What it does |
|---|---|
| `map: "Splash Cafe Pismo Beach"` | Opens that place in Google Maps |
| `trail: "Mist Trail Yosemite"` | Opens that hike on AllTrails |
| `url: "https://anything.com"` | Opens that exact link |

Each day always has the same sections: **Day → Schedule → Locations → Links →
Tips** (plus a fun fact and collapsible confirmation numbers). Day colors come from
the `theme` field: `anaheim` (blue) · `pismo` (yellow) · `bigsur` (orange) ·
`yosemite` (green) · `sf` (red).

### Editing remotely via Claude
Because the whole trip is one plain data file, you can dispatch Claude with a
message like *"In data.js, move the Cracked Crab dinner from Day 4 to Day 5"* and
it can make the change safely.

## Files

| File | Purpose |
|---|---|
| `data.js` | **The trip content. Edit this.** |
| `index.html` | Page shell |
| `styles.css` | Look & feel (rounded, bright). Color themes live at the bottom. |
| `app.js` | Renders the days, countdown, and navigation. Rarely needs edits. |

## Run it locally

It's a plain static site — no build step. Either open `index.html` directly, or:

```bash
npx serve .        # then open the printed http://localhost:3000
```

Tip: add `#day-8` to the URL to jump straight to a specific day (great for sharing).

## Deploy to Vercel (Hobby / free)

No framework, no build — Vercel serves these files as-is.

**Option A — drag & drop (easiest):**
1. Go to <https://vercel.com/new>.
2. Drag this whole folder into the upload area.
3. Click **Deploy**. You'll get a shareable `https://….vercel.app` link.

**Option B — CLI:**
```bash
npm i -g vercel
cd Calitinerary26
vercel            # first run links/creates the project
vercel --prod     # publish to the public URL
```

When the **Framework Preset** is asked, choose **Other**. Leave Build Command and
Output Directory empty (root is the output). Share the resulting URL with the family.
