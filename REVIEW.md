# Calitinerary Performance Review
*July 1, 2026 · calitinerary26.vercel.app*

---

## Verdict

This is a genuinely impressive piece of work. Not "impressive for a custom family site" — impressive by any standard. The encryption architecture, the per-day theming system, the Disney Quest module: these are deliberate, well-executed engineering decisions, not accidents. The site is also honest about what it is — it doesn't try to be an app when it's really a static site. It knows its constraints and works within them.

That said, there are three gaps that will cause real pain during the trip, and one of them (offline support) needs to be fixed before July 16. The rest of this review is about those gaps, what to do about them, and where the site's design instincts are right even when execution is incomplete.

---

## What the Site Does Exceptionally Well

**The encryption architecture is exactly right.** Storing booking data in plaintext on a public Vercel URL would be the obvious approach; AES-GCM + PBKDF2 is not. The elegance of the implementation is in its layering: `config.js` exposes only the trip title and dates (the countdown works before unlock), while `data.enc.js` holds everything sensitive and only yields it to the correct passcode. The auto-unlock via `localStorage` means family members enter the passcode once, and the `"Lock this device"` button gives someone an explicit opt-out if they want it. The `tryDecrypt` function catching exceptions silently and returning null on failure rather than throwing is a small but real UX improvement — wrong passcode gets a shake animation, not a crash.

**The per-day theming system is the clearest expression of design intent in the project.** Five color palettes (anaheim/blue, pismo/yellow, bigsur/orange, yosemite/green, sf/red) applied via `data-theme` attribute on body, with the `theme-color` meta tag updating on every navigation so the iOS status bar and browser chrome match the current day. Most itinerary tools treat all days identically. This one makes arriving at Yosemite feel visually different from arriving at Disneyland, which is appropriate — they are different. The gradient hero cards and the drive route bar (that dot—dashed line—dot layout with the duration pill) are both smart: they communicate meaning without requiring you to read anything.

**The weather integration is low-cost and well-scoped.** Open-Meteo requires no API key, returns null cleanly when a forecast doesn't exist yet (the trip is still two weeks away), and caches in `sessionStorage` so you're not hitting the API on every navigation. The whole module is 95 lines. It doesn't try to do more than it needs to: one chip, high/low temp, a WMO weather code label. The `weather.js` module is probably the best-written standalone file in the project — clean boundary, single responsibility, graceful degradation.

**The navigation ergonomics are fully thought through.** Swipe left/right on mobile, keyboard arrow keys on desktop, bottom bar prev/next, the "Back to Today" floating pill, and `#day-N` deep links for sharing a specific day. The `visibilitychange` handler that refreshes the TODAY badge if you leave the tab open overnight is a detail almost no one would implement, but it's exactly right — someone will leave this open and wake up to a new travel day, and the TODAY badge should update without a reload.

**`data.js` is an unusually good authoring experience** for a personal project. The comments are written for a non-developer, the two-format schedule bullets (`"plain text"` vs. `{ time, text }`) are flexible without being confusing, and the inline documentation for themes, coords, and drives anticipates the questions someone would actually ask while editing. This file is the trip's source of truth and it reads like one.

---

## Critical Gaps for the Actual Trip

**The main itinerary app had no offline support.** This was the most serious problem in the project. The service worker (`sw.js`) cached Disney assets but not the main app — `index.html`, `app.js`, `styles.css`, `data.enc.js`, `config.js`, `weather.js`. Yosemite Valley has genuinely poor cell service (AT&T and Verizon get 0–1 bars at Half Dome trailhead). Big Sur's Hwy 1 corridor is worse. Without offline caching, a family member opening the app in a dead zone would see a "this site can't be reached" error. **Fixed in this deploy** — cache bumped to `parkday-v5`, main app files added to `CORE`.

**The Big Sur day had no driving-mode affordance.** Day 6 is a 148-mile drive with 12 distinct stops, specific suggested arrival times, and at least five decisions about which hike to do. The schedule section rendered this as a flat list of 11 items. When the family is in the car at 10:15 AM and they've finished McWay Falls, there was no quick way to see which stop is next and how long until the Nepenthe reservation window starts. **Fixed in this deploy** — the drive route bar is now a tappable anchor that opens Google Maps directions for the day's A-to-B route.

**The schedule has no "right now" indicator.** On an active hiking day, nothing tells you which schedule item is current. At 9:50 AM on Day 8, you want to see the schedule open to "Mist Trail to Vernal Falls" highlighted, not scan from the top. The fix: on the current day, walk the schedule items with parsed times, find the most recent past item, and apply an `is-now` class. An hour of work. Would be most valuable on Days 6, 8, and 9.

**The Disney party names in `disney-data.js` are placeholders.** `meta.party` currently reads `["Nolan", "Friend 2", "Friend 3", "Friend 4", "Matthew", "Isaac"]`. Set the real names before the July 17 deploy — the in-app party editor can fix this at runtime, but someone has to find the settings panel first.

---

## Compared to Similar Experiences

The reference points that matter here are Wanderlog, TripIt, Roadtrippers, and the family group chat — the real competition for how families actually navigate a multi-day road trip.

Wanderlog's strength is the map view. Every stop plots on a route, you can see geographic clustering, and it generates a day-by-day driving plan visually. For Day 6, that would be genuinely useful: a map showing Piedras Blancas → McWay Falls → Partington Cove → Nepenthe → Pfeiffer Beach → Bixby Bridge → Garrapata, ordered north, with drive times between each. Calitinerary's drive route bar is elegant but it only shows A→B, not the multi-stop journey. That said, Wanderlog doesn't know your family's specific stops, your specific reservation times, or the Garrapata sunset constraint — it's generic mapping, not personalized advice.

