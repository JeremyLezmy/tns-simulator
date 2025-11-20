/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Controller for the multi-year projection table.
 * VERSION COMPLÈTE ET REFACTORISÉE AVEC COLONNES DÉTAILLÉES PAR MODE
 */
import { val } from "../utils/dom.js";
import { fmtEUR } from "../utils/format.js";
import { appState } from "../state.js";
import { solveForR } from "../models/tns.js";
import { calculateSasuIr } from "../models/sasuIR.js";
import { calculateSasuIs, minSalaryFor4Quarters } from "../models/sasuIS.js";
import { calculateMicro, getMicroRates, MICRO_THRESHOLDS, getAbatementRate } from "../models/micro.js";
import { decomposeSalariatContributions } from "../models/salarie.js";
import { calculateHouseholdIr } from "../models/ir.js";
import { handleIrCalculation } from "./irController.js";
import { handleTnsCalculation } from "./tnsController.js";
import { handleSasuIrCalculation } from "./sasuIRController.js";
import { handleSisuCalculation } from "./sasuISController.js";
import { handleMicroCalculation } from "./microController.js";
import { handleSalarieCalculation, getSalaireAnnuel } from "./salarieController.js";

function getOtherDeclarantContribution(baseKey = "d1") {
  if (appState.household.status === "single") return { rni: 0, encaissements: 0 };
  const otherKey = baseKey === "d1" ? "d2" : "d1";
  const dec = appState.declarants[otherKey];
  if (!dec) return { rni: 0, encaissements: 0 };

  const inputs = dec.inputs?.ir || {};
  const chargesDeduct = Number(inputs.chargesDeduct) || 0;
  const deductCsgOn = inputs.deductCsg === "1";
  let rni = 0;
  let enc = 0;

  switch (dec.mode) {
    case "tns": {
      const A = dec.computed?.tns?.A || 0;
      const R = dec.computed?.tns?.R || 0;
      const dedCsg = deductCsgOn && A > 0 ? 0.068 * A : 0;
      rni = Math.max(0, R * 0.9 - dedCsg);
      enc = R;
      break;
    }
    case "sasuIR": {
      const data = dec.computed?.sasuIr || {};
      rni = (data.salImp || 0) + (data.bnc || 0);
      enc = data.encaissements || 0;
      break;
    }
    case "sasuIS": {
      const data = dec.computed?.sasuIs || {};
      rni = (data.salBrut || 0) * 0.9 + (data.divIrBase || 0);
      enc = data.encaissements || 0;
      break;
    }
    case "micro": {
      const data = dec.computed?.micro || {};
      rni = data.baseImposable || 0;
      enc = data.remuneration || 0;
      break;
    }
    case "salarie": {
      const data = dec.computed?.salarie || {};
      rni = (data.brutTotal || 0) * 0.9;
      enc = data.netAvantIR || 0;
      break;
    }
    default:
      break;
  }

  return { rni: rni - chargesDeduct, encaissements: enc - chargesDeduct };
}

function getSpouseDataForYear(yearIndex) {
  // Nouvel écran foyer : on ne modélise plus un conjoint micro par défaut, la 2e personne est saisie via l’onglet Déclarant 2.
  return { spouseCash: 0, baseSpouse: 0 };
}
// ===================================================================================
// ==  HELPER FUNCTIONS (Construction de l'UI de la table)
// ===================================================================================

