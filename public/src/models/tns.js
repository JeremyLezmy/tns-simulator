/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * TNS (Travailleur Non Salarié) calculation model.
 */

function calculateTnsContributions(R, PASS, CFP = 0) {
  const A = 0.74 * R;
  const A_pass = Math.min(A, PASS);

  const maladie = 0.085 * Math.min(A, 3 * PASS);
  const ij = 0.005 * Math.min(A, 5 * PASS);
  const retBase = 0.1775 * A_pass + 0.0072 * Math.min(Math.max(A - PASS, 0), 4 * PASS);
  const rci = 0.081 * A_pass + 0.091 * Math.min(Math.max(A - PASS, 0), 3 * PASS);
  const id = 0.013 * A_pass;

  let af = 0;
  if (A > 1.4 * PASS) {
    af = 0.031 * A;
  } else if (A > 1.1 * PASS) {
    const rate = ((A - 1.1 * PASS) / (0.3 * PASS)) * 0.031;
    af = rate * A;
  }

  const cotSansCSG = maladie + ij + retBase + rci + id + af + CFP;
  const csg = 0.097 * A;

  return { A, maladie, ij, retBase, rci, id, af, cotSansCSG, csg, total: cotSansCSG + csg };
}

export function solveForR(dispo, PASS, CFP, includeCsg) {
  if (dispo <= 0) {
    return { R: 0, cot: calculateTnsContributions(0, PASS, CFP) };
  }

  let lo = 0,
    hi = dispo;
  let R = 0,
    cot = {};

  for (let i = 0; i < 50; i++) {
    // Iterative solver
    const mid = (lo + hi) / 2;
    cot = calculateTnsContributions(mid, PASS, CFP);
    const totalContributions = includeCsg ? cot.total : cot.cotSansCSG;
    const needed = mid + totalContributions;

    if (Math.abs(needed - dispo) < 0.5) {
      R = mid;
      break;
    }
    if (needed > dispo) {
      hi = mid;
    } else {
      lo = mid;
    }
    R = mid;
  }

  cot = calculateTnsContributions(R, PASS, CFP);
  return { R, cot };
}
