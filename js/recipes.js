// Recipe generation via the user's own Gemini API key.
//
// Everything here runs in the browser. The key is stored in this device's
// localStorage and is sent to exactly one place -- Google's generativelanguage
// endpoint -- because this site is static files on GitHub Pages and has no
// server that could receive it. That is worth stating plainly: an API key in
// localStorage is normal practice for a client-side app, but it is readable by
// any script running on the page and by anyone with access to the browser
// profile, so a shared or public computer is the wrong place to store one.
//
// Free keys come from Google AI Studio at https://aistudio.google.com/apikey.

(function () {
  'use strict';

  var KEY_STORE = 'fim.gemini.key';
  var MODEL_STORE = 'fim.gemini.model';
  var API = 'https://generativelanguage.googleapis.com/v1beta';

  // Only a fallback for the moment before the live model list arrives. The
  // actual choice is made by ranking whatever the API reports, so this file does
  // not go stale every time Google ships a generation.
  var DEFAULT_MODEL = 'gemini-2.5-flash';
  var AUTO = '__auto__';

  // Names that are not general chat models, whatever their version number.
  var EXCLUDE = /embedding|aqa|imagen|veo|image-generation|tts|audio|native-audio|live|vision|learnlm|gemma/i;

  /**
   * Score a model name so the newest and most capable sorts first.
   *
   * The ordering that matters is generation before tier: a new flash beats an
   * old pro, because a generation jump is usually worth more than a tier jump.
   * Within a generation, pro beats flash beats flash-lite. Stable is preferred
   * over preview or experimental only as a tie-break, so a newer preview still
   * outranks an older stable release -- which is what "newest" has to mean while
   * a generation is still rolling out.
   */
  function scoreModel(name) {
    var n = name.toLowerCase();
    if (EXCLUDE.test(n)) return -1;

    // Generation: "gemini-3-pro" -> 3, "gemini-2.5-flash" -> 2.5.
    var gen = 0;
    var m = /gemini-(\d+(?:\.\d+)?)/.exec(n);
    if (m) gen = parseFloat(m[1]);
    else if (/gemini-(pro|flash)/.test(n)) gen = 1;   // the original unversioned names

    var tier = 1;                       // unknown tier sits between lite and flash
    if (/flash-?lite/.test(n)) tier = 0;
    else if (/\bflash\b/.test(n)) tier = 2;
    else if (/\bpro\b/.test(n)) tier = 3;
    else if (/ultra/.test(n)) tier = 4;

    // Smaller distilled variants are less capable at the same tier. The
    // patterns are anchored deliberately: a bare /mini/ matches inside the word
    // "gemini" and would penalise every model equally.
    if (/-8b\b|-nano\b|-mini\b/.test(n)) tier -= 0.5;

    var stability = 2;
    if (/preview|-exp\b|experimental/.test(n)) stability = 1;
    if (/\d{3,}/.test(n.replace(/gemini-\d+(\.\d+)?/, ''))) stability -= 0.5;  // dated snapshots

    // Generation dominates, then tier, then stability.
    return gen * 1000 + tier * 10 + stability;
  }

  /** Best model from a list of names. */
  function pickBest(names) {
    var ranked = names
      .map(function (n) { return { name: n, score: scoreModel(n) }; })
      .filter(function (x) { return x.score > 0; })
      .sort(function (a, b) { return b.score - a.score; });
    return ranked.length ? ranked[0].name : null;
  }

  function getKey() {
    try { return localStorage.getItem(KEY_STORE) || ''; } catch (e) { return ''; }
  }

  function setKey(k) {
    try {
      if (k) localStorage.setItem(KEY_STORE, k);
      else localStorage.removeItem(KEY_STORE);
    } catch (e) { /* private mode */ }
  }

  function hasKey() { return !!getKey(); }

  var resolvedAuto = null;   // best model discovered this session

  /** The stored preference: a specific model name, or AUTO. */
  function getPreference() {
    try { return localStorage.getItem(MODEL_STORE) || AUTO; }
    catch (e) { return AUTO; }
  }

  /** The model an actual request should use right now. */
  function getModel() {
    var pref = getPreference();
    if (pref && pref !== AUTO) return pref;
    return resolvedAuto || DEFAULT_MODEL;
  }

  function setModel(m) {
    try { localStorage.setItem(MODEL_STORE, m || AUTO); } catch (e) { /* ignore */ }
  }

  /**
   * Ask the API what exists and pick the best of it. Cached for the session so
   * this costs one request, not one per recipe. Resolves to the chosen name.
   */
  function resolveAuto(force) {
    if (resolvedAuto && !force) return Promise.resolve(resolvedAuto);
    if (!hasKey()) return Promise.resolve(DEFAULT_MODEL);
    return listModels()
      .then(function (names) {
        var best = pickBest(names);
        if (best) resolvedAuto = best;
        return resolvedAuto || DEFAULT_MODEL;
      })
      .catch(function () { return DEFAULT_MODEL; });
  }

  /** Masked form of the key, for showing that one is stored without showing it. */
  function maskedKey() {
    var k = getKey();
    if (!k) return '';
    if (k.length <= 8) return '••••';
    return k.slice(0, 4) + '••••••••' + k.slice(-4);
  }

  /** Models this key can actually call, newest-sounding first. */
  function listModels() {
    var key = getKey();
    if (!key) return Promise.reject(new Error('No API key set.'));
    return fetch(API + '/models?key=' + encodeURIComponent(key))
      .then(readJson)
      .then(function (d) {
        return (d.models || [])
          .filter(function (m) {
            return (m.supportedGenerationMethods || []).indexOf('generateContent') >= 0;
          })
          .map(function (m) { return m.name.replace(/^models\//, ''); })
          .filter(function (n) { return n.indexOf('gemini') === 0; });
      });
  }

  function readJson(res) {
    return res.text().then(function (body) {
      var data;
      try { data = JSON.parse(body); } catch (e) { data = null; }
      if (!res.ok) {
        var msg = (data && data.error && data.error.message) || body || ('HTTP ' + res.status);
        var err = new Error(msg);
        err.status = res.status;
        throw err;
      }
      return data || {};
    });
  }

  /**
   * Build the prompt. The ingredient amounts are real, so the model is told to
   * treat them as a hard constraint rather than a suggestion -- the whole point
   * is a recipe for what is actually in the kitchen.
   */
  function buildPrompt(opts) {
    var lines = [];
    lines.push('You are helping someone cook with exactly what they have.');
    lines.push('');
    lines.push('INGREDIENTS AVAILABLE (these amounts are what they actually have):');
    opts.ingredients.forEach(function (it) {
      lines.push('- ' + it.name + ': ' + it.amount + ' g' +
        (it.portion ? ' (' + it.portion + ')' : ''));
    });
    lines.push('');

    if (opts.cuisine && opts.cuisine !== 'any') {
      lines.push('CUISINE: ' + opts.cuisine + '. Make it genuinely characteristic of that ' +
        'cuisine rather than a generic dish with one spice changed.');
    } else {
      lines.push('CUISINE: the cook has no preference. Choose whatever suits these ' +
        'ingredients best and say why.');
    }
    lines.push('');

    if (opts.servings) {
      lines.push('SERVINGS: aim for about ' + opts.servings + '.');
    }

    if (opts.restrictions && opts.restrictions.length) {
      lines.push('DIETARY RESTRICTIONS (these are absolute, never suggest a substitute that ' +
        'breaks one): ' + opts.restrictions.join('; ') + '.');
      lines.push('');
    }

    if (opts.notes && opts.notes.trim()) {
      lines.push('ADDITIONAL INSTRUCTIONS FROM THE COOK (these take priority over your own ' +
        'preferences): ' + opts.notes.trim());
      lines.push('');
    }

    lines.push('RULES:');
    lines.push('- Build the recipe around the listed ingredients. You may assume basic pantry ' +
      'staples (salt, pepper, cooking oil, water, common dried spices) without listing them ' +
      'as missing.');
    lines.push('- If you need something important that is not listed, put it in a short ' +
      '"You will also need" section rather than pretending it was available.');
    lines.push('- You do not have to use every ingredient. If something does not belong, say ' +
      'so briefly and leave it out.');
    lines.push('- Give quantities in grams and in ordinary kitchen measures.');
    lines.push('- Include realistic timings and the sensory cues that tell the cook a step is ' +
      'done, not just the clock.');
    lines.push('- Do not include a nutrition breakdown. The site computes that from USDA data ' +
      'and yours would conflict with it.');
    lines.push('- Do not make health or medical claims about the dish.');
    lines.push('');
    lines.push('FORMAT: markdown. A title, a one-line description, then "Ingredients", ' +
      '"Method", and optionally "Notes". Keep it tight and readable.');

    return lines.join('\n');
  }

  /** Generate a recipe. Resolves to markdown text. */
  function generate(opts) {
    var key = getKey();
    if (!key) return Promise.reject(new Error('No API key set.'));
    if (!opts.ingredients || !opts.ingredients.length) {
      return Promise.reject(new Error('Add at least one ingredient first.'));
    }
    // Make sure the model has been chosen from the live list before asking.
    if (getPreference() === AUTO && !resolvedAuto) {
      return resolveAuto().then(function () { return callModel(opts); });
    }
    return callModel(opts);
  }

  function callModel(opts) {
    var body = {
      contents: [{ role: 'user', parts: [{ text: buildPrompt(opts) }] }],
      generationConfig: {
        // A little variety, so "regenerate" actually produces something new.
        temperature: opts.regenerating ? 1.0 : 0.8,
        maxOutputTokens: 2048
      }
    };

    return fetch(API + '/models/' + encodeURIComponent(getModel()) +
                 ':generateContent?key=' + encodeURIComponent(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(readJson)
      .then(function (d) {
        var cand = (d.candidates || [])[0];
        if (!cand) {
          var blocked = d.promptFeedback && d.promptFeedback.blockReason;
          throw new Error(blocked
            ? 'The request was blocked by the model (' + blocked + ').'
            : 'The model returned no result.');
        }
        var parts = (cand.content && cand.content.parts) || [];
        var text = parts.map(function (p) { return p.text || ''; }).join('').trim();
        if (!text) {
          throw new Error(cand.finishReason === 'MAX_TOKENS'
            ? 'The reply was cut off before any text arrived. Try fewer ingredients.'
            : 'The model returned an empty reply.');
        }
        return text;
      });
  }

  window.Recipes = {
    getKey: getKey, setKey: setKey, hasKey: hasKey, maskedKey: maskedKey,
    getModel: getModel, setModel: setModel, getPreference: getPreference,
    listModels: listModels, resolveAuto: resolveAuto,
    pickBest: pickBest, scoreModel: scoreModel,
    generate: generate, buildPrompt: buildPrompt,
    resolved: function () { return resolvedAuto; },
    AUTO: AUTO, DEFAULT_MODEL: DEFAULT_MODEL,
    STUDIO_URL: 'https://aistudio.google.com/apikey'
  };
})();
