/* ============================================================================
   CALIFORNIA ROAD TRIP — ITINERARY DATA  (the file you edit)
   ============================================================================
   ⚠ THIS FILE IS THE PRIVATE SOURCE. It is NOT deployed to the website.
   After editing, run:   node encrypt.mjs <passcode>
   …which encrypts everything into data.enc.js (the only data the site ships)
   and refreshes config.js (the public countdown info). See README.md.

   HOW TO EDIT (no coding experience needed):
   • Find the day you want to change.
   • Edit the text between the "quotes". Keep the quotes and the commas.
   • To add a bullet, copy an existing line and change the text.
   • Save, then run the encrypt command above.

   SCHEDULE BULLETS — two ways to write each one:
       "Walk the pier at sunset"                        ← no time
       { time: "9:00 AM", text: "Rope drop at the park" } ← clock time
       { time: "Afternoon", text: "Beach day" }           ← general time
   Use whichever you like, mixed freely. No "time" = no time label.

   LINK SHORTCUTS — add ONE of these to any location:
       map:  "Splash Cafe Pismo Beach"   → opens that place in Google Maps
       trail:"Mist Trail Yosemite"        → opens that hike on AllTrails
       url:  "https://anything.com"       → opens that exact web address

   CONFIRMATION NUMBERS live in secrets.plain.json (also private, not deployed).

   THEMES set each day's color:
       anaheim (blue) · pismo (yellow) · bigsur (orange)
       yosemite (green) · sf (red)
   ========================================================================== */

