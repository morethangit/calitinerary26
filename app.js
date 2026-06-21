/* ============================================================================
   CALIFORNIA ROAD TRIP — APP LOGIC
   Builds the page from TRIP (see data.js). You normally won't need to edit this.
   ========================================================================== */

(function () {
  "use strict";

  const days = TRIP.days;

  /* ---------- date helpers (all in local time, date-only) ---------- */
  function ymd(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function parseDate(s) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  function todayDate() {
    const n = new Date();
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

  /* ---------- link builders ---------- */
  function mapsUrl(q) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
  }
  function trailUrl(q) {
    return "https://www.alltrails.com/search?q=" + encodeURIComponent(q);
  }
  // Resolve any item's link from its shorthand fields. Returns "" if none.
  function resolveUrl(item) {
    if (!item) return "";
    if (item.url) return item.url;
    if (item.map) return mapsUrl(item.map);
    if (item.trail) return trailUrl(item.trail);
    return "";
  }

  /* ---------- tiny DOM helper ---------- */
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  /* ---------- figure out which day to show, and trip state ---------- */
  const start = parseDate(TRIP.startDate);
  const end = parseDate(TRIP.endDate);
  const today = todayDate();
  const daysUntil = daysBetween(today, start);

  function todayIndex() {
    // if today falls within the trip, land on that day; otherwise day 1 / last day
    if (today < start) return 0;
    if (today > end) return days.length - 1;
    const i = daysBetween(start, today);
    return Math.max(0, Math.min(days.length - 1, i));
  }
  function isToday(day) {
    return ymd(today) === day.date;
  }

  /* ---------- references ---------- */
  const gate = document.getElementById("gate");
  const lock = document.getElementById("lock");
  const app = document.getElementById("app");
  const bottomBar = document.getElementById("bottomBar");
  const container = document.getElementById("dayContainer");

  let current = todayIndex();

  /* ---------- passcode + decryption (confirmation numbers) ----------
     The confirmation numbers ship only as ciphertext in data.enc.js. The
     passcode the family types decrypts them in the browser. Once correct, the
     passcode is cached in localStorage so this device never has to re-enter it. */
  const LS_KEY = "trip_pass_v1";
  let SECRETS = null;               // decrypted { "1": [...], ... } once unlocked
  let pendingTarget = null;         // day index to open after a successful unlock
  const encTextDec = new TextDecoder();
  const encTextEnc = new TextEncoder();

  function hasSecretsFile() { return !!window.TRIP_SECRETS_ENC; }
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
  // returns the decrypted secrets object on success, or null on wrong passcode
  async function tryDecrypt(pass) {
    const E = window.TRIP_SECRETS_ENC;
    if (!E) return {};            // no secrets shipped → nothing to protect
    try {
      const key = await deriveKey(pass, b64ToBytes(E.salt), E.iter);
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToBytes(E.iv) }, key, b64ToBytes(E.data));
      return JSON.parse(encTextDec.decode(plain));
    } catch (e) {
      return null;
    }
  }
  async function attemptUnlock(pass, remember) {
    const result = await tryDecrypt(pass);
    if (result) {
      SECRETS = result;
      if (remember) { try { localStorage.setItem(LS_KEY, pass); } catch (e) {} }
      return true;
    }
    return false;
  }

  /* ---------- the countdown gate ---------- */
  function showGate() {
    const n = daysUntil;
    document.getElementById("gateNumber").textContent = n;
    document.getElementById("gateUnit").textContent = n === 1 ? "day" : "days";
    document.getElementById("gateSub").textContent =
      TRIP.title + " · " + prettyDate(TRIP.startDate) + ", " + parseDate(TRIP.startDate).getFullYear();
    gate.hidden = false;
    lock.hidden = true;
    app.hidden = true;
    bottomBar.hidden = true;
  }
  function showLock(targetIndex) {
    pendingTarget = targetIndex != null ? targetIndex : todayIndex();
    gate.hidden = true;
    lock.hidden = false;
    app.hidden = true;
    bottomBar.hidden = true;
    const input = document.getElementById("lockInput");
    if (input) setTimeout(() => input.focus(), 80);
  }
  function enterApp(startIndex) {
    gate.hidden = true;
    lock.hidden = true;
    app.hidden = false;
    bottomBar.hidden = false;
    current = startIndex != null ? startIndex : current;
    render(0);
  }

  /* ---------- render one day ---------- */
  function render(direction) {
    const day = days[current];
    document.body.setAttribute("data-theme", day.theme);

    const card = el("article", "day");
    if (direction > 0) card.classList.add("from-right");
    else if (direction < 0) card.classList.add("from-left");

    /* hero */
    const hero = el("header", "hero");
    const eyebrow = el("div", "hero-eyebrow",
      "Day " + day.num + " · " + day.weekday +
      (isToday(day) ? '<span class="hero-today">TODAY</span>' : ""));
    hero.appendChild(eyebrow);
    hero.appendChild(el("h1", null, esc(day.title)));
    if (day.tagline) hero.appendChild(el("p", "hero-tagline", esc(day.tagline)));

    const meta = el("div", "hero-meta");
    if (day.stay && day.stay.name) {
      const u = resolveUrl(day.stay);
      const chip = u
        ? el("a", "hero-chip linkish")
        : el("div", "hero-chip");
      if (u) { chip.href = u; chip.target = "_blank"; chip.rel = "noopener"; }
      chip.innerHTML = '<span class="ic">🛏️</span><span>' + esc(day.stay.name) + "</span>";
      meta.appendChild(chip);
    }
    if (day.drive) {
      meta.appendChild(el("div", "hero-chip", '<span class="ic">🚗</span><span>' + esc(day.drive) + "</span>"));
    }
    if (day.stay && day.stay.coords && window.Weather) {
      const wchip = el("div", "hero-chip hero-chip-weather is-loading", '<span class="ic">⛅</span><span class="wx-text">Loading…</span>');
      meta.appendChild(wchip);
      const dayNum = day.num;
      Weather.get(day.date, day.stay.coords).then(w => {
        if (days[current].num !== dayNum) return; // user navigated away before this resolved
        if (!w) { wchip.remove(); return; }
        wchip.classList.remove("is-loading");
        wchip.querySelector(".wx-text").textContent =
          w.label + " " + Math.round(w.tMax) + "°/" + Math.round(w.tMin) + "°";
      });
    }
    hero.appendChild(meta);
    card.appendChild(hero);

    /* SCHEDULE */
    if (day.schedule && day.schedule.length) {
      const sec = section("🗓️", "Schedule");
      const ul = el("ul", "timeline");
      day.schedule.forEach(s => ul.appendChild(el("li", null, esc(s))));
      sec.appendChild(wrapCard(ul));
      card.appendChild(sec);
    }

    /* LOCATIONS */
    if (day.locations && day.locations.length) {
      const sec = section("📍", "Locations");
      const list = el("div", "loc-list");
      day.locations.forEach(loc => list.appendChild(locationEl(loc)));
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

    /* FUN FACT */
    if (day.funFact && day.funFact.q) {
      const ff = el("a", "funfact");
      ff.href = day.funFact.url; ff.target = "_blank"; ff.rel = "noopener";
      ff.innerHTML =
        '<span class="ff-ic">🤓</span>' +
        '<span class="ff-body"><span class="ff-label">Fun fact</span>' +
        '<div class="ff-q">' + esc(day.funFact.q) + "</div></span>" +
        '<span class="ff-go">↗</span>';
      card.appendChild(ff);
    }

    /* CONFIRMATIONS (collapsible) — decrypted from data.enc.js after unlock */
    const conf = SECRETS && SECRETS[day.num];
    if (conf && conf.length) {
      const det = el("details", "confs");
      det.appendChild(el("summary", null, "🔒 Confirmation numbers"));
      const list = el("div", "conf-list");
      conf.forEach(c => {
        const item = el("div", "conf-item");
        item.appendChild(el("span", "conf-label", esc(c.label)));
        item.appendChild(el("span", "conf-value", esc(c.value)));
        list.appendChild(item);
      });
      det.appendChild(list);
      card.appendChild(det);
    }

    /* tiny "forget passcode on this device" control */
    if (hasSecretsFile()) {
      const foot = el("div", "app-foot");
      const b = el("button", "forget-btn", "🔓 Lock this device");
      b.addEventListener("click", () => {
        try { localStorage.removeItem(LS_KEY); } catch (e) {}
        SECRETS = null;
        location.reload();
      });
      foot.appendChild(b);
      card.appendChild(foot);
    }

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
  function locationEl(loc) {
    const url = resolveUrl(loc);
    const node = url ? el("a", "loc is-link") : el("div", "loc");
    if (url) { node.href = url; node.target = "_blank"; node.rel = "noopener"; }
    const go = url ? (loc.trail ? '<span class="go">AllTrails ↗</span>' : '<span class="go">Map ↗</span>') : "";
    node.innerHTML =
      '<span class="loc-ic">' + (loc.icon || "📍") + "</span>" +
      '<span class="loc-body">' +
        '<span class="loc-name">' + esc(loc.name) + go + "</span>" +
        (loc.note ? '<span class="loc-note">' + esc(loc.note) + "</span>" : "") +
      "</span>";
    return node;
  }

  /* ---------- bottom bar ---------- */
  function updateBar() {
    const day = days[current];
    document.getElementById("bbDay").textContent = "Day " + day.num + (isToday(day) ? " · Today" : "");
    document.getElementById("bbDate").textContent = day.weekday + ", " + prettyDate(day.date);
    document.getElementById("prevDay").disabled = current === 0;
    document.getElementById("nextDay").disabled = current === days.length - 1;
  }
  function updateThemeColor() {
    // match the browser chrome to the day's accent gradient start
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
  // From the countdown screen: go to the itinerary, unlocking first if needed.
  document.getElementById("previewBtn").addEventListener("click", () => {
    if (SECRETS || !hasSecretsFile()) enterApp(0);
    else showLock(0);
  });

  // Passcode form
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
      void lock.offsetWidth;        // restart the shake animation
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
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      go(dx < 0 ? 1 : -1);
    }
    touchX = touchY = null;
  }, { passive: true });

  /* ---------- boot ----------
     Flow:
       • Already unlocked on this device (cached passcode) → straight through.
       • Pre-trip & locked → public countdown (Peek button then asks for passcode).
       • During/after trip & locked, or a #day-N deep link → ask for passcode first. */
  async function boot() {
    // intended destination: a #day-N deep link, if present
    let target = null;
    const hashMatch = location.hash.match(/^#day-(\d+)$/);
    if (hashMatch) {
      const idx = days.findIndex(d => d.num === Number(hashMatch[1]));
      if (idx >= 0) target = idx;
    }

    // try the cached passcode (silent auto-unlock)
    let unlocked = !hasSecretsFile();
    if (!unlocked) {
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
})();
