/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Micro-entreprise calculation model.
 */

export const MICRO_THRESHOLDS = {
  service: 77700,
  commerce: 188700,
  bnc: 77700,
  cipav: 77700,
};

// DONNÉES DE VENTILATION RESTAURÉES
const MICRO_SOCIAL_WEIGHTS_BY_ACTIVITY = {
  commerce: { maladie: 0.089, invalidite: 0.031, retBase: 0.418, retCompl: 0.165, csg: 0.297 },
  service: { maladie: 0.089, invalidite: 0.031, retBase: 0.418, retCompl: 0.165, csg: 0.297 },
  bnc: { maladie: 0.03, invalidite: 0.0325, retBase: 0.4485, retCompl: 0.177, csg: 0.312 },
  cipav: {
    maladie: 0.093,
    prestations_maladie: 0.009,
    invalidite: 0.014,
    vieillesse_base_1: 0.2345,
    vieillesse_base_2: 0.0535,
    vieillesse_compl: 0.256,
    csg: 0.34,
  },
};

const MICRO_BASE_RATES = {
  commerce: 0.212,
  service: 0.212,
  bnc: 0.261,
  cipav: 0.232,
};

const MICRO_CFP_RATES = {
  commerce: 0.001,
  service: 0.003,
  bnc: 0.002,
  cipav: 0.002,
};

export function getMicroRates(activity) {
  return {
    base: MICRO_BASE_RATES[activity] || MICRO_BASE_RATES.service,
    cfp: MICRO_CFP_RATES[activity] || MICRO_CFP_RATES.service,
  };
}

// FONCTION HELPER RESTAURÉE
export function getAbatementRate(activity) {
  switch (activity) {
    case "commerce":
      return 0.71;
    case "service": // BIC Prestations de services
      return 0.5;
    case "bnc":
    case "cipav":
    default:
      return 0.34;
  }
}

export function getSocialWeights(activity) {
  return MICRO_SOCIAL_WEIGHTS_BY_ACTIVITY[activity] || MICRO_SOCIAL_WEIGHTS_BY_ACTIVITY.service;
}

export function calculateMicro(ca, activity, acreOn) {
  const { base, cfp } = getMicroRates(activity);
  const socialRate = acreOn ? base / 2 : base;
  const totalRate = socialRate + cfp;

  const cotisations = ca * totalRate;
  const remuneration = ca - cotisations;
  const abatement = getAbatementRate(activity);
  const baseImposable = ca * (1 - abatement);

  return {
    cotisations,
    remuneration,
    baseImposable,
    totalRate,
  };
}