const TRIP = {
  title: "California Road Trip",
  subtitle: "July 16 – 26, 2026 · Family of Five",
  startDate: "2026-07-16",   // used for the "trip starts in N days" countdown
  endDate: "2026-07-26",

  days: [

    /* ===================== DAY 1 ===================== */
    {
      num: 1,
      date: "2026-07-16",
      weekday: "Thursday",
      title: "Travel Day → Anaheim",
      tagline: "Fly into LAX, settle into Anaheim, prep for Disney.",
      theme: "anaheim",
      stay: { name: "Marriott Anaheim", map: "Marriott Anaheim" },
      drive: "LAX → Anaheim (~35 min · Uber or rental car)",

      schedule: [
        "Fly into LAX — collect luggage, grab the rental car or rideshare",
        "Drive or ride to Anaheim — check into the Marriott",
        { time: "Evening", text: "Dinner near the hotel — rest up for rope drop tomorrow" },
        { time: "Tonight", text: "Download the Disneyland app & activate Lightning Lane Multi Pass" },
        { time: "Tonight", text: "Set alarms early — target the park by 8–9am for rope drop" },
      ],

      locations: [
        { icon: "🏨", name: "Marriott Anaheim", note: "Tonight's stay", map: "Marriott Anaheim" },
        { icon: "🍽", name: "GrillSmoke BBQ", note: "Dinner — easy, family-friendly, near hotel", map: "GrillSmoke BBQ Anaheim" },
        { icon: "🎢", name: "Disneyland Resort", note: "Where the magic starts tomorrow", map: "Disneyland Park Anaheim" },
      ],

      links: [
        { label: "Download the Disneyland app", url: "https://disneyland.disney.go.com/mobile-apps/" },
        { label: "Activate Lightning Lane Multi Pass", url: "https://disneyland.disney.go.com/genie/" },
      ],

      tips: [
        "Activate your Lightning Lane Multi Pass in the app tonight so it's ready at rope drop.",
        "Set alarms early — you want to be tapping into the park by 8–9am.",
      ],

      funFact: { q: "When did Disneyland first open its gates?", url: "https://en.wikipedia.org/wiki/Disneyland" },
    },

    /* ===================== DAY 2 ===================== */
    {
      num: 2,
      date: "2026-07-17",
      weekday: "Friday",
      title: "Disneyland + Disney California Adventure",
      tagline: "Rope drop to fireworks — both parks in one big day.",
      theme: "anaheim",
      stay: { name: "Marriott Anaheim", map: "Marriott Anaheim" },
      drive: "Park hours ~8am–midnight (check the app the night before)",

      schedule: [
        { time: "8 AM", text: "Rope drop at Disneyland — book a Lightning Lane the moment you tap in" },
        { time: "Morning", text: "Priority rides: Indiana Jones Adventure (not at WDW!), Matterhorn, Space Mountain" },
        { time: "Mid-morning", text: "Haunted Mansion + Pirates of the Caribbean" },
        { time: "Late morning", text: "Star Wars: Galaxy's Edge before the afternoon crowds hit" },
        { time: "Mid-afternoon", text: "Hop to DCA — Radiator Springs Racers is Priority #1 in the whole park" },
        { time: "Afternoon", text: "DCA: Guardians Mission Breakout, Incredicoaster, Web-Slingers, Soarin'" },
        { time: "Evening", text: "End the night at DCA for World of Color (check the show schedule in the app)" },
      ],

      locations: [
        { icon: "🎢", name: "Disneyland Park", note: "Rope drop here — Indiana Jones, Matterhorn, Pirates", map: "Disneyland Park" },
        { icon: "🎡", name: "Disney California Adventure", note: "Radiator Springs Racers + World of Color", map: "Disney California Adventure Park" },
        { icon: "🍽", name: "Blue Bayou Restaurant", note: "Lunch inside Pirates — reservable & atmospheric", map: "Blue Bayou Restaurant Disneyland" },
        { icon: "🍦", name: "Churros + Dole Whip", note: "Snack — don't skip the classics", map: "Disneyland" },
        { icon: "🍽", name: "Lamplight Lounge", note: "Dinner on the DCA waterfront", map: "Lamplight Lounge Disney California Adventure" },
      ],

      links: [
        { label: "Disneyland app — Lightning Lane & schedules", url: "https://disneyland.disney.go.com/genie/" },
        { label: "World of Color show times", url: "https://disneyland.disney.go.com/entertainment/disney-california-adventure/world-of-color/" },
      ],

      tips: [
        "Tap your Lightning Lane Multi Pass the second you enter — the best return times go fast.",
        "Blue Bayou and World of Color both reward booking ahead in the app.",
      ],

      funFact: { q: "Why is Disneyland's Pirates ride considered Walt's masterpiece?", url: "https://en.wikipedia.org/wiki/Pirates_of_the_Caribbean_(attraction)" },
    },

    /* ===================== DAY 3 ===================== */
    {
      num: 3,
      date: "2026-07-18",
      weekday: "Saturday",
      title: "Drive to Pismo Beach",
      tagline: "Easy coastal cruise north — chowder and a sunset pier.",
      theme: "pismo",
      stay: { name: "VRBO, Pismo Beach", map: "Pismo Beach California" },
      drive: "Anaheim → Pismo Beach via US-101 N (~3 hrs · easy & flat)",

      schedule: [
        { time: "Morning", text: "Check out from the Marriott" },
        "Drive north on US-101 — a straight shot, no major stops needed",
        { time: "Afternoon", text: "Check into the VRBO — drop bags, walk to Pismo State Beach (wide, clean, gorgeous in July)" },
        { time: "Afternoon", text: "Beach time, settle in" },
        { time: "Evening", text: "Walk the Pismo pier at sunset" },
      ],

      locations: [
        { icon: "🏖", name: "Pismo State Beach", note: "Wide, clean sand — your home beach for 3 nights", map: "Pismo State Beach" },
        { icon: "📸", name: "Pismo Beach Pier", note: "Best at sunset", map: "Pismo Beach Pier" },
        { icon: "🍽", name: "Splash Cafe", note: "Dinner — famous clam chowder bread bowl. Go early or expect a line.", map: "Splash Cafe Pismo Beach" },
        { icon: "🏨", name: "VRBO Pismo Beach", note: "Tonight's stay", map: "Pismo Beach California" },
      ],

      links: [],

      tips: [
        "Montaña de Oro State Park is close by if anyone wants a bonus hike.",
        "Splash Cafe gets a line — go early for that bread bowl.",
      ],

      funFact: { q: "Why is Pismo Beach nicknamed the 'Clam Capital of the World'?", url: "https://en.wikipedia.org/wiki/Pismo_Beach,_California" },
    },

    /* ===================== DAY 4 ===================== */
    {
      num: 4,
      date: "2026-07-19",
      weekday: "Sunday",
      title: "Oceano Dunes + Beach Day",
      tagline: "ATVs across the dunes, then a crab feast.",
      theme: "pismo",
      stay: { name: "VRBO, Pismo Beach", map: "Pismo Beach California" },
      drive: "All local — beach and dunes are minutes away",

      schedule: [
        { time: "Morning", text: "Oceano Dunes SVRA — rent ATVs/OHVs and tear across massive sand dunes" },
        { time: "Afternoon", text: "Pismo State Beach — swimming, boogie boards, volleyball" },
        { time: "Early evening", text: "Walk the Pismo Beach pier at sunset" },
      ],

      locations: [
        { icon: "🏜", name: "Oceano Dunes SVRA", note: "Rent ATVs/OHVs and ride the dunes", map: "Oceano Dunes SVRA" },
        { icon: "🏖", name: "Pismo State Beach", note: "Swimming, boogie boards, volleyball", map: "Pismo State Beach" },
        { icon: "🦀", name: "The Cracked Crab", note: "Dinner — a bucket of shellfish dumped on your table. Bib included. Messy & excellent.", map: "The Cracked Crab Pismo Beach" },
      ],

      links: [
        { label: "Oceano Dunes ATV / OHV rentals", url: "https://www.google.com/search?q=Oceano+Dunes+ATV+OHV+rental" },
      ],

      tips: [
        "ATV/OHV rentals fill fast in July — call the night before or book online.",
        "Pack a cooler lunch for the dunes; there's not much out there.",
      ],

      funFact: { q: "Where is the only California state beach you can legally drive on?", url: "https://en.wikipedia.org/wiki/Oceano_Dunes_State_Vehicular_Recreation_Area" },
    },

    /* ===================== DAY 5 ===================== */
    {
      num: 5,
      date: "2026-07-20",
      weekday: "Monday",
      title: "Free Beach Day — Pismo",
      tagline: "No agenda. Sand, surf, and maybe a little wine.",
      theme: "pismo",
      stay: { name: "VRBO, Pismo Beach", map: "Pismo Beach California" },
      drive: "Rest day — no driving required",

      schedule: [
        { time: "All day", text: "Full relaxed beach day — Pismo State Beach, no agenda" },
        { time: "Optional", text: "Edna Valley wine tasting (~15 min inland — beautiful, great for the adults)" },
        { time: "Optional", text: "Kayak or paddleboard rental in Avila Beach (just north of Pismo)" },
        { time: "Tonight", text: "Pack — tomorrow is a long, scenic drive-through day to Monterey" },
      ],

      locations: [
        { icon: "🏖", name: "Pismo State Beach", note: "Full relaxed beach day", map: "Pismo State Beach" },
        { icon: "🍷", name: "Edna Valley wineries", note: "Optional — 15 min inland, gorgeous scenery", map: "Edna Valley wineries San Luis Obispo" },
        { icon: "🛶", name: "Avila Beach", note: "Optional kayak / paddleboard rentals", map: "Avila Beach California" },
        { icon: "🍽", name: "Ember Restaurant", note: "Dinner — upscale wood-fired, a nice sit-down before the drive day", map: "Ember Restaurant Arroyo Grande" },
      ],

      links: [],

      tips: [
        "Pack tonight — tomorrow's Big Sur drive is long with lots of stops.",
        "Ember is popular for a nicer night out — reserve if you want it.",
      ],

      funFact: { q: "Why do thousands of monarch butterflies winter in Pismo Beach?", url: "https://en.wikipedia.org/wiki/Pismo_State_Beach" },
    },

    /* ===================== DAY 6 ===================== */
    {
      num: 6,
      date: "2026-07-21",
      weekday: "Tuesday",
      title: "Big Sur Drive → Monterey",
      tagline: "The most beautiful 130 miles of the whole trip.",
      theme: "bigsur",
      stay: { name: "Embassy Suites Monterey", map: "Embassy Suites Monterey" },
      drive: "Pismo → Monterey via Hwy 1 (~130 mi · budget 4–5 hrs with stops)",

      schedule: [
        { time: "Early", text: "Start early — this is a drive-and-stop day, take your time" },
        { time: "Stop", text: "Elephant Seals at Piedras Blancas (north of Cambria) — hundreds of seals on the beach" },
        { time: "Stop", text: "Bixby Bridge — pull over on the north side for the classic shot" },
        { time: "Stop", text: "McWay Falls (Julia Pfeiffer Burns SP) — turquoise waterfall onto a cove beach, 10-min walk" },
        { time: "Optional", text: "Pfeiffer Falls trail through old-growth redwood canyon (1.4 mi)" },
        { time: "Late afternoon", text: "Arrive Monterey — check into Embassy Suites" },
        { time: "Evening", text: "Walk Cannery Row — the waterfront lights are beautiful at night" },
      ],

      locations: [
        { icon: "🦭", name: "Piedras Blancas Elephant Seals", note: "Pull over 10 min — hundreds of massive seals", map: "Piedras Blancas Elephant Seal Rookery" },
        { icon: "📸", name: "Bixby Creek Bridge", note: "Most photographed bridge in California", map: "Bixby Creek Bridge" },
        { icon: "💧", name: "McWay Falls", note: "Turquoise waterfall onto a cove beach. Surreal.", map: "McWay Falls Julia Pfeiffer Burns State Park" },
        { icon: "🥾", name: "Pfeiffer Falls Trail", note: "Optional 1.4 mi redwood canyon hike", trail: "Pfeiffer Falls Pfeiffer Big Sur" },
        { icon: "🍽", name: "Nepenthe", note: "Lunch — cliffside terrace, 1,000-ft ocean views, the Ambrosia burger", map: "Nepenthe Big Sur" },
        { icon: "🌃", name: "Cannery Row", note: "Evening waterfront stroll", map: "Cannery Row Monterey" },
        { icon: "🍽", name: "Passionfish", note: "Dinner (Pacific Grove) — outstanding sustainable seafood. Reserve ahead.", map: "Passionfish Pacific Grove" },
      ],

      links: [
        { label: "Caltrans QuickMap — check Hwy 1 closures the morning of", url: "https://quickmap.dot.ca.gov/" },
        { label: "Passionfish reservation (OpenTable)", url: "https://www.opentable.com/passionfish" },
      ],

      tips: [
        "Check Caltrans QuickMap the morning of — Hwy 1 can close after slides.",
        "Fuel up before Big Sur; gas is scarce and pricey along the coast.",
        "Cancel the Passionfish reservation if plans change so you're not charged.",
      ],

      funFact: { q: "How long did it take to build the Bixby Creek Bridge in 1932?", url: "https://en.wikipedia.org/wiki/Bixby_Creek_Bridge" },
    },

    /* ===================== DAY 7 ===================== */
    {
      num: 7,
      date: "2026-07-22",
      weekday: "Wednesday",
      title: "Point Lobos Hike → Drive to Yosemite",
      tagline: "One last coastal hike, then up into the Sierra.",
      theme: "yosemite",
      stay: { name: "VRBO, Midpines", map: "6730 Rancheria Creek Rd, Midpines, CA 95345" },
      drive: "Monterey → Midpines via US-101 → CA-140 (~3.5 hrs). Enter at Hwy 140 / Arch Rock — no reservations in 2026.",

      schedule: [
        { time: "Early AM", text: "Point Lobos hike — Cypress Grove + Bird Island Trails (~1.5 hrs), then back to the hotel" },
        { time: "Morning", text: "Check out from Embassy Suites — load the car" },
        { time: "Midday", text: "Drive east through the Sierra foothills on CA-140 — beautiful valley entrance" },
        "Grab groceries at Pioneer Supermarket in Mariposa",
        { time: "Afternoon", text: "Check into the Midpines VRBO — Hwy 140 is the best base for Yosemite Valley access" },
        { time: "Evening", text: "Drive into Yosemite Valley for first views — El Capitan & Half Dome at dusk (Valley View or Tunnel View)" },
        { time: "Tonight", text: "No hiking — rest up for the big day tomorrow" },
      ],

      locations: [
        { icon: "🥾", name: "Point Lobos — Cypress Grove + Bird Island", note: "Two short 0.8-mi loops. Arrive by 8am — parking fills fast.", trail: "Cypress Grove Trail Point Lobos" },
        { icon: "🛒", name: "Pioneer Supermarket", note: "Stock up on groceries in Mariposa", map: "Pioneer Market Mariposa" },
        { icon: "📸", name: "Tunnel View", note: "Classic first look at El Capitan & Half Dome", map: "Tunnel View Yosemite" },
        { icon: "📸", name: "Valley View", note: "El Capitan reflected at dusk", map: "Valley View Yosemite" },
        { icon: "🏨", name: "VRBO Midpines", note: "Your Yosemite base for 3 nights", map: "6730 Rancheria Creek Rd, Midpines, CA 95345" },
      ],

      links: [
        { label: "Yosemite entrance & conditions (NPS)", url: "https://www.nps.gov/yose/planyourvisit/conditions.htm" },
      ],

      tips: [
        "Arrive at Point Lobos by 8am — the small lots fill quickly.",
        "No park reservation needed at the Hwy 140 / Arch Rock entrance in 2026.",
      ],

      funFact: { q: "When did Yosemite officially become a national park?", url: "https://en.wikipedia.org/wiki/Yosemite_National_Park" },
    },

    /* ===================== DAY 8 ===================== */
    {
      num: 8,
      date: "2026-07-23",
      weekday: "Thursday",
      title: "Yosemite — Mist Trail + Nevada Falls",
      tagline: "The signature hike. You will get wet.",
      theme: "yosemite",
      stay: { name: "VRBO, Midpines", map: "6730 Rancheria Creek Rd, Midpines, CA 95345" },
      drive: "~6 mi round trip · ~2,000 ft gain · bring water, snacks & grip shoes",

      schedule: [
        { time: "7:30–8 AM", text: "Be at the Happy Isles trailhead — beat the crowds and the heat" },
        { time: "Morning", text: "Mist Trail to Vernal Falls, then up to Nevada Falls (granite steps get soaked — grip shoes essential)" },
        { time: "Afternoon", text: "Optional: Mirror Lake loop if legs allow — flat and easy" },
        { time: "Evening", text: "Stay in and grill at the VRBO — big-hike recovery" },
        { time: "Tonight", text: "Pack gear for Tuolumne tomorrow — you'll start even earlier" },
      ],

      locations: [
        { icon: "🥾", name: "Mist Trail — Vernal & Nevada Falls", note: "Via Happy Isles. ~6 mi RT, ~2,000 ft gain. YOU WILL GET WET.", trail: "Mist Trail Vernal Nevada Falls Yosemite" },
        { icon: "🚶", name: "Mirror Lake Loop", note: "Optional flat, easy afternoon add-on", trail: "Mirror Lake Loop Yosemite" },
      ],

      links: [],

      tips: [
        "Grip shoes are essential — the granite steps are soaked in waterfall mist.",
        "There's no water at the upper falls — pack plenty of water and snacks.",
        "Start by 7:30–8am to beat both crowds and afternoon heat.",
      ],

      funFact: { q: "How tall is Nevada Falls — and where does its name come from?", url: "https://en.wikipedia.org/wiki/Nevada_Fall" },
    },

    /* ===================== DAY 9 ===================== */
    {
      num: 9,
      date: "2026-07-24",
      weekday: "Friday",
      title: "Yosemite — Tuolumne Meadows",
      tagline: "High-country Yosemite — alpine lakes, far fewer crowds.",
      theme: "yosemite",
      stay: { name: "VRBO, Midpines", map: "6730 Rancheria Creek Rd, Midpines, CA 95345" },
      drive: "~1.5 hrs up to the meadows via Tioga Road — 8,600 ft elevation",

      schedule: [
        { time: "Early", text: "Start early — afternoon thunderstorms are common at elevation in July" },
        { time: "Morning", text: "Main hike: Cathedral Lakes (7.4 mi RT, moderate-strenuous) — alpine lakes below a spired granite peak" },
        { time: "Alt", text: "Optional instead: Lembert Dome (2.8 mi, moderate) — panoramic views over the meadows" },
        { time: "Afternoon", text: "Meadow walk: Tuolumne Meadows — flat stroll and cold, perfect river swimming" },
        { time: "Evening", text: "Back to the VRBO — last night in Midpines, pack bags for SF tomorrow" },
      ],

      locations: [
        { icon: "🥾", name: "Cathedral Lakes", note: "7.4 mi RT, moderate-strenuous — the day's main event", trail: "Cathedral Lakes Trail Yosemite" },
        { icon: "⛰", name: "Lembert Dome", note: "Optional 2.8 mi — panoramic meadow views", trail: "Lembert Dome Yosemite" },
        { icon: "🌾", name: "Tuolumne Meadows", note: "Flat meadow stroll + cold river swimming", map: "Tuolumne Meadows Yosemite" },
      ],

      links: [
        { label: "Tioga Road status (NPS)", url: "https://www.nps.gov/yose/planyourvisit/tioga.htm" },
      ],

      tips: [
        "Start very early — afternoon thunderstorms build fast at 8,600 ft.",
        "This is the 'earn your views' day — totally different feel from the Valley, don't skip it.",
        "Pack a substantial lunch; you'll be out for the full day.",
      ],

      funFact: { q: "Why is Tioga Road one of the highest mountain passes in California?", url: "https://en.wikipedia.org/wiki/Tioga_Pass" },
    },

    /* ===================== DAY 10 ===================== */
    {
      num: 10,
      date: "2026-07-25",
      weekday: "Saturday",
      title: "Yosemite Morning → San Francisco",
      tagline: "One last summit, then trade granite for the bay.",
      theme: "sf",
      stay: { name: "Hilton San Francisco", map: "Hilton San Francisco Union Square" },
      drive: "Midpines → SF via CA-120 → I-205W → I-580 (~4.5 hrs with the morning hike)",

      schedule: [
        { time: "6:15 AM", text: "Leave the VRBO for the Sentinel Dome trailhead" },
        { time: "Morning", text: "Hike Sentinel Dome + Taft Point (Glacier Point Rd) — 360° views of the whole park" },
        { time: "Late morning", text: "Stop at Tuolumne Grove sequoias on the way out (2.5 mi RT)" },
        { time: "Midday", text: "One last look at Tunnel View, then drive west toward San Francisco" },
        { time: "Afternoon", text: "Check into the Hilton SF (near Union Square — walkable to everything)" },
        { time: "Evening", text: "Fisherman's Wharf → Ghirardelli Square → walk the Embarcadero waterfront" },
      ],

      locations: [
        { icon: "🥾", name: "Sentinel Dome + Taft Point", note: "2.2 mi RT — 360° panorama of the whole park. Leave by 6:15am.", trail: "Sentinel Dome Taft Point Yosemite" },
        { icon: "🌲", name: "Tuolumne Grove Sequoias", note: "2.5 mi RT leg-stretch on the way out", trail: "Tuolumne Grove Yosemite" },
        { icon: "🦀", name: "Fisherman's Wharf", note: "Classic SF waterfront afternoon", map: "Fisherman's Wharf San Francisco" },
        { icon: "🍫", name: "Ghirardelli Square", note: "Chocolate + bay views", map: "Ghirardelli Square San Francisco" },
        { icon: "🍽", name: "Cotogna", note: "Dinner — rustic Italian, great for a group", map: "Cotogna San Francisco" },
        { icon: "🍗", name: "Zuni Café", note: "Dinner alt — SF institution, legendary roast chicken. Reserve ahead.", map: "Zuni Cafe San Francisco" },
        { icon: "🏨", name: "Hilton San Francisco", note: "Tonight's stay, near Union Square", map: "Hilton San Francisco Union Square" },
      ],

      links: [
        { label: "Cotogna reservations", url: "https://cotognasf.com/" },
        { label: "Zuni Café reservations", url: "https://zunicafe.com/" },
      ],

      tips: [
        "Leave by 6:15–6:30am — Glacier Point Road parking fills fast.",
        "Knock out the hike first, then it's a clean run to the city.",
      ],

      funFact: { q: "What's the official name of the Golden Gate Bridge's orange color?", url: "https://en.wikipedia.org/wiki/Golden_Gate_Bridge" },
    },

    /* ===================== DAY 11 ===================== */
    {
      num: 11,
      date: "2026-07-26",
      weekday: "Sunday",
      title: "San Francisco Day → Fly Home",
      tagline: "Golden Gate Park, the Ferry Building, then a red-eye home.",
      theme: "sf",
      stay: { name: "Flying home tonight ✈️", url: "" },
      drive: "BART from Powell St or Embarcadero → SFO (~30 min, $9/person). Far easier than Uber for 5 with bags.",

      schedule: [
        { time: "Morning", text: "Sleep in a bit, then check out and store luggage at the bell desk" },
        { time: "11 AM", text: "California Academy of Sciences — aquarium, planetarium, rainforest, living roof (opens 11am Sun)" },
        { time: "Lunch", text: "Park Chalet on the park's western edge, near Ocean Beach" },
        { time: "Afternoon", text: "Stroll Ocean Beach or explore the park (Japanese Tea Garden, Conservatory of Flowers)" },
        { time: "Evening", text: "Final dinner at the Ferry Building" },
        { time: "~9:30 PM", text: "Walk to Embarcadero BART for SFO — flight departs 11:56 PM" },
      ],

      locations: [
        { icon: "🐠", name: "California Academy of Sciences", note: "Aquarium, planetarium, rainforest & living roof (opens 11am Sun)", map: "California Academy of Sciences" },
        { icon: "🌸", name: "Japanese Tea Garden", note: "Optional — Golden Gate Park", map: "Japanese Tea Garden San Francisco" },
        { icon: "🌊", name: "Ocean Beach", note: "Western edge of the park", map: "Ocean Beach San Francisco" },
        { icon: "🍽", name: "Park Chalet", note: "Lunch — family-friendly, kids' menu, dog-friendly patio", map: "Park Chalet San Francisco" },
        { icon: "🦪", name: "Hog Island Oyster Co.", note: "Dinner — casual seafood at the Ferry Building, easy walk to BART", map: "Hog Island Oyster Co Ferry Building San Francisco" },
      ],

      links: [
        { label: "BART trip planner → SFO", url: "https://www.bart.gov/planner" },
      ],

      tips: [
        "Store luggage at the Hilton bell desk for the day — your flight isn't until tonight.",
        "11:56 PM departure: give yourself 2+ hrs, so head to BART by ~9:30pm.",
        "BART beats Uber for 5 people with bags — $9/person and no traffic.",
      ],

      funFact: { q: "How does the California Academy of Sciences' 'living roof' work?", url: "https://en.wikipedia.org/wiki/California_Academy_of_Sciences" },
    },

  ],
};

/* Make the data reachable to the encrypt script (Node) and, if ever loaded
   directly in a browser for local editing, to the page. Not used by the
   deployed site — the site reads the encrypted data.enc.js instead. */
if (typeof module !== "undefined" && module.exports) module.exports = TRIP;