TripIt's value is reservation parsing and flight alerts. Calitinerary's confirmations section (the collapsible details with copy buttons) is the right design for quick reference at check-in, but it's passive — you look it up when you need it. There's no proactive alert if Hwy 1 closes the night before Day 6, no reminder that Passionfish reservations need to be moved if you're running 90 minutes behind.

Roadtrippers is the closest category match — explicitly built for the driving itinerary format. But it's generic, and its "trip suggestions" are algorithmically generated without the local knowledge embedded in this site's tips (the Garrapata sunset timing, the Pfeiffer Beach parking buffer, the Oceano Dunes "call the night before" advice). The personalization in Calitinerary's content is better than anything Roadtrippers would produce.

The family group chat is the most instructive comparison, because it's what people fall back to when the itinerary app doesn't answer the question they have. "Where is everyone?" "Are we doing Partington Cove?" "What's the Passionfish reservation time?" None of those questions are answerable from Calitinerary — they require coordination. The Disney Quest module solves this for July 17 via Firebase. The other 10 days have nothing. The family will manage via text, which is fine, but it's worth noting that the most practically useful feature upgrade for Days 3–11 would be something as simple as a shared note — just the group chat lifted slightly.

---

## Concrete Recommendations

**Done in this deploy:** Offline caching for the main app (sw.js CORE expanded to `parkday-v5`), tappable drive route bar linking to Google Maps (app.js + styles.css).

**Before July 16, must-do:** Set real Disney party names in `disney-data.js`. One line. Don't leave this to the in-app editor on the morning of.

**Before July 16, high-value if time allows:** Add a "you are here" indicator to the timeline on the current day. After `render()`, if `isToday(day)` is true, walk the schedule items with parsed times, find the most recent past item, and add `class="is-now"` to it. Add a left-border or accent-dot style for `.is-now` in `styles.css`. Nobody will notice it on rest days; on Days 6, 8, and 9, it will be the most-glanced-at element on the screen.

**Nice to have, not time-critical:** A packing checklist (used before the trip, never during), a "✓ Done" button on location cards for Day 6 (local state, no Firebase needed), a one-line shared note per day visible to all family members.

---

## The Disney Quest Module

This is the most polished piece in the project and it earns that status.

The living sky that tracks real time of day — dawn at 8 AM, golden hour as you approach the park hop, night at World of Color — is not a gimmick. It grounds the scroll-through experience in the actual shape of the day. When you're at the `woc-position` scene and the sky is already dusk-colored, you feel the urgency of the evening timeline. That's doing narrative work, not just visual work.

The Firebase Realtime Database choice for stamp sync is correct. A family of six will be on different rides at the same time, and anyone should be able to stamp for anyone else. The local-first fallback (`loadLocal()`, `saveLocal()`) means stamps persist to localStorage immediately and sync when connectivity allows — exactly the right architecture for a crowded theme park where cell towers are overloaded. The distinction between `ROOM_REAL` and `ROOM_TEST` rooms shows real engineering hygiene.

The testing panel — time scrubber from 480 to 1440 minutes, playback at 60x and 600x, jump buttons for Rope Drop / VQ 11:58 / Park Hop / WoC / Night — is the kind of thing that separates careful from careless. You can simulate the full day in five minutes and verify that the VQ alarm fires at 11:58, that the sky transitions correctly, that the passport summary shows at the right moment.

The VQ notification system for World of Color is solving the right problem. The noon hard deadline is a real trip-failure mode — miss the Virtual Queue and six people don't see World of Color. A full-screen wash overlay plus a push notification is appropriate severity.

**What to watch for:**

Firebase security: `database.rules.json` sets open read/write on the `disney2026` path. Anyone who finds the Firebase project URL can read or write the quest state. The data model isn't sensitive, but someone could clear all the stamps for the day. Acceptable trade-off for a one-day family event, but worth knowing the exposure.

iOS push notifications for the VQ alert: Safari on iOS requires explicit permission grant, and the prompt shows without context unless you pre-explain it. Before July 17, verify that each family member's phone has notifications enabled for the site. If push permission gets denied, the VQ alarm only shows as the in-app overlay — invisible if the phone is locked.

The placeholder party names ("Friend 2", "Friend 3", "Friend 4") will show in stamp badges until corrected. The in-app party editor can fix this at runtime but the correct path is to set real names in `disney-data.js` before the final deploy.

---

## One Thing to Cut

The fun fact cards. Every day has one: a trivia question and a Wikipedia link. "Why is Pismo Beach nicknamed the 'Clam Capital of the World'?" "How long did it take to build the Bixby Creek Bridge in 1932?"

These feel like editorial charm at design time and become dead weight in the field. Standing at Bixby Bridge, nobody in the family is going to tap that card and read a Wikipedia article about 1932 bridge construction. At Pismo pier at sunset, nobody is looking up clam trivia. These are museum-caption impulses applied to a real-time travel tool — a category error about when reading happens. The Wikipedia links also won't work offline, which is a specific problem on Days 6, 8, and 9.

More importantly: the visual slot those cards occupy could be empty (cleaner) or could carry a more useful day-specific affordance. The tips cards are already doing the job of "useful information you should read today." The fun facts duplicate that purpose badly.

Cut all 11. The days will be no worse, and the card layout will breathe a little more.

---

*Reviewed against commit state as of July 1, 2026. Based on source reading of `app.js`, `data.js`, `styles.css`, `sw.js`, `weather.js`, `disney.js`, `disney-data.js`, `disney.css`, `config.js`, `database.rules.json`, and `PERFORMANCE_PLAN.md`. Fixes for offline support and tappable route bar deployed in the same pass.*
