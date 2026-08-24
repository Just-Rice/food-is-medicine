// Food is Medicine -- router and views. Vanilla JS, no build step.
(function () {
  'use strict';

  var FOODS = window.FOODS || [];
  var MED = window.MEDICINAL || [];
  var SOURCES = window.SOURCES || {};
  var CREDITS = window.IMAGE_CREDITS || {};
  var DRI = window.DRI;
  var Profile = window.Profile;
  var Prefs = window.Prefs;
  var I18N = window.I18N;
  var t = I18N.t;

  var main = document.getElementById('main');
  var strip = document.getElementById('profileStrip');

  // ---- small helpers ----------------------------------------------------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmt(v) {
    if (v == null || isNaN(v)) return '—';
    var a = Math.abs(v);
    if (a === 0) return '0';
    if (a >= 100) return String(Math.round(v));
    if (a >= 1) return String(Math.round(v * 10) / 10);
    if (a >= 0.1) return String(Math.round(v * 100) / 100);
    return String(Math.round(v * 1000) / 1000);
  }

  var UNIT_LABEL = { g: 'g', mg: 'mg', ug: 'µg', kcal: 'kcal' };

  // Marks a block of English-only medical prose when the UI is in another
  // language, so the reader knows it was left alone deliberately.
  function englishMark() {
    if (I18N.isEnglish()) return '';
    return '<span class="en-mark" title="' + esc(t('untranslated_hint')) + '">' +
      esc(t('untranslated')) + '</span>';
  }

  // ---- nutrient presentation --------------------------------------------
  var PANEL = [
    { key: 'sec_macros', rows: [
      ['kcal', 'kcal'], ['protein', 'g'], ['carbs', 'g'], ['fiber', 'g'],
      ['sugar', 'g'], ['fat', 'g'], ['water', 'g']
    ]},
    { key: 'sec_fats', rows: [
      ['satfat', 'g'], ['monofat', 'g'], ['polyfat', 'g'], ['ala', 'g'],
      ['epa', 'g'], ['dha', 'g'], ['la', 'g'], ['cholesterol', 'mg']
    ]},
    { key: 'sec_vitamins', rows: [
      ['vita', 'ug'], ['vitc', 'mg'], ['vitd', 'ug'], ['vite', 'mg'],
      ['vitk', 'ug'], ['thiamin', 'mg'], ['riboflavin', 'mg'], ['niacin', 'mg'],
      ['pantothenic', 'mg'], ['b6', 'mg'], ['folate', 'ug'], ['b12', 'ug'],
      ['choline', 'mg']
    ]},
    { key: 'sec_minerals', rows: [
      ['calcium', 'mg'], ['iron', 'mg'], ['magnesium', 'mg'], ['phosphorus', 'mg'],
      ['potassium', 'mg'], ['sodium', 'mg'], ['zinc', 'mg'], ['copper', 'mg'],
      ['manganese', 'mg'], ['selenium', 'ug']
    ]}
  ];

  function nutrientLabel(key) { return t('n_' + key); }

  // FDA Daily Values (21 CFR 101.9) -- the single population-wide set of numbers
  // printed on US labels, used until the visitor supplies their own details.
  var GENERIC_DV = {
    protein: 50, fiber: 28, vita: 900, vitc: 90, vitd: 20, vite: 15, vitk: 120,
    thiamin: 1.2, riboflavin: 1.3, niacin: 16, pantothenic: 5, b6: 1.7,
    folate: 400, b12: 2.4, choline: 550, calcium: 1300, iron: 18, magnesium: 420,
    phosphorus: 1250, potassium: 4700, sodium: 2300, zinc: 11, copper: 0.9,
    manganese: 2.3, selenium: 55
  };

  function referenceSet() {
    var targets = Profile.targets();
    if (!targets) return { personal: false, values: GENERIC_DV, meta: {} };
    var values = {}, meta = {};
    Object.keys(targets).forEach(function (k) { values[k] = targets[k].value; meta[k] = targets[k]; });
    return { personal: true, values: values, meta: meta };
  }

  function highlights(food, ref, limit) {
    var out = [];
    Object.keys(ref.values).forEach(function (key) {
      if (key === 'sodium') return;
      var amount = food.nutrients[key], target = ref.values[key];
      if (amount == null || !target) return;
      var pct = (amount / target) * 100;
      if (pct >= 20) out.push({ key: key, pct: pct });
    });
    out.sort(function (a, b) { return b.pct - a.pct; });
    return out.slice(0, limit || 3);
  }

  // Everything a food can be found by: its display name, the USDA description,
  // the other names people actually call it, and its family tags. Typing
  // "ladyfinger" or "bhindi" finds okra; typing "gourd" returns the whole
  // cucurbit shelf, not only the foods with "gourd" in the USDA name.
  function haystack(food) {
    if (food._hay) return food._hay;
    food._hay = [food.name, food.usda || '',
                 (food.aka || []).join(' '),
                 (food.tags || []).join(' ')].join(' ').toLowerCase();
    return food._hay;
  }

  // Relevance, so that substring matching stays useful without being silly.
  // "anda" (egg) genuinely occurs inside "mandarin" and "chukandar"; those are
  // real matches and should still be findable, but the chicken egg belongs at
  // the top. Whole-word hits outrank buried substrings.
  function relevance(food, q) {
    var name = food.name.toLowerCase();
    if (name === q) return 100;
    if (name.indexOf(q) === 0) return 90;

    var word = new RegExp('(^|[^a-z])' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (word.test(name)) return 80;

    var aliases = food.aka || [];
    for (var i = 0; i < aliases.length; i++) {
      var a = aliases[i].toLowerCase();
      if (a === q) return 70;
      if (word.test(a)) return 60;
    }

    var tags = food.tags || [];
    for (var j = 0; j < tags.length; j++) {
      if (tags[j].toLowerCase() === q) return 50;
      if (word.test(tags[j])) return 45;
    }

    if (name.indexOf(q) >= 0) return 30;
    if (word.test(food.usda || '')) return 20;
    return 5;   // matched somewhere, but only mid-word
  }

  // Which of a food's own labels matched, so the card can show why it appeared
  // when the match was on a name the reader did not type.
  function matchedAlias(food, q) {
    if (!q) return null;
    var hit = (food.aka || []).filter(function (a) {
      return a.toLowerCase().indexOf(q) >= 0;
    })[0];
    if (hit && food.name.toLowerCase().indexOf(q) < 0) return hit;
    return null;
  }

  var GROUPS = ['all', 'fruit', 'veg', 'mushroom', 'nut', 'legume', 'grain',
                'herb', 'dairy', 'meat', 'poultry', 'offal', 'fish',
                'shellfish', 'egg', 'fat', 'bee'];

  function groupLabel(id) { return t('g_' + id); }

  function foodImage(food, cls) {
    var credit = CREDITS[food.slug];
    if (!credit) return '<div class="' + cls + ' noimg" aria-hidden="true"></div>';
    return '<img class="' + cls + '" src="img/' + esc(food.slug) + '.jpg" alt="" ' +
      'loading="lazy" decoding="async">';
  }

  // BMI-for-age for anyone under 20. The number sits behind a deliberate click:
  // AAP guidance is to avoid weight-focused talk with young people, so showing
  // a body figure unprompted to a 13-year-old is the wrong default. Someone who
  // wants it can have it, with the context that makes it meaningful.
  var showPercentile = false;

  function bmiForAgeBlock(prof) {
    if (!window.Growth.applies(prof.age)) return '';
    var bmi = Profile.bmi();
    var r = window.Growth.percentile(bmi, prof.age, prof.sex);
    if (!r) return '';

    if (!showPercentile) {
      return '<div class="card pad reveal-card">' +
        '<div><strong>' + esc(t('bmi_for_age')) + '</strong>' +
        '<p class="hint">Adult BMI categories do not apply under 20 \u2014 a healthy BMI ' +
        'changes as you grow. Percentiles compare you with others of the same age and sex.</p></div>' +
        '<button class="btn ghost" type="button" id="revealPct">' +
        esc(t('show_percentile')) + '</button></div>';
    }

    return '<div class="card pad">' +
      '<div class="energy-row" style="margin:0 0 14px">' +
      '<div class="macro"><div class="v">' + r.percentile + '<span class="u">th</span></div>' +
      '<div class="l">' + esc(t('bmi_for_age')) + '</div></div>' +
      '<div class="macro"><div class="v">' + fmt(bmi) + '</div>' +
      '<div class="l">' + esc(t('bmi')) + '</div></div>' +
      '<div class="macro"><div class="v">' + r.median + '</div>' +
      '<div class="l">Median at age ' + esc(prof.age) + '</div></div></div>' +
      '<p><strong>' + esc(r.band.label) + '</strong> by the ' +
      '<a href="#/sources#src-cdc_growth">CDC growth charts</a>. ' + englishMark() + '</p>' +
      '<p class="hint">A percentile is a comparison, not a verdict. It says where you sit ' +
      'among people of your age and sex \u2014 half of perfectly healthy children are below ' +
      'the 50th by definition. It cannot tell muscle from fat, it does not account for when ' +
      'puberty started, and one reading says far less than the direction of travel over a ' +
      'year. If it worries you, the person to show it to is a doctor, who can put it next to ' +
      'your growth history.</p>' +
      '<button class="btn ghost" type="button" id="hidePct">' + esc(t('hide_percentile')) +
      '</button></div>';
  }

  // Shown wherever the site touches weight, restriction or body composition.
  // Dieting is the commonest precipitant of eating disorders and they carry
  // among the highest mortality of any mental illness, so a page that discusses
  // deficits should not be silent about that.
  function supportNote() {
    return '<div class="note support"><p>' + esc(t('ed_help')) + '</p>' +
      '<p><a href="https://www.nimh.nih.gov/health/topics/eating-disorders" ' +
      'rel="noopener" target="_blank">' + esc(t('ed_help_link')) + '</a> · ' +
      '<a href="#/sources#src-aap_ed">' + esc(t('nav_sources')) + '</a></p></div>';
  }

  // ---- profile strip ----------------------------------------------------
  function renderStrip() {
    var p = Profile.get();
    if (!p) { strip.hidden = true; strip.innerHTML = ''; return; }
    var e = Profile.energy();
    strip.hidden = false;
    strip.innerHTML = '<div class="wrap">' +
      '<span>' + esc(p.age) + ' · ' + esc(t(p.sex)) + ' · ' +
      fmt(p.heightCm) + '&nbsp;cm · ' + fmt(p.weightKg) + '&nbsp;kg</span>' +
      '<span><strong>' + e.tdee + '</strong>&nbsp;kcal/' + esc(t('daily_total').toLowerCase()) + '</span>' +
      '<a href="#/you">' + esc(t('nav_you')) + '</a></div>';
  }

  // ======================================================================
  // View: food explorer
  // ======================================================================
  var foodState = { q: '', group: 'all', sort: 'name' };

  // Building a thousand cards costs the best part of a second, most of it spent
  // on rows nobody has scrolled to. Render a page at a time and let the reader
  // ask for the rest; a search that narrows below the cap shows everything.
  var PAGE_SIZE = 240;
  var showAllFoods = false;

  function viewFoods() {
    var ref = referenceSet();
    var sortKeys = ['protein', 'fiber', 'vitc', 'vitk', 'folate', 'iron', 'calcium',
                    'magnesium', 'potassium', 'zinc', 'selenium', 'vitd', 'vita',
                    'b12', 'ala', 'epa', 'dha'];

    main.innerHTML =
      '<div class="page-head"><h1>' + esc(t('foods_title')) + '</h1>' +
      '<p>' + t('foods_lede_count', { n: FOODS.length }) + ' ' +
      (ref.personal ? t('foods_lede_personal') : t('foods_lede_generic')) + '</p></div>' +

      '<div class="controls">' +
      '<input class="search" id="foodSearch" type="search" placeholder="' +
      esc(t('search_foods')) + '" value="' + esc(foodState.q) + '" aria-label="' +
      esc(t('search_foods')) + '">' +
      '<select class="control" id="foodSort" aria-label="' + esc(t('sort_by')) + '">' +
      '<option value="name">' + esc(t('sort_prefix') + t('sort_name')) + '</option>' +
      '<option value="kcal">' + esc(t('sort_prefix') + t('sort_energy')) + '</option>' +
      sortKeys.map(function (k) {
        return '<option value="' + k + '">' +
          esc(t('sort_prefix') + nutrientLabel(k) + ' ' + t('sort_highest')) + '</option>';
      }).join('') + '</select></div>' +

      '<div class="chips" role="group" aria-label="' + esc(t('filter_group')) + '">' +
      GROUPS.map(function (g) {
        return '<button class="chip" type="button" data-group="' + g + '" aria-pressed="' +
          (foodState.group === g ? 'true' : 'false') + '">' + esc(groupLabel(g)) + '</button>';
      }).join('') + '</div>' +

      '<p class="result-count" id="foodCount"></p>' +
      '<div class="grid" id="foodGrid"></div>' +
      '<div class="show-all" id="showAllWrap"></div>';

    document.getElementById('foodSort').value = foodState.sort;

    // Repainting a grid of a thousand cards on every keystroke costs a few
    // hundred milliseconds each time, which reads as a stutter while typing.
    // Coalesce the keystrokes and paint once the typing pauses.
    var search = document.getElementById('foodSearch');
    var typingTimer = null;
    search.addEventListener('input', function () {
      foodState.q = search.value;
      showAllFoods = false;
      if (typingTimer) clearTimeout(typingTimer);
      typingTimer = setTimeout(function () { typingTimer = null; paint(); }, 130);
    });
    document.getElementById('foodSort').addEventListener('change', function (ev) {
      foodState.sort = ev.target.value; paint();
    });
    main.querySelectorAll('.chip[data-group]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        foodState.group = btn.dataset.group;
        showAllFoods = false;
        main.querySelectorAll('.chip[data-group]').forEach(function (b) {
          b.setAttribute('aria-pressed', b.dataset.group === foodState.group ? 'true' : 'false');
        });
        paint();
      });
    });

    paint();

    function paint() {
      var q = foodState.q.trim().toLowerCase();
      var hidden = 0;
      var list = FOODS.filter(function (f) {
        if (foodState.group !== 'all' && f.group !== foodState.group) return false;
        if (q && haystack(f).indexOf(q) < 0 && f.slug.indexOf(q) < 0) return false;
        if (Prefs.excludedReason(f)) { hidden++; return false; }
        return true;
      });

      if (foodState.sort === 'name' && q) {
        list.sort(function (a, b) {
          var d = relevance(b, q) - relevance(a, q);
          return d !== 0 ? d : a.name.localeCompare(b.name);
        });
      } else if (foodState.sort === 'name') {
        list.sort(function (a, b) { return a.name.localeCompare(b.name); });
      } else {
        var key = foodState.sort;
        list.sort(function (a, b) { return (b.nutrients[key] || 0) - (a.nutrients[key] || 0); });
      }

      var count = list.length === 1 ? t('one_food') : t('n_foods', { n: list.length });
      var capped = !showAllFoods && list.length > PAGE_SIZE;
      var shown = capped ? list.slice(0, PAGE_SIZE) : list;

      document.getElementById('foodCount').innerHTML = esc(count) +
        (hidden ? ' <span class="dim">· ' + esc(t('hidden_by_diet', { n: hidden })) +
          ' <a href="#/settings">' + esc(t('nav_settings')) + '</a></span>' : '') +
        (capped ? ' <span class="dim">· ' +
          esc(t('showing_some', { n: PAGE_SIZE, total: list.length })) + '</span>' : '');

      var grid = document.getElementById('foodGrid');
      if (!list.length) {
        grid.innerHTML = '<p class="empty">' + esc(t('no_match')) + '</p>';
        var more0 = document.getElementById('showAllWrap');
        if (more0) more0.innerHTML = '';
        return;
      }

      grid.innerHTML = shown.map(function (f) {
        var hs = highlights(f, ref, 3);
        return '<a class="food-card" href="#/food/' + esc(f.slug) + '">' +
          foodImage(f, 'thumb') +
          '<div class="food-card-body">' +
          '<h3>' + esc(f.name) + '</h3>' +
          (function () {
            var alias = matchedAlias(f, q);
            return alias ? '<div class="alias-hit">also called ' + esc(alias) + '</div>' : '';
          })() +
          '<div class="kcal">' + fmt(f.nutrients.kcal) + ' kcal · ' +
          fmt(f.nutrients.protein) + ' g ' + esc(t('n_protein').toLowerCase()) + '</div>' +
          (hs.length
            ? '<div class="highlights">' + hs.map(function (h) {
                return '<span class="tag">' + esc(nutrientLabel(h.key)) + ' ' +
                  Math.round(h.pct) + '%</span>';
              }).join('') + '</div>'
            : '<div class="highlights"><span class="tag g">' + esc(groupLabel(f.group)) +
              '</span></div>') +
          '</div></a>';
      }).join('');

      var wrap = document.getElementById('showAllWrap');
      if (wrap) {
        wrap.innerHTML = capped
          ? '<button class="btn ghost" type="button" id="showAllBtn">' +
            esc(t('show_all', { total: list.length })) + '</button>'
          : '';
        var btn = document.getElementById('showAllBtn');
        if (btn) {
          btn.addEventListener('click', function () {
            showAllFoods = true;
            paint();
          });
        }
      }
    }
  }

  // ======================================================================
  // View: single food
  // ======================================================================
  var portionState = {};

  function viewFood(slug) {
    var food = FOODS.filter(function (f) { return f.slug === slug; })[0];
    if (!food) return viewMissing();

    var ref = referenceSet();
    var choices = [{ label: t('per100'), grams: 100 }];
    if (food.portion && Math.abs(food.portion.grams - 100) > 1) {
      choices.push({ label: '1 ' + food.portion.label, grams: food.portion.grams });
    }
    var chosen = portionState[slug] || 0;
    if (chosen >= choices.length) chosen = 0;
    var scale = choices[chosen].grams / 100;

    var excluded = Prefs.excludedReason(food);
    var linked = MED.filter(function (m) { return (m.foodSlugs || []).indexOf(slug) >= 0; });
    var credit = CREDITS[slug];
    var fdcUrl = 'https://fdc.nal.usda.gov/food-details/' + food.fdcId + '/nutrients';

    main.innerHTML =
      '<a class="crumb" href="#/foods">&larr; ' + esc(t('all_foods')) + '</a>' +

      (excluded
        ? '<div class="note danger"><p><strong>' + esc(t('excluded_warning')) + '</strong> — ' +
          esc(excluded.reason === 'allergen' ? t('a_' + excluded.detail)
              : excluded.reason === 'diet' ? t('diet_' + excluded.detail)
              : excluded.detail) +
          '. <a href="#/settings">' + esc(t('nav_settings')) + '</a></p></div>'
        : '') +

      '<div class="food-hero">' + foodImage(food, 'hero-img') +
      '<div class="food-hero-text">' +
      '<h1>' + esc(food.name) + '</h1>' +
      '<span class="tag g">' + esc(groupLabel(food.group)) + '</span>' +
      ((food.aka || []).length
        ? '<p class="also-called">Also called ' +
          food.aka.map(function (a) { return esc(a); }).join(', ') + '</p>'
        : '') +
      ((food.tags || []).length
        ? '<div class="tag-row">' + food.tags.map(function (tg) {
            return '<a class="tag tappable" href="#/foods?q=' +
              encodeURIComponent(tg) + '">' + esc(tg) + '</a>';
          }).join('') + '</div>'
        : '') +
      '<p class="source-line">' + esc(food.usda || '') + ' — ' +
      '<a href="' + fdcUrl + '" rel="noopener" target="_blank">FDC ' + food.fdcId + '</a>' +
      (credit && credit.page
        ? '<br><span class="credit">' +
          esc(t('photo_credit', { author: credit.author, license: credit.license })) +
          ' · <a href="' + esc(credit.page) + '" rel="noopener" target="_blank">file</a></span>'
        : '') +
      '</p></div></div>' +

      (choices.length > 1
        ? '<div class="portion-toggle"><span class="label">' + esc(t('show')) + '</span>' +
          choices.map(function (c, i) {
            return '<button class="chip" type="button" data-portion="' + i + '" aria-pressed="' +
              (i === chosen ? 'true' : 'false') + '">' + esc(c.label) +
              (i > 0 ? ' (' + fmt(c.grams) + ' g)' : '') + '</button>';
          }).join('') + '</div>'
        : '') +

      '<div class="macro-row">' +
      ['kcal', 'protein', 'carbs', 'fiber', 'fat'].map(function (k) {
        var v = food.nutrients[k];
        var unit = k === 'kcal' ? 'kcal' : 'g';
        return '<div class="macro"><div class="v">' + (v == null ? '—' : fmt(v * scale)) +
          '<span class="u"> ' + unit + '</span></div>' +
          '<div class="l">' + esc(nutrientLabel(k)) + '</div></div>';
      }).join('') + '</div>' +

      '<p class="result-count">' + (ref.personal ? t('pct_personal') : t('pct_generic')) + '</p>' +

      '<div class="table-scroll"><table class="nutrients">' +
      '<thead><tr><th>' + esc(t('nutrient')) + '</th><th class="num">' + esc(t('amount')) +
      '</th><th class="num">' + esc(ref.personal ? t('of_your_target') : t('of_dv')) +
      '</th></tr></thead><tbody>' + panelRows(food, ref, scale) + '</tbody></table></div>' +

      ulNotes(food, scale) +

      (linked.length
        ? '<h2 class="section">' + esc(t('nav_medicinal')) + '</h2>' +
          '<div class="herb-grid">' + linked.map(herbCard).join('') + '</div>'
        : '');

    main.querySelectorAll('[data-portion]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        portionState[slug] = Number(btn.dataset.portion);
        viewFood(slug);
        window.scrollTo(0, 0);
      });
    });
  }

  function panelRows(food, ref, scale) {
    var html = '';
    PANEL.forEach(function (section) {
      var rows = section.rows.filter(function (r) { return food.nutrients[r[0]] != null; });
      if (!rows.length) return;
      html += '<tr class="group-head"><td colspan="3">' + esc(t(section.key)) + '</td></tr>';
      rows.forEach(function (r) {
        var key = r[0], unit = r[1];
        var amount = food.nutrients[key] * scale;
        var target = ref.values[key];
        var meta = ref.meta[key];
        var pctCell = '<td class="num"><span class="pct dim">—</span></td>';

        if (target) {
          var pct = (amount / target) * 100;
          var cls = pct > 100 ? 'over' : (pct >= 50 ? 'high' : '');
          // Sodium reads the other way round: a high share of the limit is bad.
          if (key === 'sodium') cls = pct >= 50 ? 'over' : (pct >= 20 ? 'high' : '');
          pctCell = '<td class="num"><span class="dv-cell">' +
            '<span class="bar ' + cls + '"><span style="width:' +
            Math.min(100, Math.round(pct)) + '%"></span></span>' +
            '<span class="pct">' + (pct < 1 ? '<1' : Math.round(pct)) + '%</span></span></td>';
        }

        html += '<tr><td class="name">' + esc(nutrientLabel(key)) +
          (meta && meta.type === 'AI' ? '<span class="dri-type">AI</span>' : '') +
          '</td><td class="num">' + fmt(amount) + ' ' + (UNIT_LABEL[unit] || unit) +
          '</td>' + pctCell + '</tr>';
      });
    });
    return html;
  }

  function ulNotes(food, scale) {
    var hits = [];
    // A child's tolerable limits are far below an adult's -- selenium is 90 µg
    // at age 1-3 against 400 for an adult -- so the limits shown have to follow
    // whoever is reading.
    var prof = Profile.get();
    var limits = DRI.upperLimitsFor(prof ? prof.age : 30);
    Object.keys(limits).forEach(function (key) {
      var amount = food.nutrients[key];
      if (amount == null) return;
      var ul = limits[key];
      if (ul.supplementOnly) return;   // does not apply to whole food
      var pct = (amount * scale / ul.value) * 100;
      if (pct >= 60) hits.push({ key: key, pct: pct, ul: ul });
    });
    return hits.map(function (h) {
      return '<div class="note ' + (h.pct >= 100 ? 'danger' : 'warn') + '">' +
        '<p><strong>' + esc(nutrientLabel(h.key)) + ': ' +
        (h.pct >= 100 ? 'this portion exceeds' : 'this portion reaches ' + Math.round(h.pct) + '% of') +
        ' the tolerable upper intake level</strong> of ' + fmt(h.ul.value) + ' ' +
        (UNIT_LABEL[h.ul.unit] || h.ul.unit) + ' a day for adults. ' + englishMark() + '</p>' +
        '<p>' + esc(h.ul.note) + '</p></div>';
    }).join('');
  }

  // ======================================================================
  // View: medicinal
  // ======================================================================
  var GRADES = [
    { id: 'established', blurb: 'Accepted by a regulator or clinical guideline after formal review.' },
    { id: 'moderate', blurb: 'Several trials or a meta-analysis agree, with caveats.' },
    { id: 'preliminary', blurb: 'Small, short or mixed studies. Interesting, not settled.' },
    { id: 'insufficient', blurb: 'Studied and found wanting, or too weak to judge.' },
    { id: 'ineffective', blurb: 'Well-powered trials looked and found no benefit.' }
  ];
  var GRADE_RANK = {};
  GRADES.forEach(function (g, i) { GRADE_RANK[g.id] = i; });

  var medState = { q: '', grade: 'all' };

  function bestGrade(entry) {
    return entry.claims.reduce(function (best, c) {
      return GRADE_RANK[c.grade] < GRADE_RANK[best] ? c.grade : best;
    }, 'ineffective');
  }

  function herbCard(m) {
    var seen = [];
    m.claims.forEach(function (c) { if (seen.indexOf(c.grade) < 0) seen.push(c.grade); });
    seen.sort(function (a, b) { return GRADE_RANK[a] - GRADE_RANK[b]; });
    return '<a class="herb-card" href="#/herb/' + esc(m.slug) + '">' +
      '<h3>' + esc(m.name) + (m.warning ? ' <span class="ul-flag">safety</span>' : '') + '</h3>' +
      (m.latin ? '<div class="latin">' + esc(m.latin) + '</div>' : '') +
      '<p class="lede">' + esc(m.claims[0].claim) + '</p>' +
      '<div class="grades">' + seen.map(function (g) {
        return '<span class="grade grade-' + g + '">' + esc(g) + '</span>';
      }).join('') + '</div></a>';
  }

  function viewMedicinal() {
    main.innerHTML =
      '<div class="page-head"><h1>' + esc(t('nav_medicinal')) + ' ' + englishMark() + '</h1>' +
      '<p>Herbs are pharmacologically active, which is exactly why they need the same ' +
      'scrutiny as drugs. Each entry below is graded by how good the evidence actually is ' +
      '— not by how often it appears on a supplement label. Several popular remedies here ' +
      'are graded <em>ineffective</em>, because large trials looked carefully and found ' +
      'nothing.</p></div>' +

      (I18N.isEnglish() ? ''
        : '<div class="note"><p>' + esc(t('untranslated_hint')) + '</p></div>') +

      '<div class="card legend">' + GRADES.map(function (g) {
        return '<div><span class="grade grade-' + g.id + '">' + esc(g.id) + '</span>' +
          '<span>' + esc(g.blurb) + '</span></div>';
      }).join('') + '</div>' +

      '<div class="controls">' +
      '<input class="search" id="medSearch" type="search" placeholder="Search herbs, foods, conditions…" ' +
      'value="' + esc(medState.q) + '" aria-label="Search medicinal entries"></div>' +

      '<div class="chips" role="group" aria-label="Filter by evidence grade">' +
      '<button class="chip" type="button" data-grade="all" aria-pressed="' +
      (medState.grade === 'all' ? 'true' : 'false') + '">All evidence levels</button>' +
      GRADES.map(function (g) {
        return '<button class="chip" type="button" data-grade="' + g.id + '" aria-pressed="' +
          (medState.grade === g.id ? 'true' : 'false') + '">' + esc(g.id) + '</button>';
      }).join('') + '</div>' +

      '<p class="result-count" id="medCount"></p>' +
      '<div class="herb-grid" id="medGrid"></div>';

    var search = document.getElementById('medSearch');
    search.addEventListener('input', function () { medState.q = search.value; paint(); });
    main.querySelectorAll('.chip[data-grade]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        medState.grade = btn.dataset.grade;
        main.querySelectorAll('.chip[data-grade]').forEach(function (b) {
          b.setAttribute('aria-pressed', b.dataset.grade === medState.grade ? 'true' : 'false');
        });
        paint();
      });
    });
    paint();

    function paint() {
      var q = medState.q.trim().toLowerCase();
      var list = MED.filter(function (m) {
        if (medState.grade !== 'all' &&
            !m.claims.some(function (c) { return c.grade === medState.grade; })) return false;
        if (!q) return true;
        var hay = [m.name, m.latin || '', (m.activeCompounds || []).join(' '),
          m.claims.map(function (c) { return c.claim + ' ' + c.detail; }).join(' '),
          m.mechanism || '', m.safety || ''].join(' ').toLowerCase();
        return hay.indexOf(q) >= 0;
      });
      list.sort(function (a, b) {
        var d = GRADE_RANK[bestGrade(a)] - GRADE_RANK[bestGrade(b)];
        return d !== 0 ? d : a.name.localeCompare(b.name);
      });
      document.getElementById('medCount').textContent =
        list.length + (list.length === 1 ? ' entry' : ' entries');
      document.getElementById('medGrid').innerHTML = list.length
        ? list.map(herbCard).join('') : '<p class="empty">' + esc(t('no_match')) + '</p>';
    }
  }

  function refPills(keys) {
    if (!keys || !keys.length) return '';
    return '<div class="refs">' + keys.map(function (k) {
      var s = SOURCES[k];
      if (!s) return '';
      return '<a class="ref-pill" href="#/sources#src-' + esc(k) + '" title="' +
        esc(s.title) + '">' + esc(s.org.split(/[,;]|\.\s/)[0]) + (s.year ? ' ' + s.year : '') + '</a>';
    }).join('') + '</div>';
  }

  // The warning banner has to match what the entry actually is: telling someone
  // to think twice "before using this herb" reads oddly above bacon.
  function safetyBanner(m) {
    var lead = (m.kind === 'food' || m.kind === 'mushroom')
      ? 'Read the safety section on this page before treating this food as medicinal.'
      : (m.kind === 'compound'
          ? 'Read the safety section on this page before taking this supplement.'
          : 'Read the safety section on this page before using this herb.');
    return '<div class="note danger"><p><strong>' + esc(lead) + '</strong> It carries a ' +
      'documented risk of harm or a serious drug interaction, not merely a theoretical one.' +
      '</p></div>';
  }

  function viewHerb(slug) {
    var m = MED.filter(function (x) { return x.slug === slug; })[0];
    if (!m) return viewMissing();

    var relatedFoods = (m.foodSlugs || []).map(function (s) {
      return FOODS.filter(function (f) { return f.slug === s; })[0];
    }).filter(Boolean);

    main.innerHTML =
      '<a class="crumb" href="#/medicinal">&larr; ' + esc(t('nav_medicinal')) + '</a>' +
      '<div class="detail-head"><h1>' + esc(m.name) + '</h1>' +
      (m.latin ? '<span class="latin">' + esc(m.latin) + '</span>' : '') +
      englishMark() + '</div>' +
      (m.activeCompounds && m.activeCompounds.length
        ? '<p class="source-line">Active constituents: ' + m.activeCompounds.map(esc).join(', ') + '</p>'
        : '<div style="height:14px"></div>') +

      (m.warning ? safetyBanner(m) : '') +

      '<h2 class="section">What the evidence says</h2>' +
      m.claims.map(function (c) {
        return '<div class="claim"><div class="claim-head">' +
          '<h3>' + esc(c.claim) + '</h3>' +
          '<span class="grade grade-' + c.grade + '">' + esc(c.grade) + '</span></div>' +
          '<p>' + esc(c.detail) + '</p>' + refPills(c.refs) + '</div>';
      }).join('') +

      '<div class="two-col" style="margin-top:26px">' +
      '<div class="card pad"><dl class="facts">' +
      (m.mechanism ? '<dt>How it works</dt><dd>' + esc(m.mechanism) + '</dd>' : '') +
      '</dl></div>' +
      '<div class="card pad"><dl class="facts">' +
      (m.safety ? '<dt>Safety</dt><dd>' + esc(m.safety) + '</dd>' : '') +
      (m.interactions
        ? '<dt>Drug interactions</dt><dd>' + esc(m.interactions) + '</dd>'
        : '<dt>Drug interactions</dt><dd>None well documented. That is not a guarantee — ' +
          'most herb–drug interactions have never been formally studied.</dd>') +
      '</dl></div></div>' +

      (m.refs && m.refs.length
        ? '<h2 class="section">Further sources for this entry</h2>' + refPills(m.refs) : '') +

      (relatedFoods.length
        ? '<h2 class="section">Nutrition data for related foods</h2><div class="grid">' +
          relatedFoods.map(function (f) {
            return '<a class="food-card" href="#/food/' + esc(f.slug) + '">' +
              foodImage(f, 'thumb') + '<div class="food-card-body"><h3>' + esc(f.name) +
              '</h3><div class="kcal">' + fmt(f.nutrients.kcal) + ' kcal / 100 g</div>' +
              '</div></a>';
          }).join('') + '</div>'
        : '');
  }

  // ---- "best sources" ranking -------------------------------------------
  // Ranking by amount per 100 g is misleading once spices and concentrates are
  // in the database: ground cinnamon is 53% fibre, so it outranks every
  // vegetable, and nobody eats 100 g of it. Ranking by a realistic household
  // portion fixes that without special-casing anything -- cinnamon's portion is
  // a 2.6 g teaspoon, broccoli's is a 91 g cup.
  // `serving` is a plausible amount to eat at once; `portion` is a countable
  // kitchen unit and can be a whole cabbage, which is useless here.
  function servingGrams(food) {
    if (food.serving && food.serving.grams) return food.serving.grams;
    if (food.portion && food.portion.grams && food.portion.grams <= 250) {
      return food.portion.grams;
    }
    return 100;
  }

  function servingLabel(food) {
    if (food.serving && food.serving.label) return food.serving.label;
    if (food.portion && food.portion.label && food.portion.grams <= 250) {
      return food.portion.label;
    }
    return '100 g';
  }

  function servingAmount(food, key) {
    var per100 = food.nutrients[key];
    if (per100 == null) return 0;
    return per100 * (servingGrams(food) / 100);
  }

  // Excluded from source suggestions. Rendered fats and gelatin are cooking
  // ingredients rather than things eaten for their nutrients -- and gelatin in
  // particular is an incomplete protein that should never be recommended as a
  // protein source. The named fats are excluded even though they sit in the
  // dairy group, because USDA's portion for them is a measuring cup: a cup of
  // ghee would top the vitamin A list and nobody eats one.
  var NOT_A_SOURCE_GROUP = { fat: true, bee: true };
  var NOT_A_SOURCE_SLUG = {
    ghee: true, butter: true, buttersalted: true,
    tallow: true, lard: true, schmaltz: true
  };

  function bestSources(key, n) {
    return FOODS
      .filter(function (f) {
        return f.nutrients[key] != null &&
          !NOT_A_SOURCE_GROUP[f.group] && !NOT_A_SOURCE_SLUG[f.slug] &&
          !Prefs.excludedReason(f);
      })
      .sort(function (a, b) { return servingAmount(b, key) - servingAmount(a, key); })
      .slice(0, n || 3);
  }

  // ======================================================================
  // View: profile
  // ======================================================================
  var unitState = 'metric';

  function viewProfile() {
    var p = Profile.get();
    var imperial = unitState === 'imperial';
    var wVal = '', hVal = '', hInVal = '';
    if (p) {
      wVal = imperial ? Math.round(Profile.kgToLb(p.weightKg)) : Math.round(p.weightKg * 10) / 10;
      if (imperial) {
        var totalIn = Profile.cmToIn(p.heightCm);
        hVal = Math.floor(totalIn / 12);
        hInVal = Math.round(totalIn % 12);
      } else { hVal = Math.round(p.heightCm); }
    }

    main.innerHTML =
      '<div class="page-head"><h1>' + esc(t('profile_title')) + '</h1>' +
      '<p>Nutrient requirements are not one number. An 18-year-old woman needs more than ' +
      'twice the iron of a man the same age; a man over 50 needs a third more vitamin B6 ' +
      'than he did at 30. Fill this in and every percentage on the site is recalculated ' +
      'against your own reference intakes.</p></div>' +

      '<div class="note"><p>' + t('privacy_note') + '</p></div>' +

      '<div class="card form-card">' +
      '<div class="unit-switch chips" role="group" aria-label="Units">' +
      '<button class="chip" type="button" data-unit="metric" aria-pressed="' +
      (!imperial ? 'true' : 'false') + '">' + esc(t('metric')) + '</button>' +
      '<button class="chip" type="button" data-unit="imperial" aria-pressed="' +
      (imperial ? 'true' : 'false') + '">' + esc(t('imperial')) + '</button></div>' +

      '<form id="profileForm">' +
      '<div class="field-row">' +
      '<div class="field"><label for="pAge">' + esc(t('age')) + '</label>' +
      '<input id="pAge" type="number" min="1" max="119" step="1" required value="' +
      (p ? esc(p.age) : '') + '"></div>' +
      '<div class="field"><label for="pSex">' + esc(t('sex')) + '</label>' +
      '<select id="pSex" required>' +
      '<option value="female"' + (p && p.sex === 'female' ? ' selected' : '') + '>' + esc(t('female')) + '</option>' +
      '<option value="male"' + (p && p.sex === 'male' ? ' selected' : '') + '>' + esc(t('male')) + '</option>' +
      '</select></div></div>' +

      '<div class="field-row">' +
      (imperial
        ? '<div class="field"><label for="pHeight">' + esc(t('height')) + '</label>' +
          '<div class="inline-inputs">' +
          '<input id="pHeight" type="number" min="2" max="8" step="1" required placeholder="ft" value="' + esc(hVal) + '">' +
          '<input id="pHeightIn" type="number" min="0" max="11" step="1" placeholder="in" value="' + esc(hInVal) + '">' +
          '</div></div>' +
          '<div class="field"><label for="pWeight">' + esc(t('weight_lb')) + '</label>' +
          '<input id="pWeight" type="number" min="40" max="900" step="1" required value="' + esc(wVal) + '"></div>'
        : '<div class="field"><label for="pHeight">' + esc(t('height_cm')) + '</label>' +
          '<input id="pHeight" type="number" min="90" max="250" step="1" required value="' + esc(hVal) + '"></div>' +
          '<div class="field"><label for="pWeight">' + esc(t('weight_kg')) + '</label>' +
          '<input id="pWeight" type="number" min="20" max="400" step="0.1" required value="' + esc(wVal) + '"></div>') +
      '</div>' +

      '<div class="field" style="margin-bottom:18px"><label for="pActivity">' + esc(t('activity')) + '</label>' +
      '<select id="pActivity">' + DRI.activity.map(function (a) {
        var sel = p && p.activity === a.value ? ' selected' : (!p && a.value === 1.375 ? ' selected' : '');
        return '<option value="' + a.value + '"' + sel + '>' + esc(a.label) + ' — ' + esc(a.hint) + '</option>';
      }).join('') + '</select></div>' +

      '<div class="btn-row"><button class="btn" type="submit">' +
      esc(p ? t('update_targets') : t('calc_targets')) + '</button></div>' +
      '</form>' +

      (p ? '<div class="danger-zone">' +
        '<div><strong>' + esc(t('clear_details')) + '</strong>' +
        '<p>Removes your age, sex, height and weight from this browser. Percentages go back ' +
        'to the generic food label.</p></div>' +
        '<button class="btn danger" type="button" id="clearProfile">' +
        esc(t('clear_details')) + '</button></div>' : '') +
      '</div>' +

      '<div id="profileResults"></div>';

    main.querySelectorAll('[data-unit]').forEach(function (btn) {
      btn.addEventListener('click', function () { unitState = btn.dataset.unit; viewProfile(); });
    });

    var clearBtn = document.getElementById('clearProfile');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        Profile.clear(); renderStrip(); viewProfile(); window.scrollTo(0, 0);
      });
    }

    document.getElementById('profileForm').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var weight = Number(document.getElementById('pWeight').value);
      var heightCm, weightKg;
      if (imperial) {
        var ft = Number(document.getElementById('pHeight').value);
        var inch = Number(document.getElementById('pHeightIn').value || 0);
        heightCm = Profile.inToCm(ft * 12 + inch);
        weightKg = Profile.lbToKg(weight);
      } else {
        heightCm = Number(document.getElementById('pHeight').value);
        weightKg = weight;
      }
      var next = {
        age: Number(document.getElementById('pAge').value),
        sex: document.getElementById('pSex').value,
        activity: Number(document.getElementById('pActivity').value),
        heightCm: Math.round(heightCm * 10) / 10,
        weightKg: Math.round(weightKg * 10) / 10
      };
      if (!Profile.save(next)) return;
      renderStrip();
      viewProfile();
      document.getElementById('profileResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    if (p) renderResults();

    function renderResults() {
      var prof = Profile.get();
      var targets = Profile.targets();
      var e = Profile.energy();
      var order = ['protein', 'fiber']
        .concat(PANEL[2].rows.map(function (r) { return r[0]; }))
        .concat(PANEL[3].rows.map(function (r) { return r[0]; }))
        .concat(['ala', 'la'])
        .filter(function (k) { return targets[k]; });

      var minor = !DRI.energyApplies(prof.age);

      document.getElementById('profileResults').innerHTML =
        (minor
          ? '<h2 class="section">' + esc(t('growing_title')) + '</h2>' +
            '<div class="note"><p><strong>You are still growing, so the adult numbers do ' +
            'not apply to you — and that is the interesting part, not a limitation.</strong> ' +
            'Your body is building bone and muscle at a rate it never will again, which is why ' +
            'your calcium target is higher than an adult\'s and, if you are a teenage girl, ' +
            'your iron target is more than double an adult man\'s. The targets below are the ' +
            'real ones for your age.</p>' +
            '<p>What this site will not do is give you a calorie target. Adult energy equations ' +
            'do not account for the cost of growing, and the ' +
            '<a href="#/sources#src-aap_prevention">American Academy of Pediatrics</a> advises ' +
            'against dieting and against weight-focused talk with under-18s altogether — ' +
            'because encouraging teenagers to diet is one of the few things in this whole area ' +
            'with good evidence of harm. Eating enough of the right things is the goal at your ' +
            'age. ' + englishMark() + '</p></div>' +
            bmiForAgeBlock(prof) +
            supportNote()
          : '<h2 class="section">' + esc(t('energy_needs')) + '</h2>' +
            '<div class="energy-row">' +
            '<div class="macro"><div class="v">' + e.bmr + '<span class="u"> kcal</span></div>' +
            '<div class="l">' + esc(t('resting')) + '</div></div>' +
            '<div class="macro"><div class="v">' + e.tdee + '<span class="u"> kcal</span></div>' +
            '<div class="l">' + esc(t('daily_total')) + '</div></div>' +
            (window.Growth.applies(prof.age)
              ? ''
              : '<div class="macro"><div class="v">' + fmt(Profile.bmi()) + '</div>' +
                '<div class="l">' + esc(t('bmi')) + '</div></div>') +
            '</div>' +
            (window.Growth.applies(prof.age) ? bmiForAgeBlock(prof) : '') +
            '<p class="result-count"><a href="#/weight">' + esc(t('weight_title')) + ' &rarr;</a></p>') +

        '<h2 class="section">' + esc(t('your_targets')) + ' ' + englishMark() + '</h2>' +
        '<div class="table-scroll"><table class="nutrients">' +
        '<thead><tr><th>' + esc(t('nutrient')) + '</th><th class="num">' + esc(t('your_target')) +
        '</th><th>' + esc(t('best_sources')) + '</th></tr></thead><tbody>' +
        order.map(function (key) {
          var target = targets[key];
          var top = bestSources(key, 3);
          return '<tr><td class="name">' + esc(nutrientLabel(key)) +
            '<span class="dri-type">' + esc(target.type) + '</span></td>' +
            '<td class="num">' + fmt(target.value) + ' ' + (UNIT_LABEL[target.unit] || target.unit) + '</td>' +
            '<td class="src-cell">' + top.map(function (f) {
              return '<a href="#/food/' + esc(f.slug) + '">' + esc(f.name) + '</a> <span class="dim">(' +
                Math.round((servingAmount(f, key) / target.value) * 100) + '% per ' +
                esc(servingLabel(f)) + ')</span>';
            }).join(', ') + '</td></tr>';
        }).join('') + '</tbody></table></div>' +

        '<div class="note warn"><p>These targets describe a healthy general population. They ' +
        'do not account for pregnancy or breastfeeding, which raise several requirements ' +
        'substantially; for smoking, which raises the vitamin C requirement by 35&nbsp;mg a ' +
        'day; for a vegan diet, whose iron requirement the Food and Nutrition Board sets ' +
        'roughly 1.8&times; higher because non-haem iron is absorbed less well; or for any ' +
        'medical condition or medication. If any of those apply to you, the right numbers ' +
        'come from a clinician, not from this page. ' + englishMark() + '</p></div>' +
        (minor ? '' : supportNote());

      var reveal = document.getElementById('revealPct');
      if (reveal) {
        reveal.addEventListener('click', function () {
          showPercentile = true;
          var y = window.pageYOffset;
          renderResults();
          window.scrollTo(0, y);
        });
      }
      var hide = document.getElementById('hidePct');
      if (hide) {
        hide.addEventListener('click', function () {
          showPercentile = false;
          var y = window.pageYOffset;
          renderResults();
          window.scrollTo(0, y);
        });
      }
    }
  }

  // ======================================================================
  // View: weight change
  // ======================================================================
  var planState = { goal: 'lose', targetKg: null, rate: 0.5 };

  function viewWeight() {
    var p = Profile.get();
    if (!p) {
      main.innerHTML = '<div class="page-head"><h1>' + esc(t('weight_title')) + '</h1>' +
        '<p>' + esc(t('weight_lede')) + '</p></div>' +
        '<div class="note"><p>This needs your height, weight, sex and age first. ' +
        '<a href="#/you">' + esc(t('profile_title')) + ' &rarr;</a></p></div>';
      return;
    }

    // Under 18 the whole apparatus is wrong, so the page becomes something else
    // rather than showing a form and then refusing to act on it.
    if (!DRI.energyApplies(p.age)) {
      main.innerHTML =
        '<div class="page-head"><h1>' + esc(t('growing_title')) + '</h1></div>' +

        '<div class="note"><p><strong>' + esc(t('under18_title')) + '</strong> — and not as a ' +
        'formality. The equations this page uses were built and validated in adults. They have ' +
        'no term for the energy cost of growing, so applied to someone your age they are simply ' +
        'the wrong tool, and adult BMI categories do not apply under 20 either.</p></div>' +

        '<div class="note warn"><p><strong>There is also a reason beyond the arithmetic.</strong> ' +
        'The <a href="#/sources#src-aap_prevention">American Academy of Pediatrics</a> advises ' +
        'clinicians and families to discourage dieting in under-18s, and to avoid talking about ' +
        'weight at all — talking about eating and activity instead. That is not caution for its ' +
        'own sake: weight-focused talk with teenagers is associated with higher rates of both ' +
        'obesity and eating disorders later, so a calorie target is one of the few things on ' +
        'this site with good evidence of doing harm. That is why there is no calculator here ' +
        'rather than a calculator with a warning on it. ' + englishMark() + '</p></div>' +

        '<h2 class="section">What is worth paying attention to instead</h2>' +
        '<div class="prose">' +
        '<p>Adolescence is the period of highest nutrient demand in a human life outside ' +
        'pregnancy, and the things most likely to be short are specific and fixable. ' +
        '<strong>Calcium</strong> matters more now than it ever will again: roughly half of ' +
        'adult bone mass is laid down during the teenage years, and bone you do not build now ' +
        'is difficult to build later. <strong>Iron</strong> requirements jump sharply — a ' +
        '14-to-18-year-old girl needs 15 mg a day against 8 mg for an adult woman over 50, ' +
        'because of growth and menstruation together. Both are on ' +
        '<a href="#/you">your targets page</a>, calculated for your actual age.</p>' +
        '<p>The behaviours with the best evidence behind them are unglamorous and have nothing ' +
        'to do with weight: eating breakfast, eating meals with other people where that is ' +
        'possible, sleeping enough, moving in ways you actually enjoy, and not skipping meals. ' +
        'Those are what the paediatric guidance actually recommends, and they are the same ' +
        'advice whatever your size.</p></div>' +

        supportNote() +

        '<p class="result-count"><a href="#/you">' + esc(t('your_targets')) + ' &rarr;</a> · ' +
        '<a href="#/foods">' + esc(t('all_foods')) + ' &rarr;</a></p>';
      return;
    }

    var range = window.WeightPlan.healthyRange(p.heightCm);
    if (planState.targetKg == null) {
      planState.targetKg = Math.round(
        Math.min(Math.max(p.weightKg, range.min), range.max) * 10) / 10;
    }

    main.innerHTML =
      '<div class="page-head"><h1>' + esc(t('weight_title')) + '</h1>' +
      '<p>' + esc(t('weight_lede')) + '</p></div>' +

      '<div class="card form-card">' +
      '<div class="field-row">' +
      '<div class="field"><label for="wGoal">' + esc(t('goal')) + '</label>' +
      '<select id="wGoal">' +
      ['lose', 'maintain', 'gain', 'recomp'].map(function (g) {
        return '<option value="' + g + '"' + (planState.goal === g ? ' selected' : '') + '>' +
          esc(t(g)) + '</option>';
      }).join('') + '</select>' +
      (planState.goal === 'recomp'
        ? '<span class="hint">' + esc(t('recomp_hint')) + '</span>' : '') + '</div>' +
      (planState.goal === 'recomp' || planState.goal === 'maintain' ? '' :
        '<div class="field"><label for="wTarget">' + esc(t('target_weight')) + ' (kg)</label>' +
        '<input id="wTarget" type="number" min="25" max="400" step="0.5" value="' +
        esc(planState.targetKg) + '"></div>' +
        '<div class="field"><label for="wRate">' + esc(t('rate')) + ' (kg/' + esc(t('weeks').slice(0, 4)) + ')</label>' +
        '<select id="wRate">' +
        [0.25, 0.5, 0.75, 1].map(function (r) {
          return '<option value="' + r + '"' + (planState.rate === r ? ' selected' : '') + '>' +
            r + ' kg</option>';
        }).join('') + '</select></div>') + '</div></div>' +

      '<div id="weightResults"></div>';

    function sync(rerenderForm) {
      var goalEl = document.getElementById('wGoal');
      var targetEl = document.getElementById('wTarget');
      var rateEl = document.getElementById('wRate');
      var prevGoal = planState.goal;
      planState.goal = goalEl.value;
      if (targetEl) planState.targetKg = Number(targetEl.value);
      if (rateEl) planState.rate = Number(rateEl.value);
      // Switching goal changes which fields exist, so rebuild the form.
      if (rerenderForm && planState.goal !== prevGoal) { viewWeight(); return; }
      paint();
    }
    document.getElementById('wGoal').addEventListener('change', function () { sync(true); });
    ['wTarget', 'wRate'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', function () { sync(false); });
        el.addEventListener('input', function () { sync(false); });
      }
    });
    paint();

    function paint() {
      var r = window.WeightPlan.calculate(p, {
        goal: planState.goal, targetKg: planState.targetKg, rateKgWeek: planState.rate
      });
      var maintain = planState.goal === 'maintain';
      var recomp = planState.goal === 'recomp';

      document.getElementById('weightResults').innerHTML =
        r.warnings.filter(function (w) { return w.level === 'danger'; }).map(warnBlock).join('') +

        (r.blocked || !recomp ? '' :
          '<div class="energy-row">' +
          '<div class="macro"><div class="v">' + r.targetIntake + '<span class="u"> kcal</span></div>' +
          '<div class="l">' + esc(t('target_intake')) + '</div></div>' +
          '<div class="macro"><div class="v">' + r.proteinLow + '–' + r.proteinHigh +
          '<span class="u"> g</span></div>' +
          '<div class="l">' + esc(t('protein_target')) + '</div></div>' +
          '<div class="macro"><div class="v" style="font-size:1rem;line-height:1.35">' +
          esc(t('resistance_needed')) + '</div>' +
          '<div class="l">' + esc(t('training')) + '</div></div></div>') +

        (r.blocked || recomp ? '' :
          '<div class="energy-row">' +
          '<div class="macro"><div class="v">' + r.tdee + '<span class="u"> kcal</span></div>' +
          '<div class="l">' + esc(t('daily_total')) + '</div></div>' +
          (maintain ? '' :
            '<div class="macro"><div class="v">' + (r.dailyAdjust > 0 ? '+' : '') + r.dailyAdjust +
            '<span class="u"> kcal</span></div>' +
            '<div class="l">' + esc(t('daily_adjust')) + '</div></div>') +
          '<div class="macro"><div class="v">' + r.targetIntake + '<span class="u"> kcal</span></div>' +
          '<div class="l">' + esc(t('target_intake')) + '</div></div>' +
          (maintain || !r.weeks ? '' :
            '<div class="macro"><div class="v">' + r.weeks + '<span class="u"> ' +
            esc(t('weeks')) + '</span></div>' +
            '<div class="l">' + esc(t('time_to_goal')) + '</div></div>') +
          '</div>') +

        '<h2 class="section">' + esc(t('bmi')) + '</h2>' +
        '<div class="energy-row">' +
        '<div class="macro"><div class="v">' + r.currentBmi + '</div>' +
        '<div class="l">' + esc(t('current_bmi')) + '</div></div>' +
        (recomp || maintain ? '' :
          '<div class="macro"><div class="v">' + r.targetBmi + '</div>' +
          '<div class="l">' + esc(t('goal_bmi')) + '</div></div>') +
        '<div class="macro"><div class="v">' + r.healthyMin + '–' + r.healthyMax +
        '<span class="u"> kg</span></div>' +
        '<div class="l">Healthy range for your height</div></div></div>' +
        '<p class="result-count">Current category: <strong>' + esc(r.band.label) + '</strong> ' +
        '(<a href="#/sources#src-who_bmi">WHO cut-offs</a>) ' + englishMark() + '</p>' +

        r.warnings.filter(function (w) { return w.level !== 'danger'; }).map(warnBlock).join('') +

        '<h2 class="section">Where these numbers come from</h2>' +
        '<div class="prose"><p>The daily adjustment is your estimated total energy ' +
        'expenditure — <a href="#/sources#src-mifflin">Mifflin-St Jeor</a> multiplied by your ' +
        'activity level — offset by the energy content of the tissue you want to add or lose, ' +
        'taken as 7,700&nbsp;kcal per kilogram. The safe-rate benchmark of 0.5–1&nbsp;kg a week ' +
        'is <a href="#/sources#src-cdc_weightloss">CDC guidance</a>, and the BMI categories are ' +
        '<a href="#/sources#src-who_bmi">WHO</a>. For a projection that models the slowdown ' +
        'properly rather than assuming a straight line, use the ' +
        '<a href="#/sources#src-nih_bwp">NIH Body Weight Planner</a>. ' + englishMark() + '</p>' +
        (recomp
          ? '<p>The redistribution figures come from a different literature. The protein ' +
            'range is where <a href="#/sources#src-morton_protein">supplementation trials</a> ' +
            'stop showing added benefit; the claim that fat loss and muscle gain can happen ' +
            'together rests on <a href="#/sources#src-barakat_recomp">a review of the ' +
            'evidence</a> and on <a href="#/sources#src-longland_recomp">a controlled trial</a> ' +
            'in which men in a real energy deficit still gained lean mass on high protein with ' +
            'resistance training. The small deficit shown is a starting point, not the ' +
            'mechanism — protein and training are. ' + englishMark() + '</p>'
          : '') +
        '<p>This page deliberately does not produce a meal plan, a macro split or a food list ' +
        'to follow. It tells you the size of the gap and how fast the evidence says you can ' +
        'safely close it; what you eat to get there is a conversation for you and, if the ' +
        'change is large or you have any medical condition, a clinician.</p></div>' +
        supportNote();
    }

    function warnBlock(w) {
      var cls = w.level === 'danger' ? 'danger' : (w.level === 'warn' ? 'warn' : '');
      return '<div class="note ' + cls + '"><p><strong>' + esc(w.title) + '</strong></p>' +
        '<p>' + esc(w.body) + ' ' + englishMark() + '</p></div>';
    }
  }

  // ======================================================================
  // View: recipes
  // ======================================================================
  var CUISINES = [
    'any', 'North Indian', 'South Indian', 'Bengali', 'Gujarati', 'Pakistani',
    'Sri Lankan', 'Thai', 'Vietnamese', 'Chinese (Sichuan)', 'Chinese (Cantonese)',
    'Japanese', 'Korean', 'Filipino', 'Indonesian', 'Malaysian',
    'Italian', 'French', 'Spanish', 'Portuguese', 'Greek', 'Turkish',
    'Lebanese', 'Persian', 'Moroccan', 'Ethiopian', 'West African', 'Egyptian',
    'Mexican', 'Peruvian', 'Brazilian', 'Caribbean', 'Cajun', 'American',
    'British', 'German', 'Polish', 'Russian', 'Scandinavian'
  ];

  var RECIPE_STORE = 'fim.recipe.v1';

  function loadRecipeState() {
    var base = { basket: [], cuisine: 'any', servings: 2, notes: '', result: '', error: '' };
    try {
      var raw = localStorage.getItem(RECIPE_STORE);
      if (raw) {
        var saved = JSON.parse(raw);
        Object.keys(base).forEach(function (k) {
          if (saved[k] !== undefined) base[k] = saved[k];
        });
      }
    } catch (e) { /* ignore */ }
    var clean = sanitiseRecipeState(base);
    // Write the repaired state straight back, so a corrupt blob is fixed on
    // disk rather than re-cleaned on every single page load.
    try {
      localStorage.setItem(RECIPE_STORE, JSON.stringify({
        basket: clean.basket, cuisine: clean.cuisine, servings: clean.servings,
        notes: clean.notes, result: clean.result
      }));
    } catch (e) { /* private mode */ }
    return clean;
  }

  // A basket saved in an earlier session can hold slugs that no longer exist:
  // the food list is regenerated from USDA and entries do get renamed or
  // dropped. Left alone those rows render as a raw slug, contribute nothing to
  // the nutrition totals, and get sent to the model as gibberish. Everything
  // restored from storage is therefore checked against the current data.
  function sanitiseRecipeState(st) {
    var known = {};
    FOODS.forEach(function (f) { known[f.slug] = f; });

    st.basket = (Array.isArray(st.basket) ? st.basket : [])
      .filter(function (item) { return item && known[item.slug]; })
      .map(function (item) {
        var food = known[item.slug];
        var amount = Number(item.amount);
        if (!(amount > 0) || amount > 20000) {
          amount = food.portion ? Math.round(food.portion.grams) : 100;
        }
        var qty = Number(item.qty);
        if (!food.portion || !(qty > 0)) qty = food.portion ? 1 : null;
        return { slug: item.slug, amount: Math.round(amount), qty: qty };
      });

    if (CUISINES.indexOf(st.cuisine) < 0) st.cuisine = 'any';
    var servings = Number(st.servings);
    st.servings = (servings >= 1 && servings <= 12) ? Math.round(servings) : 2;
    if (typeof st.notes !== 'string') st.notes = '';
    if (typeof st.result !== 'string') st.result = '';
    st.error = '';
    return st;
  }

  var recipeState = loadRecipeState();
  var recipeBusy = false;

  function saveRecipeState() {
    try {
      localStorage.setItem(RECIPE_STORE, JSON.stringify({
        basket: recipeState.basket, cuisine: recipeState.cuisine,
        servings: recipeState.servings, notes: recipeState.notes,
        result: recipeState.result
      }));
    } catch (e) { /* ignore */ }
  }

  // A deliberately small markdown renderer: headings, bold, italics, lists and
  // paragraphs. The site loads no external scripts, and a recipe needs nothing
  // more than this.
  function renderMarkdown(md) {
    var lines = String(md).split(/\r?\n/);
    var out = [], listType = null;

    function closeList() {
      if (listType) { out.push('</' + listType + '>'); listType = null; }
    }
    function inline(text) {
      return esc(text)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
    }

    lines.forEach(function (line) {
      var trimmed = line.trim();
      if (!trimmed) { closeList(); return; }

      var h = /^(#{1,6})\s+(.*)$/.exec(trimmed);
      if (h) {
        closeList();
        var level = Math.min(h[1].length + 1, 6);
        out.push('<h' + level + '>' + inline(h[2]) + '</h' + level + '>');
        return;
      }
      var ol = /^\d+[.)]\s+(.*)$/.exec(trimmed);
      if (ol) {
        if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol'; }
        out.push('<li>' + inline(ol[1]) + '</li>');
        return;
      }
      var ul = /^[-*+]\s+(.*)$/.exec(trimmed);
      if (ul) {
        if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul'; }
        out.push('<li>' + inline(ul[1]) + '</li>');
        return;
      }
      closeList();
      out.push('<p>' + inline(trimmed) + '</p>');
    });
    closeList();
    return out.join('\n');
  }

  // Nutrition for the basket, from this site's USDA data rather than from the
  // model. Asking a language model for a nutrition breakdown produces plausible
  // numbers; this produces real ones.
  function basketNutrition() {
    var totals = {};
    recipeState.basket.forEach(function (item) {
      var food = FOODS.filter(function (f) { return f.slug === item.slug; })[0];
      if (!food) return;
      var factor = item.amount / 100;
      Object.keys(food.nutrients).forEach(function (k) {
        totals[k] = (totals[k] || 0) + food.nutrients[k] * factor;
      });
    });
    return totals;
  }

  // Dietary restrictions in a form the model can be told to respect.
  function restrictionSentences() {
    var prefs = Prefs.get();
    var out = [];
    if (prefs.diet && prefs.diet !== 'none') {
      out.push('the cook is ' + prefs.diet);
    }
    (prefs.allergens || []).forEach(function (a) {
      out.push('must contain no ' + t('a_' + a).toLowerCase() +
        (a === 'lactose' ? ' (intolerance)' : ' (allergy)'));
    });
    var custom = (prefs.customExclude || '').split(',')
      .map(function (x) { return x.trim(); }).filter(Boolean);
    if (custom.length) out.push('avoid entirely: ' + custom.join(', '));
    return out;
  }

  function keyBar() {
    var has = window.Recipes.hasKey();
    return '<div class="card pad key-bar">' +
      '<div><strong>' + esc(t('api_key')) + '</strong>' +
      (has
        ? '<p class="hint">' + esc(t('api_key_set')) + ' · <code>' +
          esc(window.Recipes.maskedKey()) + '</code>' +
          '<span id="modelNote"> · ' +
          (window.Recipes.getPreference() !== window.Recipes.AUTO
            ? esc(t('model')) + ': <code>' + esc(window.Recipes.getPreference()) + '</code>'
            : (window.Recipes.resolved()
                ? esc(t('model')) + ': <code>' + esc(window.Recipes.resolved()) + '</code>'
                : esc(t('checking_models')))) +
          '</span></p>'
        : '<p class="hint">' + esc(t('api_key_missing')) + ' · ' +
          '<a href="' + esc(window.Recipes.STUDIO_URL) + '" rel="noopener" target="_blank">' +
          esc(t('get_free_key')) + '</a></p>') +
      '</div>' +
      (has
        ? '<div class="key-actions">' +
          '<div class="model-pick"><label for="modelSel">' + esc(t('model')) + '</label>' +
          '<select id="modelSel"><option value="' + esc(window.Recipes.AUTO) + '"' +
          (window.Recipes.getPreference() === window.Recipes.AUTO ? ' selected' : '') + '>' +
          esc(t('model_auto')) + '</option>' +
          (window.Recipes.getPreference() !== window.Recipes.AUTO
            ? '<option value="' + esc(window.Recipes.getPreference()) + '" selected>' +
              esc(window.Recipes.getPreference()) + '</option>'
            : '') +
          '</select></div>' +
          '<button class="btn ghost" type="button" id="clearKey">' + esc(t('remove_key')) + '</button>' +
          '</div>'
        : '<div class="key-entry">' +
          '<input id="keyInput" type="password" autocomplete="off" spellcheck="false" ' +
          'placeholder="AIza…" aria-label="' + esc(t('api_key')) + '">' +
          '<button class="btn" type="button" id="saveKey">' + esc(t('save_key')) + '</button>' +
          '</div>') +
      '</div>';
  }

  // Discover which models the key can call and fill the picker. Runs at most
  // once per page load; the result is cached in the Recipes module.
  function hydrateModels() {
    if (!window.Recipes.hasKey()) return;
    var note = document.getElementById('modelNote');
    var sel = document.getElementById('modelSel');

    window.Recipes.resolveAuto().then(function (best) {
      var current = document.getElementById('modelNote');
      if (current && window.Recipes.getPreference() === window.Recipes.AUTO) {
        current.innerHTML = ' · ' + esc(t('model')) + ': <code>' + esc(best) + '</code>';
      }
      return window.Recipes.listModels();
    }).then(function (names) {
      var current = document.getElementById('modelSel');
      if (!current || !names || !names.length) return;
      var pref = window.Recipes.getPreference();
      var ranked = names.slice().sort(function (a, b) {
        return window.Recipes.scoreModel(b) - window.Recipes.scoreModel(a);
      }).filter(function (n) { return window.Recipes.scoreModel(n) > 0; });
      current.innerHTML =
        '<option value="' + esc(window.Recipes.AUTO) + '"' +
        (pref === window.Recipes.AUTO ? ' selected' : '') + '>' +
        esc(t('model_auto')) + '</option>' +
        ranked.map(function (n) {
          return '<option value="' + esc(n) + '"' + (pref === n ? ' selected' : '') + '>' +
            esc(n) + '</option>';
        }).join('');
    }).catch(function () {
      var current = document.getElementById('modelNote');
      if (current) current.textContent = '';
    });
  }

  function viewRecipes() {
    var has = window.Recipes.hasKey();
    var basket = recipeState.basket;
    var restrictions = restrictionSentences();

    main.innerHTML =
      '<div class="page-head"><h1>' + esc(t('recipes_title')) + '</h1>' +
      '<p>' + esc(t('recipes_lede')) + '</p></div>' +

      keyBar() +
      '<p class="hint" style="margin:-6px 0 22px">' + esc(t('key_privacy')) + '</p>' +

      '<h2 class="section">' + esc(t('your_ingredients')) + '</h2>' +
      '<div class="card pad">' +
      '<div class="ingredient-add">' +
      '<input class="search" id="ingSearch" type="search" placeholder="' +
      esc(t('add_ingredient')) + '" autocomplete="off" aria-label="' + esc(t('add_ingredient')) + '">' +
      '<div class="suggest" id="ingSuggest" hidden></div>' +
      '</div>' +
      (basket.length
        ? '<ul class="basket" id="basket">' + basket.map(function (item, i) {
            var food = FOODS.filter(function (f) { return f.slug === item.slug; })[0];
            var portion = food && food.portion;
            return '<li>' +
              '<span class="b-name">' + esc(food ? food.name : item.slug) + '</span>' +
              (portion
                ? '<span class="b-qty">' +
                  '<button class="step" type="button" data-dec="' + i + '" ' +
                  'aria-label="One fewer">&minus;</button>' +
                  '<input type="number" min="0.5" max="99" step="0.5" class="qty" ' +
                  'value="' + esc(item.qty || 1) + '" data-idx="' + i + '" ' +
                  'aria-label="Number of portions"> ' +
                  '<button class="step" type="button" data-inc="' + i + '" ' +
                  'aria-label="One more">+</button>' +
                  '<span class="b-portion">&times; ' + esc(portion.label) + '</span></span>'
                : '') +
              '<span class="b-amt"><input type="number" min="1" max="9000" step="5" ' +
              'value="' + esc(Math.round(item.amount)) + '" data-idx="' + i + '" class="amt" ' +
              'aria-label="' + esc(t('amount_g')) + '"> g</span>' +
              '<button class="chip" type="button" data-remove="' + i + '">' +
              esc(t('remove')) + '</button></li>';
          }).join('') + '</ul>'
        : '<p class="empty" style="padding:20px 0">' + esc(t('empty_basket')) + '</p>') +
      '</div>' +

      (basket.length ? basketNutritionBlock() : '') +

      '<h2 class="section">' + esc(t('cuisine')) + '</h2>' +
      '<div class="card pad">' +
      '<div class="field-row">' +
      '<div class="field"><label for="cuisineSel">' + esc(t('cuisine')) + '</label>' +
      '<select id="cuisineSel">' + CUISINES.map(function (c) {
        return '<option value="' + esc(c) + '"' +
          (recipeState.cuisine === c ? ' selected' : '') + '>' +
          esc(c === 'any' ? t('any_cuisine') : c) + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field"><label for="servingsInput">' + esc(t('servings')) + '</label>' +
      '<input id="servingsInput" type="number" min="1" max="12" step="1" value="' +
      esc(recipeState.servings) + '"></div></div>' +

      '<div class="field"><label for="notesInput">' + esc(t('extra_instructions')) + '</label>' +
      '<textarea id="notesInput" rows="3" placeholder="…">' + esc(recipeState.notes) + '</textarea>' +
      '<span class="hint">' + esc(t('extra_hint')) + '</span></div>' +

      (restrictions.length
        ? '<p class="hint" style="margin-top:14px">Your <a href="#/settings">dietary settings</a> ' +
          'are sent with the request: ' + esc(restrictions.join('; ')) + '.</p>'
        : '') +

      '<div class="btn-row" style="margin-top:18px">' +
      '<button class="btn" type="button" id="genBtn"' +
      (has && basket.length ? '' : ' disabled') + '>' +
      esc(recipeState.result ? t('regenerate') : t('generate')) + '</button>' +
      (recipeState.result
        ? '<button class="btn ghost" type="button" id="clearRecipe">' + esc(t('remove')) + '</button>'
        : '') +
      '</div></div>' +

      '<div id="recipeOut">' + recipeOutput() + '</div>';

    bindRecipeEvents();
  }

  // Adding a food already in the basket adds another portion of it rather than
  // creating a duplicate row -- two rows of potato would double-count in the
  // nutrition totals and read as a mistake.
  function addToBasket(slug) {
    var existing = -1;
    recipeState.basket.forEach(function (b, i) { if (b.slug === slug) existing = i; });
    var food = FOODS.filter(function (f) { return f.slug === slug; })[0];

    if (existing >= 0) {
      setQty(existing, (recipeState.basket[existing].qty || 1) + 1);
      return;
    }
    var grams = food && food.portion ? food.portion.grams : 100;
    recipeState.basket.push({
      slug: slug,
      amount: Math.round(grams),
      qty: food && food.portion ? 1 : null
    });
    saveRecipeState();
    viewRecipes();
  }

  function setQty(idx, qty) {
    var item = recipeState.basket[idx];
    if (!item) return;
    var food = FOODS.filter(function (f) { return f.slug === item.slug; })[0];
    if (!food || !food.portion) return;
    qty = Math.max(0.5, Math.round(qty * 2) / 2);
    item.qty = qty;
    item.amount = Math.round(qty * food.portion.grams);
    saveRecipeState();
    viewRecipes();
  }

  function basketNutritionBlock() {
    var totals = basketNutrition();
    var ref = referenceSet();
    var keys = ['kcal', 'protein', 'carbs', 'fiber', 'fat'];
    var servings = Math.max(1, Number(recipeState.servings) || 1);

    return '<h2 class="section">' + esc(t('basket_nutrition')) + '</h2>' +
      '<div class="energy-row">' +
      keys.map(function (k) {
        var v = totals[k] || 0;
        return '<div class="macro"><div class="v">' + fmt(v) +
          '<span class="u"> ' + (k === 'kcal' ? 'kcal' : 'g') + '</span></div>' +
          '<div class="l">' + esc(nutrientLabel(k)) + '</div></div>';
      }).join('') + '</div>' +
      '<p class="result-count">Whole basket, raw, from USDA data. Per serving at ' +
      servings + ': <strong>' + fmt((totals.kcal || 0) / servings) + ' kcal</strong>, ' +
      fmt((totals.protein || 0) / servings) + ' g protein' +
      (ref.personal
        ? ' — ' + Math.round(((totals.kcal || 0) / servings) /
            (Profile.energy().tdee / 3) * 100) + '% of a third of your daily energy'
        : '') +
      '. Cooking changes this: water is lost, fat is added, and some vitamins leach out.</p>';
  }

  function recipeOutput() {
    if (recipeBusy) {
      return '<div class="note"><p>' + esc(t('generating')) + '</p></div>';
    }
    if (recipeState.error) {
      return '<div class="note danger"><p><strong>That did not work.</strong></p>' +
        '<p>' + esc(recipeState.error) + '</p></div>';
    }
    if (!recipeState.result) return '';
    return '<div class="card pad recipe">' + renderMarkdown(recipeState.result) + '</div>' +
      '<p class="hint">Written by Gemini from your ingredient list. Unlike the rest of this ' +
      'site it is not drawn from a checked source, so treat cooking times and food-safety ' +
      'steps — especially for meat, fish and eggs — as a starting point rather than an ' +
      'authority. ' + englishMark() + '</p>';
  }

  function bindRecipeEvents() {
    var saveBtn = document.getElementById('saveKey');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var input = document.getElementById('keyInput');
        var v = (input.value || '').trim();
        if (!v) return;
        window.Recipes.setKey(v);
        viewRecipes();
      });
    }
    var clearBtn = document.getElementById('clearKey');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        window.Recipes.setKey('');
        viewRecipes();
      });
    }
    var modelSel = document.getElementById('modelSel');
    if (modelSel) {
      modelSel.addEventListener('change', function () {
        window.Recipes.setModel(modelSel.value);
        viewRecipes();
      });
    }
    hydrateModels();

    var search = document.getElementById('ingSearch');
    var suggest = document.getElementById('ingSuggest');
    if (search) {
      search.addEventListener('input', function () {
        var q = search.value.trim().toLowerCase();
        if (!q) { suggest.hidden = true; suggest.innerHTML = ''; return; }
        // Foods already in the basket stay in the list. Hiding them was the
        // wrong call: someone with two potatoes searches "potato" again and
        // concludes the site is broken. Clicking one adds another portion.
        var chosen = {};
        recipeState.basket.forEach(function (b, idx) { chosen[b.slug] = idx; });
        var hits = FOODS
          .filter(function (f) {
            return !Prefs.excludedReason(f) && haystack(f).indexOf(q) >= 0;
          })
          .sort(function (a, b) {
            var d = relevance(b, q) - relevance(a, q);
            return d !== 0 ? d : a.name.localeCompare(b.name);
          })
          .slice(0, 8);
        suggest.hidden = !hits.length;
        suggest.innerHTML = hits.map(function (f) {
          var already = chosen[f.slug] !== undefined;
          return '<button type="button" data-add="' + esc(f.slug) + '">' +
            esc(f.name) + '<span class="dim"> · ' + esc(groupLabel(f.group)) + '</span>' +
            (already ? '<span class="already">in basket · add another</span>' : '') +
            '</button>';
        }).join('');
        suggest.querySelectorAll('[data-add]').forEach(function (b) {
          b.addEventListener('click', function () {
            addToBasket(b.dataset.add);
          });
        });
      });
    }

    main.querySelectorAll('[data-remove]').forEach(function (b) {
      b.addEventListener('click', function () {
        recipeState.basket.splice(Number(b.dataset.remove), 1);
        saveRecipeState();
        viewRecipes();
      });
    });
    main.querySelectorAll('input.amt').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var idx = Number(inp.dataset.idx);
        var v = Math.max(1, Number(inp.value) || 1);
        var item = recipeState.basket[idx];
        item.amount = v;
        // Editing grams directly re-derives the portion count so the two
        // controls never disagree.
        var food = FOODS.filter(function (f) { return f.slug === item.slug; })[0];
        if (food && food.portion) {
          item.qty = Math.round((v / food.portion.grams) * 10) / 10;
        }
        saveRecipeState();
        viewRecipes();
      });
    });
    main.querySelectorAll('input.qty').forEach(function (inp) {
      inp.addEventListener('change', function () {
        setQty(Number(inp.dataset.idx), Number(inp.value));
      });
    });
    main.querySelectorAll('[data-inc]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = Number(b.dataset.inc);
        setQty(i, (recipeState.basket[i].qty || 1) + 1);
      });
    });
    main.querySelectorAll('[data-dec]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = Number(b.dataset.dec);
        setQty(i, (recipeState.basket[i].qty || 1) - 1);
      });
    });

    var cuisine = document.getElementById('cuisineSel');
    if (cuisine) {
      cuisine.addEventListener('change', function () {
        recipeState.cuisine = cuisine.value;
        saveRecipeState();
      });
    }
    var servings = document.getElementById('servingsInput');
    if (servings) {
      servings.addEventListener('change', function () {
        recipeState.servings = Math.max(1, Number(servings.value) || 1);
        saveRecipeState();
        viewRecipes();
      });
    }
    var notes = document.getElementById('notesInput');
    if (notes) {
      notes.addEventListener('input', function () {
        recipeState.notes = notes.value;
        saveRecipeState();
      });
    }
    var clearRecipe = document.getElementById('clearRecipe');
    if (clearRecipe) {
      clearRecipe.addEventListener('click', function () {
        recipeState.result = '';
        recipeState.error = '';
        saveRecipeState();
        viewRecipes();
      });
    }

    var gen = document.getElementById('genBtn');
    if (gen) {
      gen.addEventListener('click', function () {
        if (recipeBusy) return;
        var regenerating = !!recipeState.result;
        recipeBusy = true;
        recipeState.error = '';
        document.getElementById('recipeOut').innerHTML = recipeOutput();
        gen.disabled = true;

        window.Recipes.generate({
          ingredients: recipeState.basket.map(function (item) {
            var food = FOODS.filter(function (f) { return f.slug === item.slug; })[0];
            return {
              name: food ? food.name : item.slug,
              amount: item.amount,
              // "2 × potato, medium" is more useful to a cook than "150 g".
              portion: (food && food.portion && item.qty)
                ? item.qty + ' × ' + food.portion.label : null
            };
          }),
          cuisine: recipeState.cuisine,
          servings: recipeState.servings,
          notes: recipeState.notes,
          restrictions: restrictionSentences(),
          regenerating: regenerating
        }).then(function (text) {
          recipeState.result = text;
          recipeState.error = '';
        }).catch(function (err) {
          recipeState.error = err && err.message ? err.message : String(err);
        }).then(function () {
          recipeBusy = false;
          saveRecipeState();
          viewRecipes();
          var out = document.getElementById('recipeOut');
          if (out) out.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }
  }

  // ======================================================================
  // View: settings & accessibility
  // ======================================================================
  function viewSettings() {
    var prefs = Prefs.get();

    main.innerHTML =
      '<div class="page-head"><h1>' + esc(t('settings_title')) + '</h1></div>' +

      '<h2 class="section">' + esc(t('language')) + '</h2>' +
      '<div class="card pad">' +
      '<div class="chips">' + I18N.languages.map(function (l) {
        return '<button class="chip" type="button" data-lang="' + l.code + '" aria-pressed="' +
          (I18N.get() === l.code ? 'true' : 'false') + '" lang="' + l.code + '">' +
          esc(l.name) + '</button>';
      }).join('') + '</div>' +
      '<p class="hint" style="margin-top:12px">' + esc(t('untranslated_hint')) + '</p></div>' +

      '<h2 class="section">' + esc(t('appearance')) + '</h2>' +
      '<div class="card pad">' +
      '<div class="setting-row"><div><strong>' + esc(t('appearance')) + '</strong></div>' +
      '<div class="chips">' + [['system', 'theme_system'], ['light', 'theme_light'], ['dark', 'theme_dark']]
        .map(function (o) {
          return '<button class="chip" type="button" data-theme="' + o[0] + '" aria-pressed="' +
            (prefs.theme === o[0] ? 'true' : 'false') + '">' + esc(t(o[1])) + '</button>';
        }).join('') + '</div></div>' +

      '<div class="setting-row"><div><strong>' + esc(t('high_contrast')) + '</strong>' +
      '<p class="hint">' + esc(t('high_contrast_hint')) + '</p></div>' +
      toggle('contrast', prefs.contrast) + '</div>' +

      '<div class="setting-row"><div><strong>' + esc(t('text_size')) + '</strong></div>' +
      '<div class="chips">' + [['normal', 'text_normal'], ['large', 'text_large'], ['larger', 'text_larger']]
        .map(function (o) {
          return '<button class="chip" type="button" data-text="' + o[0] + '" aria-pressed="' +
            (prefs.textSize === o[0] ? 'true' : 'false') + '">' + esc(t(o[1])) + '</button>';
        }).join('') + '</div></div>' +

      '<div class="setting-row"><div><strong>' + esc(t('reduce_motion')) + '</strong>' +
      '<p class="hint">' + esc(t('reduce_motion_hint')) + '</p></div>' +
      toggle('reduceMotion', prefs.reduceMotion) + '</div></div>' +

      '<h2 class="section">' + esc(t('api_key')) + '</h2>' +
      keyBar() +
      '<p class="hint" style="margin:-6px 0 0">' + esc(t('key_privacy')) + ' ' +
      '<a href="#/recipes">' + esc(t('nav_recipes')) + ' &rarr;</a></p>' +

      '<h2 class="section">' + esc(t('dietary_title')) + '</h2>' +
      '<div class="card pad">' +
      '<p class="hint" style="margin-top:0">' + esc(t('dietary_hint')) + '</p>' +
      '<div class="chips" style="margin-bottom:20px">' + Prefs.DIETS.map(function (d) {
        return '<button class="chip" type="button" data-diet="' + d + '" aria-pressed="' +
          (prefs.diet === d ? 'true' : 'false') + '">' + esc(t('diet_' + d)) + '</button>';
      }).join('') + '</div>' +

      '<strong>' + esc(t('allergens_title')) + '</strong>' +
      '<div class="chips" style="margin:10px 0 20px">' + Prefs.ALLERGENS.map(function (a) {
        return '<button class="chip" type="button" data-allergen="' + a + '" aria-pressed="' +
          (prefs.allergens.indexOf(a) >= 0 ? 'true' : 'false') + '">' + esc(t('a_' + a)) + '</button>';
      }).join('') + '</div>' +

      '<div class="field"><label for="customExcl">' + esc(t('custom_excl')) + '</label>' +
      '<input id="customExcl" type="text" value="' + esc(prefs.customExclude) + '" ' +
      'placeholder="mushroom, cilantro, shellfish">' +
      '<span class="hint">' + esc(t('custom_excl_hint')) + '</span></div>' +

      '<p class="result-count" id="filterCount" style="margin-top:16px"></p></div>';

    function toggle(key, on) {
      return '<button class="switch" type="button" data-toggle="' + key + '" role="switch" ' +
        'aria-checked="' + (on ? 'true' : 'false') + '"><span></span></button>';
    }

    main.querySelectorAll('[data-lang]').forEach(function (b) {
      b.addEventListener('click', function () {
        // Re-render in place rather than routing: routing scrolls to the top,
        // which throws you out of the settings list you were reading.
        var y = window.pageYOffset;
        I18N.set(b.dataset.lang);
        renderChrome('settings');
        renderStrip();
        viewSettings();
        window.scrollTo(0, y);
      });
    });
    function rerender() {
      var y = window.pageYOffset;
      viewSettings();
      window.scrollTo(0, y);
    }
    main.querySelectorAll('[data-theme]').forEach(function (b) {
      b.addEventListener('click', function () { Prefs.set('theme', b.dataset.theme); rerender(); });
    });
    main.querySelectorAll('[data-text]').forEach(function (b) {
      b.addEventListener('click', function () { Prefs.set('textSize', b.dataset.text); rerender(); });
    });
    main.querySelectorAll('[data-toggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        Prefs.set(b.dataset.toggle, !Prefs.get(b.dataset.toggle));
        rerender();
      });
    });
    main.querySelectorAll('[data-diet]').forEach(function (b) {
      b.addEventListener('click', function () { Prefs.set('diet', b.dataset.diet); rerender(); });
    });
    main.querySelectorAll('[data-allergen]').forEach(function (b) {
      b.addEventListener('click', function () {
        var list = Prefs.get('allergens').slice();
        var i = list.indexOf(b.dataset.allergen);
        if (i >= 0) list.splice(i, 1); else list.push(b.dataset.allergen);
        Prefs.set('allergens', list);
        rerender();
      });
    });
    var saveKeyBtn = document.getElementById('saveKey');
    if (saveKeyBtn) {
      saveKeyBtn.addEventListener('click', function () {
        var v = (document.getElementById('keyInput').value || '').trim();
        if (!v) return;
        window.Recipes.setKey(v);
        rerender();
      });
    }
    var clearKeyBtn = document.getElementById('clearKey');
    if (clearKeyBtn) {
      clearKeyBtn.addEventListener('click', function () {
        window.Recipes.setKey('');
        rerender();
      });
    }
    var modelSelS = document.getElementById('modelSel');
    if (modelSelS) {
      modelSelS.addEventListener('change', function () {
        window.Recipes.setModel(modelSelS.value);
        rerender();
      });
    }
    hydrateModels();

    var custom = document.getElementById('customExcl');
    custom.addEventListener('input', function () {
      Prefs.set('customExclude', custom.value);
      updateCount();
    });
    updateCount();

    function updateCount() {
      var hidden = FOODS.filter(function (f) { return Prefs.excludedReason(f); }).length;
      document.getElementById('filterCount').textContent = hidden
        ? t('hidden_by_diet', { n: hidden }) + ' (' + (FOODS.length - hidden) + ' / ' + FOODS.length + ')'
        : t('n_foods', { n: FOODS.length });
    }
  }

  // ======================================================================
  // View: sources
  // ======================================================================
  var TIER_LABEL = {
    government: 'Government / regulator', systematic: 'Systematic review',
    trial: 'Primary trial', guideline: 'Clinical guideline', reference: 'Reference work'
  };

  function viewSources(anchor) {
    var keys = Object.keys(SOURCES);
    var order = ['government', 'systematic', 'guideline', 'trial', 'reference'];
    keys.sort(function (a, b) {
      var d = order.indexOf(SOURCES[a].tier) - order.indexOf(SOURCES[b].tier);
      return d !== 0 ? d : (SOURCES[b].year || 0) - (SOURCES[a].year || 0);
    });

    var imageCount = Object.keys(CREDITS).length;

    main.innerHTML =
      '<div class="page-head"><h1>' + esc(t('sources_title')) + ' ' + englishMark() + '</h1>' +
      '<p>Every figure and every claim on this site traces back to one of the ' + keys.length +
      ' sources below. They were chosen on one rule: government agencies, systematic reviews ' +
      'and clinical guidelines first; named primary trials where a single study genuinely ' +
      'settled a question; nothing from a supplement seller, a wellness site or a secondary ' +
      'article summarising research it does not cite.</p></div>' +

      '<div class="note"><p><strong>Why these and not others.</strong> Nutrition and herbal ' +
      'medicine are unusually badly served online, because the same claim gets copied between ' +
      'sites until it looks like consensus. The way through it is to prefer sources that are ' +
      'obliged to show their working: Cochrane publishes its search strategy and its ' +
      'risk-of-bias assessment; the FDA publishes the reasoning behind every authorised health ' +
      'claim; NCCIH is a research body with no product to sell and is correspondingly willing ' +
      'to say that a popular remedy does not work.</p></div>' +

      order.map(function (tier) {
        var inTier = keys.filter(function (k) { return SOURCES[k].tier === tier; });
        if (!inTier.length) return '';
        return '<h2 class="section">' + esc(TIER_LABEL[tier]) + '</h2>' +
          inTier.map(function (k) {
            var s = SOURCES[k];
            return '<div class="card source-item" id="src-' + esc(k) + '">' +
              '<h3><a href="' + esc(s.url) + '" rel="noopener" target="_blank">' + esc(s.title) + '</a>' +
              '<span class="tier tier-' + esc(s.tier) + '">' + esc(s.tier) + '</span></h3>' +
              '<p class="org">' + esc(s.org) + (s.year ? ' · ' + s.year : '') + '</p>' +
              (s.note ? '<p class="note">' + esc(s.note) + '</p>' : '') + '</div>';
          }).join('');
      }).join('') +

      '<h2 class="section">How the nutrition data was built</h2>' +
      '<div class="prose">' +
      '<p>The ' + FOODS.length + ' foods on this site were not typed in by hand. The USDA ' +
      'publishes its SR Legacy and Foundation Foods releases as bulk CSV; a build script in ' +
      'this repository (<code>build/build_foods.py</code>) reads those releases, pulls the ' +
      'nutrients shown here for a curated list locked to specific FDC IDs, derives the ' +
      'dietary and allergen tags, and writes <code>data/foods.js</code>. Each food links back ' +
      'to its USDA record so you can check any number against the source in one click.</p>' +
      '<p>That matters more than it sounds. Most nutrition sites transcribe values by hand or ' +
      'copy them from each other, and the errors compound silently. Generating the data means ' +
      'a wrong number here would have to be wrong at USDA.</p>' +

      '<h2>Photographs</h2>' +
      '<p>All ' + imageCount + ' food photographs come from Wikimedia Commons under free ' +
      'licences, fetched by <code>build/fetch_images.py</code>, which records the author and ' +
      'licence of each file alongside it. Each food page shows its own photo credit. Commons ' +
      'was used rather than general web images because the licences permit redistribution and ' +
      'the attribution is machine-readable.</p>' +

      '<h2>On the translations</h2>' +
      '<p>The interface, food groups, nutrient names and the whole weight and settings section ' +
      'are translated into Spanish, Hindi and Kannada — as localisations rather than ' +
      'word-for-word renderings. Nutrient names use the forms actually printed on Indian food ' +
      'labels rather than Sanskritised coinages, and the site title becomes the older proverb ' +
      '<span lang="hi">अन्नं औषधम्</span> / <span lang="kn">ಆಹಾರವೇ ಔಷಧ</span> rather than a ' +
      'calque of the English.</p>' +
      '<p>Detailed medical prose — the evidence summaries, mechanisms, safety notes and ' +
      'drug-interaction warnings — is deliberately left in English and marked as such. A ' +
      'subtly mistranslated interaction warning is more dangerous than one you have to read ' +
      'in a second language, and this material is exactly where a small error does the most ' +
      'harm.</p>' +

      '<h2>What is deliberately absent</h2>' +
      '<p>There are no supplement recommendations, no proprietary blends, no dosing ' +
      'instructions, no meal plans and nothing for sale. Where the evidence for a popular ' +
      'remedy is bad, the page says so rather than hedging.</p></div>';

    if (anchor) {
      var target = document.getElementById(anchor);
      if (target) setTimeout(function () { target.scrollIntoView({ block: 'center' }); }, 0);
    }
  }

  function viewMissing() {
    main.innerHTML = '<div class="page-head"><h1>' + esc(t('no_match')) + '</h1></div>' +
      '<p><a href="#/foods">' + esc(t('all_foods')) + '</a></p>';
  }

  // ======================================================================
  // Router
  // ======================================================================
  function route() {
    var raw = location.hash.replace(/^#/, '');
    var anchor = null;
    var hashIdx = raw.indexOf('#');
    if (hashIdx >= 0) { anchor = raw.slice(hashIdx + 1); raw = raw.slice(0, hashIdx); }
    // A tag chip links to #/foods?q=gourd, so pull the query off before routing.
    var query = null;
    var qIdx = raw.indexOf('?');
    if (qIdx >= 0) {
      var qs = raw.slice(qIdx + 1);
      raw = raw.slice(0, qIdx);
      qs.split('&').forEach(function (pair) {
        var kv = pair.split('=');
        if (kv[0] === 'q') query = decodeURIComponent(kv[1] || '').replace(/\+/g, ' ');
      });
    }
    var parts = raw.split('/').filter(Boolean);
    var top = parts[0] || 'foods';
    if (query !== null) { foodState.q = query; foodState.group = 'all'; }

    if (top === 'food' && parts[1]) viewFood(parts[1]);
    else if (top === 'herb' && parts[1]) viewHerb(parts[1]);
    else if (top === 'medicinal') viewMedicinal();
    else if (top === 'you') viewProfile();
    else if (top === 'weight') viewWeight();
    else if (top === 'recipes') viewRecipes();
    else if (top === 'settings') viewSettings();
    else if (top === 'sources') viewSources(anchor);
    else { top = 'foods'; viewFoods(); }

    renderChrome(top);
    if (!anchor) window.scrollTo(0, 0);
  }

  // Nav labels and the brand live outside `main`, so they are re-rendered here
  // whenever the language changes.
  function renderChrome(top) {
    document.querySelector('.brand-text').innerHTML = t('brand');
    var nav = document.getElementById('nav');
    var items = [['foods', 'nav_foods'], ['recipes', 'nav_recipes'],
                 ['medicinal', 'nav_medicinal'], ['you', 'nav_you'],
                 ['weight', 'nav_weight'], ['settings', 'nav_settings'],
                 ['sources', 'nav_sources']];
    nav.innerHTML = items.map(function (it) {
      var active = it[0] === top ||
        (it[0] === 'foods' && top === 'food') ||
        (it[0] === 'medicinal' && top === 'herb');
      return '<a href="#/' + it[0] + '"' + (active ? ' class="active"' : '') + '>' +
        esc(t(it[1])) + '</a>';
    }).join('');
    document.getElementById('disclaimerLead').textContent = t('not_medical_advice');
  }

  window.addEventListener('hashchange', route);
  Profile.onChange(renderStrip);
  Prefs.onChange(function () { /* display prefs apply themselves via the root */ });
  I18N.onChange(function () { renderStrip(); });
  renderStrip();
  route();
})();