function buildProjHeader(mode, scope, showWarning) {
  let headers = [];
  // Ces en-têtes sont maintenant une copie exacte de votre code original
  if (scope === "foyer") {
    headers = ["Année", "PASS", "RNI foyer", "IR", "Net foyer mens.", "Net foyer"];
    if (showWarning) headers.push("Warning micro");
  } else
    switch (mode) {
    case "tns":
      headers = ["Année", "PASS", "CA", "R", "Cotis.", "RNI", "IR", "Net mens.", "Net"];
      break;
    case "sasuIR":
      headers = ["Année", "PASS", "Salaire", "Bénéfices", "PS", "RNI", "IR", "Net mens.", "Net"];
      break;
    case "sasuIS":
      headers = [
        "Année",
        "PASS",
        "SMIC h.",
        "Mode",
        "CA",
        "Salaire brut",
        "Dividendes bruts",
        "Dividendes nets",
        "Mode div.",
        "Cotis/IS/PS",
        "RNI",
        "IR",
        "Net mens.",
        "Net",
      ];
      break;
    case "micro":
      headers = ["Année", "PASS", "CA", "Cotisations", "RNI", "IR", "Net mens.", "Net", "Warning micro"];
      break;
    case "salarie":
      headers = [
        "Année",
        "PASS",
        "SMIC h.",
        "Mode",
        "Salaire brut",
        "Super brut",
        "Charges salariales",
        "Net avant IR",
        "Cotis. patronales",
        "RNI",
        "IR",
        "Net mens.",
        "Net",
      ];
      break;
  }
  const ths = headers
    .map((h) => `<th class="num">${h}</th>`)
    .join("")
    .replace(/class="num">(Année|Mode|Mode div\.|Warning micro)/g, ">$1");
  document.getElementById("projHeaderRow").innerHTML = ths;
}

function buildSummaryFooter(sums, mode) {
  const tfoot = document.getElementById("projFooter");
  let cells = "";
  if (mode === "foyer") {
    cells = `<td>Total / Moyenne</td><td class="num">–</td><td class="num">${fmtEUR(sums.rni)}</td><td class="num">${fmtEUR(
      sums.ir
    )}</td><td></td><td class="num">${fmtEUR(sums.net)}</td>${sums.warning ? "<td></td>" : ""}`;
  } else
    switch (mode) {
    case "salarie":
      // CORRECTION : La structure a 13 cellules et utilise les bonnes sommes
      cells = `<td>Total / Moyenne</td><td class="num">–</td><td class="num">–</td><td></td><td class="num">${fmtEUR(
        sums.r
      )}</td><td class="num">–</td><td class="num">–</td><td class="num">${fmtEUR(sums.netAvantIr)}</td><td class="num">${fmtEUR(
        sums.cot
      )}</td><td class="num">${fmtEUR(sums.rni)}</td><td class="num">${fmtEUR(sums.ir)}</td><td></td><td class="num">${fmtEUR(sums.net)}</td>`;
      break;
    case "tns":
      cells = `<td>Total / Moyenne</td><td class="num">–</td><td class="num">${fmtEUR(sums.ca)}</td><td class="num">${fmtEUR(
        sums.r
      )}</td><td class="num">${fmtEUR(sums.cot)}</td><td class="num">${fmtEUR(sums.rni)}</td><td class="num">${fmtEUR(
        sums.ir
      )}</td><td></td><td class="num">${fmtEUR(sums.net)}</td>`;
      break;
    case "sasuIR":
      cells = `<td>Total / Moyenne</td><td class="num">–</td><td class="num">${fmtEUR(sums.r)}</td><td class="num">${fmtEUR(
        sums.bnc
      )}</td><td class="num">${fmtEUR(sums.cot)}</td><td class="num">${fmtEUR(sums.rni)}</td><td class="num">${fmtEUR(
        sums.ir
      )}</td><td></td><td class="num">${fmtEUR(sums.net)}</td>`;
      break;
    case "sasuIS":
      cells = `<td>Total / Moyenne</td><td class="num">–</td><td class="num">–</td><td></td><td class="num">${fmtEUR(
        sums.ca
      )}</td><td class="num">${fmtEUR(sums.r)}</td><td class="num">${fmtEUR(sums.divBrut)}</td><td class="num">${fmtEUR(
        sums.divNet
      )}</td><td >–</td><td class="num">${fmtEUR(sums.cot)}</td><td class="num">${fmtEUR(sums.rni)}</td><td class="num">${fmtEUR(
        sums.ir
      )}</td><td></td><td class="num">${fmtEUR(sums.net)}</td>`;
      break;
    case "micro":
      cells = `<td>Total / Moyenne</td><td class="num">–</td><td class="num">${fmtEUR(sums.ca)}</td><td class="num">${fmtEUR(
        sums.cot
      )}</td><td class="num">${fmtEUR(sums.rni)}</td><td class="num">${fmtEUR(sums.ir)}</td><td></td><td class="num">${fmtEUR(
        sums.net
      )}</td><td></td>`;
      break;
  }
  tfoot.innerHTML = `<tr class="summary">${cells}</tr>`;
}
// ===================================================================================
// ==  SOUS-FONCTIONS DE CALCUL (une par mode)
// ===================================================================================

