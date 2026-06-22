/* ============================================================================
   DISNEYLAND · A DAY OF MAGIC — v2 logic
   ----------------------------------------------------------------------------
   A storybook journey. Living sky + parallax props + a curving trail of
   passport stamps. The clock gently guides ("you are here" + ahead-of-schedule
   praise only); completing stamps is the real progress. Quest state syncs via
   Firebase (or localStorage). A testing clock lets you rehearse the whole day.
   ========================================================================== */

(function () {
  "use strict";

  var DAY = window.DISNEY_DAY;
  if (!DAY) return;
  var BLOCKS = DAY.blocks;
  var DAY_START = DAY.meta.dayStartMin, DAY_END = DAY.meta.dayEndMin, SPAN = DAY_END - DAY_START;

  var TYPE_ICON = { ride: "🎢", food: "🍽️", show: "🎆", move: "🚶", action: "⚡", deadline: "⏰" };

  // time-of-day sky palette + "darkness" (0 day .. 1 night) per phase
  var SKY = {
    dawn:    { a: "#f9c8a0", b: "#b58fd6", dark: 0.18 },
    morning: { a: "#bfe3ff", b: "#8ec5ff", dark: 0.0 },
    midday:  { a: "#cdecff", b: "#7fb7ff", dark: 0.0 },
    golden:  { a: "#ffd29b", b: "#ff7e5a", dark: 0.12 },
    dusk:    { a: "#6f6db0", b: "#2b2350", dark: 0.6 },
    night:   { a: "#0b1330", b: "#05060f", dark: 1.0 },
  };

  /* ---------- elements ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var stopsEl = $("stops"), propsEl = $("props"), trailSvg = $("trail");
  var trailBase = $("trailBase"), trailGlow = $("trailGlow"), marker = $("marker");
  var fxCanvas = $("fx"), stampCountEl = $("stampCount");
  var rootStyle = document.documentElement.style;

  /* ---------- helpers ---------- */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function hex(h) { h = h.replace("#", ""); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function mix(h1, h2, t) { var a = hex(h1), b = hex(h2); return "rgb(" + Math.round(lerp(a[0], b[0], t)) + "," + Math.round(lerp(a[1], b[1], t)) + "," + Math.round(lerp(a[2], b[2], t)) + ")"; }
  function fmtClock(min) {
    min = ((Math.round(min) % 1440) + 1440) % 1440;
    var h = Math.floor(min / 60), m = min % 60, ap = h >= 12 ? "PM" : "AM", h12 = h % 12 || 12;
    return h12 + ":" + String(m).padStart(2, "0") + " " + ap;
  }
  function realMin() { var d = new Date(); return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; }

  /* ---------- time source (real clock OR testing clock) ---------- */
  var test = { active: new URLSearchParams(location.search).has("test"), min: DAY_START, playing: false, speed: 60, lastTick: 0 };
  function now() { return test.active ? test.min : realMin(); }

  /* ---------- quest/stamp state + storage + sync ---------- */
  var ROOM_REAL = "disney2026", ROOM_TEST = "disney2026_test";
  var room = (test.active && localStorage.getItem("disney_testroom") !== "0") ? ROOM_TEST : ROOM_REAL;
  var state = {}, myName = localStorage.getItem("disney_name") || "", db = null;
  var lsKey = function () { return "disney_quests_" + room; };
  function loadLocal() { try { state = JSON.parse(localStorage.getItem(lsKey()) || "{}"); } catch (e) { state = {}; } }
  function saveLocal() { try { localStorage.setItem(lsKey(), JSON.stringify(state)); } catch (e) {} }
  function isDone(id) { return !!(state[id] && state[id].done); }

  function initFirebase() {
    var cfg = window.FIREBASE_CONFIG;
    if (!cfg || cfg.apiKey === "REPLACE_ME" || typeof firebase === "undefined") return false;
    try {
      firebase.initializeApp(cfg);
      bindRoom();
      return true;
    } catch (e) { console.warn("Firebase off, local-only:", e); db = null; return false; }
  }
  function bindRoom() {
    if (typeof firebase === "undefined") { loadLocal(); repaintAll(); return; }
    if (db) { try { db.off(); } catch (e) {} }
    db = firebase.database().ref(room + "/quests");
    db.on("value", function (snap) { state = snap.val() || {}; saveLocal(); repaintAll(); });
  }
  function setQuest(id, done) {
    var rec = done ? { done: true, by: myName || "someone", at: Date.now() } : { done: false };
    state[id] = rec; saveLocal();
    if (db) { try { db.child(id).set(rec); } catch (e) {} }
    repaintStop(id); updateProgress(); refreshAhead();
  }

  /* ---------- build DOM: overture + blocks + stops ---------- */
  var stopEls = {};       // questId -> .stop element
  var blockEls = [];      // { el, block }

  function build() {
    stopsEl.innerHTML = "";

    // OVERTURE — Main Street walk
    var ov = document.createElement("section");
    ov.className = "overture";
    ov.id = "overture";
    ov.innerHTML =
      '<div class="ov-kicker">Main Street, U.S.A.</div>' +
      '<div class="ov-title">A Day of Magic</div>' +
      '<p class="ov-quote">"Here you leave today and enter the world of yesterday, tomorrow and fantasy."</p>' +
      '<div class="ov-scroll-cue">scroll into the park ↓</div>';
    stopsEl.appendChild(ov);

    BLOCKS.forEach(function (b) {
      var zone = DAY.zones[b.zone];
      var sec = document.createElement("section");
      sec.className = "block"; sec.id = "block-" + b.id;
      sec.style.setProperty("--zone", zone.accent);

      var head = document.createElement("div");
      head.className = "block-head";
      head.innerHTML =
        '<span class="block-eyebrow">' + esc(b.time) + " · " + esc(zone.label) + "</span>" +
        '<h2 class="block-title">' + esc(b.title) + "</h2>" +
        (b.subtitle ? '<p class="block-sub">' + esc(b.subtitle) + "</p>" : "");
      sec.appendChild(head);

      // strategy notes
      if (b.notes) b.notes.forEach(function (n) {
        var note = document.createElement("div");
        note.className = "block-note";
        note.innerHTML = '<span class="bn-ic">↳</span><span>' + esc(n) + "</span>";
        sec.appendChild(note);
      });

      // stops
      (b.quests || []).forEach(function (q) {
        var stop = document.createElement("div");
        stop.className = "stop" + (q.star ? " is-star" : "") + (q.optional ? " optional" : "") + (q.type === "deadline" ? " deadline" : "");
        stop.dataset.id = q.id;
        var stampWord = q.type === "food" ? "Tasted" : q.type === "show" ? "Seen" : q.type === "move" ? "Done" : "Ridden";
        stop.innerHTML =
          '<div class="medallion"><span class="med-ic">' + (TYPE_ICON[q.type] || "•") + "</span>" +
            '<span class="stamp">' + stampWord + "</span></div>" +
          '<div class="scene-card">' +
            '<div class="stop-label">' + esc(q.label) + (q.star ? ' <span class="stop-star">★</span>' : "") + "</div>" +
            (q.note ? '<div class="stop-note">' + esc(q.note) + "</div>" : "") +
            (b.deadline && q.type === "deadline" ? '<span class="deadline-clock" data-deadline="' + b.deadline.atMin + '">' + esc(b.deadline.label) + "</span>" : "") +
            '<div class="stop-by"></div>' +
          "</div>";
        stop.querySelector(".medallion").addEventListener("click", function () { onStopTap(q.id, stop); });
        sec.appendChild(stop);
        stopEls[q.id] = stop;
      });

      // LL chain reminder on ride blocks
      if ((b.quests || []).some(function (q) { return q.type === "ride"; }) && !b.alert) {
        var ll = document.createElement("div");
        ll.className = "ll-reminder";
        ll.innerHTML = '<span class="ll-ic">↻</span> Scanned in? Book your next Lightning Lane now.';
        sec.appendChild(ll);
      }

      stopsEl.appendChild(sec);
      blockEls.push({ el: sec, block: b });
    });

    // endcap
    var ec = document.createElement("footer");
    ec.id = "endcap";
    ec.innerHTML = '<div class="ec-title">A kiss goodnight</div>' +
      "<p>That's the whole day. Go make some magic. ✨</p>" +
      '<button class="ec-reset" id="resetFoot">Reset our stamps</button>';
    stopsEl.appendChild(ec);
    $("resetFoot").addEventListener("click", resetAll);

    // deadline flash overlay
    var flash = document.createElement("div"); flash.id = "deadlineFlash"; document.body.appendChild(flash);
  }

  /* ---------- props: fetch + inline the landmark SVGs ---------- */
  var propItems = [];   // { el, anchorY, depth, side }
  function buildProps() {
    propsEl.innerHTML = ""; propItems = [];
    // Main Street pair for the overture
    addProp("mainstreet-left", overtureAnchor(), 0.45, "left");
    addProp("mainstreet-right", overtureAnchor(), 0.45, "right");
    addProp("train-station", overtureAnchor() + vh() * 0.2, 0.6, "center");
    // one landmark per block
    blockEls.forEach(function (b) {
      var name = DAY.meta.landmarks[b.block.id];
      if (name) addProp(name, blockCenter(b.el), 0.55, "center");
    });
    // exact positions are set every frame by onScroll()
  }
  function overtureAnchor() { var ov = $("overture"); return ov ? ov.offsetTop + ov.offsetHeight * 0.62 : 0; }
  function blockCenter(el) { return el.offsetTop + el.offsetHeight * 0.5; }
  function addProp(name, anchorY, depth, side) {
    var div = document.createElement("div");
    div.className = "prop prop-" + side;
    if (side === "left") { div.style.left = "0"; div.style.right = "auto"; div.style.transform = "none"; div.style.width = "min(46vw,340px)"; }
    else if (side === "right") { div.style.left = "auto"; div.style.right = "0"; div.style.transform = "none"; div.style.width = "min(46vw,340px)"; }
    propsEl.appendChild(div);
    var item = { el: div, anchorY: anchorY, depth: depth, side: side };
    propItems.push(item);
    fetch("assets/disney/" + name + ".svg").then(function (r) { return r.ok ? r.text() : ""; })
      .then(function (txt) { if (txt) div.innerHTML = txt; }).catch(function () {});
  }

  /* ---------- layout: trail geometry + medallion placement ---------- */
  var H = 0;            // document height
  function vw() { return window.innerWidth; }
  function vh() { return window.innerHeight; }
  function swayAmp() { return clamp(vw() * 0.16, 26, 70); }
  function swayX(y) { return vw() / 2 + swayAmp() * Math.sin(y / 460); }

  function layout() {
    H = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    // trail svg sizing
    trailSvg.setAttribute("width", vw());
    trailSvg.setAttribute("height", H);
    trailSvg.setAttribute("viewBox", "0 0 " + vw() + " " + H);
    // build the path
    var startY = (($("overture") || {}).offsetHeight || 0) * 0.5;
    var d = "M " + swayX(startY).toFixed(1) + " " + startY.toFixed(1);
    for (var y = startY + 18; y <= H; y += 18) d += " L " + swayX(y).toFixed(1) + " " + y.toFixed(1);
    trailBase.setAttribute("d", d);
    trailGlow.setAttribute("d", d);
    glowLen = trailGlow.getTotalLength();
    trailGlow.style.strokeDasharray = glowLen;

    // place medallions onto the sway path
    Object.keys(stopEls).forEach(function (id) {
      var med = stopEls[id].querySelector(".medallion");
      var r = med.getBoundingClientRect();
      var yc = r.top + window.scrollY + r.height / 2;
      med.style.transform = "translateX(" + (swayX(yc) - vw() / 2).toFixed(1) + "px)";
    });

    // recompute prop anchors now that heights are known
    propItems.length = 0;
    buildPropsAnchorsOnly();
    onScroll(); tickClock();
  }
  function buildPropsAnchorsOnly() {
    // re-derive anchors for existing prop elements (DOM already built)
    var divs = propsEl.querySelectorAll(".prop");
    // first three are overture pair + station; rest map to blocks in order
    var idx = 0, ov = overtureAnchor();
    propItems = [];
    if (divs[idx]) propItems.push({ el: divs[idx++], anchorY: ov, depth: 0.45, side: "left" });
    if (divs[idx]) propItems.push({ el: divs[idx++], anchorY: ov, depth: 0.45, side: "right" });
    if (divs[idx]) propItems.push({ el: divs[idx++], anchorY: ov + vh() * 0.2, depth: 0.6, side: "center" });
    blockEls.forEach(function (b) {
      if (!DAY.meta.landmarks[b.block.id]) return;
      if (divs[idx]) propItems.push({ el: divs[idx++], anchorY: blockCenter(b.el), depth: 0.55, side: "center" });
    });
  }

  /* ---------- time → document Y ---------- */
  var anchors = [];     // [{min, y}]
  function buildAnchors() {
    anchors = [];
    blockEls.forEach(function (b) {
      var med = b.el.querySelector(".medallion");
      var y = med ? (med.getBoundingClientRect().top + window.scrollY) : (b.el.offsetTop + 40);
      anchors.push({ min: b.block.startMin, y: y });
    });
    var ec = $("endcap");
    anchors.push({ min: DAY_END, y: ec ? ec.offsetTop : H });
  }
  function yForMin(t) {
    if (!anchors.length) return 0;
    if (t <= anchors[0].min) return anchors[0].y;
    for (var i = 0; i < anchors.length - 1; i++) {
      if (t >= anchors[i].min && t < anchors[i + 1].min) {
        var f = (t - anchors[i].min) / (anchors[i + 1].min - anchors[i].min);
        return lerp(anchors[i].y, anchors[i + 1].y, f);
      }
    }
    return anchors[anchors.length - 1].y;
  }

  /* ---------- scroll → sky, parallax, marker fill, return-now ---------- */
  var glowLen = 0, ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var sy = window.scrollY, centerY = sy + vh() / 2;

      // --- living sky by what you're looking at ---
      var phase = "midday", nextPhase = "midday", f = 0, accent = "#c98a5e";
      for (var i = 0; i < blockEls.length; i++) {
        var top = blockEls[i].el.offsetTop;
        var bot = (i + 1 < blockEls.length) ? blockEls[i + 1].el.offsetTop : H;
        if (centerY >= top && centerY < bot) {
          phase = DAY.meta.sky[blockEls[i].block.id] || "midday";
          nextPhase = (i + 1 < blockEls.length) ? (DAY.meta.sky[blockEls[i + 1].block.id] || phase) : phase;
          f = clamp((centerY - top) / (bot - top), 0, 1);
          accent = DAY.zones[blockEls[i].block.zone].accent;
          break;
        }
      }
      if (centerY < (blockEls[0] ? blockEls[0].el.offsetTop : 0)) { phase = "dawn"; nextPhase = "dawn"; f = 0; }
      var s1 = SKY[phase], s2 = SKY[nextPhase];
      rootStyle.setProperty("--sky-a", mix(s1.a, s2.a, f));
      rootStyle.setProperty("--sky-b", mix(s1.b, s2.b, f));
      var dark = lerp(s1.dark, s2.dark, f);
      rootStyle.setProperty("--star-op", clamp((dark - 0.45) / 0.55, 0, 1).toFixed(2));
      rootStyle.setProperty("--sun-op", clamp(1 - dark * 1.4, 0, 1).toFixed(2));
      rootStyle.setProperty("--moon-op", clamp((dark - 0.4) / 0.6, 0, 1).toFixed(2));
      rootStyle.setProperty("--zone", accent);
      rootStyle.setProperty("--tint", mixA(accent, 0.18));

      // celestial arc by overall day progress
      var p = clamp(centerY / H, 0, 1);
      rootStyle.setProperty("--sun-x", (10 + 78 * p).toFixed(1) + "%");
      rootStyle.setProperty("--sun-y", (vh() * (0.66 - 0.46 * Math.sin(p * Math.PI)) / vh() * 100).toFixed(1) + "vh");
      rootStyle.setProperty("--moon-x", (12 + 76 * p).toFixed(1) + "%");
      rootStyle.setProperty("--moon-y", (vh() * (0.6 - 0.4 * Math.sin(p * Math.PI)) / vh() * 100).toFixed(1) + "vh");

      // --- parallax props ---
      for (var k = 0; k < propItems.length; k++) {
        var it = propItems[k];
        var off = (it.anchorY - centerY) * it.depth;
        var op = clamp(1 - Math.abs(off) / (vh() * 0.95), 0, 1);
        var baseX = it.side === "center" ? "-50%" : "0";
        it.el.style.transform = "translate(" + baseX + "," + off.toFixed(1) + "px)";
        it.el.style.opacity = (op * 0.96).toFixed(2);
      }

      // --- return-to-now visibility ---
      var my = yForMin(now());
      var onScreen = my > sy + 70 && my < sy + vh() - 70;
      var rn = $("returnNow"); if (rn) rn.hidden = onScreen;
    });
  }
  function mixA(h, a) { var c = hex(h); return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }

  /* ---------- clock tick: marker, now-block, deadlines, ahead ---------- */
  var curBlock = -1, deadlinesFired = {};
  function tickClock() {
    var min = now();
    var my = yForMin(min);
    marker.style.top = my + "px";
    marker.style.left = swayX(my) + "px";
    if (glowLen) { var frac = clamp(my / H, 0, 1); trailGlow.style.strokeDashoffset = (glowLen * (1 - frac)).toFixed(1); }

    // current block + now stops
    var idx = 0;
    for (var i = 0; i < BLOCKS.length; i++) { if (BLOCKS[i].startMin <= min) idx = i; else break; }
    if (idx !== curBlock) {
      curBlock = idx;
      blockEls.forEach(function (b, i) {
        var on = i === idx; b.el.classList.toggle("is-now", on);
        b.el.querySelectorAll(".stop").forEach(function (s) { s.classList.toggle("is-now", on); });
      });
    }

    // testing readout
    if (test.active) {
      var tc = $("tpClock"); if (tc) tc.textContent = fmtClock(min);
      var sc = $("tpScrub"); if (sc && !scrubbing) sc.value = Math.round(min);
    }

    // deadlines
    BLOCKS.forEach(function (b) {
      if (!b.deadline) return;
      var dueSoon = min >= b.deadline.atMin && min < b.deadline.atMin + 30;
      var el = document.querySelector('#block-' + b.id + ' .deadline-clock');
      if (el) el.textContent = b.deadline.label + (dueSoon ? " — GO!" : "");
      if (min >= b.deadline.atMin && !deadlinesFired[b.id]) { deadlinesFired[b.id] = true; fireDeadline(b); }
      if (min < b.deadline.atMin) deadlinesFired[b.id] = false;
    });

    refreshAhead();
  }

  function fireDeadline(b) {
    var flash = $("deadlineFlash");
    if (flash && fxOn()) { flash.classList.remove("show"); void flash.offsetWidth; flash.classList.add("show"); }
    if (navigator.vibrate) try { navigator.vibrate([60, 40, 60]); } catch (e) {}
    if (fxOn()) for (var i = 0; i < 20; i++) (function (i) { setTimeout(function () { burst(innerWidth * (0.2 + Math.random() * 0.6), innerHeight * (0.25 + Math.random() * 0.3), DAY.alertAccent, 1); }, i * 30); })(i);
    console.log("[deadline]", b.deadline.fire);
  }

  /* ---------- ahead-of-schedule (praise only) ---------- */
  function refreshAhead() {
    var min = now();
    var expected = 0, total = 0, done = 0;
    BLOCKS.forEach(function (b) {
      (b.quests || []).forEach(function (q) {
        total++;
        if (isDone(q.id)) done++;
        if (b.startMin <= min) expected++;
      });
    });
    var surplus = done - expected;
    var banner = $("aheadBanner");
    if (surplus >= 2) {
      banner.hidden = false;
      banner.textContent = "✨ You're ahead of schedule — " + surplus + " stamps of bonus magic time!";
      marker.classList.add("ahead");
    } else {
      banner.hidden = true;
      marker.classList.remove("ahead");
    }
  }

  /* ---------- stamp interactions ---------- */
  var pendingTap = null;
  function onStopTap(id, stop) {
    if (!myName) { pendingTap = { id: id, stop: stop }; openNameGate(); return; }
    var nowDone = !isDone(id);
    setQuest(id, nowDone);
    if (nowDone) {
      var r = stop.querySelector(".medallion").getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, getComputedStyle(stop).getPropertyValue("--zone") || "#ffcf6b", 1.2);
      if (navigator.vibrate) try { navigator.vibrate(14); } catch (e) {}
    }
  }
  function repaintStop(id) {
    var el = stopEls[id]; if (!el) return;
    var done = isDone(id);
    el.classList.toggle("done", done);
    var by = el.querySelector(".stop-by");
    if (by) by.textContent = done && state[id].by ? "✓ stamped by " + state[id].by : "";
  }
  function repaintAll() { Object.keys(stopEls).forEach(repaintStop); updateProgress(); refreshAhead(); }
  function updateProgress() {
    var t = Object.keys(stopEls).length, d = Object.keys(stopEls).filter(isDone).length;
    stampCountEl.textContent = d + " of " + t + " stamps";
  }
  function resetAll() {
    if (!confirm("Reset every stamp for the whole party?")) return;
    Object.keys(stopEls).forEach(function (id) { setQuest(id, false); });
  }

  /* ---------- return to now ---------- */
  $("returnNow").addEventListener("click", function () {
    var my = yForMin(now());
    window.scrollTo({ top: my - vh() * 0.42, behavior: prefersReduced() ? "auto" : "smooth" });
  });

  /* ---------- sparkle FX (canvas) ---------- */
  var ctx, particles = [], rafId = null, trailAccum = 0;
  function prefersReduced() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function fxOn() { return !document.body.classList.contains("no-fx") && !document.body.classList.contains("reduce-fx") && !prefersReduced(); }
  function sizeCanvas() { var dpr = Math.min(window.devicePixelRatio || 1, 2); fxCanvas.width = innerWidth * dpr; fxCanvas.height = innerHeight * dpr; ctx = fxCanvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function burst(x, y, color, scale) {
    if (!fxOn()) return; scale = scale || 1; color = (color || "#ffcf6b").trim();
    for (var i = 0; i < 14 * scale; i++) { var a = Math.random() * Math.PI * 2, sp = (1 + Math.random() * 3) * scale;
      particles.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, life: 1, decay: 0.012 + Math.random() * 0.02, size: 1.5 + Math.random() * 2.6, color: color }); }
    ensureLoop();
  }
  function ensureLoop() { if (!rafId) rafId = requestAnimationFrame(loop); }
  function loop() {
    rafId = null; if (!ctx) return;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (fxOn()) { trailAccum++; if (trailAccum % 7 === 0) {
      var r = marker.getBoundingClientRect();
      if (r.top > -40 && r.top < innerHeight + 40) particles.push({ x: r.left + r.width / 2 + (Math.random() - 0.5) * 10, y: r.top + r.height / 2, vx: (Math.random() - 0.5) * 0.4, vy: -0.3 - Math.random() * 0.5, life: 1, decay: 0.02, size: 1 + Math.random() * 1.8, color: getComputedStyle(rootStyleEl()).getPropertyValue("--gold").trim() || "#ffcf6b" });
    } }
    for (var i = particles.length - 1; i >= 0; i--) { var p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.life -= p.decay; if (p.life <= 0) { particles.splice(i, 1); continue; } ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; star(p.x, p.y, p.size * (0.5 + p.life)); }
    ctx.globalAlpha = 1;
    if (particles.length || fxOn()) rafId = requestAnimationFrame(loop);
  }
  function rootStyleEl() { return document.documentElement; }
  function star(x, y, r) { ctx.beginPath(); for (var i = 0; i < 4; i++) { var a = (Math.PI / 2) * i; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.lineTo(x + Math.cos(a + Math.PI / 4) * r * 0.4, y + Math.sin(a + Math.PI / 4) * r * 0.4); } ctx.closePath(); ctx.fill(); }
  document.addEventListener("visibilitychange", function () { if (document.hidden && rafId) { cancelAnimationFrame(rafId); rafId = null; } else ensureLoop(); });

  /* ---------- name gate ---------- */
  function openNameGate() {
    var choices = $("nameChoices"); choices.innerHTML = "";
    ["Nolan", "Friend 2", "Friend 3", "Friend 4"].forEach(function (n) { var b = document.createElement("button"); b.type = "button"; b.textContent = n; b.addEventListener("click", function () { commitName(n); }); choices.appendChild(b); });
    $("namegate").hidden = false;
  }
  function commitName(n) {
    myName = n.trim().slice(0, 14) || "Guest"; localStorage.setItem("disney_name", myName);
    $("namegate").hidden = true;
    if (pendingTap) { var p = pendingTap; pendingTap = null; onStopTap(p.id, p.stop); }
  }
  $("nameForm").addEventListener("submit", function (e) { e.preventDefault(); var v = $("nameInput").value.trim(); if (v) commitName(v); });

  /* ---------- info / dedication overlay ---------- */
  function fillDedication() {
    $("dedBody").textContent = "Disneyland is your land. Seventy-one years ago today — July 17, 1955 — Walt opened these gates. Today they're yours.";
    $("dedSync").innerHTML = "This is your party's <strong>shared map</strong>. Every stamp you collect appears on all four phones, live. One day, two parks, endless magic — wander together, even when you split up.";
  }
  $("infoBtn").addEventListener("click", function () { $("info").hidden = false; });
  $("enterBtn").addEventListener("click", function () { $("info").hidden = true; try { localStorage.setItem("disney_seen", "1"); } catch (e) {} });

  /* ---------- effects toggle ---------- */
  function applyFxPref() { var off = localStorage.getItem("disney_fx") === "0"; document.body.classList.toggle("no-fx", off); $("fxBtn").style.opacity = off ? 0.45 : 1; if (!off) ensureLoop(); }
  $("fxBtn").addEventListener("click", function () { var off = localStorage.getItem("disney_fx") === "0"; localStorage.setItem("disney_fx", off ? "1" : "0"); applyFxPref(); });

  /* ---------- testing panel ---------- */
  var scrubbing = false;
  function initTesting() {
    var peek = $("testpeek"), panel = $("testpanel");
    if (test.active) panel.hidden = false;
    peek.hidden = false;
    peek.addEventListener("click", function () { test.active = !test.active; panel.hidden = !test.active; if (!test.active) test.playing = false; else test.min = now(); tickClock(); onScroll(); });
    $("tpClose").addEventListener("click", function () { test.active = false; test.playing = false; panel.hidden = true; tickClock(); onScroll(); });
    $("tpLive").addEventListener("click", function () { test.active = false; test.playing = false; tickClock(); onScroll(); });
    var scrub = $("tpScrub");
    scrub.addEventListener("input", function () { test.active = true; panel.hidden = false; scrubbing = true; test.playing = false; $("tpPlay").classList.remove("active"); $("tpPlay").textContent = "▶ Play"; test.min = +scrub.value; tickClock(); onScroll(); });
    scrub.addEventListener("change", function () { scrubbing = false; });
    $("tpPlay").addEventListener("click", function () { test.active = true; panel.hidden = false; test.playing = !test.playing; this.classList.toggle("active", test.playing); this.textContent = test.playing ? "⏸ Pause" : "▶ Play"; test.lastTick = performance.now(); });
    document.querySelectorAll(".tp-speed").forEach(function (btn) { btn.addEventListener("click", function () { test.speed = +btn.dataset.speed; document.querySelectorAll(".tp-speed").forEach(function (b) { b.classList.remove("active"); }); btn.classList.add("active"); }); });
    document.querySelectorAll(".tp-chip").forEach(function (btn) { btn.addEventListener("click", function () { test.active = true; panel.hidden = false; test.playing = false; $("tpPlay").classList.remove("active"); $("tpPlay").textContent = "▶ Play"; test.min = +btn.dataset.min; tickClock(); var my = yForMin(test.min); window.scrollTo({ top: my - vh() * 0.42, behavior: "smooth" }); }); });
    var roomBtn = $("tpRoom"); function syncRoom() { roomBtn.textContent = "Room: " + (room === ROOM_TEST ? "TEST" : "LIVE"); } syncRoom();
    roomBtn.addEventListener("click", function () { room = room === ROOM_TEST ? ROOM_REAL : ROOM_TEST; localStorage.setItem("disney_testroom", room === ROOM_TEST ? "1" : "0"); syncRoom(); if (db) bindRoom(); else { loadLocal(); repaintAll(); } });
    $("tpReset").addEventListener("click", resetAll);
    var mo = $("tpMotion"); mo.addEventListener("click", function () { var on = document.body.classList.toggle("reduce-fx"); mo.textContent = "Reduce motion: " + (on ? "on" : "off"); mo.classList.toggle("active", on); if (!on) ensureLoop(); });
    var def = document.querySelector('.tp-speed[data-speed="60"]'); if (def) def.classList.add("active");
  }
  function testLoop(ts) {
    if (test.active && test.playing) { if (!test.lastTick) test.lastTick = ts; var dt = (ts - test.lastTick) / 1000; test.lastTick = ts; test.min += dt * (test.speed / 60); if (test.min >= DAY_END) { test.min = DAY_END; test.playing = false; var pb = $("tpPlay"); if (pb) { pb.classList.remove("active"); pb.textContent = "▶ Play"; } } tickClock(); }
    else test.lastTick = 0;
    requestAnimationFrame(testLoop);
  }

  /* ---------- boot ---------- */
  function boot() {
    sizeCanvas();
    build();
    buildProps();
    fillDedication();
    // two layout passes (fonts/props can shift heights); also after a short delay
    requestAnimationFrame(function () { layout(); buildAnchors(); finishBoot(); });
  }
  function finishBoot() {
    var live = initFirebase();
    if (!live) { loadLocal(); repaintAll(); }
    applyFxPref();
    initTesting();
    watchBattery();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () { sizeCanvas(); layout(); buildAnchors(); onScroll(); });
    setInterval(function () { if (!(test.active && test.playing)) tickClock(); }, 20000);
    requestAnimationFrame(testLoop);

    if (test.active) test.min = DAY_START;
    onScroll(); tickClock();

    // re-measure after web fonts settle, then position to "now" / show dedication
    setTimeout(function () {
      layout(); buildAnchors(); onScroll(); tickClock();
      var firstRun = !localStorage.getItem("disney_seen");
      if (firstRun) { $("info").hidden = false; }
      else { var my = yForMin(now()); window.scrollTo({ top: Math.max(0, my - vh() * 0.42), behavior: "auto" }); }
    }, 450);
  }
  function watchBattery() {
    if (!navigator.getBattery) return;
    navigator.getBattery().then(function (bat) { function chk() { if (!bat.charging && bat.level <= 0.2) document.body.classList.add("reduce-fx"); } bat.addEventListener("levelchange", chk); bat.addEventListener("chargingchange", chk); chk(); }).catch(function () {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
