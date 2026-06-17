/**
 * GreenStep — Test Suite
 * Tests for carbon footprint calculation logic.
 *
 * How to run:
 *   In browser: open test.html in any browser, results show on page and in console.
 *   In Node.js: node test.js
 *
 * These tests validate the core emission-factor math used in greenstep.html,
 * input sanitization, grading thresholds, and edge cases (zero/negative/invalid inputs).
 */

'use strict';

// ---- Re-implementation of the core logic under test (kept in sync with greenstep.html) ----

const EF = {
  car: 0.21,
  bus: 0.089,
  flight: 90,
  electricity: 0.82,
  lpg: 14.2,
  shower: 0.035,
  laundry: 0.3,
  clothes: 0.5,
  online: 0.1,
  plastic: 0.006
};

function sanitize(val) {
  return isNaN(val) ? 0 : Math.max(0, +val);
}

function calcTransport(car, bus, flight) {
  car = sanitize(car); bus = sanitize(bus); flight = sanitize(flight);
  return car * EF.car + bus * EF.bus + (flight * EF.flight / 30);
}

function calcDiet(dietFactor, foodWasteMeals, localFoodMultiplier) {
  dietFactor = sanitize(dietFactor);
  foodWasteMeals = sanitize(foodWasteMeals);
  localFoodMultiplier = sanitize(localFoodMultiplier);
  return (dietFactor * 1000 / 365 / 1000 + foodWasteMeals * 0.025) * localFoodMultiplier;
}

function calcEnergy(elecKwh, lpgCylinders, solarMultiplier, acMultiplier) {
  elecKwh = sanitize(elecKwh); lpgCylinders = sanitize(lpgCylinders);
  solarMultiplier = sanitize(solarMultiplier); acMultiplier = sanitize(acMultiplier);
  return (elecKwh * EF.electricity / 30 + lpgCylinders * EF.lpg / 30 + acMultiplier * 0.4) * solarMultiplier;
}

function calcWater(showerMins, laundryLoads, waterHeatingFactor) {
  showerMins = sanitize(showerMins); laundryLoads = sanitize(laundryLoads); waterHeatingFactor = sanitize(waterHeatingFactor);
  return showerMins * EF.shower + laundryLoads * EF.laundry / 7 + waterHeatingFactor * 0.3;
}

function calcGrade(annualTons) {
  if (annualTons < 1.5) return 'A+';
  if (annualTons < 1.9) return 'A';
  if (annualTons < 3) return 'B';
  if (annualTons < 5) return 'C';
  return 'D';
}

function calcTreesNeeded(annualTons) {
  return Math.ceil(annualTons * 1000 / 21);
}

// ---- Minimal test runner (no external dependencies) ----

let passCount = 0;
let failCount = 0;
const results = [];

function approxEqual(a, b, tolerance) {
  tolerance = tolerance || 0.01;
  return Math.abs(a - b) <= tolerance;
}