function projectTnsYear(i, p, extra, foyerScope = false, warning = "") {
  const ca = val("ca") * Math.pow(1 + val("caGrow") / 100, i);
  const dispo = ca * (1 - val("chargesPct") / 100) - val("chargesFixes");
  const res = solveForR(dispo, p.pass, val("cfp"), document.getElementById("includeCsg").value === "1");
  const dedCsg = document.getElementById("deductCsg").value === "1" ? 0.068 * res.cot.A : 0;

  const encaissements = res.R;
  const rni_perso = res.R * 0.9 - dedCsg;
  const totalCot = res.cot.total;
  const { RNI, totalIR, net } = calculateFinals(
    rni_perso,
    p.spouse.baseSpouse,
    encaissements,
    p.spouse.spouseCash,
    p.parts,
    p.inflationIndex,
    i === 0,
    extra,
    foyerScope
  );

  let rowData, sumsToAdd;
  if (foyerScope) {
    rowData = [p.year, p.pass, RNI, totalIR, net / 12, net];
    if (warning) rowData.push(warning);
    sumsToAdd = { rni: RNI, ir: totalIR, net, warning: warning ? 1 : 0 };
  } else {
    rowData = [p.year, p.pass, ca, res.R, totalCot, RNI, totalIR, net / 12, net];
    sumsToAdd = { ca, r: res.R, cot: totalCot, net, rni: RNI, ir: totalIR };
  }
  return { rowData, sumsToAdd, rowClass: "" };
}

function projectSasuIrYear(i, p, extra, foyerScope = false, warning = "") {
  const salaire = val("sasuSalaire") * Math.pow(1 + val("sasuSalaireGrow") / 100, i);
  const bnc = val("sasuBnc") * Math.pow(1 + val("sasuBncGrow") / 100, i);
  const res = calculateSasuIr(salaire, bnc, val("psRate"));

  const encaissements = res.encaissements;
  const rni_perso = res.rni;
  const { RNI, totalIR, net } = calculateFinals(
    rni_perso,
    p.spouse.baseSpouse,
    encaissements,
    p.spouse.spouseCash,
    p.parts,
    p.inflationIndex,
    i === 0,
    extra,
    foyerScope
  );

  let rowData, sumsToAdd;
  if (foyerScope) {
    rowData = [p.year, p.pass, RNI, totalIR, net / 12, net];
    if (warning) rowData.push(warning);
    sumsToAdd = { rni: RNI, ir: totalIR, net, warning: warning ? 1 : 0 };
  } else {
    rowData = [p.year, p.pass, salaire, bnc, res.psDue, RNI, totalIR, net / 12, net];
    sumsToAdd = { r: salaire, bnc, cot: res.psDue, net, rni: RNI, ir: totalIR };
  }
  return { rowData, sumsToAdd, rowClass: "" };
}

