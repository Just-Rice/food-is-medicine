// The extended food list and cuisines, shared by Food is Medicine and Food Log.
//
// data/foods.js is the curated list every page loads. data/foods-more.js holds
// about thirteen thousand more foods -- dishes, drinks, baked goods, more cuts
// and preparations -- from USDA SR Legacy, Foundation Foods and FNDDS and the
// UK's CoFID 2021, about a megabyte over the wire. It is loaded only when a
// page asks (FoodsMore.load()), and expanded into objects shaped like the
// curated foods, with:
//   more: true, source ('sr'|'fd'|'fn'|'uk'|'sp'), kind ('whole', 'dish', ...),
//   cuisines [...], spices [{slug, g}] (grams per 100 g of the dish),
//   parts [slug...] (plant foods in an FNDDS dish), nodata (no nutrient
//   figures: a spice no table lists), spiceSource 'typical' (spices from
//   build/dish_spices.txt rather than an ingredient list).
// A nutrient the source does not list is absent, never zero.
//
// data/cuisines.js (small, loaded with the page) supplies the cuisine list,
// the curated foods' cuisines and the dish spice templates; this file applies
// them as soon as it runs.

(function () {
  'use strict';

  var C = window.CUISINE_DATA || { cuisines: [], core: {}, templates: [] };
  var CODES = C.cuisines.map(function (c) { return c[0]; });
  var script = document.currentScript;
  var base = script && script.src ? script.src.replace(/[^/]*$/, '') : 'data/';
  var list = null, promise = null, listeners = [];

  function fromBits(bits, table) {
    var out = [];
    for (var i = 0; i < table.length; i++) if (bits & (1 << i)) out.push(table[i]);
    return out;
  }

  function pairs(s) {
    if (!s) return [];
    return String(s).split(';').map(function (p) {
      var i = p.lastIndexOf(':');
      return { slug: p.slice(0, i), g: Number(p.slice(i + 1)) };
    });
  }

  // The curated foods' cuisines, straight away.
  (window.FOODS || []).forEach(function (f) {
    if (C.core[f.slug]) f.cuisines = fromBits(C.core[f.slug], CODES);
  });

  var TEMPLATES = C.templates.map(function (t) {
    return { re: new RegExp(t[0]), spices: pairs(t[1]) };
  });

  function label(l) {
    if (!l) return null;
    var i = l.lastIndexOf('|');
    return { label: l.slice(0, i), grams: Number(l.slice(i + 1)) };
  }

  function expand(D) {
    var col = {};
    D.cols.forEach(function (c, i) { col[c] = i; });
    var keys = D.keys;
    return D.foods.map(function (r) {
      var nums = String(r[col.n] || '').split(','), n = {};
      for (var i = 0; i < keys.length; i++) {
        if (nums[i] !== undefined && nums[i] !== '') n[keys[i]] = Number(nums[i]);
      }
      var id = r[col.id], src = id.slice(0, 2), flags = r[col.flags] || 0;
      var f = {
        slug: id, name: r[col.name], usda: r[col.desc] || r[col.name], more: true, source: src,
        group: D.groups[r[col.group]], kind: D.kinds[r[col.kind]],
        diet: fromBits(r[col.diet], D.diets), allergens: fromBits(r[col.allergens], D.allergens),
        cuisines: fromBits(r[col.cuisines], CODES),
        aka: r[col.aka] ? String(r[col.aka]).split(';') : [],
        tags: r[col.tags] ? String(r[col.tags]).split(';') : [],
        nutrients: n,
        spices: pairs(r[col.spices]),
        parts: r[col.parts] ? String(r[col.parts]).split(';') : []
      };
      if (src === 'sr' || src === 'fd') f.fdcId = Number(id.slice(3));
      var p = label(r[col.portion]), s = label(r[col.serving]);
      if (p) f.portion = p;
      if (s) f.serving = s;
      if (flags === 1) f.nodata = true;
      if (flags === 2) f.spiceSource = 'typical';
      return f;
    });
  }

  /** Load the extended list once. Resolves to its foods. */
  function load() {
    if (list) return Promise.resolve(list);
    if (promise) return promise;
    promise = new Promise(function (resolve, reject) {
      var el = document.createElement('script');
      el.src = base + 'foods-more.js';
      el.async = true;
      el.onload = function () {
        try {
          list = expand(window.FOODS_MORE_DATA);
          window.FOODS_MORE_DATA = null;
        } catch (e) { promise = null; reject(e); return; }
        resolve(list);
        listeners.forEach(function (fn) { try { fn(list); } catch (e) { setTimeout(function () { throw e; }, 0); } });
      };
      el.onerror = function () {
        promise = null;
        el.remove();
        reject(new Error('The extended food list could not be loaded.'));
      };
      document.head.appendChild(el);
    });
    return promise;
  }

  /** The spices a dish with this name usually contains, from the templates, or []. */
  function typicalSpices(name) {
    var t = String(name || '').toLowerCase().replace(/[,()/]/g, ' ').replace(/\s+/g, ' ');
    for (var i = 0; i < TEMPLATES.length; i++) {
      if (TEMPLATES[i].re.test(t)) return TEMPLATES[i].spices.slice();
    }
    return [];
  }

  window.FoodsMore = {
    load: load,
    loaded: function () { return !!list; },
    foods: function () { return list || []; },
    onLoad: function (fn) { if (list) fn(list); else listeners.push(fn); },
    typicalSpices: typicalSpices,
    cuisines: C.cuisines.map(function (c) { return { code: c[0], label: c[1] }; }),
    cuisineLabel: function (code) {
      for (var i = 0; i < C.cuisines.length; i++) if (C.cuisines[i][0] === code) return C.cuisines[i][1];
      return code;
    },
    // What each source leaves out, for "not listed" notes.
    missing: { fn: ['manganese', 'pantothenic'], uk: ['choline'] },
    sourceName: function (src) {
      return { sr: 'USDA SR Legacy', fd: 'USDA Foundation Foods', fn: 'USDA FNDDS 2021–2023',
               uk: 'UK CoFID 2021', sp: 'Food is Medicine spice list' }[src] || 'USDA FoodData Central';
    }
  };
})();
