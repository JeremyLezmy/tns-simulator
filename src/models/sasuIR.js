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
    // Les prélèvements sociaux sur la quote-part impactent le cash perçu
    // (mais n'affectent pas la base imposable IR dans ce mode).
    encaissements: salaire + bnc - psDue,
  };
}