function test(name, fn) {
  try {
    fn();
    passCount++;
    results.push({ name: name, status: 'PASS', message: '' });
  } catch (err) {
    failCount++;
    results.push({ name: name, status: 'FAIL', message: err.message });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertApprox(actual, expected, tolerance, message) {
  if (!approxEqual(actual, expected, tolerance)) {
    throw new Error(
      (message || 'Values not approximately equal') +
      ' — expected ' + expected + ', got ' + actual
    );
  }
}

// ---- Test cases ----

test('Transport: zero inputs produce zero emissions', function () {
  const result = calcTransport(0, 0, 0);
  assert(result === 0, 'Expected 0 kg CO2/day for no travel');
});

test('Transport: car-only emissions match expected factor', function () {
  // 20 km/day * 0.21 kg/km = 4.2 kg/day
  const result = calcTransport(20, 0, 0);
  assertApprox(result, 4.2, 0.01);
});

test('Transport: flight hours convert correctly to daily average', function () {
  // 30 hours/month at 90kg/hr = 2700kg/month -> /30 days = 90 kg/day
  const result = calcTransport(0, 0, 30);
  assertApprox(result, 90, 0.1);
});

test('Transport: combined car + bus + flight sums correctly', function () {
  const car = 10 * EF.car;
  const bus = 10 * EF.bus;
  const flight = (2 * EF.flight) / 30;
  const expected = car + bus + flight;
  const result = calcTransport(10, 10, 2);
  assertApprox(result, expected, 0.01);
});

test('Diet: vegan diet produces lower footprint than non-vegetarian', function () {
  const vegan = calcDiet(1.1, 0, 1);
  const nonVeg = calcDiet(3.3, 0, 1);
  assert(vegan < nonVeg, 'Vegan diet should have lower emissions than non-vegetarian');
});

test('Diet: food waste increases footprint', function () {
  const noWaste = calcDiet(1.7, 0, 1);
  const withWaste = calcDiet(1.7, 7, 1);
  assert(withWaste > noWaste, 'Food waste should increase the daily footprint');
});

test('Diet: local food multiplier reduces footprint proportionally', function () {
  const base = calcDiet(1.7, 2, 1);
  const local = calcDiet(1.7, 2, 0.55);
  assertApprox(local, base * 0.55, 0.001);
});

test('Energy: solar reduces electricity-driven emissions', function () {
  const noSolar = calcEnergy(300, 1, 1, 0.6);
  const fullSolar = calcEnergy(300, 1, 0.4, 0.6);
  assert(fullSolar < noSolar, 'Solar panels should reduce energy emissions');
});

test('Energy: zero electricity and gas with no AC gives zero', function () {
  const result = calcEnergy(0, 0, 1, 0);
  assert(result === 0, 'Expected 0 kg CO2/day for no energy usage');
});

test('Water: longer showers increase footprint', function () {
  const shortShower = calcWater(5, 0, 0);
  const longShower = calcWater(20, 0, 0);
  assert(longShower > shortShower, 'Longer showers should increase water-related emissions');
});

test('Water: solar water heater has near-zero heating factor', function () {
  const solarHeater = calcWater(0, 0, 0.1);
  const electricHeater = calcWater(0, 0, 1.2);
  assert(solarHeater < electricHeater, 'Solar water heating should emit less than electric heating');
});

test('Grading: below 1.5 tons/year gives A+ grade', function () {
  assert(calcGrade(1.2) === 'A+', 'Expected grade A+ for 1.2 tons/year');
});

test('Grading: exactly at India average (1.9) gives B (boundary check)', function () {
  // 1.9 is NOT < 1.9, so it falls into the next bracket (B, since 1.9 < 3)
  assert(calcGrade(1.9) === 'B', 'Expected grade B at the 1.9 ton boundary');
});

test('Grading: above 5 tons/year gives D grade', function () {
  assert(calcGrade(6.5) === 'D', 'Expected grade D for high emitters above 5 tons/year');
});

test('Grading: handles zero emissions without error', function () {
  assert(calcGrade(0) === 'A+', 'Zero emissions should still resolve to a valid grade (A+)');
});

test('Trees needed: scales correctly with annual tons', function () {
  // 1.9 tons * 1000 / 21 kg-per-tree-per-year ≈ 91 trees
  const trees = calcTreesNeeded(1.9);
  assert(trees === 91, 'Expected 91 trees for 1.9 tons/year, got ' + trees);
});

test('Trees needed: zero footprint requires zero trees', function () {
  assert(calcTreesNeeded(0) === 0, 'Zero footprint should require zero trees');
});

test('Sanitize: negative numbers are clamped to zero', function () {
  assert(sanitize(-50) === 0, 'Negative input should sanitize to 0');
});

test('Sanitize: non-numeric input (NaN) defaults to zero', function () {
  assert(sanitize(NaN) === 0, 'NaN input should sanitize to 0');
  assert(sanitize(undefined) === 0, 'Undefined input should sanitize to 0');
});

test('Sanitize: valid positive numbers pass through unchanged', function () {
  assert(sanitize(42) === 42, 'Valid positive number should pass through unchanged');
});

test('Edge case: extremely high inputs do not produce negative or NaN results', function () {
  const result = calcTransport(100000, 100000, 100000);
  assert(!isNaN(result) && result > 0, 'Extreme inputs should still produce a valid positive number');
});

test('Edge case: full footprint calculation never returns negative total', function () {
  const transport = calcTransport(0, 0, 0);
  const diet = calcDiet(1.1, 0, 0.55);
  const energy = calcEnergy(0, 0, 0.4, 0);
  const water = calcWater(1, 0, 0);
  const total = transport + diet + energy + water;
  assert(total >= 0, 'Total daily footprint should never be negative');
});

// ---- Output results ----

function printResults() {
  const isNode = (typeof module !== 'undefined' && module.exports);
  const lines = [];
  lines.push('GreenStep Test Suite Results');
  lines.push('='.repeat(40));
  results.forEach(function (r) {
    const icon = r.status === 'PASS' ? '✓' : '✗';
    lines.push(icon + ' ' + r.name + (r.message ? ' — ' + r.message : ''));
  });
  lines.push('='.repeat(40));
  lines.push('Total: ' + (passCount + failCount) + ' | Passed: ' + passCount + ' | Failed: ' + failCount);

  const output = lines.join('\n');
  console.log(output);

  if (typeof document !== 'undefined') {
    const el = document.getElementById('test-output');
    if (el) {
      el.textContent = output;
    }
  }

  return { passCount: passCount, failCount: failCount, total: passCount + failCount };
}

const summary = printResults();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { summary, calcTransport, calcDiet, calcEnergy, calcWater, calcGrade, calcTreesNeeded, sanitize };
}
