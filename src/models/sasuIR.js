/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * SASU à l'IR calculation model.
 */

export function calculateSasuIr(salaire, bnc, psRate) {
  const salImp = 0.9 * salaire;
  const psDue = psRate * bnc;
  const rni = salImp + bnc;

  return {
    salaire,
    bnc,
    salImp,
    psDue,
    rni,
    encaissements: salaire + bnc,
  };
}