function projectSasuIsYear(i, p, extra, foyerScope = false, warning = "") {
  const ca = val("sisuCA") * Math.pow(1 + val("sisuCAGrow") / 100, i);
  const salMode = document.getElementById("sisuSalaryMode").value;
  const divMode = document.getElementById("divMode").value;
  const salBrut = salMode === "min4q" ? minSalaryFor4Quarters(p.smic) : val("sisuSalaire");
  const res = calculateSasuIs(
    ca,
    val("sisuChargesPct"),
    val("sisuChargesFix"),
    salBrut,
    val("isRedThr"),
    val("isRate") / 100,
    val("distRate"),
    divMode
  );

  const encaissements = res.encaissements;
  // LA CORRECTION EST ICI : Ajout de "const"
  const rni_perso = salBrut * 0.9 + res.divIrBase;
  const { RNI, totalIR, net } = calculateFinals(
    rni_perso,
    p.spouse.baseSpouse,
    encaissements,
    p.spouse.spouseCash,
    p.parts,
    p.inflationIndex,
    i === 0,
    extra,
    foyerScope
  );

  let rowData, sumsToAdd;
  if (foyerScope) {
    rowData = [p.year, p.pass, RNI, totalIR, net / 12, net];
    if (warning) rowData.push(warning);
    sumsToAdd = { rni: RNI, ir: totalIR, net, warning: warning ? 1 : 0 };
  } else {
    rowData = [
      p.year,
      p.pass,
      p.smic,
      "SASU-IS",
      ca,
      salBrut,
      res.divBrut,
      res.divNet,
      divMode === "pfu" ? "PFU" : "Barème",
      res.totalTaxes,
      RNI,
      totalIR,
      net / 12,
      net,
    ];
    sumsToAdd = { ca, r: salBrut, divBrut: res.divBrut, divNet: res.divNet, cot: res.totalTaxes, net, rni: RNI, ir: totalIR };
  }
  return { rowData, sumsToAdd, rowClass: "" };
}

function projectMicroYear(i, p, consecutiveExceeds, extra, decLabel = "", foyerScope = false, warningFoyer = "") {
  const ca = val("microCA") * Math.pow(1 + val("microGrow") / 100, i);
  const activity = document.getElementById("microActivity").value;
  const acreOn = i === 0 && document.getElementById("microACRE").checked;
  const res = calculateMicro(ca, activity, acreOn);

  const encaissements = res.remuneration;
  const rni_perso = res.baseImposable;
  const { RNI, totalIR, net } = calculateFinals(
    rni_perso,
    p.spouse.baseSpouse,
    encaissements,
    p.spouse.spouseCash,
    p.parts,
    p.inflationIndex,
    i === 0,
    extra,
    foyerScope
  );

  const threshold = MICRO_THRESHOLDS[activity] || 0;
  let warningText = foyerScope && warningFoyer ? warningFoyer : decLabel ? `[${decLabel}] ✅ OK` : "✅ OK";

  // ✅ NOUVELLE PARTIE : On détermine une classe CSS en fonction du statut
  let rowClass = ""; // Par défaut, aucune classe spéciale

  if (consecutiveExceeds >= 1 && consecutiveExceeds < 3) {
    warningText = decLabel ? `[${decLabel}] ⚠️ Sortie imminente` : "⚠️ Sortie imminente";
    rowClass = "proj-warning-imminent"; // Classe pour le surlignage jaune
  } else if (ca > threshold) {
    warningText = decLabel ? `[${decLabel}] ❌ Dépassement` : "❌ Dépassement";
    rowClass = "proj-warning-exceeded"; // Classe pour le surlignage rouge
  }

  let rowData, sumsToAdd;
  if (foyerScope) {
    rowData = [p.year, p.pass, RNI, totalIR, net / 12, net];
    if (warningText) rowData.push(warningText);
    sumsToAdd = { rni: RNI, ir: totalIR, net };
  } else {
    rowData = [p.year, p.pass, ca, res.cotisations, RNI, totalIR, net / 12, net, warningText];
    sumsToAdd = { ca, cot: res.cotisations, net, rni: RNI, ir: totalIR };
  }

  // On retourne maintenant la donnée ET la classe
  return { rowData, sumsToAdd, rowClass };
}

