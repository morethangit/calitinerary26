/* ============================================================================
   CALIFORNIA ROAD TRIP — APP LOGIC
   ----------------------------------------------------------------------------
   The full itinerary is encrypted in data.enc.js and only decrypted in the
   browser after the family passcode is entered. The public countdown info
   (title + dates) comes from config.js. You normally won't edit this file —
   edit data.js / secrets.plain.json and re-run  node encrypt.mjs <passcode>.
   ========================================================================== */

(function () {
  "use strict";

  // Public, non-sensitive countdown info (title + dates). Always available.
  const CFG = window.TRIP_CONFIG || {};

  // The itinerary — populated only after a successful unlock.
  let TRIP_DATA = null;
  let days = [];
  let SECRETS = {};

  /* ---------- hidden test mode — fakes "now" for demoing TODAY/is-now ---------- */
  const TEST_KEY = "trip_test_override";
  let testOverride = null;
  (function loadTestOverride() {
    try {
      const raw = localStorage.getItem(TEST_KEY);
      if (raw) { const d = new Date(raw); if (!isNaN(d)) testOverride = d; }
    } catch (e) {}
  })();
  function getNow() { return testOverride || new Date(); }
  function setTestOverride(d) {
    testOverride = d;
    try { localStorage.setItem(TEST_KEY, d.toISOString()); } catch (e) {}
  }
  function clearTestOverride() {
    testOverride = null;
    try { localStorage.removeItem(TEST_KEY); } catch (e) {}
  }

  /* ---------- date helpers (all in local time, date-only) ---------- */
  function ymd(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function parseDate(s) {
    const [y, m, d] = String(s).split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  function todayDate() {
    const n = getNow();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
  function daysBetween(a, b) {
    return Math.round((b - a) / 86400000);
  }
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  function prettyDate(s) {
    const d = parseDate(s);
    return MONTHS[d.getMonth()] + " " + d.getDate();
  }
  // "9:20 AM" -> minutes since midnight; non-clock labels ("Evening", "Optional") return null
  function parseClockTime(t) {
    const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(t || "").trim());
    if (!m) return null;
    let h = parseInt(m[1], 10) % 12;
    if (/pm/i.test(m[3])) h += 12;
    return h * 60 + parseInt(m[2], 10);
  }

  /* ---------- link builders ---------- */
  function mapsUrl(q) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q); }
  function trailUrl(q) { return "https://www.alltrails.com/explore?q=" + encodeURIComponent(q); }
  function resolveUrl(item) {
    if (!item) return "";
    if (item.url) return item.url;
    if (item.map) return mapsUrl(item.map);
    if (item.trail) return trailUrl(item.trail);
    return "";
  }

  /* ---------- tiny DOM helpers ---------- */
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  /* ---------- trip dates / current-day logic (from CFG, pre-decrypt) ---------- */
  const start = parseDate(CFG.startDate || "2026-07-16");
  const end = parseDate(CFG.endDate || CFG.startDate || "2026-07-16");
  const dayCount = Math.max(1, daysBetween(start, end) + 1);
  let today = todayDate();
  function refreshToday() { today = todayDate(); }
  function daysUntil() { return daysBetween(today, start); }

  function todayIndex() {
    if (today < start) return 0;
    if (today > end) return dayCount - 1;
    return Math.max(0, Math.min(dayCount - 1, daysBetween(start, today)));
  }
  function isToday(day) { return ymd(today) === day.date; }
  function inTripWindow() { return today >= start && today <= end; }

  /* ---------- references ---------- */
  const gate = document.getElementById("gate");
  const lock = document.getElementById("lock");
  const app = document.getElementById("app");
  const bottomBar = document.getElementById("bottomBar");
  const container = document.getElementById("dayContainer");
  const todayJump = document.getElementById("todayJump");

  let current = todayIndex();
  let pendingTarget = null;

  /* ---------- passcode + decryption (whole itinerary) ---------- */
  const LS_KEY = "trip_pass_v1";
  const encTextDec = new TextDecoder();
  const encTextEnc = new TextEncoder();

  function hasEnc() { return !!window.TRIP_SECRETS_ENC; }
  function isUnlocked() { return TRIP_DATA != null; }
  function b64ToBytes(b64) {
    const bin = atob(b64);
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  }
  async function deriveKey(pass, salt, iter) {
    const baseKey = await crypto.subtle.importKey("raw", encTextEnc.encode(pass), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: salt, iterations: iter, hash: "SHA-256" },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
  }
  // returns the decrypted { trip, secrets } payload, or null on a wrong passcode
  async function tryDecrypt(pass) {
    const E = window.TRIP_SECRETS_ENC;
    if (!E) return null;
    try {
      const key = await deriveKey(pass, b64ToBytes(E.salt), E.iter);
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToBytes(E.iv) }, key, b64ToBytes(E.data));
      return JSON.parse(encTextDec.decode(plain));
    } catch (e) {
      return null;
    }
  }
  async function attemptUnlock(pass, remember) {
    const payload = await tryDecrypt(pass);
    if (payload && payload.trip && Array.isArray(payload.trip.days)) {
      TRIP_DATA = payload.trip;
      days = TRIP_DATA.days;
      SECRETS = payload.secrets || {};
      if (remember) { try { localStorage.setItem(LS_KEY, pass); } catch (e) {} }
      return true;
    }
    return false;
  }

  /* ---------- screens ---------- */
  function setBottomBarVisible(visible) {
    bottomBar.classList.toggle("is-visible", visible);
  }
  function showGate() {
    const n = daysUntil();
    document.getElementById("gateNumber").textContent = n;
    document.getElementById("gateUnit").textContent = n === 1 ? "day" : "days";
    document.getElementById("gateSub").textContent =
      (CFG.title || "Trip") + " · " + prettyDate(CFG.startDate) + ", " + parseDate(CFG.startDate).getFullYear();
    gate.hidden = false; lock.hidden = true; app.hidden = true; setBottomBarVisible(false);
    todayJump.hidden = true;
  }
  function showLock(targetIndex) {
    pendingTarget = targetIndex != null ? targetIndex : todayIndex();
    gate.hidden = true; lock.hidden = false; app.hidden = true; setBottomBarVisible(false);
    todayJump.hidden = true;
    const input = document.getElementById("lockInput");
    if (input) setTimeout(() => input.focus(), 80);
  }
  function enterApp(startIndex) {
    gate.hidden = true; lock.hidden = true; app.hidden = false; setBottomBarVisible(true);
    current = startIndex != null ? startIndex : current;
    render(0);
  }

  /* ---------- render one day ---------- */
  function render(direction) {
    const day = days[current];
    if (!day) return;
    document.body.setAttribute("data-theme", day.theme);

    const card = el("article", "day");
    if (direction > 0) card.classList.add("from-right");
    else if (direction < 0) card.classList.add("from-left");

    /* hero */
    const hero = el("header", "hero");
    const eyebrow = el("div", "hero-eyebrow",
      "Day " + day.num + " · " + day.weekday +
      (isToday(day) ? '<span class="hero-today">TODAY</span>' : ""));
    if (day.num === 1) eyebrow.addEventListener("click", openTestModePopup);
    hero.appendChild(eyebrow);
    hero.appendChild(el("h1", null, esc(day.title)));
    if (day.tagline) hero.appendChild(el("p", "hero-tagline", esc(day.tagline)));

    const meta = el("div", "hero-meta");
    const metaTop = el("div", "hero-meta-top");
    if (day.stay && day.stay.name) {
      const u = resolveUrl(day.stay);
      const chip = u ? el("a", "hero-chip linkish") : el("div", "hero-chip");
      if (u) { chip.href = u; chip.target = "_blank"; chip.rel = "noopener"; }
      chip.innerHTML = '<span class="ic">🛏️</span><span>' + esc(day.stay.name) + "</span>";
      metaTop.appendChild(chip);
    }
    if (day.stay && day.stay.coords && window.Weather) {
      const wchip = el("div", "hero-chip hero-chip-weather is-loading", '<span class="ic">⛅</span><span class="wx-text">Loading…</span>');
      metaTop.appendChild(wchip);
      const dayNum = day.num;
      Weather.get(day.date, day.stay.coords).then(w => {
        if (days[current].num !== dayNum) return; // user navigated away before this resolved
        wchip.classList.remove("is-loading");
        if (!w) {
          wchip.querySelector(".wx-text").textContent = "Forecast not available yet";
          return;
        }
        wchip.querySelector(".wx-text").textContent =
          w.label + " " + Math.round(w.tMax) + "°/" + Math.round(w.tMin) + "°";
      });
    }
    if (metaTop.children.length) meta.appendChild(metaTop);

    if (day.drive && day.drive.from && day.drive.to) {
      const route = el("a", "hero-route");
      route.href = "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(day.drive.from) + "&destination=" + encodeURIComponent(day.drive.to);
      route.target = "_blank";
      route.rel = "noopener noreferrer";
      route.setAttribute("aria-label", "Open route: " + day.drive.from + " to " + day.drive.to + " in Maps");
      route.innerHTML =
        '<div class="hero-route-track">' +
          '<span class="hero-route-dot"></span>' +
          '<span class="hero-route-line"><span class="hero-route-duration">' + esc(day.drive.duration || "") + "</span></span>" +
          '<span class="hero-route-dot"></span>' +
        "</div>" +
        '<div class="hero-route-labels"><span>' + esc(day.drive.from) + "</span><span>" + esc(day.drive.to) + "</span></div>" +
        (day.drive.note ? '<div class="hero-route-note">' + esc(day.drive.note) + "</div>" : "");
      meta.appendChild(route);
    } else if (day.drive) {
      meta.appendChild(el("div", "hero-chip", "<span>" + esc(day.drive) + "</span>"));
    }
    hero.appendChild(meta);
    card.appendChild(hero);

    /* EXPERIENCE — prominent launch CTA for a custom standalone page (e.g. Disney) */
    if (day.experience && day.experience.href) {
      const exp = el("a", "experience-cta");
      exp.href = day.experience.href;
      exp.innerHTML =
        '<span class="exp-spark">✨</span>' +
        '<span class="exp-body">' +
          '<span class="exp-label">' + esc(day.experience.label) + "</span>" +
          (day.experience.sub ? '<span class="exp-sub">' + esc(day.experience.sub) + "</span>" : "") +
        "</span>" +
        '<span class="exp-go">→</span>';
      card.appendChild(exp);
    }

    /* SCHEDULE — each bullet may be a string or { time, text } */
    if (day.schedule && day.schedule.length) {
      const sec = section("🗓️", "Schedule");
      const ul = el("ul", "timeline");
      // on the current day, highlight the most recent item whose clock time has passed
      const now = getNow();
      const nowMinutes = isToday(day) ? now.getHours() * 60 + now.getMinutes() : null;
      let nowLi = null;
      const mentionCandidates = locMentionCandidates(day.locations);
      day.schedule.forEach(s => {
        const item = (typeof s === "string") ? { text: s } : s;
        const li = el("li");
        if (item.time) {
          li.classList.add("has-time");
          li.appendChild(el("span", "t-time", esc(item.time)));
        }
        const textSpan = el("span", "t-text", locMentionHTML(item.text, mentionCandidates, day.date));
        li.appendChild(textSpan);
        textSpan.querySelectorAll(".loc-mention").forEach(btn => {
          btn.addEventListener("click", () => jumpToLocation(btn.dataset.locTarget));
        });
        ul.appendChild(li);
        if (nowMinutes != null) {
          const mins = parseClockTime(item.time);
          if (mins != null && mins <= nowMinutes) nowLi = li;
        }
      });
      if (nowLi) nowLi.classList.add("is-now");
      sec.appendChild(wrapCard(ul));
      card.appendChild(sec);
    }

    /* LOCATIONS */
    if (day.locations && day.locations.length) {
      const sec = section("📍", "Locations");
      const list = el("div", "loc-list");
      day.locations.forEach((loc, idx) => list.appendChild(locationEl(loc, day.date, idx)));
      sec.appendChild(list);
      card.appendChild(sec);
    }

    /* LINKS */
    if (day.links && day.links.length) {
      const sec = section("🔗", "Links");
      const list = el("div", "link-list");
      day.links.forEach(lk => {
        const a = el("a", "link-row", esc(lk.label));
        a.href = lk.url; a.target = "_blank"; a.rel = "noopener";
        list.appendChild(a);
      });
      sec.appendChild(list);
      card.appendChild(sec);
    }

    /* TIPS */
    if (day.tips && day.tips.length) {
      const sec = section("💡", "Tips");
      const list = el("div", "tips");
      day.tips.forEach(t => {
        const row = el("div", "tip");
        row.innerHTML = '<span class="tip-ic">✨</span><span>' + esc(t) + "</span>";
        list.appendChild(row);
      });
      sec.appendChild(list);
      card.appendChild(sec);
    }

    /* PACKING CHECKLIST — static, only present on the day(s) it's defined for */
    if (day.packing && day.packing.length) {
      const sec = section("🎒", "Packing Checklist");
      const list = el("div", "tips packing");
      day.packing.forEach(t => {
        const row = el("div", "tip");
        row.innerHTML = '<span class="tip-ic">☐</span><span>' + esc(t) + "</span>";
        list.appendChild(row);
      });
      sec.appendChild(list);
      card.appendChild(sec);
    }

    /* CONFIRMATIONS (collapsible) — decrypted alongside the itinerary */
    const conf = SECRETS && SECRETS[day.num];
    if (conf && conf.length) {
      const det = el("details", "confs");
      det.appendChild(el("summary", null, "🔒 Confirmation numbers"));
      const list = el("div", "conf-list");
      conf.forEach(c => {
        const item = el("div", "conf-item");
        const body = el("div", "conf-body");
        body.appendChild(el("span", "conf-label", esc(c.label)));
        body.appendChild(el("span", "conf-value", esc(c.value)));
        item.appendChild(body);
        const copyBtn = document.createElement("button");
        copyBtn.className = "conf-copy";
        copyBtn.textContent = "Copy";
        copyBtn.setAttribute("aria-label", "Copy " + c.label);
        copyBtn.addEventListener("click", () => {
          const finish = () => {
            copyBtn.textContent = "✓ Copied";
            copyBtn.classList.add("copied");
            setTimeout(() => { copyBtn.textContent = "Copy"; copyBtn.classList.remove("copied"); }, 1800);
          };
          if (navigator.clipboard) {
            navigator.clipboard.writeText(c.value).then(finish).catch(finish);
          } else {
            const ta = document.createElement("textarea");
            ta.value = c.value; ta.style.position = "fixed"; ta.style.opacity = "0";
            document.body.appendChild(ta); ta.select(); document.execCommand("copy");
            document.body.removeChild(ta); finish();
          }
        });
        item.appendChild(copyBtn);
        list.appendChild(item);
      });
      det.appendChild(list);
      card.appendChild(det);
    }

    /* tiny "lock this device" control */
    const foot = el("div", "app-foot");
    const lockBtn = el("button", "forget-btn", "🔓 Lock this device");
    lockBtn.addEventListener("click", () => {
      try { localStorage.removeItem(LS_KEY); } catch (e) {}
      location.reload();
    });
    foot.appendChild(lockBtn);
    card.appendChild(foot);

    container.innerHTML = "";
    container.appendChild(card);
    window.scrollTo({ top: 0, behavior: direction === 0 ? "auto" : "smooth" });
    updateBar();
    updateThemeColor();
    if (location.hash !== "#day-" + day.num) {
      history.replaceState(null, "", "#day-" + day.num);
    }
  }

  function section(icon, title) {
    const sec = el("section", "section");
    const head = el("div", "section-head");
    head.appendChild(el("span", "dot"));
    head.appendChild(el("h2", null, icon + " " + title));
    sec.appendChild(head);
    return sec;
  }
  function wrapCard(child) {
    const c = el("div", "card");
    c.appendChild(child);
    return c;
  }
  /* ---------- linking schedule text mentions to their Locations card ---------- */
  function locElId(dayDate, idx) { return "loc-day-" + dayDate + "-" + idx; }
  // build search candidates per location, longest/most specific first, so a
  // schedule mention resolves to the right card even when the wording doesn't
  // match the location name exactly (word order swapped, or a trailing
  // qualifier like "Trail"/"State Park" is dropped in the schedule text)
  function locMentionCandidates(locations) {
    const out = [];
    (locations || []).forEach((loc, idx) => {
      if (!loc.name) return;
      const words = loc.name.trim().split(/\s+/);
      const seen = new Set();
      const add = phrase => {
        const key = phrase.toLowerCase();
        if (phrase && !seen.has(key)) { seen.add(key); out.push({ idx, text: phrase }); }
      };
      add(loc.name);
      if (words.length === 2) add(words[1] + " " + words[0]);
      for (let n = words.length - 1; n >= 2; n--) add(words.slice(0, n).join(" "));
    });
    return out.sort((a, b) => b.text.length - a.text.length);
  }
  // find non-overlapping candidate matches in schedule text and render it as
  // escaped text with matched spans wrapped in tappable pills
  function locMentionHTML(text, candidates, dayDate) {
    if (!candidates.length) return esc(text);
    const lower = text.toLowerCase();
    const ranges = [];
    candidates.forEach(c => {
      const needle = c.text.toLowerCase();
      let from = 0, pos;
      while ((pos = lower.indexOf(needle, from)) !== -1) {
        const end = pos + needle.length;
        if (!ranges.some(r => pos < r.end && end > r.start)) ranges.push({ start: pos, end, idx: c.idx });
        from = pos + 1;
      }
    });
    if (!ranges.length) return esc(text);
    ranges.sort((a, b) => a.start - b.start);
    let html = "", cursor = 0;
    ranges.forEach(r => {
      if (r.start > cursor) html += esc(text.slice(cursor, r.start));
      html += '<button type="button" class="loc-mention" data-loc-target="' + esc(locElId(dayDate, r.idx)) + '">' +
        esc(text.slice(r.start, r.end)) + "</button>";
      cursor = r.end;
    });
    if (cursor < text.length) html += esc(text.slice(cursor));
    return html;
  }
  function jumpToLocation(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.remove("flash");
    void target.offsetWidth; // restart the animation if it's already mid-flash
    target.classList.add("flash");
    setTimeout(() => target.classList.remove("flash"), 900);
  }

  // "checked off" state for location cards — instant local write always,
  // synced across everyone's phones via Firebase when it's reachable (same
  // local-first pattern as the Disney stamp sync; degrades to local-only
  // offline or if Firebase isn't configured).
  function locDoneKey(dayDate, idx) { return dayDate + "_" + idx; }
  function setLocDone(key, done) {
    try { if (done) localStorage.setItem("loc-done:" + key, "1"); else localStorage.removeItem("loc-done:" + key); } catch (e) {}
    if (locDB) locDB.child(key).set(done ? true : null).catch(() => {});
  }
  function locationEl(loc, dayDate, idx) {
    const url = resolveUrl(loc);
    const node = url ? el("a", "loc is-link") : el("div", "loc");
    node.id = locElId(dayDate, idx);
    if (url) { node.href = url; node.target = "_blank"; node.rel = "noopener"; }
    const go = url ? (loc.trail ? '<span class="go">AllTrails ↗</span>' : '<span class="go">Map ↗</span>') : "";
    const key = locDoneKey(dayDate, idx);
    const done = localStorage.getItem("loc-done:" + key) === "1";
    if (done) node.classList.add("is-done");
    node.innerHTML =
      '<button type="button" class="loc-check" data-loc-key="' + esc(key) + '" aria-pressed="' + done + '" aria-label="Mark ' + esc(loc.name) + ' as done"></button>' +
      '<span class="loc-ic">' + (loc.icon || "📍") + "</span>" +
      '<span class="loc-body">' +
        '<span class="loc-name">' + esc(loc.name) + go + "</span>" +
        (loc.note ? '<span class="loc-note">' + esc(loc.note) + "</span>" : "") +
      "</span>";
    node.querySelector(".loc-check").addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      const isDone = node.classList.toggle("is-done");
      e.currentTarget.setAttribute("aria-pressed", String(isDone));
      setLocDone(key, isDone);
    });
    return node;
  }

  /* ---------- optional Firebase sync for checked-off stops ---------- */
  let locDB = null;
  function initLocSync() {
    try {
      if (typeof firebase === "undefined") return;
      const cfg = window.FIREBASE_CONFIG;
      if (!cfg || !cfg.apiKey || cfg.apiKey === "REPLACE_ME") return;
      if (!firebase.apps.length) firebase.initializeApp(cfg);
      locDB = firebase.database().ref("roadtrip2026/locChecks");
      locDB.on("value", snap => {
        const remote = snap.val() || {};
        document.querySelectorAll(".loc-check").forEach(btn => {
          const key = btn.dataset.locKey;
          const done = !!remote[key];
          btn.closest(".loc").classList.toggle("is-done", done);
          btn.setAttribute("aria-pressed", String(done));
          try { if (done) localStorage.setItem("loc-done:" + key, "1"); else localStorage.removeItem("loc-done:" + key); } catch (e) {}
        });
      });
    } catch (e) { locDB = null; }
  }

  /* ---------- bottom bar + back-to-today ---------- */
  function updateBar() {
    const day = days[current];
    if (!day) return;
    document.getElementById("bbDay").textContent = "Day " + day.num + (isToday(day) ? " · Today" : "");
    document.getElementById("bbDate").textContent = day.weekday + ", " + prettyDate(day.date);
    document.getElementById("prevDay").disabled = current === 0;
    document.getElementById("nextDay").disabled = current === days.length - 1;
    // Show "Back to today" only during the trip, when you're not already on today.
    const showJump = inTripWindow() && current !== todayIndex();
    todayJump.hidden = !showJump;
  }
  function updateThemeColor() {
    const accent = getComputedStyle(document.body).getPropertyValue("--grad-a").trim();
    if (accent) document.getElementById("themeColorMeta").setAttribute("content", accent);
  }

  function go(delta) {
    const next = current + delta;
    if (next < 0 || next >= days.length) return;
    current = next;
    render(delta);
  }
  function goTo(index, dir) {
    if (index < 0 || index >= days.length || index === current) return;
    const direction = dir != null ? dir : (index > current ? 1 : -1);
    current = index;
    render(direction);
  }

  /* ---------- events ---------- */
  document.getElementById("prevDay").addEventListener("click", () => go(-1));
  document.getElementById("nextDay").addEventListener("click", () => go(1));
  document.getElementById("bbCenter").addEventListener("click", () => goTo(todayIndex()));
  todayJump.addEventListener("click", () => goTo(todayIndex()));

  document.getElementById("previewBtn").addEventListener("click", () => {
    if (isUnlocked()) enterApp(0);
    else showLock(0);
  });

  document.getElementById("lockForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("lockInput");
    const errEl = document.getElementById("lockError");
    const btn = document.getElementById("lockBtn");
    errEl.hidden = true;
    btn.disabled = true;
    const ok = await attemptUnlock(input.value.trim(), true);
    btn.disabled = false;
    if (ok) {
      enterApp(pendingTarget != null ? pendingTarget : todayIndex());
    } else {
      input.value = "";
      errEl.hidden = false;
      lock.classList.remove("shake");
      void lock.offsetWidth;
      lock.classList.add("shake");
      input.focus();
    }
  });

  // keyboard arrows (desktop)
  document.addEventListener("keydown", e => {
    if (app.hidden) return;
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  });

  // swipe (mobile)
  let touchX = null, touchY = null;
  container.addEventListener("touchstart", e => {
    touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
  }, { passive: true });
  container.addEventListener("touchend", e => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
    touchX = touchY = null;
  }, { passive: true });

  // If the tab has been open across a date change, catch up to the new "today".
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    const before = ymd(today);
    refreshToday();
    if (ymd(today) === before) return;
    if (!app.hidden) render(0);        // refresh TODAY badge, bar, jump button
    else if (!gate.hidden) showGate(); // refresh countdown number
  });

  /* ---------- hidden test mode popup (tap the Day 1 pill) ---------- */
  function fmtDateInput(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function fmtTimeInput(d) { return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
  function updateTestModeBadge() { document.getElementById("testModeBadge").hidden = !testOverride; }
  function openTestModePopup() {
    const n = getNow();
    document.getElementById("testDate").value = fmtDateInput(n);
    document.getElementById("testTime").value = fmtTimeInput(n);
    const active = !!testOverride;
    document.getElementById("testModalBtn").textContent = active ? "Disable Test Mode" : "Enable Test Mode";
    document.getElementById("testModalSub").textContent = active
      ? "Test mode is on — pick a new date/time, or disable it below."
      : "Preview the TODAY badge and schedule highlight as of any date/time.";
    document.getElementById("testModal").hidden = false;
  }
  function closeTestModePopup() { document.getElementById("testModal").hidden = true; }
  document.getElementById("testModalForm").addEventListener("submit", e => {
    e.preventDefault();
    if (testOverride) {
      clearTestOverride();
    } else {
      const dateVal = document.getElementById("testDate").value;
      if (!dateVal) return;
      const timeVal = document.getElementById("testTime").value || "00:00";
      const [y, m, d] = dateVal.split("-").map(Number);
      const [hh, mm] = timeVal.split(":").map(Number);
      setTestOverride(new Date(y, m - 1, d, hh, mm));
    }
    refreshToday();
    current = todayIndex();
    updateTestModeBadge();
    closeTestModePopup();
    if (!app.hidden) render(0);
  });
  document.getElementById("testModalCancel").addEventListener("click", closeTestModePopup);
  document.getElementById("testModeBadge").addEventListener("click", openTestModePopup);
  updateTestModeBadge();

  /* ---------- boot ----------
       • Cached passcode on this device → straight through.
       • Pre-trip & locked → public countdown (Peek then asks for the passcode).
       • During/after trip & locked, or a #day-N deep link → ask for passcode first. */
  async function boot() {
    // intended destination from a #day-N deep link (days are sequential, num = index+1)
    let target = null;
    const hashMatch = location.hash.match(/^#day-(\d+)$/);
    if (hashMatch) {
      target = Math.max(0, Math.min(dayCount - 1, Number(hashMatch[1]) - 1));
    }

    // silent auto-unlock with the cached passcode
    let unlocked = false;
    if (hasEnc()) {
      let stored = null;
      try { stored = localStorage.getItem(LS_KEY); } catch (e) {}
      if (stored) unlocked = await attemptUnlock(stored, false);
    }

    if (unlocked) {
      if (target != null) return enterApp(target);
      if (today < start) return showGate();
      return enterApp(todayIndex());
    }

    // locked
    if (target != null) return showLock(target);
    if (today < start) return showGate();   // countdown stays public pre-trip
    showLock(todayIndex());
  }

  boot();
  initLocSync();
})();
