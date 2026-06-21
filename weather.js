/* ============================================================================
   WEATHER — lightweight client-side forecast lookup (no API key needed)
   Uses Open-Meteo (https://open-meteo.com), a free CORS-friendly weather API.
   Exposes window.Weather.get(dateStr, { lat, lon }) -> Promise<weather|null>.
   Resolves null (never rejects) if there's no forecast for that date yet,
   or if the request fails for any reason.
   ========================================================================== */

(function () {
  "use strict";

  // WMO weather codes -> compact icon + label (only the common ones).
  const CODES = {
    0: "☀️ Clear", 1: "🌤 Mostly clear", 2: "⛅ Partly cloudy", 3: "☁️ Cloudy",
    45: "🌫 Foggy", 48: "🌫 Foggy",
    51: "🌦 Light drizzle", 53: "🌦 Drizzle", 55: "🌧 Drizzle",
    61: "🌧 Light rain", 63: "🌧 Rain", 65: "🌧 Heavy rain",
    71: "🌨 Light snow", 73: "🌨 Snow", 75: "🌨 Heavy snow",
    80: "🌦 Showers", 81: "🌧 Showers", 82: "🌧 Heavy showers",
    95: "⛈ Thunderstorm", 96: "⛈ Thunderstorm", 99: "⛈ Thunderstorm",
  };
  function describe(code) {
    return CODES[code] || "🌡 Forecast";
  }

  const cache = new Map();

  function cacheKey(date, coords) {
    return coords.lat + "," + coords.lon + "," + date;
  }

  function readSession(key) {
    try {
      const raw = sessionStorage.getItem("wx:" + key);
      return raw ? JSON.parse(raw) : undefined;
    } catch (e) {
      return undefined;
    }
  }
  function writeSession(key, value) {
    try {
      sessionStorage.setItem("wx:" + key, JSON.stringify(value));
    } catch (e) {
      /* ignore (private browsing, storage full, etc.) */
    }
  }

  async function fetchForecast(date, coords) {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + coords.lat +
      "&longitude=" + coords.lon +
      "&daily=temperature_2m_max,temperature_2m_min,weathercode" +
      "&temperature_unit=fahrenheit" +
      "&timezone=auto" +
      "&start_date=" + date +
      "&end_date=" + date;

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const i = data && data.daily && data.daily.time ? data.daily.time.indexOf(date) : -1;
    if (i === -1) return null;

    return {
      tMax: data.daily.temperature_2m_max[i],
      tMin: data.daily.temperature_2m_min[i],
      label: describe(data.daily.weathercode[i]),
    };
  }

  function get(date, coords) {
    if (!coords || coords.lat == null || coords.lon == null) return Promise.resolve(null);

    const key = cacheKey(date, coords);
    if (cache.has(key)) return Promise.resolve(cache.get(key));

    const stored = readSession(key);
    if (stored !== undefined) {
      cache.set(key, stored);
      return Promise.resolve(stored);
    }

    return fetchForecast(date, coords)
      .catch(() => null)
      .then(result => {
        cache.set(key, result);
        writeSession(key, result);
        return result;
      });
  }

  window.Weather = { get };
})();