function projectSalarieYear(i, p, extra, foyerScope = false, warning = "") {
  const salaireAnnuel = getSalaireAnnuel() * Math.pow(1 + val("salaireGrow") / 100, i);
  const deco = decomposeSalariatContributions(salaireAnnuel, document.getElementById("statutSal").value);
  const netAvantIr = salaireAnnuel - deco.totalSalarie;
  const superBrut = salaireAnnuel + deco.totalEmployeur;

  const encaissements = netAvantIr;
  const rni_perso = salaireAnnuel * 0.9;
  const { RNI, totalIR, net } = calculateFinals(
    rni_perso,
    p.spouse.baseSpouse,
    encaissements,
    p.spouse.spouseCash,
    p.parts,
    p.inflationIndex,
    i === 0,
    extra,
    foyerScope
  );

  // CORRECTION : Le tableau de données contient maintenant les 13 colonnes
  let rowData, sumsToAdd;
  if (foyerScope) {
    rowData = [p.year, p.pass, RNI, totalIR, net / 12, net];
    rowData.push(warning || "");
    sumsToAdd = { rni: RNI, ir: totalIR, net, warning: warning ? 1 : 0 };
  } else {
    rowData = [
      p.year,
      p.pass,
      p.smic,
      "Salariat",
      salaireAnnuel, // Salaire brut
      superBrut, // Super brut
      deco.totalSalarie, // Charges salariales
      netAvantIr, // Net avant IR
      deco.totalEmployeur, // Cotis. patronales
      RNI, // RNI foyer
      totalIR, // IR
      net / 12, // Net foyer mens.
      net, // Net foyer
    ];
    sumsToAdd = { r: salaireAnnuel, netAvantIr, cot: deco.totalEmployeur, rni: RNI, ir: totalIR, net };
  }
  return { rowData, sumsToAdd, rowClass: "" };
}
// ===================================================================================
// ==  MASTER FUNCTION
// ===================================================================================

