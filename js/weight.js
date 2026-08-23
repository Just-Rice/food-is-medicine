// Weight-change arithmetic, and the safety checks that matter more than it.
//
// The energy maths here is deliberately simple and deliberately caveated. The
// familiar "3,500 kcal is a pound" rule (Wishnofsky, 1958) is a reasonable guide
// to the *initial* daily adjustment, but it is wrong over months: as you lose
// weight you become smaller and your energy expenditure falls, so a fixed
// deficit produces a curve that flattens, not a straight line. Hall and
// colleagues quantified this — roughly every 10 kcal/day of sustained change
// eventually yields about 0.5 kg, reached over years rather than weeks.
//
// So this module reports the initial adjustment and an estimate of time to
// goal, and says plainly that real loss runs slower than the straight-line
// figure. It never presents a diet plan.

(function () {
  'use strict';

  var KCAL_PER_KG = 7700;   // ~3,500 kcal per pound

  // WHO adult BMI cut-offs.
  var BMI_BANDS = [
    { max: 16,   id: 'severe',      label: 'Severely underweight' },
    { max: 18.5, id: 'underweight', label: 'Underweight' },
    { max: 25,   id: 'healthy',     label: 'Healthy weight' },
    { max: 30,   id: 'overweight',  label: 'Overweight' },
    { max: 999,  id: 'obese',       label: 'Obese' }
  ];

  // Intake floors below which weight loss should be medically supervised.
  // These are the long-standing clinical thresholds used for outpatient advice.
  var FLOOR = { female: 1200, male: 1500 };

  function bmiFor(weightKg, heightCm) {
    var m = heightCm / 100;
    return weightKg / (m * m);
  }

  function bmiBand(bmi) {
    for (var i = 0; i < BMI_BANDS.length; i++) {
      if (bmi < BMI_BANDS[i].max) return BMI_BANDS[i];
    }
    return BMI_BANDS[BMI_BANDS.length - 1];
  }

  // Weight range corresponding to a healthy BMI at this height.
  function healthyRange(heightCm) {
    var m = heightCm / 100;
    return { min: 18.5 * m * m, max: 24.9 * m * m };
  }

  /**
   * @param {Object} profile  from Profile.get()
   * @param {Object} plan     {goal:'lose'|'gain'|'maintain', targetKg:number, rateKgWeek:number}
   * @returns {Object} numbers plus a list of warnings, most severe first.
   */
  function calculate(profile, plan) {
    var energy = window.DRI.energyFor(profile);
    var tdee = energy.tdee;
    var currentBmi = bmiFor(profile.weightKg, profile.heightCm);
    var band = bmiBand(currentBmi);
    var range = healthyRange(profile.heightCm);

    var result = {
      tdee: tdee,
      bmr: energy.bmr,
      currentBmi: Math.round(currentBmi * 10) / 10,
      band: band,
      healthyMin: Math.round(range.min * 10) / 10,
      healthyMax: Math.round(range.max * 10) / 10,
      warnings: [],
      blocked: false
    };

    if (plan.goal === 'maintain') {
      result.dailyAdjust = 0;
      result.targetIntake = tdee;
      result.weeklyChange = 0;
      result.weeks = null;
      result.targetBmi = result.currentBmi;
      addUniversalWarnings(result, profile);
      return result;
    }

    var direction = plan.goal === 'lose' ? -1 : 1;
    var rate = Math.abs(plan.rateKgWeek || 0.5) * direction;   // kg per week
    var targetKg = plan.targetKg;
    var deltaKg = targetKg - profile.weightKg;

    result.targetBmi = Math.round(bmiFor(targetKg, profile.heightCm) * 10) / 10;
    result.weeklyChange = rate;
    result.dailyAdjust = Math.round((rate * KCAL_PER_KG) / 7);
    result.targetIntake = Math.round(tdee + result.dailyAdjust);
    result.weeks = (rate !== 0 && deltaKg !== 0 && (deltaKg / rate) > 0)
      ? Math.ceil(deltaKg / rate) : null;
    result.deltaKg = Math.round(deltaKg * 10) / 10;

    // ---- safety checks, ordered most serious first ----------------------

    if (profile.age < 18) {
      result.warnings.push({
        level: 'danger',
        title: 'These numbers do not apply under 18',
        body: 'Children and adolescents are still growing, and adult BMI categories do not ' +
              'apply to them — paediatric assessment uses age-and-sex percentile charts ' +
              'instead. Deliberate calorie restriction during growth can affect height, bone ' +
              'density and puberty. Please talk to a doctor rather than using this page.'
      });
      result.blocked = true;
    }

    if (plan.goal === 'lose' && currentBmi < 18.5) {
      result.warnings.push({
        level: 'danger',
        title: 'You are already below a healthy weight for your height',
        body: 'Your BMI of ' + result.currentBmi + ' falls in the ' + band.label.toLowerCase() +
              ' range, and losing more weight would be actively harmful — being underweight ' +
              'carries risks to bone density, immune function, fertility and heart rhythm. ' +
              'This site will not calculate a deficit for you. If you feel a strong need to ' +
              'lose weight despite being underweight, that feeling is itself worth talking to ' +
              'a doctor about; it is a common and very treatable experience.'
      });
      result.blocked = true;
    }

    if (plan.goal === 'lose' && result.targetBmi < 18.5 && currentBmi >= 18.5) {
      result.warnings.push({
        level: 'danger',
        title: 'Your target weight is below the healthy range',
        body: 'A weight of ' + fmt(targetKg) + ' kg would put your BMI at ' + result.targetBmi +
              ', below the 18.5 threshold. A healthy weight for your height runs from about ' +
              result.healthyMin + ' to ' + result.healthyMax + ' kg. Consider setting a target ' +
              'inside that range and speaking to a clinician before going lower.'
      });
      result.blocked = true;
    }

    if (!result.blocked && plan.goal === 'lose') {
      var floor = FLOOR[profile.sex] || 1200;
      if (result.targetIntake < floor) {
        result.warnings.push({
          level: 'danger',
          title: 'That rate would put you below a safe intake',
          body: 'Reaching ' + fmt(Math.abs(rate)) + ' kg a week would mean eating about ' +
                result.targetIntake + ' kcal a day. Sustained intakes below roughly ' + floor +
                ' kcal make it very hard to meet your requirements for protein, calcium, iron ' +
                'and the B vitamins, and diets at that level are normally run under medical ' +
                'supervision. Choose a slower rate.'
        });
        result.blocked = true;
      } else if (result.targetIntake < result.bmr) {
        result.warnings.push({
          level: 'warn',
          title: 'This target is below your resting energy expenditure',
          body: 'Eating below the energy your body uses at complete rest (' + result.bmr +
                ' kcal) is possible but hard to sustain, and tends to cost muscle as well as ' +
                'fat. Keeping protein high and doing some resistance exercise mitigates that.'
        });
      }
    }

    if (Math.abs(rate) > profile.weightKg * 0.01) {
      result.warnings.push({
        level: 'warn',
        title: 'That is faster than the usual recommendation',
        body: 'Guidance generally puts sustainable change at about 0.25–1 kg a week, or under ' +
              '1% of body weight. Faster loss increases the share that comes from muscle ' +
              'rather than fat, and raises the risk of gallstones.'
      });
    }

    if (plan.goal === 'gain' && result.targetBmi > 30 && currentBmi <= 30) {
      result.warnings.push({
        level: 'warn',
        title: 'Your target crosses into the obese BMI range',
        body: 'BMI is a crude measure and says nothing about body composition — if you are ' +
              'gaining deliberately through resistance training, it will misclassify added ' +
              'muscle as excess weight. Worth being aware of rather than alarmed by.'
      });
    }

    addUniversalWarnings(result, profile);
    return result;
  }

  function addUniversalWarnings(result, profile) {
    result.warnings.push({
      level: 'info',
      title: 'Why real loss runs slower than this figure',
      body: 'The 7,700 kcal per kilogram rule assumes your energy expenditure stays put. It ' +
            'does not: as you get lighter you burn less, so a fixed deficit shrinks in effect ' +
            'and the curve flattens. Expect the early weeks to track this estimate and later ' +
            'months to fall behind it. The NIH Body Weight Planner models the curve properly ' +
            'if you want a realistic projection.'
    });
    result.warnings.push({
      level: 'info',
      title: 'On BMI',
      body: 'BMI was built to describe populations, not individuals. It cannot tell muscle ' +
            'from fat and routinely misclassifies muscular, very tall and very short people. ' +
            'Treat every BMI figure on this page as one crude number among many.'
    });
  }

  function fmt(v) {
    return String(Math.round(v * 10) / 10);
  }

  window.WeightPlan = {
    calculate: calculate,
    bmiFor: bmiFor,
    bmiBand: bmiBand,
    healthyRange: healthyRange,
    KCAL_PER_KG: KCAL_PER_KG,
    BMI_BANDS: BMI_BANDS
  };
})();
