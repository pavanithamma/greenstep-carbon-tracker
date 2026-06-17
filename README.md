# GreenStep — Test Suite

This folder contains unit tests for the core carbon footprint calculation logic used in `greenstep.html`.

## What's tested

- **Transport calculations** — car, bus, and flight emission math, including combined totals
- **Diet calculations** — diet type factors, food waste impact, local food multiplier
- **Energy calculations** — electricity/LPG emissions, solar panel reduction, AC usage
- **Water calculations** — shower duration impact, water heating method differences
- **Grading logic** — A+ to D grade boundaries, including edge cases at exact thresholds
- **Trees-needed calculator** — offset calculation accuracy
- **Input sanitization** — negative numbers, NaN, undefined values are handled safely
- **Edge cases** — extreme inputs, zero values, ensuring no negative or invalid totals

## How to run

### In Node.js
```bash
node test.js
```

### In a browser
Open `test.html` in any browser. Results appear on the page and in the browser console (F12).

## Results

All 22 tests currently pass, covering the emission-factor math, grading thresholds, and input validation used throughout the GreenStep app.

## Why this matters

Carbon calculations need to be trustworthy — if the math is wrong, the entire app's purpose (helping people understand their real footprint) falls apart. These tests catch regressions if the formulas are ever changed during future feature development.
