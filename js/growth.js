// BMI-for-age percentiles for children and adolescents, from the CDC growth
// charts in data/growth.js.
//
// This exists because adult BMI categories are simply wrong for anyone under
// 20. A healthy BMI changes month by month through growth: 17 is entirely
// normal for a six-year-old and underweight for a sixteen-year-old. Applying
// the adult 18.5 threshold to a child misclassifies them routinely, which is
// why paediatric practice uses percentiles against age and sex instead.
//
// The CDC categories used below are:
//   under the 5th percentile   - underweight
//   5th to under 85th          - healthy weight
//   85th to under 95th         - overweight
//   95th and above             - obesity
//
// The site shows a percentile for context. It does not calculate a calorie
// deficit for anyone under 18, following the American Academy of Pediatrics,
// whose 2016 clinical report (reaffirmed 2022) advises against dieting and
// against weight-focused talk with adolescents entirely.

(function () {
  'use strict';

  var LMS = window.GROWTH_LMS || { male: [], female: [] };

  var BANDS = [
    { max: 5,   id: 'underweight', label: 'Underweight for age' },
    { max: 85,  id: 'healthy',     label: 'Healthy weight for age' },
    { max: 95,  id: 'overweight',  label: 'Overweight for age' },
    { max: 101, id: 'obese',       label: 'Obesity range for age' }
  ];

  // Abramowitz & Stegun 26.2.17 -- accurate to about 7.5e-8, far beyond what a
  // displayed percentile needs, and avoids pulling in a stats library.
  function normalCdf(z) {
    var b1 = 0.319381530, b2 = -0.356563782, b3 = 1.781477937,
        b4 = -1.821255978, b5 = 1.330274429, p = 0.2316419,
        c = 0.39894228;
    if (z >= 0) {
      var t = 1 / (1 + p * z);
      return 1 - c * Math.exp(-z * z / 2) * t *
        (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
    }
    var t2 = 1 / (1 - p * z);
    return c * Math.exp(-z * z / 2) * t2 *
      (t2 * (t2 * (t2 * (t2 * b5 + b4) + b3) + b2) + b1);
  }

  // Linear interpolation between the two nearest monthly rows.
  function lmsFor(sex, ageMonths) {
    var rows = LMS[sex === 'female' ? 'female' : 'male'];
    if (!rows || !rows.length) return null;
    if (ageMonths <= rows[0][0]) return rows[0].slice(1);
    if (ageMonths >= rows[rows.length - 1][0]) return rows[rows.length - 1].slice(1);
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] >= ageMonths) {
        var a = rows[i - 1], b = rows[i];
        var f = (ageMonths - a[0]) / (b[0] - a[0]);
        return [a[1] + f * (b[1] - a[1]),
                a[2] + f * (b[2] - a[2]),
                a[3] + f * (b[3] - a[3])];
      }
    }
    return null;
  }

  /**
   * BMI-for-age percentile.
   * @param {number} bmi
   * @param {number} ageYears  2 to 20; outside that range this returns null
   * @param {string} sex
   * @returns {{percentile:number, z:number, band:Object, median:number}|null}
   */
  function percentile(bmi, ageYears, sex) {
    // Use the middle of the year, since the site only collects whole years.
    var ageMonths = ageYears * 12 + 6;
    if (ageMonths < 24 || ageMonths > 240) return null;
    var lms = lmsFor(sex, ageMonths);
    if (!lms) return null;

    var L = lms[0], M = lms[1], S = lms[2];
    var z = (Math.abs(L) < 1e-7)
      ? Math.log(bmi / M) / S
      : (Math.pow(bmi / M, L) - 1) / (L * S);

    var pct = normalCdf(z) * 100;
    var band = BANDS[BANDS.length - 1];
    for (var i = 0; i < BANDS.length; i++) {
      if (pct < BANDS[i].max) { band = BANDS[i]; break; }
    }
    return {
      percentile: Math.round(pct * 10) / 10,
      z: Math.round(z * 100) / 100,
      band: band,
      median: Math.round(M * 10) / 10
    };
  }

  function applies(ageYears) {
    return ageYears >= 2 && ageYears < 20;
  }

  window.Growth = {
    percentile: percentile,
    applies: applies,
    BANDS: BANDS
  };
})();
