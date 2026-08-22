// The user's personal details, and the maths that turns them into daily targets.
// Everything lives in localStorage on this device; nothing is sent anywhere.

(function () {
  'use strict';

  var KEY = 'fim.profile.v1';
  var listeners = [];
  var current = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var p = JSON.parse(raw);
      return valid(p) ? p : null;
    } catch (e) {
      return null;
    }
  }

  function valid(p) {
    return p && typeof p.age === 'number' && p.age > 0 && p.age < 120 &&
      typeof p.weightKg === 'number' && p.weightKg > 0 &&
      typeof p.heightCm === 'number' && p.heightCm > 0 &&
      (p.sex === 'male' || p.sex === 'female');
  }

  function save(p) {
    if (!valid(p)) return false;
    current = p;
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* private mode */ }
    listeners.forEach(function (fn) { fn(current); });
    return true;
  }

  function clear() {
    current = null;
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    listeners.forEach(function (fn) { fn(null); });
  }

  function get() { return current; }
  function onChange(fn) { listeners.push(fn); }

  /**
   * Daily targets for the stored profile, or null if none is set.
   * Falls through to DRI.targetsFor, which does the actual reference lookup.
   */
  function targets() {
    return current ? window.DRI.targetsFor(current) : null;
  }

  function energy() {
    return current ? window.DRI.energyFor(current) : null;
  }

  // Body mass index, shown alongside the plain caution that it is a population
  // screening tool and says nothing about any individual's body composition.
  function bmi() {
    if (!current) return null;
    var m = current.heightCm / 100;
    return Math.round((current.weightKg / (m * m)) * 10) / 10;
  }

  // Unit helpers, so the form can accept imperial input.
  function lbToKg(lb) { return lb * 0.45359237; }
  function kgToLb(kg) { return kg / 0.45359237; }
  function inToCm(inch) { return inch * 2.54; }
  function cmToIn(cm) { return cm / 2.54; }

  window.Profile = {
    get: get, save: save, clear: clear, onChange: onChange,
    targets: targets, energy: energy, bmi: bmi, valid: valid,
    lbToKg: lbToKg, kgToLb: kgToLb, inToCm: inToCm, cmToIn: cmToIn
  };
})();
