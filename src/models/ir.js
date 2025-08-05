/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Impôt sur le Revenu (IR) calculation model.
 */

export function computeTaxFromBareme(baseParPart, inflationPct = 0) {
  const factor = 1 + inflationPct / 100;
  const steps = [
    { from: 0, to: 11497 * factor, rate: 0.0 },
    { from: 11497 * factor, to: 29315 * factor, rate: 0.11 },
    { from: 29315 * factor, to: 83823 * factor, rate: 0.3 },
    { from: 83823 * factor, to: 180294 * factor, rate: 0.41 },
    { from: 180294 * factor, to: Infinity, rate: 0.45 },
  ];

  let tax = 0,
    tmi = 0,
    taxedBase = 0;
  const slices = [];

  for (const step of steps) {
    const baseInSlice = Math.max(0, Math.min(baseParPart, step.to) - step.from);
    if (baseInSlice > 0) {
      const taxInSlice = baseInSlice * step.rate;
      slices.push({ base: baseInSlice, rate: step.rate, tax: taxInSlice });
      tax += taxInSlice;
      taxedBase += baseInSlice;
      tmi = step.rate;
      if (baseParPart <= step.to) break;
    }
  }
  return { tax, tmiRate: tmi, slices, taxedBase, steps };
}

export function calculateHouseholdIr(rSal, rBnc, rDivIR, baseSpouse, dedCsg, parts, inflationPct) {
  const RNI = Math.max(0, rSal + rBnc + rDivIR + baseSpouse - dedCsg);
  const baseParPart = RNI / parts;
  const irResult = computeTaxFromBareme(baseParPart, inflationPct);
  const totalIR = irResult.tax * parts;

  return { RNI, totalIR, tmi: irResult.tmiRate, irResult };
}
