// Dietary Reference Intakes (DRIs) from the National Academies of Sciences,
// Engineering, and Medicine — Food and Nutrition Board. Values transcribed from
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

(function () {
  'use strict';

  // Life-stage bands. `min`/`max` are ages in years, inclusive.
  var BANDS = [
    { id: '9-13', min: 9, max: 13 },
    { id: '14-18', min: 14, max: 18 },
    { id: '19-30', min: 19, max: 30 },
    { id: '31-50', min: 31, max: 50 },
    { id: '51-70', min: 51, max: 70 },
    { id: '70+', min: 71, max: 130 }
  ];

  // For each nutrient: display label, unit, the kind of value (RDA or AI), and
  // per-sex values indexed by the bands above in order.
  //                                        9-13  14-18 19-30 31-50 51-70  70+
  var REFERENCE = {
    vita:        { label: 'Vitamin A',          unit: 'ug', type: 'RDA',
                   male:   [600,  900,  900,  900,  900,  900],
                   female: [600,  700,  700,  700,  700,  700] },
    vitc:        { label: 'Vitamin C',          unit: 'mg', type: 'RDA',
                   male:   [45,   75,   90,   90,   90,   90],
                   female: [45,   65,   75,   75,   75,   75] },
    vitd:        { label: 'Vitamin D',          unit: 'ug', type: 'RDA',
                   male:   [15,   15,   15,   15,   15,   20],
                   female: [15,   15,   15,   15,   15,   20] },
    vite:        { label: 'Vitamin E',          unit: 'mg', type: 'RDA',
                   male:   [11,   15,   15,   15,   15,   15],
                   female: [11,   15,   15,   15,   15,   15] },
    vitk:        { label: 'Vitamin K',          unit: 'ug', type: 'AI',
                   male:   [60,   75,   120,  120,  120,  120],
                   female: [60,   75,   90,   90,   90,   90] },
    thiamin:     { label: 'Thiamin (B1)',       unit: 'mg', type: 'RDA',
                   male:   [0.9,  1.2,  1.2,  1.2,  1.2,  1.2],
                   female: [0.9,  1.0,  1.1,  1.1,  1.1,  1.1] },
    riboflavin:  { label: 'Riboflavin (B2)',    unit: 'mg', type: 'RDA',
                   male:   [0.9,  1.3,  1.3,  1.3,  1.3,  1.3],
                   female: [0.9,  1.0,  1.1,  1.1,  1.1,  1.1] },
    niacin:      { label: 'Niacin (B3)',        unit: 'mg', type: 'RDA',
                   male:   [12,   16,   16,   16,   16,   16],
                   female: [12,   14,   14,   14,   14,   14] },
    pantothenic: { label: 'Pantothenic acid',   unit: 'mg', type: 'AI',
                   male:   [4,    5,    5,    5,    5,    5],
                   female: [4,    5,    5,    5,    5,    5] },
    b6:          { label: 'Vitamin B6',         unit: 'mg', type: 'RDA',
                   male:   [1.0,  1.3,  1.3,  1.3,  1.7,  1.7],
                   female: [1.0,  1.2,  1.3,  1.3,  1.5,  1.5] },
    folate:      { label: 'Folate',             unit: 'ug', type: 'RDA',
                   male:   [300,  400,  400,  400,  400,  400],
                   female: [300,  400,  400,  400,  400,  400] },
    b12:         { label: 'Vitamin B12',        unit: 'ug', type: 'RDA',
                   male:   [1.8,  2.4,  2.4,  2.4,  2.4,  2.4],
                   female: [1.8,  2.4,  2.4,  2.4,  2.4,  2.4] },
    choline:     { label: 'Choline',            unit: 'mg', type: 'AI',
                   male:   [375,  550,  550,  550,  550,  550],
                   female: [375,  400,  425,  425,  425,  425] },
    calcium:     { label: 'Calcium',            unit: 'mg', type: 'RDA',
                   male:   [1300, 1300, 1000, 1000, 1000, 1200],
                   female: [1300, 1300, 1000, 1000, 1200, 1200] },
    iron:        { label: 'Iron',               unit: 'mg', type: 'RDA',
                   male:   [8,    11,   8,    8,    8,    8],
                   female: [8,    15,   18,   18,   8,    8] },
    magnesium:   { label: 'Magnesium',          unit: 'mg', type: 'RDA',
                   male:   [240,  410,  400,  420,  420,  420],
                   female: [240,  360,  310,  320,  320,  320] },
    phosphorus:  { label: 'Phosphorus',         unit: 'mg', type: 'RDA',
                   male:   [1250, 1250, 700,  700,  700,  700],
                   female: [1250, 1250, 700,  700,  700,  700] },
    potassium:   { label: 'Potassium',          unit: 'mg', type: 'AI',
                   male:   [2500, 3000, 3400, 3400, 3400, 3400],
                   female: [2300, 2300, 2600, 2600, 2600, 2600] },
    zinc:        { label: 'Zinc',               unit: 'mg', type: 'RDA',
                   male:   [8,    11,   11,   11,   11,   11],
                   female: [8,    9,    8,    8,    8,    8] },
    copper:      { label: 'Copper',             unit: 'mg', type: 'RDA',
                   male:   [0.7,  0.89, 0.9,  0.9,  0.9,  0.9],
                   female: [0.7,  0.89, 0.9,  0.9,  0.9,  0.9] },
    manganese:   { label: 'Manganese',          unit: 'mg', type: 'AI',
                   male:   [1.9,  2.2,  2.3,  2.3,  2.3,  2.3],
                   female: [1.6,  1.6,  1.8,  1.8,  1.8,  1.8] },
    selenium:    { label: 'Selenium',           unit: 'ug', type: 'RDA',
                   male:   [40,   55,   55,   55,   55,   55],
                   female: [40,   55,   55,   55,   55,   55] },
    ala:         { label: 'Omega-3 (ALA)',      unit: 'g',  type: 'AI',
                   male:   [1.2,  1.6,  1.6,  1.6,  1.6,  1.6],
                   female: [1.0,  1.1,  1.1,  1.1,  1.1,  1.1] },
    la:          { label: 'Omega-6 (linoleic)', unit: 'g',  type: 'AI',
                   male:   [12,   16,   17,   17,   14,   14],
                   female: [10,   11,   12,   12,   11,   11] }
  };

  // Tolerable Upper Intake Levels for adults 19+. Entries flagged
  // `supplementOnly` have a UL that the Food and Nutrition Board applies to
  // supplements and fortified foods only — it says nothing about the amount in
  // whole food, so the food pages must not warn on them. Brazil nuts carry more
  // than the magnesium UL per 100 g and that is simply not a finding.
  var UPPER_LIMITS = {
    vita:      { value: 3000, unit: 'ug', supplementOnly: true, note: 'Applies to preformed vitamin A (retinol) only. Carotenoids from plants are not included and are not known to cause toxicity.' },
    vitc:      { value: 2000, unit: 'mg', note: 'Above this, osmotic diarrhoea and GI upset become likely.' },
    vitd:      { value: 100,  unit: 'ug', note: 'Chronic excess causes hypercalcaemia. Essentially unreachable from food alone.' },
    vite:      { value: 1000, unit: 'mg', supplementOnly: true, note: 'Applies to supplemental alpha-tocopherol; may increase bleeding risk.' },
    niacin:    { value: 35,   unit: 'mg', supplementOnly: true, note: 'Applies to supplements and fortified foods (flushing), not to niacin in whole food.' },
    b6:        { value: 100,  unit: 'mg', supplementOnly: true, note: 'Chronic high supplemental intake can cause sensory neuropathy.' },
    folate:    { value: 1000, unit: 'ug', supplementOnly: true, note: 'Applies to synthetic folic acid from supplements and fortified foods only.' },
    choline:   { value: 3500, unit: 'mg', note: 'Excess causes a fishy body odour, sweating and low blood pressure.' },
    calcium:   { value: 2500, unit: 'mg', note: 'Drops to 2,000 mg/day at age 51 and over. Excess raises kidney-stone risk.' },
    iron:      { value: 45,   unit: 'mg', note: 'Acute overdose is a leading cause of poisoning in young children.' },
    magnesium: { value: 350,  unit: 'mg', supplementOnly: true, note: 'Applies to supplemental magnesium only. Magnesium in food has no upper limit.' },
    phosphorus:{ value: 4000, unit: 'mg', note: 'Drops to 3,000 mg/day at age 71 and over.' },
    zinc:      { value: 40,   unit: 'mg', note: 'Chronic excess induces copper deficiency.' },
    copper:    { value: 10,   unit: 'mg', note: 'Excess causes liver damage.' },
    manganese: { value: 11,   unit: 'mg', note: 'Excess is neurotoxic; people with liver disease are more susceptible.' },
    selenium:  { value: 400,  unit: 'ug', note: 'Selenosis causes hair and nail loss. Two Brazil nuts can approach this.' },
    sodium:    { value: 2300, unit: 'mg', note: 'This is the 2019 Chronic Disease Risk Reduction (CDRR) intake, not a classic UL: reducing intake below it is expected to lower cardiovascular risk.' }
  };

  function bandIndex(age) {
    for (var i = 0; i < BANDS.length; i++) {
      if (age >= BANDS[i].min && age <= BANDS[i].max) return i;
    }
    return age < 9 ? 0 : BANDS.length - 1;
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
    // genuinely personal rather than looked up from a band.
    var perKg = p.age <= 13 ? 0.95 : (p.age <= 18 ? 0.85 : 0.8);
    out.protein = {
      label: 'Protein', unit: 'g', type: 'RDA',
      value: Math.round(perKg * p.weightKg * 10) / 10,
      basis: perKg + ' g per kg body weight (NASEM DRI for macronutrients, 2005)'
    };

    // Fibre's AI is defined as 14 g per 1,000 kcal, so it tracks energy needs.
    var energy = energyFor(p);
    out.fiber = {
      label: 'Fibre', unit: 'g', type: 'AI',
      value: Math.round(14 * energy.tdee / 1000),
      basis: '14 g per 1,000 kcal of estimated energy need (NASEM DRI, 2005)'
    };

    return out;
  }

  /**
   * Resting and total energy expenditure.
   * BMR uses Mifflin-St Jeor, the equation that validation studies find most
   * accurate for the general population:
   *   Mifflin MD et al., Am J Clin Nutr 1990;51(2):241-7.
   */
  function energyFor(p) {
    var bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
    bmr += (p.sex === 'female') ? -161 : 5;
    return { bmr: Math.round(bmr), tdee: Math.round(bmr * (p.activity || 1.375)) };
  }

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
    upperLimits: UPPER_LIMITS,
    bands: BANDS,
    activity: ACTIVITY,
    targetsFor: targetsFor,
    energyFor: energyFor
  };
})();
