/* ============================================================================
   A PARK DAY · DISNEYLAND — v3 engine
   ----------------------------------------------------------------------------
   Full-screen, scene-based, scroll-driven. Each land is a pinned stage; scroll
   animates the scene and reveals signage that dissolves as you move on. Four
   guests tracked independently with ink stamps. Living time-of-day sky. PWA +
   client-scheduled time-sensitive alerts + subtle synthesized park sounds.
   ========================================================================== */

(function () {
  "use strict";
  var DAY = window.DISNEY_DAY;
  if (!DAY) return;
  var BLOCKS = DAY.blocks, M = DAY.meta;
  var DAY_START = M.dayStartMin, DAY_END = M.dayEndMin;
  var GKEYS = ["g1", "g2", "g3", "g4"];

  /* ----------------------------------------------------------- inline icons */
  var ICONS = {
    map: '<path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2z"/><path d="M9 3v16M15 5v16"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    "chevron-up": '<path d="M6 15l6-6 6 6"/>',
    "chevron-down": '<path d="M6 9l6 6 6-6"/>',
    pin: '<path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.4"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a3 3 0 0 1 0 6"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    motion: '<path d="M4 12h7M4 7h12M4 17h9"/><path d="M17 9l3 3-3 3"/>',
    party: '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="9" r="2.4"/><path d="M3 20c0-3 2.5-5 5-5s5 2 5 5M13 20c0-2.3 1.6-4 3.5-4s3.5 1.7 3.5 4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    book: '<path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M5 18a2 2 0 0 1 2-2h11"/>',
    star: '<path d="M12 3l2.6 6.3L21 10l-5 4 1.5 7L12 17.5 6.5 21 8 14 3 10l6.4-.7z"/>',
    ride: '<path d="M3 17h18M5 17V8l4 2 3-4 3 3 4-1v9"/><circle cx="7" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
    food: '<path d="M6 3v8a2 2 0 0 0 4 0V3M8 11v10M16 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4 2.5-1 2.5-4V3M16 12v9"/>',
    show: '<path d="M12 3l1.6 4.5L18 9l-4.4 1.5L12 15l-1.6-4.5L6 9l4.4-1.5z"/><path d="M5 19l1.5-2M19 19l-1.5-2M12 18v3"/>',
    move: '<path d="M9 5l-2 6 3 2-1 6M15 4l1 5-3 3 2 7"/><circle cx="10" cy="3.2" r="1.3"/>',
    lightning: '<path d="M13 2L5 13h6l-2 9 9-12h-6z"/>',
    vq: '<path d="M7 3h10M7 21h10M8 3c0 4 8 5 8 9s-8 5-8 9M16 3c0 4-8 5-8 9"/>',
  };
  function svg(name, cls) {
    return '<span class="ic ' + (cls || "") + '"><svg viewBox="0 0 24 24">' + (ICONS[name] || "") + "</svg></span>";
  }
  function hydrateIcons(root) {
    (root || document).querySelectorAll("[data-icon]").forEach(function (el) {
      el.innerHTML = '<span class="ic"><svg viewBox="0 0 24 24">' + (ICONS[el.dataset.icon] || "") + "</svg></span>";
    });
  }
  var TYPE_ICON = { ride: "ride", food: "food", show: "show", move: "move", action: "lightning", deadline: "vq" };

  /* ----------------------------------------------------------- helpers */
  var $ = function (id) { return document.getElementById(id); };
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function hx(h) { h = h.replace("#", ""); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function mix(h1, h2, t) { var a = hx(h1), b = hx(h2); return "rgb(" + Math.round(lerp(a[0], b[0], t)) + "," + Math.round(lerp(a[1], b[1], t)) + "," + Math.round(lerp(a[2], b[2], t)) + ")"; }
  function mixA(h, a) { var c = hx(h); return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
  function fmt(min) { min = ((Math.round(min) % 1440) + 1440) % 1440; var h = Math.floor(min / 60), m = min % 60, ap = h >= 12 ? "PM" : "AM", h12 = h % 12 || 12; return h12 + ":" + String(m).padStart(2, "0") + " " + ap; }
  function realMin() { var d = new Date(); return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; }
  function vh() { return window.innerHeight; }

  var SKY = {
    dawn: { a: "#f9c8a0", b: "#b58fd6", d: 0.18 }, morning: { a: "#bfe3ff", b: "#8ec5ff", d: 0 },
    midday: { a: "#cdecff", b: "#7fb7ff", d: 0 }, golden: { a: "#ffd29b", b: "#ff7e5a", d: 0.12 },
    dusk: { a: "#6f6db0", b: "#2b2350", d: 0.6 }, night: { a: "#0b1330", b: "#05060f", d: 1 },
  };

  /* ----------------------------------------------------------- time source */
  var test = { active: new URLSearchParams(location.search).has("test"), min: DAY_START, playing: false, speed: 60, lastTick: 0 };
  function now() { return test.active ? test.min : realMin(); }

  /* ----------------------------------------------------------- state + sync */
  var ROOM_REAL = "disney2026", ROOM_TEST = "disney2026_test";
  var room = (test.active && localStorage.getItem("disney_testroom") !== "0") ? ROOM_TEST : ROOM_REAL;
  var state = {}, party = (M.party || ["Guest 1", "Guest 2", "Guest 3", "Guest 4"]).slice(0, 4);
  var mine = localStorage.getItem("disney_me") || "g1";
  var db = null, dbParty = null;
  var lsKey = function () { return "disney_state_" + room; };
  var lsParty = "disney_party";
  function normParty() { for (var i = 0; i < 4; i++) { if (!party[i]) party[i] = "Guest " + (i + 1); } party = party.slice(0, 4); }
  normParty();
  function loadLocal() { try { state = JSON.parse(localStorage.getItem(lsKey()) || "{}"); } catch (e) { state = {}; } try { var p = JSON.parse(localStorage.getItem(lsParty) || "null"); if (p && p.length) party = p; } catch (e) {} normParty(); }
  function saveLocal() { try { localStorage.setItem(lsKey(), JSON.stringify(state)); } catch (e) {} }
  function savePartyLocal() { try { localStorage.setItem(lsParty, JSON.stringify(party)); } catch (e) {} }
  function isDone(id, g) { return !!(state[id] && state[id][g] && state[id][g].done); }
  function countDone(id) { var n = 0; GKEYS.forEach(function (g) { if (isDone(id, g)) n++; }); return n; }
  function isSkipped(id) { return !!(state[id] && state[id].skip); }

  function initFirebase() {
    var cfg = window.FIREBASE_CONFIG;
    if (!cfg || cfg.apiKey === "REPLACE_ME" || typeof firebase === "undefined") return false;
    try { firebase.initializeApp(cfg); bindRoom(); bindParty(); return true; }
    catch (e) { console.warn("Firebase off:", e); db = null; return false; }
  }
  function bindRoom() {
    if (typeof firebase === "undefined") return;
    if (db) { try { db.off(); } catch (e) {} }
    db = firebase.database().ref(room + "/quests");
    db.on("value", function (s) { state = s.val() || {}; saveLocal(); repaintAll(); });
  }
  function bindParty() {
    if (typeof firebase === "undefined") return;
    dbParty = firebase.database().ref(room + "/party");
    dbParty.on("value", function (s) { var v = s.val(); if (v && v.length) { party = v.slice(0, 4); normParty(); savePartyLocal(); repaintParty(); buildParty(); buildDirectory(); } });
  }
  function setGuest(id, g, done) {
    if (!state[id]) state[id] = {};
    state[id][g] = done ? { done: true, at: Date.now(), rot: Math.round(Math.random() * 60 - 30) } : { done: false };
    saveLocal();
    if (db) { try { db.child(id + "/" + g).set(state[id][g]); } catch (e) {} }
    repaintSign(id); refreshSheet(id); updateNow(); refreshAhead(); updateTrailProgress();
  }
  function setSkip(id, val) {
    if (!state[id]) state[id] = {};
    state[id].skip = !!val;
    saveLocal();
    if (db) { try { db.child(id + "/skip").set(!!val); } catch (e) {} }
    repaintSign(id); refreshSheet(id); refreshAhead(); updateTrailProgress();
  }
  function pushParty() { savePartyLocal(); if (dbParty) { try { dbParty.set(party); } catch (e) {} } repaintParty(); }

  /* ----------------------------------------------------------- scene index */
  // scenes = overture + blocks + passport. blocks carry the data.
  var scenes = [];   // { el, kind, block?, phase, name, font, motion, beats:[{el, kind, center, anchor, id?}] }
  var film = $("film");

  function build() {
    film.innerHTML = "";
    scenes = [];
    buildOverture();
    BLOCKS.forEach(buildScene);
    buildPassport();
  }

  function sceneShell(opts) {
    var sec = document.createElement("section");
    sec.className = "scene" + (opts.future ? " future" : "");
    sec.dataset.id = opts.id;
    var beatsCount = opts.beats || 1;       // info beats (notes + stops), excludes the title
    var vhH = clamp(215 + beatsCount * 66, 250, 500);   // taller scenes = each beat owns more scroll = gentler flow
    sec.style.height = vhH + "vh";
    var stage = document.createElement("div"); stage.className = "stage";
    var back = document.createElement("div"); back.className = "scene-backdrop"; back.dataset.motion = opts.motion || "drift";
    var ground = document.createElement("div"); ground.className = "scene-ground";
    stage.appendChild(back); stage.appendChild(ground);
    sec.appendChild(stage);
    film.appendChild(sec);
    return { sec: sec, stage: stage, back: back };
  }

  // a slowly-spinning decoration the viewport passes (Tomorrowland / Batuu)
  var ORBIT_SVG = '<div class="orbit-spin"><svg viewBox="0 0 120 120">' +
    '<ellipse cx="60" cy="60" rx="54" ry="20" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2"/>' +
    '<circle cx="60" cy="60" r="16" fill="#ffd86b"/>' +
    '<circle cx="114" cy="60" r="5" fill="#fff"/></svg></div>';

  // add one parallax layer to a scene backdrop
  function addLayer(back, opts) {
    var d = document.createElement("div");
    d.className = "layer " + (opts.klass || "");
    d.dataset.depth = opts.depth != null ? opts.depth : 1;
    d.dataset.exit = opts.exit || "fade";
    d.dataset.basex = opts.basex || "-50%";
    if (opts.role) d.dataset.role = opts.role;
    if (opts.enter != null) d.dataset.enter = opts.enter;
    if (opts.leave != null) d.dataset.leave = opts.leave;
    if (opts.css) d.style.cssText = opts.css;
    if (opts.prop) d.dataset.prop = opts.prop;
    if (opts.html) d.innerHTML = opts.html;
    back.appendChild(d);
    return d;
  }

  function buildOverture() {
    var sh = sceneShell({ id: "overture", motion: "logo", beats: 1 });
    var comp = sh.back;
    // The opening: a Disneyland logo over the dawn sky. As you scroll it lifts and
    // fades, and you descend into Rope Drop where the castle is revealed (once).
    addLayer(comp, { klass: "bg", depth: 0.3, exit: "fade" });
    addLayer(comp, { klass: "logo", role: "logo", prop: "disneyland-logo", css: "left:50%;top:30%;bottom:auto;width:min(82vw,520px);transform-origin:50% 50%" });
    var stage = sh.stage;
    var title = document.createElement("div");
    title.className = "scene-title";
    title.innerHTML =
      '<span class="scene-eyebrow">Main Street, U.S.A.</span>' +
      '<h1 class="scene-name f-regal">A Park Day</h1>' +
      '<p class="scene-sub">"Here you leave today and enter the world of yesterday, tomorrow and fantasy."</p>';
    stage.appendChild(title);
    var cue = document.createElement("div");
    cue.className = "beat";
    cue.innerHTML = '<p class="whisper">Scroll to walk into the park. Tap any sign to open it; tap away to close.</p>';
    stage.appendChild(cue);
    scenes.push({ el: sh.sec, stage: stage, back: sh.back, kind: "overture", phase: "dawn", name: "Main Street", motion: "logo", beats: [{ el: title, kind: "title" }, { el: cue, kind: "whisper", idx: 0, n: 1 }] });
  }

  function buildScene(block) {
    var zone = DAY.zones[block.zone];
    var fontKey = M.font[block.id] || "lobster";
    var motion = M.motion[block.id] || "drift";
    var future = fontKey === "righteous";
    var stops = (block.quests || []);
    var notes = (block.notes || []);
    var beatN = stops.length + notes.length;
    var sh = sceneShell({ id: block.id, motion: motion, beats: beatN, future: future });
    sh.sec.style.setProperty("--zone", zone.accent);
    // layered backdrop: distant horizon (bg) + optional orbit + foreground landmark(s)
    addLayer(sh.back, { klass: "bg", depth: 0.32, exit: "fade" });
    if ((M.orbit || []).indexOf(block.id) >= 0)
      addLayer(sh.back, { klass: "orbit", depth: 0.7, exit: "up", html: ORBIT_SVG, css: "left:50%;top:11%;bottom:auto;width:118px" });
    addLayer(sh.back, { klass: "fg", depth: 1, exit: (M.exit && M.exit[block.id]) || "fade",
      leave: (M.leave && M.leave[block.id]), prop: M.landmarks[block.id] || "" });
    // a second landmark that emerges as the first one clears (e.g. Matterhorn after Space Mountain)
    if (M.landmark2 && M.landmark2[block.id]) {
      var l2 = M.landmark2[block.id];
      addLayer(sh.back, { klass: "fg", depth: l2.depth || 1, exit: l2.exit || "fade", enter: l2.enter, leave: l2.leave, prop: l2.prop });
    }
    var stage = sh.stage;

    // title beat
    var title = document.createElement("div");
    title.className = "scene-title";
    var nameCls = future ? "f-future" : "";
    title.innerHTML =
      '<span class="scene-eyebrow">' + esc(block.time) + " &middot; " + esc(zone.label) + "</span>" +
      '<h1 class="scene-name ' + nameCls + '">' + esc(block.title) + "</h1>" +
      (block.subtitle ? '<p class="scene-sub">' + esc(block.subtitle) + "</p>" : "");
    stage.appendChild(title);
    var beats = [{ el: title, kind: "title" }];

    // notes + stops revealed one at a time in a single slot beneath the header,
    // each owning an equal slice of the scene's scroll (no overlap, info under header)
    var seq = [];
    notes.forEach(function (n) { seq.push({ kind: "note", note: n }); });
    stops.forEach(function (q) { seq.push({ kind: "stop", q: q }); });
    var N = seq.length;
    seq.forEach(function (item, i) {
      var beat = document.createElement("div");
      beat.className = "beat";
      if (item.kind === "note") {
        beat.innerHTML = '<p class="whisper">' + esc(item.note) + "</p>";
      } else {
        beat.appendChild(buildSign(item.q, block, i % 2 === 1));
      }
      stage.appendChild(beat);
      beats.push({ el: beat, kind: item.kind, idx: i, n: N, id: item.kind === "stop" ? item.q.id : null });
    });

    // per-land trail: a dotted centered line + this land's stop-nodes that flow up past the
    // fixed marker as you scroll (placed/animated in placeTrailNodes + updateSceneTrail).
    var trailEl = document.createElement("div"); trailEl.className = "scene-trail";
    var trailWrap = document.createElement("div"); trailWrap.className = "scene-trail-nodes";
    var trailNodes = {};
    beats.forEach(function (b) {
      if (b.kind !== "stop") return;
      var step = (INFO_END - INFO_START) / Math.max(1, b.n || 1);
      var centerP = INFO_START + step * ((b.idx || 0) + 0.5);
      var nd = document.createElement("div"); nd.className = "trail-node";
      nd.dataset.centerp = centerP;
      trailWrap.appendChild(nd); trailNodes[b.id] = nd;
    });
    trailEl.appendChild(trailWrap);
    stage.insertBefore(trailEl, title);

    scenes.push({ el: sh.sec, stage: stage, back: sh.back, kind: "block", block: block, phase: M.sky[block.id] || "midday", name: block.title, fontKey: fontKey, motion: motion, beats: beats, trailWrap: trailWrap, trailNodes: trailNodes });
  }

  var signEls = {};
  function buildSign(q, block, tiltR) {
    var btn = document.createElement("button");
    btn.className = "stop-sign" + (tiltR ? " tilt-r" : "") + (q.type === "deadline" ? " deadline" : "");
    btn.dataset.id = q.id;
    btn.innerHTML =
      '<div class="sign-plate">' +
        '<span class="sign-cat">' + svg(TYPE_ICON[q.type] || "star") + "</span>" +
        '<div class="sign-name">' + esc(q.label) + "</div>" +
        '<div class="sign-meta">' + (q.star ? '<span class="sign-star">' + svg("star", "solid") + "</span>" : "") +
          '<span class="sign-pips">' + GKEYS.map(function (g) { return '<span class="pip ' + g + '"></span>'; }).join("") + "</span>" +
        "</div>" +
        '<div class="sign-hint">tap to open</div>' +
      "</div>";
    btn.addEventListener("click", function () { openSheet(q.id); });
    signEls[q.id] = btn;
    return btn;
  }

  function repaintSign(id) {
    var el = signEls[id]; if (!el) return;
    var q = questById(id);
    GKEYS.forEach(function (g, i) {
      var pip = el.querySelectorAll(".pip")[i];
      if (pip) pip.classList.toggle("on", isDone(id, g));
    });
    var n = countDone(id), skip = isSkipped(id);
    el.classList.toggle("complete", n === 4);
    el.classList.toggle("glow", n >= 1);            // any one person checking it off lights it up
    el.classList.toggle("skipped", skip && n === 0);
    var hint = el.querySelector(".sign-hint");
    if (hint) hint.textContent = n ? n + " of 4 done" : (skip ? "skipped" : "tap to open");
  }
  function repaintAll() { Object.keys(signEls).forEach(repaintSign); if (curSheetId) refreshSheet(curSheetId); updateNow(); refreshAhead(); updateTrailProgress(); renderPassport(); }
  function repaintParty() { renderPassport(); if (curSheetId) refreshSheet(curSheetId); }

  function questById(id) { for (var i = 0; i < BLOCKS.length; i++) { var qs = BLOCKS[i].quests || []; for (var j = 0; j < qs.length; j++) if (qs[j].id === id) return qs[j]; } return null; }
  function blockOf(id) { for (var i = 0; i < BLOCKS.length; i++) { var qs = BLOCKS[i].quests || []; for (var j = 0; j < qs.length; j++) if (qs[j].id === id) return BLOCKS[i]; } return null; }

  /* ----------------------------------------------------------- attraction sheet */
  var curSheetId = null, popGuest = null;
  function openSheet(id) {
    curSheetId = id;
    refreshSheet(id);
    var sh = $("sheet"); sh.classList.remove("closing"); sh.hidden = false;
    updateUpNext(active);                              // hide the nav bar while the sheet is up
  }
  var sheetCloseT = null;
  function closeSheet() {
    var sh = $("sheet"); if (sh.hidden) return;
    sh.classList.add("closing");                       // play the slide-down, then hide
    clearTimeout(sheetCloseT);
    sheetCloseT = setTimeout(function () { sh.hidden = true; sh.classList.remove("closing"); curSheetId = null; updateUpNext(active); }, 280);
  }
  function refreshSheet(id) {
    if (curSheetId !== id && $("sheet").hidden) return;
    var q = questById(id), block = blockOf(id);
    if (!q) return;
    var zone = DAY.zones[block.zone];
    var future = (M.font[block.id] === "righteous");
    var st = DAY.meta.stamps[q.type] || { label: "Done", ink: "#2f8f63" };
    var html = "";
    html += '<div class="sheet-eyebrow">' + esc(block.time) + " &middot; " + esc(zone.label) + "</div>";
    html += '<div class="sheet-title' + (future ? " scene-future-title" : "") + '">' + esc(q.label) + (q.star ? " " + svg("star", "solid") : "") + "</div>";
    if (q.note) html += '<p class="sheet-note">' + esc(q.note) + "</p>";
    if (block.deadline && q.type === "deadline") html += '<div class="sheet-deadline">' + svg("vq") + " " + esc(block.deadline.label) + " &middot; opens at " + fmt(block.deadline.atMin) + "</div>";
    function guestRow(g, primary) {
      var i = GKEYS.indexOf(g);
      var done = isDone(id, g), rec = state[id] && state[id][g], rot = rec && rec.rot != null ? rec.rot : -8;
      var label = party[i] || ("Guest " + (i + 1));
      return '<div class="guest-row' + (primary ? " primary" : "") + '" data-g="' + g + '">' +
        '<span class="guest-badge ' + g + '">' + esc((label[0] || "?").toUpperCase()) + "</span>" +
        '<span class="guest-name">' + esc(label) + (g === mine ? '<span class="you">YOU</span>' : "") + "</span>" +
        '<span class="guest-toggle">' + (done
          ? '<span class="stamp' + (popGuest === id + ":" + g ? " pop" : "") + '" style="color:' + st.ink + ';--rot:' + rot + 'deg">' + esc(st.label) + "</span>"
          : '<span class="togbox"></span>') + "</span>" +
        "</div>";
    }
    // primary = this phone's guest (one tap, no name-picking); others are secondary
    html += '<div class="sheet-section-label">Your stamp</div>' + guestRow(mine, true);
    var others = GKEYS.filter(function (g) { return g !== mine; });
    html += '<div class="sheet-section-label">Log for the group</div>';
    others.forEach(function (g) { html += guestRow(g, false); });
    // skip control — advances the day/trail without anyone stamping it
    var skipped = isSkipped(id);
    html += '<button class="sheet-skip' + (skipped ? " on" : "") + '" id="sheetSkip">' +
      svg(skipped ? "star" : "move") + " " + (skipped ? "Skipped &mdash; tap to un-skip" : "Activity Skipped") + "</button>";
    var c = $("sheetContent");
    c.innerHTML = html;
    popGuest = null;
    // theme the sheet to the land
    document.documentElement.style.setProperty("--zone", zone.accent);
    c.querySelectorAll(".guest-row").forEach(function (row) {
      row.addEventListener("click", function () {
        var g = row.dataset.g, willDo = !isDone(id, g);
        if (willDo) { sound("stamp"); sparkleAt(row); popGuest = id + ":" + g; }   // effects on live node, flag the pop
        setGuest(id, g, willDo);                          // then re-render the sheet (stamp pops in)
      });
    });
    var sk = $("sheetSkip");
    if (sk) sk.addEventListener("click", function () {
      var willSkip = !isSkipped(id);
      setSkip(id, willSkip);
      if (willSkip) { closeSheet(); navToActivity(1); }   // skipping advances to the next activity
    });
  }

  /* ----------------------------------------------------------- scene engine */
  var active = 0, ticking = false, docScroll = 1;
  // cache every scene's geometry once (build / resize) so onScroll never reads layout —
  // interleaving layout reads with style writes per frame is what made scrolling jitter.
  function measure() {
    var V = vh();
    for (var i = 0; i < scenes.length; i++) {
      var el = scenes[i].el;
      scenes[i].top = el.offsetTop;
      scenes[i].h = el.offsetHeight;
    }
    docScroll = Math.max(1, (document.body.scrollHeight || document.documentElement.scrollHeight) - V);
    buildActivityIndex();
    placeTrailNodes();
    updateTrailProgress();
  }

  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var sy = window.scrollY, V = vh(), center = sy + V / 2;
      var act = 0, actP = 0;
      for (var i = 0; i < scenes.length; i++) {       // reads from cache only — pure writes below
        var top = scenes[i].top || 0, h = scenes[i].h || V;
        var p = clamp((sy - top) / Math.max(1, h - V), 0, 1);
        scenes[i]._p = p;
        if (center >= top && center < top + h) { act = i; actP = p; }
        var near = (top - sy < V * 1.6 && top + h - sy > -V * 0.6);
        scenes[i].el.classList.toggle("live", near);
        if (near) { applyMotion(scenes[i], p); revealBeats(scenes[i], p); updateSceneTrail(scenes[i], p); }
      }
      active = act;
      // sky from active scene → next
      var s1 = SKY[scenes[act].phase] || SKY.midday;
      var nxt = scenes[Math.min(scenes.length - 1, act + 1)];
      var s2 = SKY[nxt.phase] || s1;
      var rs = document.documentElement.style;
      rs.setProperty("--sky-a", mix(s1.a, s2.a, actP));
      rs.setProperty("--sky-b", mix(s1.b, s2.b, actP));
      var dark = lerp(s1.d, s2.d, actP);
      rs.setProperty("--star-op", clamp((dark - 0.45) / 0.55, 0, 1).toFixed(2));
      rs.setProperty("--sun-op", clamp(1 - dark * 1.4, 0, 1).toFixed(2));
      rs.setProperty("--moon-op", clamp((dark - 0.4) / 0.6, 0, 1).toFixed(2));
      var acc = scenes[act].block ? DAY.zones[scenes[act].block.zone].accent : "#c98a5e";
      rs.setProperty("--zone", acc); rs.setProperty("--tint", mixA(acc, 0.16));
      var p = clamp(center / (docScroll + V), 0, 1);    // cached — no scrollHeight read
      rs.setProperty("--sun-x", (10 + 78 * p).toFixed(1) + "%");
      rs.setProperty("--sun-y", ((0.66 - 0.46 * Math.sin(p * Math.PI)) * 100).toFixed(1) + "vh");
      rs.setProperty("--moon-x", (12 + 76 * p).toFixed(1) + "%");
      rs.setProperty("--moon-y", ((0.6 - 0.4 * Math.sin(p * Math.PI)) * 100).toFixed(1) + "vh");
      // now-plate land + nav state
      $("nowLand").textContent = scenes[act].name;
      document.body.classList.toggle("at-end", act === scenes.length - 1);
      updateUpNext(act);
      updateReturnNow();
      if (marker) marker.style.display = scenes[act].trailWrap ? "" : "none";   // only on the lands
    });
  }

  // every layer parallaxes by depth, grows as you pass, then exits cleanly off-screen.
  // the overture logo (data-role="logo") lifts and fades as you descend into Rope Drop.
  function applyMotion(scene, p) {
    var layers = scene.back.querySelectorAll(".layer");
    for (var i = 0; i < layers.length; i++) {
      var L = layers[i];
      var role = L.dataset.role;
      var depth = parseFloat(L.dataset.depth) || 1;
      var basex = L.dataset.basex || "-50%";
      var tx = 0, ty = 0, scale = 1, op = 1, rot = 0;
      if (role === "logo") {
        scale = 1 + p * 0.18;                // breathes up a touch
        ty = -p * 60;                        // lifts away as you scroll down
        op = clamp(1 - (p - 0.20) / 0.45, 0, 1);
      } else {
        var zoom = scene.motion === "zoom";
        rot = scene.motion === "sway" ? Math.sin(p * Math.PI * 2) * 2
            : scene.motion === "orbit" ? (p * 4 - 2) : 0;
        var enter = parseFloat(L.dataset.enter) || 0;
        var leave = L.dataset.leave != null ? parseFloat(L.dataset.leave) : 0.80;
        var q = Math.max(0, p - enter);
        scale = 1 + q * 0.26 * depth + (zoom ? q * 0.7 * depth : 0);
        ty = -q * 12 * depth;                // gentle continuous parallax rise
        op = enter > 0 ? clamp((p - enter) / 0.12, 0, 1) : 1;
        var ex = clamp((p - leave) / Math.max(0.001, 1 - leave), 0, 1);   // exit only in the tail
        if (ex > 0) {
          var exit = L.dataset.exit || "fade";
          if (exit === "left") tx = -150 * ex;
          else if (exit === "right") tx = 150 * ex;
          else if (exit === "up") { ty -= 120 * ex; op *= (1 - ex * 0.5); }
          else { op *= (1 - ex); ty -= 12 * ex; }
        }
      }
      L.style.transform = "translateX(calc(" + basex + " + " + tx.toFixed(1) + "%)) translateY(" + ty.toFixed(1) + "%) rotate(" + rot.toFixed(2) + "deg) scale(" + scale.toFixed(3) + ") translateZ(0)";
      L.style.opacity = op.toFixed(2);
    }
  }

  // The header holds for the whole scene; info beats reveal one at a time below it.
  var INFO_START = 0.14, INFO_END = 0.90;
  function revealBeats(scene, p) {
    scene.beats.forEach(function (beat) {
      if (beat.kind === "title") {
        // the header is present the whole scene; it only steps aside at the very end
        // as the next scene's header takes over (the now-plate always shows the land too)
        var op = p > 0.88 ? clamp(1 - (p - 0.88) / 0.12, 0, 1) : 1;
        var tty = (1 - op) * -18;
        beat.el.style.opacity = op.toFixed(3);
        beat.el.style.transform = "translateY(" + tty.toFixed(1) + "px)";
        beat.el.style.pointerEvents = op > 0.5 ? "auto" : "none";
        return;
      }
      var n = beat.n || 1, idx = beat.idx || 0;
      var step = (INFO_END - INFO_START) / n;
      var c = INFO_START + step * (idx + 0.5);
      // narrow fade windows so only one beat dominates the slot at a time; the small
      // remaining overlap is a quick cross-fade with the two beats pushed apart
      var inA = c - step * 0.54, inB = c - step * 0.16, outA = c + step * 0.16, outB = c + step * 0.54;
      var bop;
      if (p <= inA || p >= outB) bop = 0;
      else if (p < inB) bop = (p - inA) / (inB - inA);
      else if (p > outA) bop = 1 - (p - outA) / (outB - outA);
      else bop = 1;
      bop = clamp(bop, 0, 1);
      var ty = p < c ? (1 - bop) * 44 : -(1 - bop) * 40;
      var scale = 0.95 + bop * 0.06;
      beat.el.style.opacity = bop.toFixed(3);
      beat.el.style.transform = "translate(-50%, calc(-50% + " + ty.toFixed(1) + "px)) scale(" + scale.toFixed(3) + ")";
      beat.el.style.pointerEvents = bop > 0.45 ? "auto" : "none";
    });
  }

  /* ----------------------------------------------------------- now / nav */
  function vw() { return window.innerWidth; }
  function nowSceneIndex() {
    var min = now(), idx = 0;
    for (var i = 0; i < scenes.length; i++) { if (scenes[i].block && scenes[i].block.startMin <= min) idx = i; }
    return idx;
  }
  function updateNow() { $("nowTime").textContent = fmt(now()); }
  function updateReturnNow() {
    var rn = $("returnNow"); if (!rn) return;
    rn.hidden = (active === nowSceneIndex());
  }
  // the middle pill = "up next" header jump; the bar hides while the sheet is open
  function updateUpNext(act) {
    var bar = $("navbar"); if (bar) bar.hidden = !$("sheet").hidden;
    var isLast = act >= scenes.length - 1;
    var nm = $("upNextName"); if (nm) nm.textContent = isLast ? "The journal" : scenes[act + 1].name;
  }
  function sceneTop(i) { return scenes[i] ? (scenes[i].top != null ? scenes[i].top : scenes[i].el.offsetTop) : 0; }
  function sceneH(i) { return scenes[i] ? (scenes[i].h != null ? scenes[i].h : scenes[i].el.offsetHeight) : vh(); }
  function scrollToScene(i, smooth) {
    if (!scenes[i]) return;
    window.scrollTo({ top: sceneTop(i) + sceneH(i) * 0.18, behavior: smooth === false ? "auto" : "smooth" });
  }
  // crossfade jump: fade a curtain in, hop the scroll behind it, fade back out — never a long jarring scroll
  function jumpTo(i) {
    if (!scenes[i]) return;
    var target = sceneTop(i) + sceneH(i) * 0.18;
    if (Math.abs(target - window.scrollY) < vh() * 0.9) { scrollToScene(i); return; } // close: just smooth-scroll
    var curtain = $("curtain");
    curtain.classList.add("show");
    setTimeout(function () {
      window.scrollTo(0, target - vh() * 0.12);          // land slightly above, so the fade-in shows a touch of travel
      onScroll();
      requestAnimationFrame(function () { window.scrollTo(0, target); onScroll(); });
      setTimeout(function () { curtain.classList.remove("show"); }, 80);
    }, 300);
  }

  /* --------- activity index: every quest as a scroll target (nav + trail) --------- */
  var activities = [];   // [{ id, sceneIdx, idx, n, centerP, targetY, frac }]
  function buildActivityIndex() {
    activities = [];
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i]; if (!s.block) continue;
      s.beats.forEach(function (b) {
        if (b.kind !== "stop") return;
        var step = (INFO_END - INFO_START) / Math.max(1, b.n || 1);
        var centerP = INFO_START + step * ((b.idx || 0) + 0.5);
        var targetY = sceneTop(i) + Math.max(0, sceneH(i) - vh()) * centerP;
        activities.push({ id: b.id, sceneIdx: i, idx: b.idx, n: b.n, centerP: centerP, targetY: targetY, frac: clamp(targetY / docScroll, 0, 1) });
      });
    }
  }
  function smoothTo(y) { window.scrollTo({ top: Math.max(0, Math.round(y)), behavior: "smooth" }); }
  // up/down circles step one activity at a time (Indiana Jones → "tap in, book Space Mountain")
  function navToActivity(dir) {
    if (!activities.length) { scrollToScene(clamp(active + (dir > 0 ? 1 : -1), 0, scenes.length - 1)); return; }
    var sy = window.scrollY, eps = 10, i;
    if (dir > 0) {
      for (i = 0; i < activities.length; i++) if (activities[i].targetY > sy + eps) { smoothTo(activities[i].targetY); return; }
      scrollToScene(scenes.length - 1);                 // past the last activity → the journal
    } else {
      for (i = activities.length - 1; i >= 0; i--) if (activities[i].targetY < sy - eps) { smoothTo(activities[i].targetY); return; }
      smoothTo(0);                                      // before the first → the overture
    }
  }

  /* --------- the trail: first-person. A fixed marker; each land's stop-nodes flow
     up past it as you scroll that land (no whole-day birds-eye map). --------- */
  var marker, markerY = 0, flowDist = 600;
  // place each land's nodes so node i sits at markerY + centerP·flowDist (before flow);
  // updateSceneTrail then slides them up so each passes the marker at its reveal point.
  function placeTrailNodes() {
    marker = marker || $("marker");
    var V = vh();
    markerY = V * 0.5;                 // the fixed "you are here" line, mid-screen
    flowDist = Math.max(260, V * 1.1); // how far a node travels across the land's scroll
    scenes.forEach(function (s) {
      if (!s.trailWrap) return;
      var nodes = s.trailWrap.querySelectorAll(".trail-node");
      for (var i = 0; i < nodes.length; i++) {
        var cp = parseFloat(nodes[i].dataset.centerp) || 0.5;
        nodes[i].style.top = (markerY + cp * flowDist).toFixed(1) + "px";
      }
    });
  }
  // called per near-scene each frame: flow this land's nodes up past the fixed marker
  function updateSceneTrail(scene, p) {
    if (!scene.trailWrap) return;
    scene.trailWrap.style.transform = "translateY(" + (-(p * flowDist)).toFixed(1) + "px) translateZ(0)";
  }
  // glow each land's nodes from completion state (gold = done, gray = skipped)
  function updateTrailProgress() {
    scenes.forEach(function (s) {
      if (!s.trailNodes) return;
      Object.keys(s.trailNodes).forEach(function (id) {
        var el = s.trailNodes[id], done = countDone(id) > 0, skip = isSkipped(id);
        el.classList.toggle("done", done);
        el.classList.toggle("skip", !done && skip);
      });
    });
  }

  /* ----------------------------------------------------------- ahead-of-schedule */
  function refreshAhead() {
    var min = now(), expected = 0;
    BLOCKS.forEach(function (b) { (b.quests || []).forEach(function () { if (b.startMin <= min) expected++; }); });
    var done = 0; BLOCKS.forEach(function (b) { (b.quests || []).forEach(function (q) { if (countDone(q.id) > 0 || isSkipped(q.id)) done++; }); });
    var surplus = done - expected;
    var banner = $("aheadBanner");
    if (surplus >= 2) { banner.hidden = false; banner.textContent = "You're ahead of schedule — " + surplus + " stops of bonus magic!"; }
    else banner.hidden = true;
    if (marker) marker.classList.toggle("ahead", surplus >= 2);
  }

  /* ----------------------------------------------------------- passport / journal */
  function buildPassport() {
    var sec = document.createElement("section");
    sec.className = "scene"; sec.dataset.id = "passport";
    sec.style.height = "auto";
    sec.innerHTML = '<div class="passport" id="passport"></div>';
    film.appendChild(sec);
    scenes.push({ el: sec, stage: sec, back: document.createElement("div"), kind: "passport", phase: "night", name: "Our Day", beats: [] });
    renderPassport();
  }
  function renderPassport() {
    var el = $("passport"); if (!el) return;
    var cats = [["ride", "Rides ridden", "ride"], ["action", "Lightning Lanes booked", "lightning"], ["show", "Shows attended", "show"], ["food", "Dining", "food"], ["deadline", "Queues joined", "vq"]];
    var html = '<h2 class="passport-title">Our Day</h2><p class="passport-sub">A stamp book for ' + esc(M.title) + "</p>";
    GKEYS.forEach(function (g, gi) {
      var counts = {}, total = 0;
      BLOCKS.forEach(function (b) { (b.quests || []).forEach(function (q) { if (isDone(q.id, g)) { counts[q.type] = (counts[q.type] || 0) + 1; total++; } }); });
      html += '<div class="pass-card"><div class="pass-head"><span class="guest-badge ' + g + '">' + esc((party[gi][0] || "?").toUpperCase()) + '</span>' +
        '<span class="pass-name">' + esc(party[gi]) + '</span><span class="pass-total">' + total + '</span></div><div class="pass-stats">';
      cats.forEach(function (c) { html += '<div class="pass-stat">' + svg(c[2]) + '<span>' + c[1] + '</span><span class="n">' + (counts[c[0]] || 0) + "</span></div>"; });
      html += "</div></div>";
    });
    html += '<button class="pass-foot linkish" id="passMap">' + svg("map") + ' Back to the map</button>';
    el.innerHTML = html;
    var pm = $("passMap"); if (pm) pm.addEventListener("click", function () { jumpTo(nowSceneIndex()); });
  }

  /* ----------------------------------------------------------- backdrops (fetch + inline) */
  var svgCache = {};
  // bottom-anchor each prop so it stands on the ground regardless of aspect ratio;
  // the two Main Street rows anchor to their outer edge so they hug the sides.
  function setPA(el) {
    var s = el.querySelector("svg"); if (!s) return;
    var pa = el.classList.contains("street-l") ? "xMinYMax meet"
           : el.classList.contains("street-r") ? "xMaxYMax meet" : "xMidYMax meet";
    s.setAttribute("preserveAspectRatio", pa);
  }
  function loadBackdrops() {
    document.querySelectorAll(".layer[data-prop]").forEach(function (el) {
      var name = el.dataset.prop; if (!name) return;
      if (svgCache[name]) { el.innerHTML = svgCache[name]; setPA(el); return; }
      fetch("assets/disney/" + name + ".svg?v=12").then(function (r) { return r.ok ? r.text() : ""; })
        .then(function (t) { if (t) { svgCache[name] = t; el.innerHTML = t; setPA(el); } }).catch(function () {});
    });
  }

  /* ----------------------------------------------------------- sparkle fx */
  var ctx, parts = [], raf = null, canvas = $("fx");
  function prefersReduced() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function fxOn() { return !document.body.classList.contains("no-fx") && !document.body.classList.contains("reduce-fx") && !prefersReduced(); }
  function sizeCanvas() { var d = Math.min(window.devicePixelRatio || 1, 2); canvas.width = innerWidth * d; canvas.height = innerHeight * d; ctx = canvas.getContext("2d"); ctx.setTransform(d, 0, 0, d, 0, 0); }
  function sparkleAt(node) { var r = node.getBoundingClientRect(); burst(r.left + r.width * 0.5, r.top + r.height * 0.5, getComputedStyle(document.documentElement).getPropertyValue("--gold").trim() || "#ffcf6b", 1.2); }
  function burst(x, y, color, sc) { if (!fxOn()) return; sc = sc || 1; color = (color || "#ffcf6b").trim(); for (var i = 0; i < 14 * sc; i++) { var a = Math.random() * 6.28, s = (1 + Math.random() * 3) * sc; parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: 1, dec: 0.012 + Math.random() * 0.02, sz: 1.5 + Math.random() * 2.6, c: color }); } loop(); }
  function loop() { if (raf) return; raf = requestAnimationFrame(function () { raf = null; if (!ctx) return; ctx.clearRect(0, 0, innerWidth, innerHeight); for (var i = parts.length - 1; i >= 0; i--) { var p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.life -= p.dec; if (p.life <= 0) { parts.splice(i, 1); continue; } ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; star(p.x, p.y, p.sz * (0.5 + p.life)); } ctx.globalAlpha = 1; if (parts.length) loop(); }); }
  function star(x, y, r) { ctx.beginPath(); for (var i = 0; i < 4; i++) { var a = (Math.PI / 2) * i; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.lineTo(x + Math.cos(a + Math.PI / 4) * r * 0.4, y + Math.sin(a + Math.PI / 4) * r * 0.4); } ctx.closePath(); ctx.fill(); }

  /* ----------------------------------------------------------- sound (web audio) */
  var AC = null, soundOn = localStorage.getItem("disney_sound") === "1";
  function audio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return AC; }
  function tone(freq, dur, type, vol, when) { var ac = audio(); if (!ac) return; var t0 = ac.currentTime + (when || 0); var o = ac.createOscillator(), g = ac.createGain(); o.type = type || "sine"; o.frequency.value = freq; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol || 0.2, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + dur + 0.02); }
  function sound(kind) {
    if (!soundOn) return;
    if (kind === "stamp") { var ac = audio(); if (ac) { var o = ac.createOscillator(), g = ac.createGain(); o.type = "square"; o.frequency.setValueAtTime(180, ac.currentTime); o.frequency.exponentialRampToValueAtTime(70, ac.currentTime + 0.12); g.gain.setValueAtTime(0.25, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.16); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.18); } }
    else if (kind === "chime") { tone(880, 0.5, "sine", 0.2, 0); tone(1320, 0.6, "sine", 0.15, 0.08); tone(1760, 0.7, "sine", 0.1, 0.16); }
    else if (kind === "whistle") { tone(700, 0.5, "triangle", 0.15, 0); tone(900, 0.5, "triangle", 0.12, 0.18); }
  }

  /* ----------------------------------------------------------- notifications + scheduling */
  var alertsOn = localStorage.getItem("disney_alerts") === "1", timers = [];
  function alertItems() {
    var items = [];
    BLOCKS.forEach(function (b) {
      if (b.deadline) {
        items.push({ min: b.deadline.atMin - 3, title: "World of Color VQ", body: "Virtual queue opens in 3 minutes — get all four tickets ready." });
        items.push({ min: b.deadline.atMin, title: "VQ is OPEN", body: b.deadline.fire || "Book the virtual queue now." });
      }
    });
    return items;
  }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function scheduleAlerts() {
    clearTimers();
    if (!alertsOn || test.active) return;   // in test mode use the manual button
    var nm = realMin();
    alertItems().forEach(function (it) {
      var ms = (it.min - nm) * 60000;
      if (ms > 0 && ms < 16 * 3600000) timers.push(setTimeout(function () { fireAlert(it.title, it.body); }, ms));
    });
  }
  function vqWash() {
    var w = $("vqWash"); if (!w) return;
    w.classList.remove("show"); void w.offsetWidth; w.classList.add("show");
    setTimeout(function () { w.classList.remove("show"); }, 6200);
  }
  function fireAlert(title, body) {
    vqWash();                              // full-screen solid-color wash
    showToast(title + " — " + body);
    sound("chime");
    if (navigator.vibrate) try { navigator.vibrate([60, 40, 60]); } catch (e) {}
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(function (reg) { reg.showNotification(title, { body: body, icon: "assets/disney/app-icon.svg", badge: "assets/disney/app-icon.svg", tag: "parkday" }); });
        else new Notification(title, { body: body });
      } catch (e) {}
    }
  }
  var toastT = null;
  function showToast(msg) { var t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 6000); }

  function requestAlerts() {
    if (!("Notification" in window)) { alertsOn = !alertsOn; persistAlerts(); return; }
    if (Notification.permission === "granted") { alertsOn = !alertsOn; persistAlerts(); }
    else if (Notification.permission !== "denied") { Notification.requestPermission().then(function (p) { alertsOn = (p === "granted"); persistAlerts(); }); }
    else { alertsOn = false; persistAlerts(); showToast("Notifications are blocked in your browser settings."); }
  }
  function persistAlerts() { localStorage.setItem("disney_alerts", alertsOn ? "1" : "0"); scheduleAlerts(); syncSettings(); }

  /* ----------------------------------------------------------- overlays + settings wiring */
  function openOverlay(id) { $(id).hidden = false; }
  function closeOverlay(id) { $(id).hidden = true; }
  document.addEventListener("click", function (e) { var c = e.target.closest("[data-close]"); if (!c) return; var ov = c.closest(".sheet, .overlay"); if (ov === $("sheet")) closeSheet(); else if (ov) ov.hidden = true; });

  function buildDirectory() {
    var list = $("dirList"); list.innerHTML = "";
    BLOCKS.forEach(function (b, i) {
      var zone = DAY.zones[b.zone];
      var row = document.createElement("button"); row.className = "dir-row"; row.style.setProperty("--rc", zone.accent);
      var sceneIdx = scenes.findIndex(function (s) { return s.block === b; });
      row.innerHTML = '<span class="dr-time">' + esc(b.time) + '</span><span class="dr-name">' + esc(b.title) + '</span><span class="dr-done" data-block="' + b.id + '"></span>';
      row.addEventListener("click", function () { closeOverlay("directory"); jumpTo(sceneIdx); });
      list.appendChild(row);
    });
    updateDirCounts();
  }
  function updateDirCounts() {
    BLOCKS.forEach(function (b) {
      var done = 0, tot = (b.quests || []).length;
      (b.quests || []).forEach(function (q) { if (countDone(q.id) > 0) done++; });
      var el = document.querySelector('.dr-done[data-block="' + b.id + '"]');
      if (el) el.textContent = tot ? done + "/" + tot : "";
    });
  }

  function buildParty() {
    var list = $("partyList"); list.innerHTML = "";
    party.forEach(function (name, i) {
      var g = GKEYS[i];
      var row = document.createElement("div"); row.className = "party-row";
      row.innerHTML = '<span class="guest-badge ' + g + '">' + esc((name[0] || "?").toUpperCase()) + '</span>';
      var inp = document.createElement("input"); inp.value = name; inp.maxLength = 14;
      inp.addEventListener("change", function () { party[i] = inp.value.trim().slice(0, 14) || ("Guest " + (i + 1)); row.querySelector(".guest-badge").textContent = (party[i][0] || "?").toUpperCase(); pushParty(); });
      row.appendChild(inp); list.appendChild(row);
    });
    var mineWrap = $("partyMine"); mineWrap.innerHTML = "";
    party.forEach(function (name, i) {
      var g = GKEYS[i];
      var b = document.createElement("button"); b.textContent = name; b.className = g === mine ? "sel" : "";
      b.addEventListener("click", function () { mine = g; localStorage.setItem("disney_me", g); buildParty(); if (curSheetId) refreshSheet(curSheetId); });
      mineWrap.appendChild(b);
    });
  }

  function syncSettings() {
    setRow("alertsToggle", "alertsState", alertsOn);
    setRow("soundToggle", "soundState", soundOn);
    setRow("fxToggle", "fxState", !document.body.classList.contains("no-fx"));
    setRow("motionToggle", "motionState", document.body.classList.contains("reduce-fx"));
    var note = $("alertsNote");
    if (note) note.textContent = ("Notification" in window)
      ? "Alerts fire while this map is open. For lock-screen reminders on iPhone, add this to your Home Screen first (Share → Add to Home Screen)."
      : "This browser doesn't support notifications; you'll still see in-app reminders.";
  }
  function setRow(btnId, stateId, on) { var b = $(btnId), s = $(stateId); if (b) b.classList.toggle("on", on); if (s) s.textContent = on ? "On" : "Off"; }

  /* ----------------------------------------------------------- dedication */
  function fillDedication() {
    $("dedBody").textContent = "Disneyland is your land. Seventy-one years ago to the day — July 17, 1955 — Walt opened these gates with these words. Today, they're yours.";
    $("dedSync").innerHTML = "This is your party's <strong>shared map</strong>. Every stamp the four of you collect appears on all your phones, live — wander together, even when you split up. Time-sensitive reminders (like the World of Color queue) can buzz you in Settings.";
  }

  // one-time intro: pick which guest holds this phone, then fade into "A Park Day"
  function buildIntro() {
    var wrap = $("introWho"); if (!wrap) return; wrap.innerHTML = "";
    party.forEach(function (name, i) {
      var b = document.createElement("button"); b.textContent = name;
      b.addEventListener("click", function () {
        mine = GKEYS[i]; localStorage.setItem("disney_me", mine);
        try { localStorage.setItem("disney_intro", "1"); } catch (e) {}
        var intro = $("intro"); intro.classList.add("gone");
        window.scrollTo(0, 0);
        setTimeout(function () { intro.hidden = true; onScroll(); }, 850);
      });
      wrap.appendChild(b);
    });
  }

  /* ----------------------------------------------------------- testing */
  var scrubbing = false;
  function initTesting() {
    var peek = $("testpeek"), panel = $("testpanel");
    if (test.active) panel.hidden = false;
    peek.hidden = false;
    peek.addEventListener("click", function () { test.active = !test.active; panel.hidden = !test.active; if (!test.active) test.playing = false; else test.min = now(); updateNow(); onScroll(); });
    $("tpClose").addEventListener("click", function () { test.active = false; test.playing = false; panel.hidden = true; updateNow(); });
    $("tpLive").addEventListener("click", function () { test.active = false; test.playing = false; updateNow(); });
    var scrub = $("tpScrub");
    scrub.addEventListener("input", function () { test.active = true; panel.hidden = false; scrubbing = true; test.playing = false; $("tpPlay").classList.remove("active"); $("tpPlay").textContent = "Play"; test.min = +scrub.value; updateNow(); updateReturnNow(); refreshAhead(); });
    scrub.addEventListener("change", function () { scrubbing = false; });
    $("tpPlay").addEventListener("click", function () { test.active = true; panel.hidden = false; test.playing = !test.playing; this.classList.toggle("active", test.playing); this.textContent = test.playing ? "Pause" : "Play"; test.lastTick = performance.now(); });
    document.querySelectorAll(".tp-speed").forEach(function (btn) { btn.addEventListener("click", function () { test.speed = +btn.dataset.speed; document.querySelectorAll(".tp-speed").forEach(function (b) { b.classList.remove("active"); }); btn.classList.add("active"); }); });
    document.querySelectorAll(".tp-chip").forEach(function (btn) { btn.addEventListener("click", function () { test.active = true; panel.hidden = false; test.min = +btn.dataset.min; updateNow(); var i = nowSceneIndex(); scrollToScene(i); }); });
    var roomBtn = $("tpRoom"); function sr() { roomBtn.textContent = "Room: " + (room === ROOM_TEST ? "TEST" : "LIVE"); } sr();
    roomBtn.addEventListener("click", function () { room = room === ROOM_TEST ? ROOM_REAL : ROOM_TEST; localStorage.setItem("disney_testroom", room === ROOM_TEST ? "1" : "0"); sr(); if (db) { bindRoom(); bindParty(); } else { loadLocal(); repaintAll(); } });
    $("tpReset").addEventListener("click", function () { if (!confirm("Reset every stamp for the whole party?")) return; Object.keys(signEls).forEach(function (id) { GKEYS.forEach(function (g) { if (isDone(id, g)) setGuest(id, g, false); }); }); });
    $("tpAlert").addEventListener("click", function () { fireAlert("World of Color VQ", "Virtual queue opens in 3 minutes — get all four tickets ready."); });
    var def = document.querySelector('.tp-speed[data-speed="60"]'); if (def) def.classList.add("active");
  }
  function testLoop(ts) {
    if (test.active && test.playing) { if (!test.lastTick) test.lastTick = ts; var dt = (ts - test.lastTick) / 1000; test.lastTick = ts; test.min += dt * (test.speed / 60); if (test.min >= DAY_END) { test.min = DAY_END; test.playing = false; var pb = $("tpPlay"); if (pb) { pb.classList.remove("active"); pb.textContent = "Play"; } } updateNow(); updateReturnNow(); var tc = $("tpClock"); if (tc) tc.textContent = fmt(test.min); var s = $("tpScrub"); if (s && !scrubbing) s.value = Math.round(test.min); }
    else test.lastTick = 0;
    requestAnimationFrame(testLoop);
  }

  /* ----------------------------------------------------------- boot */
  function boot() {
    hydrateIcons();
    sizeCanvas();
    build();
    loadBackdrops();
    fillDedication();
    var live = initFirebase();
    if (!live) { loadLocal(); repaintAll(); }
    else { loadLocal(); repaintAll(); }   // paint cached immediately; firebase repaints on snapshot

    // settings state
    if (localStorage.getItem("disney_fx") === "0") document.body.classList.add("no-fx");
    buildDirectory(); buildParty(); syncSettings();

    // wiring
    $("dirBtn").addEventListener("click", function () { updateDirCounts(); openOverlay("directory"); });
    $("setBtn").addEventListener("click", function () { syncSettings(); openOverlay("settings"); });
    $("dirSummary").addEventListener("click", function () { closeOverlay("directory"); jumpTo(scenes.length - 1); });
    $("navPrev").addEventListener("click", function () { navToActivity(-1); });   // up = previous activity
    $("navNext").addEventListener("click", function () { navToActivity(1); });    // down = next activity
    $("returnNow").addEventListener("click", function () { jumpTo(nowSceneIndex()); });
    $("upNext").addEventListener("click", function () { scrollToScene(Math.min(scenes.length - 1, active + 1)); }); // middle pill = next section
    $("alertsToggle").addEventListener("click", requestAlerts);
    $("soundToggle").addEventListener("click", function () { soundOn = !soundOn; localStorage.setItem("disney_sound", soundOn ? "1" : "0"); if (soundOn) { audio(); sound("chime"); } syncSettings(); });
    $("fxToggle").addEventListener("click", function () { var off = document.body.classList.toggle("no-fx"); localStorage.setItem("disney_fx", off ? "0" : "1"); syncSettings(); });
    $("motionToggle").addEventListener("click", function () { document.body.classList.toggle("reduce-fx"); syncSettings(); });
    $("partyBtn").addEventListener("click", function () { closeOverlay("settings"); buildParty(); openOverlay("party"); });
    $("aboutBtn").addEventListener("click", function () { closeOverlay("settings"); openOverlay("info"); });
    $("enterBtn").addEventListener("click", function () { closeOverlay("info"); try { localStorage.setItem("disney_seen", "1"); } catch (e) {} });

    initTesting();
    measure();                                          // cache scene geometry + build trail/activity index
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () { sizeCanvas(); measure(); onScroll(); });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) onScroll(); });
    setInterval(function () { if (!(test.active && test.playing)) { updateNow(); updateReturnNow(); checkLiveDeadline(); } }, 20000);
    requestAnimationFrame(testLoop);

    // PWA
    if ("serviceWorker" in navigator) { try { navigator.serviceWorker.register("sw.js").catch(function () {}); } catch (e) {} }
    scheduleAlerts();

    if (test.active) test.min = DAY_START;
    updateNow(); onScroll();

    setTimeout(function () {
      measure();                                        // re-cache once fonts/layout settle
      onScroll();
      if (!localStorage.getItem("disney_intro")) { window.scrollTo(0, 0); buildIntro(); $("intro").hidden = false; }
      else scrollToScene(nowSceneIndex(), false);
    }, 400);
  }

  // catch the live VQ deadline if the app is open across it (no scheduled timer fired)
  var firedLive = {};
  function checkLiveDeadline() {
    if (test.active) return;
    var nm = realMin();
    BLOCKS.forEach(function (b) { if (b.deadline && nm >= b.deadline.atMin && nm < b.deadline.atMin + 2 && !firedLive[b.id]) { firedLive[b.id] = true; if (alertsOn) fireAlert("VQ is OPEN", b.deadline.fire || "Book the virtual queue now."); } });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
