// Food is Medicine -- router and views. Vanilla JS, no build step.
(function () {
  'use strict';

  var FOODS = window.FOODS || [];
  var MED = window.MEDICINAL || [];
  var SOURCES = window.SOURCES || {};
  var DRI = window.DRI;
  var Profile = window.Profile;

  var main = document.getElementById('main');
  var strip = document.getElementById('profileStrip');

  // ---- small helpers ----------------------------------------------------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  // Round to a sensible number of significant places for display: small values
  // like 0.084 mg of copper need decimals, 389 mg of potassium does not.
  function fmt(v) {
    if (v == null || isNaN(v)) return '—';
    var a = Math.abs(v);
    if (a === 0) return '0';
    if (a >= 100) return String(Math.round(v));
    if (a >= 10) return String(Math.round(v * 10) / 10);
    if (a >= 1) return String(Math.round(v * 10) / 10);
    if (a >= 0.1) return String(Math.round(v * 100) / 100);
    return String(Math.round(v * 1000) / 1000);
  }

  var UNIT_LABEL = { g: 'g', mg: 'mg', ug: 'µg', kcal: 'kcal' };

  // ---- nutrient presentation --------------------------------------------
  // Ordered as a nutrition panel reads, grouped for scanning.
  var PANEL = [
    { group: 'Macronutrients', rows: [
      ['kcal', 'Energy', 'kcal'], ['protein', 'Protein', 'g'],
      ['carbs', 'Carbohydrate', 'g'], ['fiber', 'Dietary fibre', 'g'],
      ['sugar', 'Sugars', 'g'], ['fat', 'Total fat', 'g'], ['water', 'Water', 'g']
    ]},
    { group: 'Fats', rows: [
      ['satfat', 'Saturated fat', 'g'], ['monofat', 'Monounsaturated fat', 'g'],
      ['polyfat', 'Polyunsaturated fat', 'g'], ['ala', 'Omega-3 (ALA)', 'g'],
      ['la', 'Omega-6 (linoleic acid)', 'g'], ['cholesterol', 'Cholesterol', 'mg']
    ]},
    { group: 'Vitamins', rows: [
      ['vita', 'Vitamin A', 'ug'], ['vitc', 'Vitamin C', 'mg'],
      ['vitd', 'Vitamin D', 'ug'], ['vite', 'Vitamin E', 'mg'],
      ['vitk', 'Vitamin K', 'ug'], ['thiamin', 'Thiamin (B1)', 'mg'],
      ['riboflavin', 'Riboflavin (B2)', 'mg'], ['niacin', 'Niacin (B3)', 'mg'],
      ['pantothenic', 'Pantothenic acid (B5)', 'mg'], ['b6', 'Vitamin B6', 'mg'],
      ['folate', 'Folate', 'ug'], ['b12', 'Vitamin B12', 'ug'],
      ['choline', 'Choline', 'mg']
    ]},
    { group: 'Minerals', rows: [
      ['calcium', 'Calcium', 'mg'], ['iron', 'Iron', 'mg'],
      ['magnesium', 'Magnesium', 'mg'], ['phosphorus', 'Phosphorus', 'mg'],
      ['potassium', 'Potassium', 'mg'], ['sodium', 'Sodium', 'mg'],
      ['zinc', 'Zinc', 'mg'], ['copper', 'Copper', 'mg'],
      ['manganese', 'Manganese', 'mg'], ['selenium', 'Selenium', 'ug']
    ]}
  ];

  // Generic reference values for visitors who have not filled in a profile.
  // These are the FDA Daily Values used on US nutrition labels (21 CFR 101.9),
  // which are deliberately a single set of numbers for the whole population --
  // the reason the profile page exists is that real requirements are not.
  var GENERIC_DV = {
    protein: 50, fiber: 28, vita: 900, vitc: 90, vitd: 20, vite: 15, vitk: 120,
    thiamin: 1.2, riboflavin: 1.3, niacin: 16, pantothenic: 5, b6: 1.7,
    folate: 400, b12: 2.4, choline: 550, calcium: 1300, iron: 18, magnesium: 420,
    phosphorus: 1250, potassium: 4700, sodium: 2300, zinc: 11, copper: 0.9,
    manganese: 2.3, selenium: 55
  };

  function referenceSet() {
    var t = Profile.targets();
    if (!t) return { personal: false, values: GENERIC_DV, meta: {} };
    var values = {}, meta = {};
    Object.keys(t).forEach(function (k) { values[k] = t[k].value; meta[k] = t[k]; });
    return { personal: true, values: values, meta: meta };
  }

  // "Notable" nutrients for a food card: those supplying a large share of a
  // day's reference intake in a 100 g serving.
  function highlights(food, ref, limit) {
    var out = [];
    Object.keys(ref.values).forEach(function (key) {
      if (key === 'sodium') return;
      var amount = food.nutrients[key];
      var target = ref.values[key];
      if (amount == null || !target) return;
      var pct = (amount / target) * 100;
      if (pct >= 20) out.push({ key: key, pct: pct });
    });
    out.sort(function (a, b) { return b.pct - a.pct; });
    return out.slice(0, limit || 3);
  }

  function nutrientLabel(key) {
    for (var i = 0; i < PANEL.length; i++) {
      var rows = PANEL[i].rows;
      for (var j = 0; j < rows.length; j++) if (rows[j][0] === key) return rows[j][1];
    }
    return key;
  }

  var GROUPS = [
    { id: 'all', label: 'Everything' },
    { id: 'fruit', label: 'Fruits' },
    { id: 'veg', label: 'Vegetables' },
    { id: 'mushroom', label: 'Mushrooms' },
    { id: 'nut', label: 'Nuts & seeds' },
    { id: 'legume', label: 'Legumes' },
    { id: 'grain', label: 'Grains' }
  ];
  var GROUP_LABEL = {};
  GROUPS.forEach(function (g) { GROUP_LABEL[g.id] = g.label; });

  // ---- profile strip ----------------------------------------------------
  function renderStrip() {
    var p = Profile.get();
    if (!p) {
      strip.hidden = true;
      strip.innerHTML = '';
      return;
    }
    var e = Profile.energy();
    strip.hidden = false;
    strip.innerHTML =
      '<div class="wrap">' +
      '<span>Tailored to <strong>' + esc(p.age) + '-year-old ' + esc(p.sex) +
      '</strong>, ' + fmt(p.heightCm) + '&nbsp;cm, ' + fmt(p.weightKg) + '&nbsp;kg</span>' +
      '<span>Estimated need <strong>' + e.tdee + '&nbsp;kcal/day</strong></span>' +
      '<a href="#/you">Edit</a></div>';
  }

  // ======================================================================
  // View: food explorer
  // ======================================================================
  var foodState = { q: '', group: 'all', sort: 'name' };

  function viewFoods() {
    var ref = referenceSet();

    var sortOptions = [['name', 'Name (A–Z)'], ['kcal', 'Energy']].concat(
      ['protein', 'fiber', 'vitc', 'vitk', 'folate', 'iron', 'calcium',
       'magnesium', 'potassium', 'zinc', 'selenium', 'vitd', 'vita', 'ala']
        .map(function (k) { return [k, nutrientLabel(k)]; })
    );

    main.innerHTML =
      '<div class="page-head">' +
      '<h1>What is actually in your food</h1>' +
      '<p>' + FOODS.length + ' raw whole foods &mdash; fruits, vegetables, mushrooms, nuts, ' +
      'legumes and grains &mdash; with their full nutrient profile per 100&nbsp;g, taken ' +
      'directly from the USDA’s reference database. ' +
      (ref.personal
        ? 'Percentages are measured against <a href="#/you">your own daily targets</a>.'
        : '<a href="#/you">Add your height, weight, sex and age</a> and every percentage on ' +
          'the site switches from a generic food label to your own requirement.') +
      '</p></div>' +

      '<div class="controls">' +
      '<input class="search" id="foodSearch" type="search" placeholder="Search foods…" ' +
      'value="' + esc(foodState.q) + '" aria-label="Search foods">' +
      '<select class="control" id="foodSort" aria-label="Sort foods by">' +
      sortOptions.map(function (o) {
        return '<option value="' + o[0] + '"' + (foodState.sort === o[0] ? ' selected' : '') +
          '>Sort: ' + esc(o[1]) + (o[0] === 'name' || o[0] === 'kcal' ? '' : ' (highest)') + '</option>';
      }).join('') +
      '</select></div>' +

      '<div class="chips" role="group" aria-label="Filter by food group">' +
      GROUPS.map(function (g) {
        return '<button class="chip" type="button" data-group="' + g.id + '" aria-pressed="' +
          (foodState.group === g.id ? 'true' : 'false') + '">' + esc(g.label) + '</button>';
      }).join('') + '</div>' +

      '<p class="result-count" id="foodCount"></p>' +
      '<div class="grid" id="foodGrid"></div>';

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
      var list = FOODS.filter(function (f) {
        if (foodState.group !== 'all' && f.group !== foodState.group) return false;
        if (!q) return true;
        return f.name.toLowerCase().indexOf(q) >= 0 || f.slug.indexOf(q) >= 0;
      });

      if (foodState.sort === 'name') {
        list.sort(function (a, b) { return a.name.localeCompare(b.name); });
      } else {
        var key = foodState.sort;
        list.sort(function (a, b) {
          return (b.nutrients[key] || 0) - (a.nutrients[key] || 0);
        });
      }

      document.getElementById('foodCount').textContent =
        list.length + (list.length === 1 ? ' food' : ' foods') +
        (foodState.group === 'all' ? '' : ' in ' + GROUP_LABEL[foodState.group].toLowerCase());

      var grid = document.getElementById('foodGrid');
      if (!list.length) {
        grid.innerHTML = '<p class="empty">Nothing matches that search.</p>';
        return;
      }

      grid.innerHTML = list.map(function (f) {
        var hs = highlights(f, ref, 3);
        var sortTag = '';
        if (foodState.sort !== 'name' && foodState.sort !== 'kcal' && f.nutrients[foodState.sort] != null) {
          sortTag = '';
        }
        return '<a class="food-card" href="#/food/' + esc(f.slug) + '">' +
          '<h3>' + esc(f.name) + '</h3>' +
          '<div class="kcal">' + fmt(f.nutrients.kcal) + ' kcal &middot; ' +
          fmt(f.nutrients.protein) + ' g protein &middot; ' +
          fmt(f.nutrients.fiber) + ' g fibre <span style="opacity:.7">/ 100 g</span></div>' +
          (hs.length
            ? '<div class="highlights">' + hs.map(function (h) {
                return '<span class="tag">' + esc(nutrientLabel(h.key)) + ' ' +
                  Math.round(h.pct) + '%</span>';
              }).join('') + '</div>'
            : '<div class="highlights"><span class="tag g">' +
              esc(GROUP_LABEL[f.group] || f.group) + '</span></div>') +
          sortTag + '</a>';
      }).join('');
    }
  }

  // ======================================================================
  // View: single food
  // ======================================================================
  var portionState = {};

  function viewFood(slug) {
    var food = FOODS.filter(function (f) { return f.slug === slug; })[0];
    if (!food) return viewMissing('That food is not in the database.');

    var ref = referenceSet();
    var per100 = { label: 'per 100 g', grams: 100 };
    var choices = [per100];
    if (food.portion && Math.abs(food.portion.grams - 100) > 1) {
      choices.push({ label: '1 ' + food.portion.label, grams: food.portion.grams });
    }
    var chosen = portionState[slug] || 0;
    if (chosen >= choices.length) chosen = 0;
    var scale = choices[chosen].grams / 100;

    // Which medicinal entries point back at this food?
    var linked = MED.filter(function (m) {
      return (m.foodSlugs || []).indexOf(slug) >= 0;
    });

    var fdcUrl = 'https://fdc.nal.usda.gov/food-details/' + food.fdcId + '/nutrients';

    main.innerHTML =
      '<a class="crumb" href="#/foods">&larr; All foods</a>' +
      '<div class="detail-head"><h1>' + esc(food.name) + '</h1>' +
      '<span class="tag g">' + esc(GROUP_LABEL[food.group] || food.group) + '</span></div>' +
      '<p class="source-line">USDA FoodData Central, SR Legacy &mdash; ' +
      '<a href="' + fdcUrl + '" rel="noopener" target="_blank">FDC ID ' + food.fdcId + '</a>' +
      ', published ' + esc(food.published) + '. Raw, edible portion.</p>' +

      (choices.length > 1
        ? '<div class="portion-toggle"><span class="label">Show:</span>' +
          choices.map(function (c, i) {
            return '<button class="chip" type="button" data-portion="' + i + '" aria-pressed="' +
              (i === chosen ? 'true' : 'false') + '">' + esc(c.label) +
              (i > 0 ? ' (' + fmt(c.grams) + ' g)' : '') + '</button>';
          }).join('') + '</div>'
        : '') +

      '<div class="macro-row">' +
      [['kcal', 'Energy', 'kcal'], ['protein', 'Protein', 'g'], ['carbs', 'Carbs', 'g'],
       ['fiber', 'Fibre', 'g'], ['fat', 'Fat', 'g']].map(function (m) {
        var v = food.nutrients[m[0]];
        return '<div class="macro"><div class="v">' +
          (v == null ? '—' : fmt(v * scale)) +
          '<span style="font-size:.72em;font-weight:500;opacity:.65"> ' + m[2] + '</span></div>' +
          '<div class="l">' + esc(m[1]) + '</div></div>';
      }).join('') + '</div>' +

      (ref.personal
        ? '<p class="result-count">Percentages are of <a href="#/you">your</a> daily target.</p>'
        : '<p class="result-count">Percentages are of the generic FDA Daily Value. ' +
          '<a href="#/you">Add your details</a> to use your own reference intakes instead.</p>') +

      '<div class="table-scroll"><table class="nutrients">' +
      '<thead><tr><th>Nutrient</th><th class="num">Amount</th>' +
      '<th class="num">' + (ref.personal ? 'Of your daily target' : 'Of Daily Value') + '</th>' +
      '</tr></thead><tbody>' + panelRows(food, ref, scale) + '</tbody></table></div>' +

      ulNotes(food, ref, scale) +

      (linked.length
        ? '<h2 class="section">Medicinal properties associated with this food</h2>' +
          '<div class="herb-grid">' + linked.map(herbCard).join('') + '</div>'
        : '') +

      '<h2 class="section">How to read this</h2>' +
      '<div class="prose"><p>These are figures for the food <em>raw</em>. Cooking changes ' +
      'them in both directions: water-soluble vitamins such as C and folate leach into ' +
      'cooking water, while heat makes the lycopene in tomatoes and the beta-carotene in ' +
      'carrots easier to absorb. A blank cell means USDA has no analysed value for that ' +
      'nutrient in this food, which is not the same as a zero.</p>' +
      '<p>Nutrient content is also only half the story. How much your body actually absorbs ' +
      'depends on what you eat alongside it &mdash; the non-haem iron in spinach is absorbed ' +
      'far better with a squeeze of lemon, and the same spinach’s oxalate binds much of ' +
      'its calcium into a form you cannot use.</p></div>';

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
      html += '<tr class="group-head"><td colspan="3">' + esc(section.group) + '</td></tr>';
      rows.forEach(function (r) {
        var key = r[0], label = r[1], unit = r[2];
        var amount = food.nutrients[key] * scale;
        var target = ref.values[key];
        var meta = ref.meta[key];
        var pctCell = '<td class="num"><span class="pct dim">—</span></td>';

        if (target) {
          var pct = (amount / target) * 100;
          var cls = pct > 100 ? 'over' : (pct >= 50 ? 'high' : '');
          // Sodium reads the other way round: a high share of the limit is bad,
          // so it gets the warning colours at a lower threshold.
          if (key === 'sodium') cls = pct >= 50 ? 'over' : (pct >= 20 ? 'high' : '');
          pctCell = '<td class="num"><span class="dv-cell">' +
            '<span class="bar ' + cls + '"><span style="width:' +
            Math.min(100, Math.round(pct)) + '%"></span></span>' +
            '<span class="pct">' + (pct < 1 ? '<1' : Math.round(pct)) + '%</span></span></td>';
        }

        html += '<tr><td class="name">' + esc(label) +
          (meta && meta.type === 'AI' ? '<span class="dri-type" title="Adequate Intake &mdash; used when evidence is insufficient to set an RDA">AI</span>' : '') +
          '</td><td class="num">' + fmt(amount) + ' ' + (UNIT_LABEL[unit] || unit) +
          '</td>' + pctCell + '</tr>';
      });
    });
    return html;
  }

  // Flags a serving that runs up against a Tolerable Upper Intake Level --
  // the Brazil-nut selenium problem is the reason this exists.
  function ulNotes(food, ref, scale) {
    var hits = [];
    Object.keys(DRI.upperLimits).forEach(function (key) {
      var amount = food.nutrients[key];
      if (amount == null) return;
      var ul = DRI.upperLimits[key];
      // A supplement-only UL does not apply to the food in front of you.
      if (ul.supplementOnly) return;
      var pct = (amount * scale / ul.value) * 100;
      if (pct >= 60) hits.push({ key: key, pct: pct, ul: ul });
    });
    if (!hits.length) return '';
    return hits.map(function (h) {
      return '<div class="note ' + (h.pct >= 100 ? 'danger' : 'warn') + '">' +
        '<p><strong>' + esc(nutrientLabel(h.key)) + ': ' +
        (h.pct >= 100 ? 'this portion exceeds' : 'this portion reaches ' + Math.round(h.pct) + '% of') +
        ' the tolerable upper intake level</strong> of ' + fmt(h.ul.value) + ' ' +
        (UNIT_LABEL[h.ul.unit] || h.ul.unit) + ' a day for adults.</p>' +
        '<p>' + esc(h.ul.note) + '</p></div>';
    }).join('');
  }

  // ======================================================================
  // View: medicinal index
  // ======================================================================
  var GRADES = [
    { id: 'established', label: 'Established', blurb: 'Accepted by a regulator or clinical guideline after formal review.' },
    { id: 'moderate', label: 'Moderate', blurb: 'Several trials or a meta-analysis agree, with caveats.' },
    { id: 'preliminary', label: 'Preliminary', blurb: 'Small, short or mixed studies. Interesting, not settled.' },
    { id: 'insufficient', label: 'Insufficient', blurb: 'Studied and found wanting, or too weak to judge.' },
    { id: 'ineffective', label: 'Ineffective', blurb: 'Well-powered trials looked and found no benefit.' }
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
    var seen = [], grades = [];
    m.claims.forEach(function (c) {
      if (seen.indexOf(c.grade) < 0) { seen.push(c.grade); grades.push(c.grade); }
    });
    grades.sort(function (a, b) { return GRADE_RANK[a] - GRADE_RANK[b]; });
    return '<a class="herb-card" href="#/herb/' + esc(m.slug) + '">' +
      '<h3>' + esc(m.name) + (m.warning ? ' <span class="ul-flag">safety</span>' : '') + '</h3>' +
      (m.latin ? '<div class="latin">' + esc(m.latin) + '</div>' : '') +
      '<p class="lede">' + esc(m.claims[0].claim) + '</p>' +
      '<div class="grades">' + grades.map(function (g) {
        return '<span class="grade grade-' + g + '">' + esc(g) + '</span>';
      }).join('') + '</div></a>';
  }

  function viewMedicinal() {
    main.innerHTML =
      '<div class="page-head"><h1>Medicinal properties, honestly graded</h1>' +
      '<p>Herbs are pharmacologically active, which is exactly why they need the same ' +
      'scrutiny as drugs. Each entry below is graded by how good the evidence actually is ' +
      '&mdash; not by how often it appears on a supplement label. Several popular remedies ' +
      'here are graded <em>ineffective</em>, because large trials looked carefully and ' +
      'found nothing.</p></div>' +

      '<div class="card legend">' + GRADES.map(function (g) {
        return '<div><span class="grade grade-' + g.id + '">' + esc(g.label) + '</span>' +
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
          (medState.grade === g.id ? 'true' : 'false') + '">' + esc(g.label) + '</button>';
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
        if (medState.grade !== 'all') {
          var has = m.claims.some(function (c) { return c.grade === medState.grade; });
          if (!has) return false;
        }
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
      var grid = document.getElementById('medGrid');
      grid.innerHTML = list.length
        ? list.map(herbCard).join('')
        : '<p class="empty">Nothing matches that search.</p>';
    }
  }

  // ======================================================================
  // View: single herb
  // ======================================================================
  function refPills(keys) {
    if (!keys || !keys.length) return '';
    return '<div class="refs">' + keys.map(function (k) {
      var s = SOURCES[k];
      if (!s) return '';
      return '<a class="ref-pill" href="#/sources#src-' + esc(k) + '" title="' +
        esc(s.title) + '">' + esc(s.org.split(/[,;]|\.\s/)[0]) + (s.year ? ' ' + s.year : '') + '</a>';
    }).join('') + '</div>';
  }

  function viewHerb(slug) {
    var m = MED.filter(function (x) { return x.slug === slug; })[0];
    if (!m) return viewMissing('That entry is not in the database.');

    var relatedFoods = (m.foodSlugs || []).map(function (s) {
      return FOODS.filter(function (f) { return f.slug === s; })[0];
    }).filter(Boolean);

    main.innerHTML =
      '<a class="crumb" href="#/medicinal">&larr; All medicinal entries</a>' +
      '<div class="detail-head"><h1>' + esc(m.name) + '</h1>' +
      (m.latin ? '<span class="latin">' + esc(m.latin) + '</span>' : '') + '</div>' +
      (m.activeCompounds && m.activeCompounds.length
        ? '<p class="source-line">Active constituents: ' +
          m.activeCompounds.map(esc).join(', ') + '</p>'
        : '<div style="height:14px"></div>') +

      (m.warning
        ? '<div class="note danger"><p><strong>Read the safety section on this page before ' +
          'using this herb.</strong> It carries a documented risk of harm or a serious drug ' +
          'interaction, not merely a theoretical one.</p></div>'
        : '') +

      '<h2 class="section">What the evidence says</h2>' +
      m.claims.map(function (c) {
        return '<div class="claim"><div class="claim-head">' +
          '<h3>' + esc(c.claim) + '</h3>' +
          '<span class="grade grade-' + c.grade + '">' + esc(c.grade) + '</span></div>' +
          '<p>' + esc(c.detail) + '</p>' + refPills(c.refs) + '</div>';
      }).join('') +

      '<div class="two-col" style="margin-top:26px">' +
      '<div class="card" style="padding:18px 20px"><dl class="facts">' +
      (m.mechanism ? '<dt>How it works</dt><dd>' + esc(m.mechanism) + '</dd>' : '') +
      '</dl></div>' +
      '<div class="card" style="padding:18px 20px"><dl class="facts">' +
      (m.safety ? '<dt>Safety</dt><dd>' + esc(m.safety) + '</dd>' : '') +
      (m.interactions ? '<dt>Drug interactions</dt><dd>' + esc(m.interactions) + '</dd>'
        : '<dt>Drug interactions</dt><dd>None well documented. That is not a guarantee &mdash; ' +
          'most herb–drug interactions have never been formally studied.</dd>') +
      '</dl></div></div>' +

      (m.refs && m.refs.length
        ? '<h2 class="section">Further sources for this entry</h2>' + refPills(m.refs)
        : '') +

      (relatedFoods.length
        ? '<h2 class="section">Nutrition data for related foods</h2><div class="grid">' +
          relatedFoods.map(function (f) {
            return '<a class="food-card" href="#/food/' + esc(f.slug) + '"><h3>' +
              esc(f.name) + '</h3><div class="kcal">' + fmt(f.nutrients.kcal) +
              ' kcal / 100 g</div></a>';
          }).join('') + '</div>'
        : '');
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
      } else {
        hVal = Math.round(p.heightCm);
      }
    }

    main.innerHTML =
      '<div class="page-head"><h1>Your profile</h1>' +
      '<p>Nutrient requirements are not one number. An 18-year-old woman needs more than ' +
      'twice the iron of a man the same age; a man over 50 needs a third more vitamin B6 ' +
      'than he did at 30. Fill this in and every percentage on the site is recalculated ' +
      'against your own reference intakes instead of a generic food label.</p></div>' +

      '<div class="note"><p><strong>This stays on your device.</strong> Your details are ' +
      'saved in this browser’s local storage and are never uploaded, transmitted or ' +
      'shared. Clearing them below removes them completely.</p></div>' +

      '<div class="card form-card">' +
      '<div class="unit-switch chips" role="group" aria-label="Units">' +
      '<button class="chip" type="button" data-unit="metric" aria-pressed="' +
      (!imperial ? 'true' : 'false') + '">Metric</button>' +
      '<button class="chip" type="button" data-unit="imperial" aria-pressed="' +
      (imperial ? 'true' : 'false') + '">Imperial</button></div>' +

      '<form id="profileForm">' +
      '<div class="field-row">' +
      '<div class="field"><label for="pAge">Age (years)</label>' +
      '<input id="pAge" type="number" min="9" max="119" step="1" required value="' +
      (p ? esc(p.age) : '') + '"><span class="hint">Reference intakes start at age 9 here.</span></div>' +
      '<div class="field"><label for="pSex">Sex</label>' +
      '<select id="pSex" required>' +
      '<option value="female"' + (p && p.sex === 'female' ? ' selected' : '') + '>Female</option>' +
      '<option value="male"' + (p && p.sex === 'male' ? ' selected' : '') + '>Male</option>' +
      '</select><span class="hint">The DRI tables are published for two sexes only.</span></div>' +
      '</div>' +

      '<div class="field-row">' +
      (imperial
        ? '<div class="field"><label for="pHeight">Height</label>' +
          '<div style="display:flex;gap:8px">' +
          '<input id="pHeight" type="number" min="2" max="8" step="1" required placeholder="ft" value="' + esc(hVal) + '">' +
          '<input id="pHeightIn" type="number" min="0" max="11" step="1" placeholder="in" value="' + esc(hInVal) + '">' +
          '</div><span class="hint">Feet and inches.</span></div>' +
          '<div class="field"><label for="pWeight">Weight (lb)</label>' +
          '<input id="pWeight" type="number" min="40" max="900" step="1" required value="' + esc(wVal) + '"></div>'
        : '<div class="field"><label for="pHeight">Height (cm)</label>' +
          '<input id="pHeight" type="number" min="90" max="250" step="1" required value="' + esc(hVal) + '"></div>' +
          '<div class="field"><label for="pWeight">Weight (kg)</label>' +
          '<input id="pWeight" type="number" min="20" max="400" step="0.1" required value="' + esc(wVal) + '"></div>') +
      '</div>' +

      '<div class="field" style="margin-bottom:18px"><label for="pActivity">Activity level</label>' +
      '<select id="pActivity">' + DRI.activity.map(function (a) {
        var sel = p && p.activity === a.value ? ' selected' : (!p && a.value === 1.375 ? ' selected' : '');
        return '<option value="' + a.value + '"' + sel + '>' + esc(a.label) + ' — ' + esc(a.hint) + '</option>';
      }).join('') + '</select>' +
      '<span class="hint">Used only to estimate energy needs and the fibre target.</span></div>' +

      '<div class="btn-row"><button class="btn" type="submit">' +
      (p ? 'Update my targets' : 'Calculate my targets') + '</button>' +
      (p ? '<button class="btn ghost" type="button" id="clearProfile">Clear my details</button>' : '') +
      '</div></form></div>' +

      '<div id="profileResults"></div>';

    main.querySelectorAll('[data-unit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        unitState = btn.dataset.unit;
        viewProfile();
      });
    });

    var clearBtn = document.getElementById('clearProfile');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        Profile.clear();
        renderStrip();
        viewProfile();
      });
    }

    document.getElementById('profileForm').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var age = Number(document.getElementById('pAge').value);
      var sex = document.getElementById('pSex').value;
      var activity = Number(document.getElementById('pActivity').value);
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
        age: age, sex: sex, activity: activity,
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
      if (!prof) return;
      var t = Profile.targets();
      var e = Profile.energy();
      var bmi = Profile.bmi();

      var order = ['protein', 'fiber'].concat(
        PANEL[2].rows.map(function (r) { return r[0]; }),
        PANEL[3].rows.map(function (r) { return r[0]; }),
        ['ala', 'la']
      ).filter(function (k) { return t[k]; });

      // Foods that best cover each target, so the numbers lead somewhere useful.
      document.getElementById('profileResults').innerHTML =
        '<h2 class="section">Your estimated energy needs</h2>' +
        '<div class="energy-row">' +
        '<div class="macro"><div class="v">' + e.bmr + '<span style="font-size:.6em;font-weight:500;opacity:.65"> kcal</span></div>' +
        '<div class="l">Resting (BMR)</div></div>' +
        '<div class="macro"><div class="v">' + e.tdee + '<span style="font-size:.6em;font-weight:500;opacity:.65"> kcal</span></div>' +
        '<div class="l">Daily total</div></div>' +
        '<div class="macro"><div class="v">' + fmt(bmi) + '</div><div class="l">BMI</div></div>' +
        '</div>' +
        '<div class="note"><p>Resting energy expenditure is estimated with the ' +
        '<a href="#/sources#src-mifflin">Mifflin-St Jeor equation</a> and multiplied by your ' +
        'activity level. It is a population average, not a measurement: individuals vary by ' +
        'roughly &plusmn;10% around it.</p>' +
        '<p><strong>On BMI:</strong> it was designed to describe populations, not people. It ' +
        'cannot distinguish muscle from fat, and it misclassifies muscular and very tall or ' +
        'short people routinely. Treat it as one crude number among many.</p></div>' +

        '<h2 class="section">Your daily targets</h2>' +
        '<p class="result-count">From the ' +
        '<a href="#/sources#src-dri">NASEM Dietary Reference Intakes</a> for a ' +
        esc(prof.age) + '-year-old ' + esc(prof.sex) + '. ' +
        '<strong>RDA</strong> meets the needs of about 97.5% of people; ' +
        '<strong>AI</strong> is used where the evidence cannot support an RDA.</p>' +

        '<div class="table-scroll"><table class="nutrients">' +
        '<thead><tr><th>Nutrient</th><th class="num">Your target</th><th>Best sources here</th></tr></thead><tbody>' +
        order.map(function (key) {
          var target = t[key];
          var top = FOODS.slice().filter(function (f) { return f.nutrients[key] != null; })
            .sort(function (a, b) { return b.nutrients[key] - a.nutrients[key]; })
            .slice(0, 3);
          return '<tr><td class="name">' + esc(target.label) +
            '<span class="dri-type">' + esc(target.type) + '</span></td>' +
            '<td class="num">' + fmt(target.value) + ' ' + (UNIT_LABEL[target.unit] || target.unit) + '</td>' +
            '<td style="font-size:.86rem">' + top.map(function (f) {
              return '<a href="#/food/' + esc(f.slug) + '">' + esc(f.name) + '</a> <span style="color:var(--ink-faint)">(' +
                Math.round((f.nutrients[key] / target.value) * 100) + '%/100 g)</span>';
            }).join(', ') + '</td></tr>';
        }).join('') + '</tbody></table></div>' +

        '<div class="note warn"><p><strong>The two this food list cannot cover.</strong> ' +
        'Every food on this site is a plant or a fungus, and that shows up in two rows above. ' +
        '<strong>Vitamin B12</strong> is made by bacteria and is essentially absent from ' +
        'unfortified plant foods &mdash; the best entry here reaches about 4% of a day per ' +
        '100&nbsp;g, and that is a mushroom figure that analytical chemists regard as partly ' +
        'inactive B12 analogues. Anyone eating no animal products needs a fortified food or a ' +
        'supplement; this is not negotiable and deficiency causes irreversible nerve damage. ' +
        '<strong>Vitamin D</strong> is the other: the UV-exposed mushrooms are a genuine ' +
        'exception, but ordinary mushrooms grown in the dark contain none.</p></div>' +

        '<div class="note"><p><strong>Where people most often fall short.</strong> The ' +
        '<a href="#/sources#src-dgac">Dietary Guidelines for Americans</a> single out four ' +
        'nutrients as being under-consumed widely enough to be public health concerns: ' +
        'calcium, potassium, dietary fibre and vitamin D. Three of the four are easiest to ' +
        'fix from the food list here &mdash; leafy greens and seeds for calcium, almost any ' +
        'vegetable for potassium, legumes and whole grains for fibre. Vitamin D is the ' +
        'awkward one: almost nothing plant-based contains it, which is what makes the ' +
        '<a href="#/herb/uv-mushrooms">UV-exposed mushrooms</a> genuinely unusual.</p></div>' +

        '<div class="note warn"><p>These targets describe a healthy general population. They ' +
        'do not account for pregnancy or breastfeeding, which raise several requirements ' +
        'substantially; for smoking, which raises the vitamin C requirement by 35&nbsp;mg a ' +
        'day; for a vegan diet, whose iron requirement the Food and Nutrition Board sets ' +
        'roughly 1.8&times; higher because non-haem iron is absorbed less well; or for any ' +
        'medical condition or medication. If any of those apply to you, the right numbers ' +
        'come from a clinician, not from this page.</p></div>';
    }
  }

  // ======================================================================
  // View: sources
  // ======================================================================
  var TIER_LABEL = {
    government: 'Government / regulator',
    systematic: 'Systematic review',
    trial: 'Primary trial',
    guideline: 'Clinical guideline',
    reference: 'Reference work'
  };

  function viewSources(anchor) {
    var keys = Object.keys(SOURCES);
    var order = ['government', 'systematic', 'guideline', 'trial', 'reference'];
    keys.sort(function (a, b) {
      var d = order.indexOf(SOURCES[a].tier) - order.indexOf(SOURCES[b].tier);
      return d !== 0 ? d : (SOURCES[b].year || 0) - (SOURCES[a].year || 0);
    });

    main.innerHTML =
      '<div class="page-head"><h1>Sources</h1>' +
      '<p>Every figure and every claim on this site traces back to one of the ' + keys.length +
      ' sources below. They were chosen on one rule: government agencies, systematic reviews ' +
      'and clinical guidelines first; named primary trials where a single study genuinely ' +
      'settled a question; nothing from a supplement seller, a wellness site or a secondary ' +
      'article summarising research it does not cite.</p></div>' +

      '<div class="note"><p><strong>Why these and not others.</strong> Nutrition and herbal ' +
      'medicine are unusually badly served online, because the same claim gets copied between ' +
      'sites until it looks like consensus. The way through it is to prefer sources that are ' +
      'obliged to show their working: Cochrane publishes its search strategy and its risk-of-bias ' +
      'assessment; the FDA publishes the reasoning behind every authorised health claim; NCCIH ' +
      'is a research body with no product to sell and is correspondingly willing to say that a ' +
      'popular remedy does not work.</p></div>' +

      order.map(function (tier) {
        var inTier = keys.filter(function (k) { return SOURCES[k].tier === tier; });
        if (!inTier.length) return '';
        return '<h2 class="section">' + esc(TIER_LABEL[tier]) + '</h2>' +
          inTier.map(function (k) {
            var s = SOURCES[k];
            return '<div class="card source-item" id="src-' + esc(k) + '">' +
              '<h3><a href="' + esc(s.url) + '" rel="noopener" target="_blank">' + esc(s.title) + '</a>' +
              '<span class="tier tier-' + esc(s.tier) + '">' + esc(s.tier) + '</span></h3>' +
              '<p class="org">' + esc(s.org) + (s.year ? ' &middot; ' + s.year : '') + '</p>' +
              (s.note ? '<p class="note">' + esc(s.note) + '</p>' : '') +
              '</div>';
          }).join('');
      }).join('') +

      '<h2 class="section">How the nutrition data was built</h2>' +
      '<div class="prose">' +
      '<p>The ' + FOODS.length + ' foods on this site were not typed in by hand. The USDA ' +
      'publishes SR Legacy as a bulk CSV release; a build script in this repository ' +
      '(<code>build/build_foods.py</code>) reads that release, pulls the 35 nutrients shown ' +
      'here for a curated list of raw whole foods, and writes <code>data/foods.js</code>. ' +
      'Each food keeps the FDC ID it came from, so every page links back to the original ' +
      'USDA record and you can check any number against the source in one click.</p>' +
      '<p>That matters more than it sounds. Most nutrition sites transcribe values by hand ' +
      'or copy them from each other, and the errors compound silently. Generating the data ' +
      'means a wrong number here would have to be wrong at USDA.</p>' +
      '<h2>What is deliberately absent</h2>' +
      '<p>There are no supplement recommendations, no proprietary blends, no dosing ' +
      'instructions and nothing for sale. Where the evidence for a popular remedy is bad, ' +
      'the page says so rather than hedging &mdash; ginkgo for dementia and saw palmetto ' +
      'for prostate symptoms are both graded on large trials that found nothing, and those ' +
      'are among the most useful entries on the site.</p></div>';

    if (anchor) {
      var target = document.getElementById(anchor);
      if (target) setTimeout(function () { target.scrollIntoView({ block: 'center' }); }, 0);
    }
  }

  function viewMissing(msg) {
    main.innerHTML = '<div class="page-head"><h1>Not found</h1><p>' + esc(msg) + '</p></div>' +
      '<p><a href="#/foods">Back to the food list</a></p>';
  }

  // ======================================================================
  // Router
  // ======================================================================
  function route() {
    // Support the "#/sources#src-key" form used by the citation pills.
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
    else if (top === 'sources') viewSources(anchor);
    else { top = 'foods'; viewFoods(); }

    document.querySelectorAll('#nav a').forEach(function (a) {
      var r = a.dataset.route;
      var active = r === top ||
        (r === 'foods' && top === 'food') ||
        (r === 'medicinal' && top === 'herb');
      a.classList.toggle('active', active);
    });

    if (!anchor) window.scrollTo(0, 0);
  }

  // ---- theme ------------------------------------------------------------
  var THEME_KEY = 'fim.theme';
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }
  try { applyTheme(localStorage.getItem(THEME_KEY)); } catch (e) { /* ignore */ }

  document.getElementById('themeToggle').addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme');
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var next = cur ? (cur === 'dark' ? 'light' : 'dark') : (systemDark ? 'light' : 'dark');
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
  });

  window.addEventListener('hashchange', route);
  Profile.onChange(renderStrip);
  renderStrip();
  route();
})();
