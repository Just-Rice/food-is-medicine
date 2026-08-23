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

  // A conservative default. The model list is fetched from the API when a key
  // is present, so this only has to work until that returns.
  var DEFAULT_MODEL = 'gemini-2.5-flash';

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

  function getModel() {
    try { return localStorage.getItem(MODEL_STORE) || DEFAULT_MODEL; }
    catch (e) { return DEFAULT_MODEL; }
  }

  function setModel(m) {
    try { localStorage.setItem(MODEL_STORE, m || DEFAULT_MODEL); } catch (e) { /* ignore */ }
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
      lines.push('- ' + it.name + ': ' + it.amount + ' g');
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
    getModel: getModel, setModel: setModel, listModels: listModels,
    generate: generate, buildPrompt: buildPrompt,
    DEFAULT_MODEL: DEFAULT_MODEL,
    STUDIO_URL: 'https://aistudio.google.com/apikey'
  };
})();
