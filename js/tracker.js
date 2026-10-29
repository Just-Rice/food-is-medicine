// The food log: what was eaten, when, and how much. Everything is stored in
// this device's localStorage; nothing is sent anywhere.
//
// Each entry keeps its own copy of the nutrients per 100 g rather than only a
// food slug. The food list is regenerated from USDA and a slug can be renamed
// or dropped; a log is a record of the past, and yesterday's dinner should not
// change or vanish because the reference table moved on. Entries from a photo
// keep a low and high figure as well, because a portion judged from a picture
// is a range and pretending otherwise would be false precision.

(function () {
  'use strict';

  var KEY = 'veg.log.v1';
  var MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
  var TRACKED = ['kcal', 'protein', 'carbs', 'fat', 'fiber'];

  // A day's grams are capped so a mistyped "15000" cannot wreck a week's chart.
  var MAX_GRAMS = 5000;

  var listeners = [];
  var data = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && typeof d.days === 'object' && d.days) return sanitise(d);
      }
    } catch (e) { /* private mode or corrupt value: start empty */ }
    return { days: {} };
  }

  // Anything restored from storage is checked, so one corrupt entry cannot
  // break the whole page on every load.
  function sanitise(d) {
    var out = { days: {} };
    Object.keys(d.days).forEach(function (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Array.isArray(d.days[date])) return;
      var list = d.days[date].filter(function (e) {
        return e && typeof e.id === 'string' && typeof e.name === 'string' &&
          MEALS.indexOf(e.meal) >= 0 && (e.per100 || e.fixed);
      });
      if (list.length) out.days[date] = list;
    });
    return out;
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
    listeners.forEach(function (fn) { fn(); });
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /** A Date as YYYY-MM-DD in local time -- the day the person thinks it is. */
  function dateKey(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function today() { return dateKey(new Date()); }

  /** Shift a YYYY-MM-DD key by whole days. Noon avoids daylight-saving edges. */
  function shift(key, days) {
    var p = key.split('-').map(Number);
    var d = new Date(p[0], p[1] - 1, p[2], 12);
    d.setDate(d.getDate() + days);
    return dateKey(d);
  }

  /** The meal a new entry most likely belongs to, from the clock. */
  function guessMeal(now) {
    var h = (now || new Date()).getHours();
    if (h < 11) return 'breakfast';
    if (h < 15) return 'lunch';
    if (h >= 17 && h < 22) return 'dinner';
    return 'snack';
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function clampGrams(g) {
    g = Number(g);
    if (!(g > 0)) return null;
    return Math.min(MAX_GRAMS, Math.round(g * 10) / 10);
  }

  /** The nutrients per 100 g a log entry carries, copied from a food record. */
  function per100From(food) {
    var out = {};
    TRACKED.forEach(function (k) {
      var v = food.nutrients[k];
      out[k] = v == null ? 0 : v;
    });
    return out;
  }

  /**
   * Nutrients for one entry. Weighed entries scale their per-100 g figures;
   * manual entries carry fixed totals because there is nothing to scale.
   */
  function nutrientsOf(e) {
    var out = {};
    TRACKED.forEach(function (k) {
      out[k] = e.fixed ? (e.fixed[k] || 0) : (e.per100[k] || 0) * e.grams / 100;
    });
    return out;
  }

  /** Low and high energy for an entry; equal unless it came from a photo. */
  function kcalRange(e) {
    if (e.fixed) return [e.fixed.kcal || 0, e.fixed.kcal || 0];
    var lo = e.gramsLow || e.grams, hi = e.gramsHigh || e.grams;
    return [e.per100.kcal * lo / 100, e.per100.kcal * hi / 100];
  }

  function day(date) { return (data.days[date] || []).slice(); }

  function totals(date) {
    var t = { kcalLow: 0, kcalHigh: 0, count: 0 };
    TRACKED.forEach(function (k) { t[k] = 0; });
    day(date).forEach(function (e) {
      var n = nutrientsOf(e);
      TRACKED.forEach(function (k) { t[k] += n[k]; });
      var r = kcalRange(e);
      t.kcalLow += r[0];
      t.kcalHigh += r[1];
      t.count++;
    });
    return t;
  }

  /** Energy for the `n` days ending on `endDate`, oldest first. */
  function history(endDate, n) {
    var out = [];
    for (var i = n - 1; i >= 0; i--) {
      var key = shift(endDate, -i);
      var t = totals(key);
      out.push({ date: key, kcal: t.kcal, count: t.count });
    }
    return out;
  }

  /**
   * Add an entry. `item` is one of:
   *   {food, grams, meal}                              -- from the food list
   *   {food, grams, gramsLow, gramsHigh, meal, source} -- from a photo
   *   {name, per100, grams, ...}                       -- photo item with no USDA match
   *   {name, fixed: {kcal, protein, ...}, meal}        -- typed in by hand
   */
  function add(date, item) {
    var e = {
      id: newId(),
      meal: MEALS.indexOf(item.meal) >= 0 ? item.meal : guessMeal(),
      source: item.source || (item.fixed ? 'manual' : 'food'),
      at: Date.now()
    };
    if (item.fixed) {
      e.name = String(item.name || '').slice(0, 120) || 'Food';
      e.fixed = {};
      TRACKED.forEach(function (k) {
        var v = Number(item.fixed[k]);
        e.fixed[k] = v > 0 ? Math.min(v, 20000) : 0;
      });
    } else {
      var grams = clampGrams(item.grams);
      if (!grams) return null;
      e.grams = grams;
      if (item.food) {
        e.slug = item.food.slug;
        e.name = item.food.name;
        e.per100 = per100From(item.food);
      } else {
        e.name = String(item.name || '').slice(0, 120) || 'Food';
        e.per100 = {};
        TRACKED.forEach(function (k) {
          var v = Number(item.per100 && item.per100[k]);
          e.per100[k] = v > 0 ? v : 0;
        });
      }
      var lo = clampGrams(item.gramsLow), hi = clampGrams(item.gramsHigh);
      if (lo && hi && lo <= grams && hi >= grams) { e.gramsLow = lo; e.gramsHigh = hi; }
      if (item.label) e.label = String(item.label).slice(0, 120);
    }
    (data.days[date] = data.days[date] || []).push(e);
    persist();
    return e;
  }

  function find(date, id) {
    return (data.days[date] || []).filter(function (e) { return e.id === id; })[0];
  }

  /** Change an entry's weight or meal. A new weight drops any photo range. */
  function update(date, id, patch) {
    var e = find(date, id);
    if (!e) return;
    if (patch.grams != null && !e.fixed) {
      var g = clampGrams(patch.grams);
      if (g) { e.grams = g; delete e.gramsLow; delete e.gramsHigh; }
    }
    if (patch.meal && MEALS.indexOf(patch.meal) >= 0) e.meal = patch.meal;
    persist();
  }

  function remove(date, id) {
    var list = data.days[date];
    if (!list) return;
    data.days[date] = list.filter(function (e) { return e.id !== id; });
    if (!data.days[date].length) delete data.days[date];
    persist();
  }

  window.Tracker = {
    MEALS: MEALS, TRACKED: TRACKED,
    today: today, shift: shift, dateKey: dateKey, guessMeal: guessMeal,
    day: day, totals: totals, history: history,
    nutrientsOf: nutrientsOf, kcalRange: kcalRange,
    add: add, update: update, remove: remove,
    onChange: function (fn) { listeners.push(fn); }
  };
})();
