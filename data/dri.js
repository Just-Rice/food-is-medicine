// Dietary Reference Intakes (DRIs) from the National Academies of Sciences,
// Engineering, and Medicine -- Food and Nutrition Board. Values transcribed from
// the 2019 consolidated DRI summary tables, which supersede the individual
// 1997-2011 reports and carry the revised sodium and potassium values.
//
//   NASEM, "Dietary Reference Intakes for Sodium and Potassium" (2019)
//   NASEM DRI summary tables: https://nap.nationalacademies.org/read/25353
//   NIH Office of Dietary Supplements fact sheets: https://ods.od.nih.gov/factsheets/
//
// RDA = Recommended Dietary Allowance (meets the needs of ~97.5% of people).
// AI  = Adequate Intake (used when evidence is insufficient for an RDA).
// UL  = Tolerable Upper Intake Level (highest chronic daily intake likely to
//       pose no risk; for several nutrients the UL applies to supplements and
//       fortified foods only, not to what you get from whole food).
//
// Bands run from age 1. Children are not small adults: a four-year-old's iron
// RDA is higher than an adult man's, and the upper limits are dramatically
// lower -- a child's tolerable limit for selenium is 90 micrograms against an
// adult's 400. Serving adult numbers to a child would be wrong in both
// directions at once.

