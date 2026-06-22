/* ============================================================================
   DISNEY "QUEST" — content model
   ----------------------------------------------------------------------------
   This drives the standalone interactive park-day guide (disney.html).
   It is NOT encrypted: nothing here is sensitive (it's the public itinerary).

   Source of truth: ~/Downloads/disneyland-day-guide.md

   Shape:
     window.DISNEY_DAY = {
       meta:  { ... title / parks / hours },
       zones: { zoneKey: { base, accent, label } },     // gradient palette
       blocks: [ {                                       // ordered top→bottom
         id, zone, time, startMin, title, subtitle?,
         alert?:bool, deadline?:{ atMin, label, fire },
         notes?: [ ... ],
         quests: [ { id, label, type, note?, star?, optional? } ]
       } ]
     }

   Quest `id`s are STABLE — they are the Firebase keys. Renaming a label is
   safe; changing an `id` resets that quest's checked state across devices.

   type:  ride | food | show | move | action | deadline
   ========================================================================== */

window.DISNEY_DAY = {
  meta: {
    title: "Disneyland Park Hopper",
    subtitle: "July 2026 · Group of 4 · all LLMP",
    parks: "Disneyland + Disney California Adventure",
    hours: "DL 8 AM–Midnight · DCA 8 AM–10 PM",
    dayStartMin: 480,   // 8:00 AM — top of the timeline
    dayEndMin: 1440,    // midnight — bottom of the timeline

    /* v2 scenic layer — keyed by block id (kept here so blocks stay tidy).
       sky:      time-of-day phase that paints the living background
       landmark: the park-area prop (SVG) that scrolls past behind that block.
                 Files live in assets/disney/<name>.svg — placeholders ship now,
                 Nolan's illustrations drop in over the same filenames. */
    sky: {
      "rope-drop": "dawn", "morning-sweep": "morning", "new-orleans": "midday",
      "woc-vq": "midday", "lunch": "midday", "galaxys-edge": "midday",
      "hop-dca": "golden", "dca-sweep": "golden", "dinner": "golden",
      "wind-down": "dusk", "woc-position": "dusk", "world-of-color": "night",
      "hop-back": "night", "night-session": "night",
    },
    landmarks: {
      "rope-drop": "castle", "morning-sweep": "matterhorn", "new-orleans": "haunted-mansion",
      "woc-vq": "pirates", "lunch": "pirates", "galaxys-edge": "galaxys-edge",
      "hop-dca": "cars-land", "dca-sweep": "cars-land", "dinner": "pixar-pier",
      "wind-down": "avengers", "woc-position": "world-of-color", "world-of-color": "world-of-color",
      "hop-back": "castle", "night-session": "fireworks",
    },
  },

  /* Master palette. Each block's background flows from its zone base into the
     NEXT block's zone base, so the whole page reads as one continuous gradient
     moving through the day. `accent` colors the headers, icons and glow. */
  zones: {
    ropedrop: { base: "#1b1438", accent: "#c67a5e", label: "Rope Drop" },
    morning:  { base: "#3a2a1f", accent: "#d4943f", label: "Morning" },
    nos:      { base: "#14241c", accent: "#8a6cc0", label: "New Orleans Sq" },
    batuu:    { base: "#0e1a24", accent: "#2f9fb0", label: "Galaxy's Edge" },
    hop:      { base: "#16161f", accent: "#9a8cff", label: "Park Hop" },
    carsland: { base: "#2b1410", accent: "#e0612f", label: "DCA Afternoon" },
    dinner:   { base: "#2a1d10", accent: "#e0a13f", label: "Dinner" },
    twilight: { base: "#16182e", accent: "#6a6ad6", label: "Twilight" },
    woc:      { base: "#0a1426", accent: "#34c0e0", label: "World of Color" },
    night:    { base: "#120a24", accent: "#9a4bef", label: "Night Session" },
  },

  // used for the alert/deadline treatment (pulsing magenta)
  alertAccent: "#ff3b6b",

  blocks: [
    {
      id: "rope-drop",
      zone: "ropedrop",
      time: "8:00 AM",
      startMin: 480,
      title: "Rope Drop — Disneyland",
      subtitle: "The first 90 minutes decide the whole day.",
      notes: [
        "The instant the CM scans you in, open the app and book the NEXT Lightning Lane. Not after the ride — the moment you tap in.",
      ],
      quests: [
        { id: "book-sm-ll", type: "action", star: true,
          label: "Tap in → book Space Mountain LL",
          note: "Highest LL demand, burns out first. Do it before you move." },
        { id: "indiana-jones-am", type: "ride", star: true,
          label: "Run Indiana Jones (standby)",
          note: "Rope-drop standby is 15–25 min. By 10 AM it's 75+. Scan in → book Matterhorn LL." },
      ],
    },
    {
      id: "morning-sweep",
      zone: "morning",
      time: "8:30–11:30 AM",
      startMin: 510,
      title: "DL Morning Sweep",
      subtitle: "Adventureland → Tomorrowland. Keep the LL chain alive.",
      notes: [
        "Every scan-in triggers the next booking. Skip Main Street. Don't slow down.",
      ],
      quests: [
        { id: "space-mountain", type: "ride", label: "Space Mountain (LL)",
          note: "Redeem → scan in → book your next LL immediately." },
        { id: "matterhorn", type: "ride", label: "Matterhorn (LL)",
          note: "Redeem → scan in → book your next LL immediately." },
      ],
    },
    {
      id: "new-orleans",
      zone: "nos",
      time: "11:30 AM–12:30 PM",
      startMin: 690,
      title: "New Orleans Square",
      subtitle: "Walt's corner of the park. Two back-to-back classics.",
      quests: [
        { id: "haunted-mansion-day", type: "ride", star: true,
          label: "Haunted Mansion — Daytime (Ride #1)",
          note: "Catch the queue detail by day. Save ride #2 for tonight." },
        { id: "pirates-day", type: "ride", star: true,
          label: "Pirates of the Caribbean (#1)",
          note: "Natural back-to-back in NOS. You'll ride it again tonight." },
      ],
    },
    {
      id: "woc-vq",
      zone: "nos",
      time: "11:58 AM",
      startMin: 718,
      title: "World of Color — Virtual Queue",
      subtitle: "Hard deadline. Do not miss it.",
      alert: true,
      deadline: {
        atMin: 720, // VQ opens exactly at noon
        label: "VQ opens at noon",
        fire: "🎆 World of Color VQ is OPEN — book NOW. All 4 tickets in the app. Target the 2nd show.",
      },
      notes: [
        "All 4 tickets must be linked BEFORE noon. One person books for everyone.",
        "Target the SECOND show — less crowded, better for your timeline.",
        "Missed it? Ask a CM at Paradise Gardens Park about standby for the 2nd show.",
      ],
      quests: [
        { id: "book-woc-vq", type: "deadline", star: true,
          label: "Book the World of Color VQ (2nd show)" },
      ],
    },
    {
      id: "lunch",
      zone: "nos",
      time: "12:30–1:15 PM",
      startMin: 750,
      title: "Lunch — Cafe Orleans",
      subtitle: "You're already in NOS. Zero walking.",
      quests: [
        { id: "lunch-cafe-orleans", type: "food",
          label: "Cafe Orleans — Monte Cristo",
          note: "Mobile order ahead if available." },
      ],
    },
    {
      id: "galaxys-edge",
      zone: "batuu",
      time: "1:15–2:30 PM",
      startMin: 795,
      title: "Galaxy's Edge",
      subtitle: "Batuu earns the walk even beyond the ride.",
      quests: [
        { id: "smugglers-run", type: "ride", star: true,
          label: "Millennium Falcon: Smugglers Run (LL)",
          note: "Highest-demand DL LL this summer. Pilot is the best seat. Natural DL exit after this." },
      ],
    },
    {
      id: "hop-dca",
      zone: "hop",
      time: "~2:30 PM",
      startMin: 870,
      title: "Hop to DCA",
      subtitle: "60-second walk across the esplanade. No wait.",
      quests: [
        { id: "hop-to-dca", type: "move", label: "Cross to California Adventure",
          note: "The 11 AM hopping restriction was removed June 9, 2026. Hop anytime." },
      ],
    },
    {
      id: "dca-sweep",
      zone: "carsland",
      time: "2:30–6:00 PM",
      startMin: 885,
      title: "DCA Afternoon Sweep",
      subtitle: "Keep chaining LLs. Scan in → book next.",
      quests: [
        { id: "radiator-springs", type: "ride", star: true,
          label: "Radiator Springs Racers (LL)",
          note: "Priority #1 — waits hit 90+ min on summer afternoons." },
        { id: "guardians", type: "ride", label: "Guardians: Mission Breakout",
          note: "High energy, great for a group." },
        { id: "web-slingers", type: "ride", label: "Web-Slingers: Spider-Man",
          note: "Competitive scoring, lower intensity." },
        { id: "incredicoaster", type: "ride", label: "Incredicoaster",
          note: "Speed + bay views — good coaster-block closer." },
        { id: "soarin", type: "ride", optional: true,
          label: "Soarin' Across America (LL)",
          note: "New July 2, 2026. Top-3 wait — LL it, or skip if time is tight." },
      ],
    },
    {
      id: "dinner",
      zone: "dinner",
      time: "~6:00–7:00 PM",
      startMin: 1080,
      title: "Dinner — DCA",
      subtitle: "Easiest move: grab from Pacific Wharf, eat near the water.",
      quests: [
        { id: "dinner-dca", type: "food", label: "Dinner near the WoC side",
          note: "Pacific Wharf (no res) · Carthay Circle (upscale) · Flo's V8 (Cars Land)." },
      ],
    },
    {
      id: "wind-down",
      zone: "twilight",
      time: "7:30–8:15 PM",
      startMin: 1170,
      title: "Fill-In / Wind Down",
      subtitle: "Low-key. Conserve energy for the night session.",
      quests: [
        { id: "dca-fill-in", type: "ride", optional: true,
          label: "Any short-wait rides left",
          note: "Whatever's walk-on. Don't burn out before the night half." },
      ],
    },
    {
      id: "woc-position",
      zone: "twilight",
      time: "~8:20 PM",
      startMin: 1220,
      title: "Position for World of Color",
      subtitle: "Stage toward the Buena Vista St / exit side.",
      notes: [
        "DCA mass-exits at closing right after WoC. Stand near Buena Vista St for a clean exit — not deep in the splash zone.",
        "With a VQ spot you can enter your section up to 45 min before showtime. Bring a light layer — the mist is real.",
      ],
      quests: [
        { id: "position-woc", type: "action", star: true,
          label: "Get in position (exit side)" },
      ],
    },
    {
      id: "world-of-color",
      zone: "woc",
      time: "~9:00 PM",
      startMin: 1260,
      title: "World of Color — Happiness!",
      subtitle: "~30 min. Joy hosts · Muppets pre-show · nostalgia throughout.",
      quests: [
        { id: "world-of-color", type: "show", star: true,
          label: "World of Color Happiness!",
          note: "Second show. Confirm exact showtime in the app the morning of." },
      ],
    },
    {
      id: "hop-back",
      zone: "night",
      time: "~9:35 PM",
      startMin: 1295,
      title: "Hop Back to Disneyland",
      subtitle: "60-second walk. DL closes midnight — you have 2+ hours.",
      quests: [
        { id: "hop-to-dl", type: "move", label: "Cross back to Disneyland",
          note: "The esplanade clears fast after the show. Just walk." },
      ],
    },
    {
      id: "night-session",
      zone: "night",
      time: "9:45 PM–Midnight",
      startMin: 1305,
      title: "DL Night Session",
      subtitle: "This is why you came back. A totally different park after dark.",
      quests: [
        { id: "haunted-mansion-night", type: "ride", star: true,
          label: "Haunted Mansion — Nighttime (Ride #2)",
          note: "Late-night standby 15–25 min. More theatrical, more disorienting in the dark. The one." },
        { id: "pirates-night", type: "ride", star: true,
          label: "Pirates of the Caribbean (#2)",
          note: "Short standby late at night. Walt's masterpiece deserves two visits." },
        { id: "big-thunder", type: "ride", optional: true,
          label: "Big Thunder Mountain",
          note: "Goes hardest at night." },
        { id: "indiana-jones-night", type: "ride", optional: true,
          label: "Indiana Jones — replay",
          note: "If standby is short." },
        { id: "fireworks", type: "show", optional: true,
          label: "Wondrous Journeys fireworks",
          note: "If running — watch from the hub. 70th Anniversary, through Aug 2026." },
        { id: "main-street-night", type: "action", optional: true,
          label: "Main Street at 11 PM",
          note: "Gas-lamp glow, thinning crowds. A different energy than any other time." },
      ],
    },
  ],
};
