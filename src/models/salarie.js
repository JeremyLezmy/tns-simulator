/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Salarié (employee) and assimilé-salarié (SASU President) contribution model.
 * VERSION COMPLÈTE ET CORRIGÉE
 */
import { val } from "../utils/dom.js";

function getPass() {
  return val("pass");
}
function getSmicHour() {
  return val("smicHour") || 11.65;
}

/**
 * Décomposition complète des cotisations – barème 2025 (identique à l'original)
 */
export function decomposeSalariatContributions(brutTotal, statut) {
  const PASS = getPass();
  const T1_LIMIT = PASS;
  const T2_LIMIT = 8 * PASS;
  const smicAnnuel = getSmicHour() * 151.67 * 12;
  const seuilMAL_AF = 2.5 * smicAnnuel;
  const seuilAF = 3.5 * smicAnnuel;

  const sal = {
    vieillesse_deplaf: 0.004 * brutTotal,
    vieillesse_plaf: 0.069 * Math.min(brutTotal, PASS),
    rc_tr1: 0.0315 * Math.min(brutTotal, T1_LIMIT),
    rc_tr2: 0.0864 * Math.max(0, Math.min(brutTotal, T2_LIMIT) - T1_LIMIT),
    ceg_tr1: 0.0086 * Math.min(brutTotal, T1_LIMIT),
    ceg_tr2: 0.0108 * Math.max(0, Math.min(brutTotal, T2_LIMIT) - T1_LIMIT),
    cet: 0.0014 * Math.max(0, brutTotal - PASS),
    apec: statut === "cadre" ? 0.00024 * Math.min(brutTotal, 4 * PASS) : 0,
    csg_imp: 0.024 * 0.9825 * brutTotal,
    csg_non_imp: 0.068 * 0.9825 * brutTotal,
    crds: 0.005 * 0.9825 * brutTotal,
  };

  const emp = {
    maladie: (brutTotal <= seuilMAL_AF ? 0.07 : 0.13) * brutTotal,
    vieillesse_deplaf: 0.0202 * brutTotal,
    vieillesse_plaf: 0.0855 * Math.min(brutTotal, PASS),
    alloc_fam: (brutTotal <= seuilAF ? 0.0345 : 0.0525) * brutTotal,
    chomage: 0.04 * Math.min(brutTotal, 4 * PASS),
    ags: 0.002 * Math.min(brutTotal, 4 * PASS),
    rc_tr1: 0.0472 * Math.min(brutTotal, T1_LIMIT),
    rc_tr2: 0.1295 * Math.max(0, Math.min(brutTotal, T2_LIMIT) - T1_LIMIT),
    ceg_tr1: 0.0129 * Math.min(brutTotal, T1_LIMIT),
    ceg_tr2: 0.0162 * Math.max(0, Math.min(brutTotal, T2_LIMIT) - T1_LIMIT),
    cet: 0.0021 * Math.max(0, brutTotal - PASS),
    prevoyance: statut === "cadre" ? 0.015 * Math.min(brutTotal, PASS) : 0,
    fnal: 0.001 * Math.min(brutTotal, PASS),
    csa: 0.003 * brutTotal,
    formation: 0.0055 * brutTotal,
    apprentissage: 0.0068 * brutTotal,
  };

  const parts = {};
  const push = (label, base, salarie, employeur) => {
    parts[label] = { base, salarie, employeur };
  };

  // Push de toutes les lignes, comme dans l'original
  push("Assurance maladie", brutTotal, 0, emp.maladie);
  push("Assurance vieillesse déplaf.", brutTotal, sal.vieillesse_deplaf, emp.vieillesse_deplaf);
  push("Assurance vieillesse plaf.", Math.min(brutTotal, PASS), sal.vieillesse_plaf, emp.vieillesse_plaf);
  push("Allocations familiales", brutTotal, 0, emp.alloc_fam);
  push("Assurance chômage", Math.min(brutTotal, 4 * PASS), 0, emp.chomage);
  push("AGS", Math.min(brutTotal, 4 * PASS), 0, emp.ags);
  push("Formation professionnelle", brutTotal, 0, emp.formation);
  push("Taxe apprentissage", brutTotal, 0, emp.apprentissage);
  push("Retraite compl. Tr. 1", Math.min(brutTotal, T1_LIMIT), sal.rc_tr1, emp.rc_tr1);
  push("Retraite compl. Tr. 2", Math.max(0, Math.min(brutTotal, T2_LIMIT) - T1_LIMIT), sal.rc_tr2, emp.rc_tr2);
  push("CEG Tr. 1", Math.min(brutTotal, T1_LIMIT), sal.ceg_tr1, emp.ceg_tr1);
  push("CEG Tr. 2", Math.max(0, Math.min(brutTotal, T2_LIMIT) - T1_LIMIT), sal.ceg_tr2, emp.ceg_tr2);
  push("CET (> PASS)", Math.max(0, brutTotal - PASS), sal.cet, emp.cet);
  if (statut === "cadre") push("Prévoyance cadres", Math.min(brutTotal, PASS), 0, emp.prevoyance);
  if (statut === "cadre") push("APEC", Math.min(brutTotal, 4 * PASS), sal.apec, 0);
  push("FNAL 0,10 %", Math.min(brutTotal, PASS), 0, emp.fnal);
  push("CSA 0,30 %", brutTotal, 0, emp.csa);
  push("CSG imposable", 0.9825 * brutTotal, sal.csg_imp, 0);
  push("CSG non-imposable", 0.9825 * brutTotal, sal.csg_non_imp, 0);
  push("CRDS", 0.9825 * brutTotal, sal.crds, 0);

  const totalSalarie = Object.values(parts).reduce((s, p) => s + p.salarie, 0);
  const totalEmployeur = Object.values(parts).reduce((s, p) => s + p.employeur, 0);

  return { breakdown: parts, totalSalarie, totalEmployeur };
}

export function decomposeSasuPresidentContributions(brutTotal) {
  const deco = decomposeSalariatContributions(brutTotal, "cadre");

  // Pour le président de SASU, on retire les charges liées au chômage
  delete deco.breakdown["Assurance chômage"];
  delete deco.breakdown["AGS"];
  // APEC et Prévoyance cadres sont maintenus (assimilé salarié cadre)

  // On recalcule les totaux après suppression
  deco.totalSalarie = Object.values(deco.breakdown).reduce((sum, p) => sum + p.salarie, 0);
  deco.totalEmployeur = Object.values(deco.breakdown).reduce((sum, p) => sum + p.employeur, 0);

  return deco;
}
