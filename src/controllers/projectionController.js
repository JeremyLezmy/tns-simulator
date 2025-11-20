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

function getSpouseDataForYear(yearIndex) {
  if (document.getElementById("cashOpts").value !== "you_plus_spouse") {
    return { spouseCash: 0, baseSpouse: 0 };
  }
  const caSpouseY1 = val("caSpouse");
  const growth = val("growth") / 100;
  const caSpouse = caSpouseY1 * Math.pow(1 + growth, yearIndex);
  const activity = document.getElementById("spouseActivity").value;
  const acreOn = yearIndex === 0 && document.getElementById("spouseACRE").checked;

  const { base, cfp } = getMicroRates(activity);
  const socialRate = acreOn ? base / 2 : base;
  const totalRate = socialRate + cfp;

  const abatement = getAbatementRate(activity);

  return {
    spouseCash: caSpouse - caSpouse * totalRate,
    baseSpouse: caSpouse * (1 - abatement),
  };
}
// ===================================================================================
// ==  HELPER FUNCTIONS (Construction de l'UI de la table)
// ===================================================================================

function buildProjHeader(mode) {
  let headers = [];
  // Ces en-têtes sont maintenant une copie exacte de votre code original
  switch (mode) {
    case "tns":
      headers = ["Année", "PASS", "CA", "R", "Cotis.", "RNI foyer", "IR", "Net foyer mens.", "Net foyer"];
      break;
    case "sasuIR":
      headers = ["Année", "PASS", "Salaire", "Bénéfices", "PS", "RNI foyer", "IR", "Net foyer mens.", "Net foyer"];
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
        "RNI foyer",
        "IR",
        "Net foyer mens.",
        "Net foyer",
      ];
      break;
    case "micro":
      headers = ["Année", "PASS", "CA", "Cotisations", "RNI foyer", "IR", "Net foyer mens.", "Net foyer", "Warning micro"];
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
        "RNI foyer",
        "IR",
        "Net foyer mens.",
        "Net foyer",
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
  // Cette logique est maintenant une copie exacte de votre code original
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

function projectTnsYear(i, p) {
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
    i === 0
  );

  const rowData = [p.year, p.pass, ca, res.R, totalCot, RNI, totalIR, net / 12, net];
  const sumsToAdd = { ca, r: res.R, cot: totalCot, net };
  return { rowData, sumsToAdd, rowClass: "" };
}

function projectSasuIrYear(i, p) {
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
    i === 0
  );

  const rowData = [p.year, p.pass, salaire, bnc, res.psDue, RNI, totalIR, net / 12, net];
  const sumsToAdd = { r: salaire, bnc, cot: res.psDue, net };
  return { rowData, sumsToAdd, rowClass: "" };
}

function projectSasuIsYear(i, p) {
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
    i === 0
  );

  const rowData = [
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
  const sumsToAdd = { ca, r: salBrut, divBrut: res.divBrut, divNet: res.divNet, cot: res.totalTaxes, net };
  return { rowData, sumsToAdd, rowClass: "" };
}

function projectMicroYear(i, p, consecutiveExceeds) {
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
    i === 0
  );

  const threshold = MICRO_THRESHOLDS[activity] || 0;
  let warningText = "✅ OK";

  // ✅ NOUVELLE PARTIE : On détermine une classe CSS en fonction du statut
  let rowClass = ""; // Par défaut, aucune classe spéciale

  if (consecutiveExceeds >= 1 && consecutiveExceeds < 3) {
    warningText = "⚠️ Sortie imminente";
    rowClass = "proj-warning-imminent"; // Classe pour le surlignage jaune
  } else if (ca > threshold) {
    warningText = "❌ Dépassement";
    rowClass = "proj-warning-exceeded"; // Classe pour le surlignage rouge
  }

  const rowData = [p.year, p.pass, ca, res.cotisations, RNI, totalIR, net / 12, net, warningText];
  const sumsToAdd = { ca, cot: res.cotisations, net };

  // On retourne maintenant la donnée ET la classe
  return { rowData, sumsToAdd, rowClass };
}

function projectSalarieYear(i, p) {
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
    i === 0
  );

  // CORRECTION : Le tableau de données contient maintenant les 13 colonnes
  const rowData = [
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

  const sumsToAdd = { r: salaireAnnuel, netAvantIr, cot: deco.totalEmployeur, rni: RNI, ir: totalIR, net };
  return { rowData, sumsToAdd, rowClass: "" };
}
// ===================================================================================
// ==  MASTER FUNCTION
// ===================================================================================

export function handleProjection() {
  const mode = document.getElementById("modeSel").value;
  buildProjHeader(mode);

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

  const sums = { ca: 0, r: 0, bnc: 0, cot: 0, net: 0, divBrut: 0, divNet: 0, netAvantIr: 0 };
  let consecutiveExceeds = 0;

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
        result = projectTnsYear(i, commonParams);
        break;
      case "sasuIR":
        result = projectSasuIrYear(i, commonParams);
        break;
      case "sasuIS":
        result = projectSasuIsYear(i, commonParams);
        break;
      case "micro":
        const ca_current = val("microCA") * Math.pow(1 + val("microGrow") / 100, i);
        const threshold = MICRO_THRESHOLDS[document.getElementById("microActivity").value] || 0;
        consecutiveExceeds = ca_current > threshold ? consecutiveExceeds + 1 : 0;
        result = projectMicroYear(i, commonParams, consecutiveExceeds);
        break;
      case "salarie":
        result = projectSalarieYear(i, commonParams);
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
  buildSummaryFooter(sums, mode);
}

// Helper pour calculer RNI/IR/Net et gérer la cohérence avec l'année 1
function calculateFinals(rni_perso, baseSpouse, encaissements, spouseCash, parts, inflationIndex, isFirstYear) {
  let RNI = Math.max(0, rni_perso + baseSpouse);
  const irResult = calculateHouseholdIr(0, RNI, 0, 0, 0, parts, inflationIndex);
  let totalIR = irResult.totalIR;
  let net = encaissements + spouseCash - totalIR;

  // Pour la première année, on utilise les valeurs exactes du panneau IR pour une cohérence parfaite
  if (isFirstYear) {
    RNI = appState.ir.RNI;
    totalIR = appState.ir.IR;
    net = appState.ir.net;
  }
  return { RNI, totalIR, net };
}