(function () {
  'use strict';

  // Life-stage bands. `min`/`max` are ages in years, inclusive.
  var BANDS = [
    { id: '1-3', min: 1, max: 3 },
    { id: '4-8', min: 4, max: 8 },
    { id: '9-13', min: 9, max: 13 },
    { id: '14-18', min: 14, max: 18 },
    { id: '19-30', min: 19, max: 30 },
    { id: '31-50', min: 31, max: 50 },
    { id: '51-70', min: 51, max: 70 },
    { id: '70+', min: 71, max: 130 }
  ];

  // For each nutrient: display label, unit, the kind of value (RDA or AI), and
  // per-sex values indexed by the bands above in order.
  //                                       1-3   4-8   9-13  14-18 19-30 31-50 51-70  70+
  var REFERENCE = {
    vita:        { label: 'Vitamin A',          unit: 'ug', type: 'RDA',
                   male:   [300,  400,  600,  900,  900,  900,  900,  900],
                   female: [300,  400,  600,  700,  700,  700,  700,  700] },
    vitc:        { label: 'Vitamin C',          unit: 'mg', type: 'RDA',
                   male:   [15,   25,   45,   75,   90,   90,   90,   90],
                   female: [15,   25,   45,   65,   75,   75,   75,   75] },
    vitd:        { label: 'Vitamin D',          unit: 'ug', type: 'RDA',
                   male:   [15,   15,   15,   15,   15,   15,   15,   20],
                   female: [15,   15,   15,   15,   15,   15,   15,   20] },
    vite:        { label: 'Vitamin E',          unit: 'mg', type: 'RDA',
                   male:   [6,    7,    11,   15,   15,   15,   15,   15],
                   female: [6,    7,    11,   15,   15,   15,   15,   15] },
    vitk:        { label: 'Vitamin K',          unit: 'ug', type: 'AI',
                   male:   [30,   55,   60,   75,   120,  120,  120,  120],
                   female: [30,   55,   60,   75,   90,   90,   90,   90] },
    thiamin:     { label: 'Thiamin (B1)',       unit: 'mg', type: 'RDA',
                   male:   [0.5,  0.6,  0.9,  1.2,  1.2,  1.2,  1.2,  1.2],
                   female: [0.5,  0.6,  0.9,  1.0,  1.1,  1.1,  1.1,  1.1] },
    riboflavin:  { label: 'Riboflavin (B2)',    unit: 'mg', type: 'RDA',
                   male:   [0.5,  0.6,  0.9,  1.3,  1.3,  1.3,  1.3,  1.3],
                   female: [0.5,  0.6,  0.9,  1.0,  1.1,  1.1,  1.1,  1.1] },
    niacin:      { label: 'Niacin (B3)',        unit: 'mg', type: 'RDA',
                   male:   [6,    8,    12,   16,   16,   16,   16,   16],
                   female: [6,    8,    12,   14,   14,   14,   14,   14] },
    pantothenic: { label: 'Pantothenic acid',   unit: 'mg', type: 'AI',
                   male:   [2,    3,    4,    5,    5,    5,    5,    5],
                   female: [2,    3,    4,    5,    5,    5,    5,    5] },
    b6:          { label: 'Vitamin B6',         unit: 'mg', type: 'RDA',
                   male:   [0.5,  0.6,  1.0,  1.3,  1.3,  1.3,  1.7,  1.7],
                   female: [0.5,  0.6,  1.0,  1.2,  1.3,  1.3,  1.5,  1.5] },
    folate:      { label: 'Folate',             unit: 'ug', type: 'RDA',
                   male:   [150,  200,  300,  400,  400,  400,  400,  400],
                   female: [150,  200,  300,  400,  400,  400,  400,  400] },
    b12:         { label: 'Vitamin B12',        unit: 'ug', type: 'RDA',
                   male:   [0.9,  1.2,  1.8,  2.4,  2.4,  2.4,  2.4,  2.4],
                   female: [0.9,  1.2,  1.8,  2.4,  2.4,  2.4,  2.4,  2.4] },
    choline:     { label: 'Choline',            unit: 'mg', type: 'AI',
                   male:   [200,  250,  375,  550,  550,  550,  550,  550],
                   female: [200,  250,  375,  400,  425,  425,  425,  425] },
    calcium:     { label: 'Calcium',            unit: 'mg', type: 'RDA',
                   male:   [700,  1000, 1300, 1300, 1000, 1000, 1000, 1200],
                   female: [700,  1000, 1300, 1300, 1000, 1000, 1200, 1200] },
    iron:        { label: 'Iron',               unit: 'mg', type: 'RDA',
                   male:   [7,    10,   8,    11,   8,    8,    8,    8],
                   female: [7,    10,   8,    15,   18,   18,   8,    8] },
    magnesium:   { label: 'Magnesium',          unit: 'mg', type: 'RDA',
                   male:   [80,   130,  240,  410,  400,  420,  420,  420],
                   female: [80,   130,  240,  360,  310,  320,  320,  320] },
    phosphorus:  { label: 'Phosphorus',         unit: 'mg', type: 'RDA',
                   male:   [460,  500,  1250, 1250, 700,  700,  700,  700],
                   female: [460,  500,  1250, 1250, 700,  700,  700,  700] },
    potassium:   { label: 'Potassium',          unit: 'mg', type: 'AI',
                   male:   [2000, 2300, 2500, 3000, 3400, 3400, 3400, 3400],
                   female: [2000, 2300, 2300, 2300, 2600, 2600, 2600, 2600] },
    zinc:        { label: 'Zinc',               unit: 'mg', type: 'RDA',
                   male:   [3,    5,    8,    11,   11,   11,   11,   11],
                   female: [3,    5,    8,    9,    8,    8,    8,    8] },
    copper:      { label: 'Copper',             unit: 'mg', type: 'RDA',
                   male:   [0.34, 0.44, 0.7,  0.89, 0.9,  0.9,  0.9,  0.9],
                   female: [0.34, 0.44, 0.7,  0.89, 0.9,  0.9,  0.9,  0.9] },
    manganese:   { label: 'Manganese',          unit: 'mg', type: 'AI',
                   male:   [1.2,  1.5,  1.9,  2.2,  2.3,  2.3,  2.3,  2.3],
                   female: [1.2,  1.5,  1.6,  1.6,  1.8,  1.8,  1.8,  1.8] },
    selenium:    { label: 'Selenium',           unit: 'ug', type: 'RDA',
                   male:   [20,   30,   40,   55,   55,   55,   55,   55],
                   female: [20,   30,   40,   55,   55,   55,   55,   55] },
    ala:         { label: 'Omega-3 (ALA)',      unit: 'g',  type: 'AI',
                   male:   [0.7,  0.9,  1.2,  1.6,  1.6,  1.6,  1.6,  1.6],
                   female: [0.7,  0.9,  1.0,  1.1,  1.1,  1.1,  1.1,  1.1] },
    la:          { label: 'Omega-6 (linoleic)', unit: 'g',  type: 'AI',
                   male:   [7,    10,   12,   16,   17,   17,   14,   14],
                   female: [7,    10,   10,   11,   12,   12,   11,   11] }
  };

  // Published fibre AIs. For adults the site derives fibre from estimated
  // energy needs, which is the definitional basis (14 g per 1,000 kcal). For
  // children and adolescents the published band value is used instead, because
  // energy estimates during growth are unreliable enough to distort it.
  var FIBER_AI = {
    male:   [19, 25, 31, 38, 38, 38, 30, 30],
    female: [19, 25, 26, 26, 25, 25, 21, 21]
  };

  // Tolerable Upper Intake Levels, banded by age. A child's limits are far
  // lower than an adult's -- selenium is 90 micrograms at age 1-3 against 400
  // for an adult -- so showing adult limits to a child would be actively
  // misleading. Bands here are 1-3, 4-8, 9-13, 14-18, 19+.
  //
  // `supplementOnly` marks the nutrients whose UL the Food and Nutrition Board
  // set for supplements and fortified foods alone: no limit was set on the
  // amount obtained from ordinary food, because no harm has been shown there.
  var UL_BANDS = [3, 8, 13, 18, 130];
  var UPPER_LIMITS = {
    vita:      { values: [600, 900, 1700, 2800, 3000], unit: 'ug', supplementOnly: true,
                 note: 'Applies to preformed vitamin A (retinol) only. Carotenoids from plants are not included and are not known to cause toxicity.' },
    vitc:      { values: [400, 650, 1200, 1800, 2000], unit: 'mg',
                 note: 'Above this, osmotic diarrhoea and GI upset become likely.' },
    vitd:      { values: [63, 75, 100, 100, 100], unit: 'ug',
                 note: 'Chronic excess causes hypercalcaemia. Essentially unreachable from food alone.' },
    vite:      { values: [200, 300, 600, 800, 1000], unit: 'mg', supplementOnly: true,
                 note: 'Applies to supplemental alpha-tocopherol; may increase bleeding risk.' },
    niacin:    { values: [10, 15, 20, 30, 35], unit: 'mg', supplementOnly: true,
                 note: 'Applies to supplements and fortified foods (flushing), not to niacin in whole food.' },
    b6:        { values: [30, 40, 60, 80, 100], unit: 'mg', supplementOnly: true,
                 note: 'Chronic high supplemental intake can cause sensory neuropathy.' },
    folate:    { values: [300, 400, 600, 800, 1000], unit: 'ug', supplementOnly: true,
                 note: 'Applies to synthetic folic acid from supplements and fortified foods only.' },
    choline:   { values: [1000, 1000, 2000, 3000, 3500], unit: 'mg',
                 note: 'Excess causes a fishy body odour, sweating and low blood pressure.' },
    calcium:   { values: [2500, 2500, 3000, 3000, 2500], unit: 'mg',
                 note: 'Drops to 2,000 mg/day at age 51 and over. Excess raises kidney-stone risk.' },
    iron:      { values: [40, 40, 40, 45, 45], unit: 'mg',
                 note: 'Acute overdose is a leading cause of poisoning in young children.' },
    magnesium: { values: [65, 110, 350, 350, 350], unit: 'mg', supplementOnly: true,
                 note: 'Applies to supplemental magnesium only. Magnesium in food has no upper limit.' },
    phosphorus:{ values: [3000, 3000, 4000, 4000, 4000], unit: 'mg',
                 note: 'Drops to 3,000 mg/day at age 71 and over.' },
    zinc:      { values: [7, 12, 23, 34, 40], unit: 'mg',
                 note: 'Chronic excess induces copper deficiency.' },
    copper:    { values: [1, 3, 5, 8, 10], unit: 'mg',
                 note: 'Excess causes liver damage.' },
    manganese: { values: [2, 3, 6, 9, 11], unit: 'mg',
                 note: 'Excess is neurotoxic; people with liver disease are more susceptible.' },
    selenium:  { values: [90, 150, 280, 400, 400], unit: 'ug',
                 note: 'Selenosis causes hair and nail loss. Two Brazil nuts can approach the adult limit, and a child’s limit is far lower.' },
    sodium:    { values: [1200, 1500, 1800, 2300, 2300], unit: 'mg',
                 note: 'This is the 2019 Chronic Disease Risk Reduction (CDRR) intake, not a classic UL: reducing intake below it is expected to lower cardiovascular risk.' }
  };

  function bandIndex(age) {
    for (var i = 0; i < BANDS.length; i++) {
      if (age >= BANDS[i].min && age <= BANDS[i].max) return i;
    }
    return age < 1 ? 0 : BANDS.length - 1;
  }

  function ulIndex(age) {
    for (var i = 0; i < UL_BANDS.length; i++) {
      if (age <= UL_BANDS[i]) return i;
    }
    return UL_BANDS.length - 1;
  }

  /** Upper limits resolved for one age. */
  function upperLimitsFor(age) {
    var idx = ulIndex(age);
    var out = {};
    Object.keys(UPPER_LIMITS).forEach(function (key) {
      var ul = UPPER_LIMITS[key];
      out[key] = {
        value: ul.values[idx], unit: ul.unit,
        supplementOnly: !!ul.supplementOnly, note: ul.note
      };
    });
    return out;
  }

  /**
   * Daily targets for one person.
   * @param {{age:number, sex:string, weightKg:number, heightCm:number, activity:number}} p
   * @returns {Object} nutrient key -> {value, unit, type, label}
   */
  function targetsFor(p) {
    var idx = bandIndex(p.age);
    var sex = p.sex === 'female' ? 'female' : 'male';
    var out = {};

    Object.keys(REFERENCE).forEach(function (key) {
      var ref = REFERENCE[key];
      out[key] = {
        label: ref.label, unit: ref.unit, type: ref.type,
        value: ref[sex][idx],
        basis: 'NASEM Food and Nutrition Board, 2019 DRI tables'
      };
    });

    // Protein is the one RDA expressed per kilogram of body weight, so it is
    // genuinely personal rather than looked up from a band. Requirements per
    // kilogram fall as growth slows.
    var perKg = p.age <= 3 ? 1.05 : (p.age <= 13 ? 0.95 : (p.age <= 18 ? 0.85 : 0.8));
    out.protein = {
      label: 'Protein', unit: 'g', type: 'RDA',
      value: Math.round(perKg * p.weightKg * 10) / 10,
      basis: perKg + ' g per kg body weight (NASEM DRI for macronutrients, 2005)'
    };

    if (p.age >= 19) {
      // The adult fibre AI is defined as 14 g per 1,000 kcal, so it tracks
      // energy needs and can be personalised.
      var energy = energyFor(p);
      out.fiber = {
        label: 'Fibre', unit: 'g', type: 'AI',
        value: Math.round(14 * energy.tdee / 1000),
        basis: '14 g per 1,000 kcal of estimated energy need (NASEM DRI, 2005)'
      };
    } else {
      out.fiber = {
        label: 'Fibre', unit: 'g', type: 'AI',
        value: FIBER_AI[sex][idx],
        basis: 'Published Adequate Intake for this age band (NASEM DRI, 2005)'
      };
    }

    return out;
  }

  /**
   * Resting and total energy expenditure.
   * BMR uses Mifflin-St Jeor, the equation that validation studies find most
   * accurate for the general population:
   *   Mifflin MD et al., Am J Clin Nutr 1990;51(2):241-7.
   *
   * It was derived and validated in adults. Children's energy needs include the
   * cost of growth and are estimated differently, so the site does not present
   * an energy figure to under-18s.
   */
  function energyFor(p) {
    var bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
    bmr += (p.sex === 'female') ? -161 : 5;
    return { bmr: Math.round(bmr), tdee: Math.round(bmr * (p.activity || 1.375)) };
  }

  function energyApplies(age) { return age >= 18; }

  // Physical activity multipliers as used with Mifflin-St Jeor.
  var ACTIVITY = [
    { value: 1.2,   label: 'Sedentary',    hint: 'Desk work, little deliberate exercise' },
    { value: 1.375, label: 'Lightly active', hint: 'Light exercise 1-3 days a week' },
    { value: 1.55,  label: 'Moderately active', hint: 'Moderate exercise 3-5 days a week' },
    { value: 1.725, label: 'Very active',  hint: 'Hard exercise 6-7 days a week' },
    { value: 1.9,   label: 'Extra active', hint: 'Physical job or twice-daily training' }
  ];

  window.DRI = {
    reference: REFERENCE,
    bands: BANDS,
    activity: ACTIVITY,
    targetsFor: targetsFor,
    energyFor: energyFor,
    energyApplies: energyApplies,
    upperLimitsFor: upperLimitsFor,
    // Adult limits, kept for callers that have no age to hand.
    upperLimits: upperLimitsFor(30)
  };
})();
