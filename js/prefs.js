// Display and dietary preferences. Everything is stored in localStorage on this
// device; nothing is transmitted.

(function () {
  'use strict';

  var KEY = 'fim.prefs.v1';

  var DEFAULTS = {
    theme: 'system',        // 'system' | 'light' | 'dark'
    contrast: false,        // high-contrast palette
    textSize: 'normal',     // 'normal' | 'large' | 'larger'
    reduceMotion: false,
    diet: 'none',           // 'none' | 'vegetarian' | 'vegan' | 'pescatarian'
    allergens: [],          // keys matching the tags in data/foods.js
    customExclude: ''       // free text, comma separated
  };

  var listeners = [];
  var prefs = load();

  function load() {
    var out = {};
    Object.keys(DEFAULTS).forEach(function (k) { out[k] = DEFAULTS[k]; });
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        Object.keys(DEFAULTS).forEach(function (k) {
          if (saved[k] !== undefined) out[k] = saved[k];
        });
      }
    } catch (e) { /* private mode or corrupt value: fall back to defaults */ }
    return out;
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ }
  }

  function set(key, value) {
    if (!(key in DEFAULTS)) return;
    prefs[key] = value;
    persist();
    apply();
    listeners.forEach(function (fn) { fn(prefs); });
  }

  function get(key) { return key ? prefs[key] : prefs; }

  function reset() {
    prefs = load.call(null) && JSON.parse(JSON.stringify(DEFAULTS));
    persist();
    apply();
    listeners.forEach(function (fn) { fn(prefs); });
  }

  // Push the display preferences onto the document root, where CSS reads them.
  function apply() {
    var root = document.documentElement;
    if (prefs.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', prefs.theme);

    root.toggleAttribute('data-contrast', !!prefs.contrast);
    root.setAttribute('data-text', prefs.textSize);
    root.toggleAttribute('data-reduce-motion', !!prefs.reduceMotion);
  }

  // ---- dietary filtering -------------------------------------------------

  var DIET_REQUIRES = {
    vegetarian: 'vegetarian',
    vegan: 'vegan'
  };

  function customTerms() {
    return prefs.customExclude
      .split(',')
      .map(function (s) { return s.trim().toLowerCase(); })
      .filter(Boolean);
  }

  /**
   * Why a food is excluded, or null if it is allowed.
   * Returns {reason:'diet'|'allergen'|'custom', detail:string}.
   */
  function excludedReason(food) {
    var diet = prefs.diet;
    if (diet === 'pescatarian') {
      // Fish and shellfish are fine; other animal flesh is not.
      var flesh = ['meat', 'poultry', 'offal'];
      if (flesh.indexOf(food.group) >= 0 || (food.group === 'fat' && food.diet.length === 0)) {
        return { reason: 'diet', detail: diet };
      }
    } else if (DIET_REQUIRES[diet]) {
      if ((food.diet || []).indexOf(DIET_REQUIRES[diet]) < 0) {
        return { reason: 'diet', detail: diet };
      }
    }

    for (var i = 0; i < prefs.allergens.length; i++) {
      if ((food.allergens || []).indexOf(prefs.allergens[i]) >= 0) {
        return { reason: 'allergen', detail: prefs.allergens[i] };
      }
    }

    var terms = customTerms();
    var haystack = (food.name + ' ' + (food.usda || '')).toLowerCase();
    for (var j = 0; j < terms.length; j++) {
      if (haystack.indexOf(terms[j]) >= 0) {
        return { reason: 'custom', detail: terms[j] };
      }
    }
    return null;
  }

  function isFiltering() {
    return prefs.diet !== 'none' || prefs.allergens.length > 0 || customTerms().length > 0;
  }

  apply();

  window.Prefs = {
    get: get, set: set, reset: reset,
    onChange: function (fn) { listeners.push(fn); },
    excludedReason: excludedReason,
    isFiltering: isFiltering,
    ALLERGENS: ['milk', 'lactose', 'egg', 'fish', 'crustacean', 'mollusc',
                'treenut', 'peanut', 'soy', 'gluten', 'sesame'],
    DIETS: ['none', 'vegetarian', 'vegan', 'pescatarian']
  };
})();
