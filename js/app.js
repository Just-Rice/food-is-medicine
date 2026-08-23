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
      '<div class="grid" id="foodGrid"></div>';

    document.getElementById('foodSort').value = foodState.sort;

    var search = document.getElementById('foodSearch');
    search.addEventListener('input', function () { foodState.q = search.value; paint(); });
    document.getElementById('foodSort').addEventListener('change', function (ev) {
      foodState.sort = ev.target.value; paint();
    });
    main.querySelectorAll('.chip[data-group]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        foodState.group = btn.dataset.group;
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
        if (q && f.name.toLowerCase().indexOf(q) < 0 && f.slug.indexOf(q) < 0 &&
            (f.usda || '').toLowerCase().indexOf(q) < 0) return false;
        if (Prefs.excludedReason(f)) { hidden++; return false; }
        return true;
      });

      if (foodState.sort === 'name') {
        list.sort(function (a, b) { return a.name.localeCompare(b.name); });
      } else {
        var key = foodState.sort;
        list.sort(function (a, b) { return (b.nutrients[key] || 0) - (a.nutrients[key] || 0); });
      }

      var count = list.length === 1 ? t('one_food') : t('n_foods', { n: list.length });
      document.getElementById('foodCount').innerHTML = esc(count) +
        (hidden ? ' <span class="dim">· ' + esc(t('hidden_by_diet', { n: hidden })) +
          ' <a href="#/settings">' + esc(t('nav_settings')) + '</a></span>' : '');

      var grid = document.getElementById('foodGrid');
      if (!list.length) {
        grid.innerHTML = '<p class="empty">' + esc(t('no_match')) + '</p>';
        return;
      }

      grid.innerHTML = list.map(function (f) {
        var hs = highlights(f, ref, 3);
        return '<a class="food-card" href="#/food/' + esc(f.slug) + '">' +
          foodImage(f, 'thumb') +
          '<div class="food-card-body">' +
          '<h3>' + esc(f.name) + '</h3>' +
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
    Object.keys(DRI.upperLimits).forEach(function (key) {
      var amount = food.nutrients[key];
      if (amount == null) return;
      var ul = DRI.upperLimits[key];
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
  function servingGrams(food) {
    return (food.portion && food.portion.grams) ? food.portion.grams : 100;
  }

  function servingLabel(food) {
    return (food.portion && food.portion.label) ? food.portion.label : '100 g';
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
      '<input id="pAge" type="number" min="9" max="119" step="1" required value="' +
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

      document.getElementById('profileResults').innerHTML =
        '<h2 class="section">' + esc(t('energy_needs')) + '</h2>' +
        '<div class="energy-row">' +
        '<div class="macro"><div class="v">' + e.bmr + '<span class="u"> kcal</span></div>' +
        '<div class="l">' + esc(t('resting')) + '</div></div>' +
        '<div class="macro"><div class="v">' + e.tdee + '<span class="u"> kcal</span></div>' +
        '<div class="l">' + esc(t('daily_total')) + '</div></div>' +
        '<div class="macro"><div class="v">' + fmt(Profile.bmi()) + '</div>' +
        '<div class="l">' + esc(t('bmi')) + '</div></div></div>' +
        '<p class="result-count"><a href="#/weight">' + esc(t('weight_title')) + ' &rarr;</a></p>' +

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
        'come from a clinician, not from this page. ' + englishMark() + '</p></div>';
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
      ['lose', 'maintain', 'gain'].map(function (g) {
        return '<option value="' + g + '"' + (planState.goal === g ? ' selected' : '') + '>' +
          esc(t(g)) + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field"><label for="wTarget">' + esc(t('target_weight')) + ' (kg)</label>' +
      '<input id="wTarget" type="number" min="25" max="400" step="0.5" value="' +
      esc(planState.targetKg) + '"></div>' +
      '<div class="field"><label for="wRate">' + esc(t('rate')) + ' (kg/' + esc(t('weeks').slice(0, 4)) + ')</label>' +
      '<select id="wRate">' +
      [0.25, 0.5, 0.75, 1].map(function (r) {
        return '<option value="' + r + '"' + (planState.rate === r ? ' selected' : '') + '>' +
          r + ' kg</option>';
      }).join('') + '</select></div></div></div>' +

      '<div id="weightResults"></div>';

    function sync() {
      planState.goal = document.getElementById('wGoal').value;
      planState.targetKg = Number(document.getElementById('wTarget').value);
      planState.rate = Number(document.getElementById('wRate').value);
      paint();
    }
    ['wGoal', 'wTarget', 'wRate'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', sync);
    });
    document.getElementById('wTarget').addEventListener('input', sync);
    paint();

    function paint() {
      var r = window.WeightPlan.calculate(p, {
        goal: planState.goal, targetKg: planState.targetKg, rateKgWeek: planState.rate
      });
      var maintain = planState.goal === 'maintain';

      document.getElementById('weightResults').innerHTML =
        r.warnings.filter(function (w) { return w.level === 'danger'; }).map(warnBlock).join('') +

        (r.blocked ? '' :
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
        '<div class="macro"><div class="v">' + r.targetBmi + '</div>' +
        '<div class="l">' + esc(t('goal_bmi')) + '</div></div>' +
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
        '<p>This page deliberately does not produce a meal plan, a macro split or a food list ' +
        'to follow. It tells you the size of the gap and how fast the evidence says you can ' +
        'safely close it; what you eat to get there is a conversation for you and, if the ' +
        'change is large or you have any medical condition, a clinician.</p></div>';
    }

    function warnBlock(w) {
      var cls = w.level === 'danger' ? 'danger' : (w.level === 'warn' ? 'warn' : '');
      return '<div class="note ' + cls + '"><p><strong>' + esc(w.title) + '</strong></p>' +
        '<p>' + esc(w.body) + ' ' + englishMark() + '</p></div>';
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
    var parts = raw.split('/').filter(Boolean);
    var top = parts[0] || 'foods';

    if (top === 'food' && parts[1]) viewFood(parts[1]);
    else if (top === 'herb' && parts[1]) viewHerb(parts[1]);
    else if (top === 'medicinal') viewMedicinal();
    else if (top === 'you') viewProfile();
    else if (top === 'weight') viewWeight();
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
    var items = [['foods', 'nav_foods'], ['medicinal', 'nav_medicinal'],
                 ['you', 'nav_you'], ['weight', 'nav_weight'],
                 ['settings', 'nav_settings'], ['sources', 'nav_sources']];
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