export function handleProjection() {
  const scope = appState.projectionScope || "foyer";
  const baseKey = scope === "d2" ? "d2" : scope === "d1" ? "d1" : appState.activeDeclarant || "d1";
  const includeOther = scope === "foyer" && appState.household.status !== "single";
  const dec = appState.declarants[baseKey];
  if (dec) {
    document.getElementById("modeSel").value = dec.mode;
  }
  const mode = document.getElementById("modeSel").value;
  const microPresent =
    (appState.declarants.d1?.mode === "micro") || (appState.household.status !== "single" && appState.declarants.d2?.mode === "micro");
  buildProjHeader(mode, scope, microPresent);

  // 1. Rafraîchir les calculs de l'année 1 pour que l'état global soit à jour
  switch (mode) {
    case "tns":
      handleTnsCalculation(false);
      break;
    case "sasuIR":
      handleSasuIrCalculation(false);
      break;
    case "sasuIS":
      handleSisuCalculation(false);
      break;
    case "micro":
      handleMicroCalculation(false);
      break;
    case "salarie":
      handleSalarieCalculation(false);
      break;
  }
  handleIrCalculation(false);

  // 2. Obtenir les paramètres initiaux
  const startYear = val("startYear");
  const years = val("years");
  const y1_pass = val("pass");
  const passGrow = val("passGrow") / 100;
  const y1_smic = val("smicHour");
  const smicGrow = val("smicGrow") / 100;

  const tbody = document.getElementById("tblProj");
  tbody.innerHTML = "";

  const sums = { ca: 0, r: 0, bnc: 0, cot: 0, net: 0, divBrut: 0, divNet: 0, netAvantIr: 0, rni: 0, ir: 0, warning: microPresent && scope === "foyer" ? 1 : 0 };
  let consecutiveExceeds = 0;
  const extra = includeOther ? getOtherDeclarantContribution(baseKey) : { rni: 0, encaissements: 0 };
  const decLabel = baseKey === "d2" ? "D2" : "D1";
  const includeWarning = scope === "foyer" && microPresent;
  const warningFoyer =
    includeWarning && mode !== "micro"
      ? baseKey === "d1"
        ? "[D2] ⚠️ Micro"
        : "[D1] ⚠️ Micro"
      : "";
  const isFoyer = scope === "foyer";

  // 3. Boucler sur chaque année
  for (let i = 0; i < years; i++) {
    const commonParams = {
      year: startYear + i,
      pass: y1_pass * Math.pow(1 + passGrow, i),
      smic: y1_smic * Math.pow(1 + smicGrow, i),
      spouse: getSpouseDataForYear(i),
      parts: val("parts"),
      inflationIndex: (val("inflation") / 100) * i,
    };

    let result;
    switch (mode) {
      case "tns":
        result = projectTnsYear(i, commonParams, extra, isFoyer, warningFoyer);
        break;
      case "sasuIR":
        result = projectSasuIrYear(i, commonParams, extra, isFoyer, warningFoyer);
        break;
      case "sasuIS":
        result = projectSasuIsYear(i, commonParams, extra, isFoyer, warningFoyer);
        break;
      case "micro":
        const ca_current = val("microCA") * Math.pow(1 + val("microGrow") / 100, i);
        const threshold = MICRO_THRESHOLDS[document.getElementById("microActivity").value] || 0;
        consecutiveExceeds = ca_current > threshold ? consecutiveExceeds + 1 : 0;
        result = projectMicroYear(i, commonParams, consecutiveExceeds, extra, decLabel, isFoyer, warningFoyer);
        break;
      case "salarie":
        result = projectSalarieYear(i, commonParams, extra, isFoyer, warningFoyer);
        break;
      default:
        result = { rowData: [], sumsToAdd: {} };
    }

    // Mettre à jour les totaux
    for (const key in result.sumsToAdd) {
      if (sums.hasOwnProperty(key)) {
        sums[key] += result.sumsToAdd[key];
      }
    }

  // Afficher la ligne
  const rowHtml = result.rowData
    .map((d, index) => {
      if (typeof d === "string") return `<td>${d}</td>`; // Pour "Mode", "Mode div.", "Statut Seuil"
      if (index === 0) return `<td>${Math.round(d)}</td>`; // Année
      return `<td class="num">${fmtEUR(d)}</td>`;
    })
    .join("");
    const classAttr = result.rowClass ? `class="${result.rowClass}"` : "";
    tbody.innerHTML += `<tr ${classAttr}>${rowHtml}</tr>`;
  }

  // 4. Construire le pied de page avec les totaux
  buildSummaryFooter(sums, scope === "foyer" ? "foyer" : mode);
}

// Helper pour calculer RNI/IR/Net et gérer la cohérence avec l'année 1
function calculateFinals(
  rni_perso,
  baseSpouse,
  encaissements,
  spouseCash,
  parts,
  inflationIndex,
  isFirstYear,
  extra = { rni: 0, encaissements: 0 },
  useHouseholdOverride = false
) {
  let RNI = Math.max(0, rni_perso + baseSpouse + (extra.rni || 0));
  const irResult = calculateHouseholdIr(0, RNI, 0, 0, 0, parts, inflationIndex);
  let totalIR = irResult.totalIR;
  let net = encaissements + spouseCash + (extra.encaissements || 0) - totalIR;

  // Pour la première année, on utilise les valeurs exactes du panneau IR seulement pour la vue foyer
  if (isFirstYear && useHouseholdOverride) {
    RNI = appState.ir.RNI;
    totalIR = appState.ir.IR;
    net = appState.ir.net;
  }
  return { RNI, totalIR, net };
}
