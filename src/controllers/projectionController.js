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
import { calculateMicro, MICRO_THRESHOLDS } from "../models/micro.js";
import { decomposeSalariatContributions } from "../models/salarie.js";
import { calculateHouseholdIr } from "../models/ir.js";
import { handleIrCalculation } from "./irController.js";
import { handleTnsCalculation } from "./tnsController.js";
import { handleSasuIrCalculation } from "./sasuIRController.js";
import { handleSisuCalculation } from "./sasuISController.js";
import { handleMicroCalculation } from "./microController.js";
import { handleSalarieCalculation } from "./salarieController.js";

// ===================================================================================
// ==  HELPER FUNCTIONS (Data Extraction & Calculation)
// ===================================================================================

function getInputs(dec, mode, isActive) {
  const inputs = {};
  const read = (key, def = 0) => {
    if (isActive) return val(key);
    const valStr = dec.inputs[mode]?.[key];
    return valStr !== undefined && valStr !== "" ? parseFloat(valStr) : def;
  };
  const readBool = (key, def = false) => {
    if (isActive) return document.getElementById(key)?.value === "1" || document.getElementById(key)?.checked;
    const valStr = dec.inputs[mode]?.[key];
    // Checkbox stored as boolean, Select stored as "1"/"0"
    if (typeof valStr === "boolean") return valStr;
    return valStr === "1" || valStr === "true";
  };
  const readStr = (key, def = "") => {
    if (isActive) return document.getElementById(key)?.value || def;
    return dec.inputs[mode]?.[key] || def;
  };

  // Common IR inputs (always read from active DOM if isActive, or dec.inputs.ir)
  const readIr = (key, def = 0) => {
    if (isActive) return val(key);
    const valStr = dec.inputs.ir?.[key];
    return valStr !== undefined && valStr !== "" ? parseFloat(valStr) : def;
  };
  const readIrBool = (key) => {
    if (isActive) return document.getElementById(key)?.value === "1";
    return dec.inputs.ir?.[key] === "1";
  };

  inputs.chargesDeduct = readIr("chargesDeduct");
  inputs.deductCsg = readIrBool("deductCsg");

  switch (mode) {
    case "tns":
      inputs.ca = read("ca");
      inputs.caGrow = read("caGrow");
      inputs.chargesPct = read("chargesPct");
      inputs.chargesFixes = read("chargesFixes");
      inputs.includeCsg = readBool("includeCsg");
      inputs.cfp = val("cfp"); // Global param
      break;
    case "sasuIR":
      inputs.salaire = read("sasuSalaire");
      inputs.salaireGrow = read("sasuSalaireGrow");
      inputs.bnc = read("sasuBnc");
      inputs.bncGrow = read("sasuBncGrow");
      inputs.psRate = read("psRate", 0.097);
      break;
    case "sasuIS":
      inputs.ca = read("sisuCA");
      inputs.caGrow = read("sisuCAGrow");
      inputs.chargesPct = read("sisuChargesPct");
      inputs.chargesFix = read("sisuChargesFix");
      inputs.salMode = readStr("sisuSalaryMode", "min4q");
      inputs.salaire = read("sisuSalaire");
      inputs.isRedThr = read("isRedThr");
      inputs.isRate = read("isRate");
      inputs.distRate = read("distRate");
      inputs.divMode = readStr("divMode", "pfu");
      break;
    case "micro":
      inputs.ca = read("microCA");
      inputs.grow = read("microGrow");
      inputs.activity = readStr("microActivity", "bnc");
      inputs.acre = readBool("microACRE");
      break;
    case "salarie":
      inputs.salaireBrut = read("salaireBrut");
      inputs.salaireGrow = read("salaireGrow");
      inputs.statut = readStr("statutSal", "noncadre");
      inputs.modeSaisie = readStr("salaireMode", "annuel");
      break;
  }
  return inputs;
}

function calculateDeclarantProjection(dec, yearIndex, commonParams, state, isActive) {
  const mode = dec.mode;
  const inputs = getInputs(dec, mode, isActive);
  const res = {
    rni: 0,
    encaissements: 0,
    cot: 0,
    net: 0,
    warning: "",
    warningClass: "",
    details: {}, // For mode-specific columns
  };

  // Apply deductions (charges déductibles)
  const chargesDeduct = inputs.chargesDeduct || 0;

  switch (mode) {
    case "tns": {
      const ca = inputs.ca * Math.pow(1 + inputs.caGrow / 100, yearIndex);
      const dispo = ca * (1 - inputs.chargesPct / 100) - inputs.chargesFixes;
      const tnsRes = solveForR(dispo, commonParams.pass, inputs.cfp, inputs.includeCsg);
      const dedCsg = inputs.deductCsg && tnsRes.cot.A > 0 ? 0.068 * tnsRes.cot.A : 0;

      res.rni = Math.max(0, tnsRes.R * 0.9 - dedCsg);
      res.encaissements = tnsRes.R;
      res.cot = tnsRes.cot.total;
      res.details = { ca, r: tnsRes.R, cot: res.cot };
      break;
    }
    case "sasuIR": {
      const salaire = inputs.salaire * Math.pow(1 + inputs.salaireGrow / 100, yearIndex);
      const bnc = inputs.bnc * Math.pow(1 + inputs.bncGrow / 100, yearIndex);
      const irRes = calculateSasuIr(salaire, bnc, inputs.psRate);

      res.rni = irRes.rni;
      res.encaissements = irRes.encaissements;
      res.cot = irRes.psDue;
      res.details = { salaire, bnc, cot: res.cot };
      break;
    }
    case "sasuIS": {
      const ca = inputs.ca * Math.pow(1 + inputs.caGrow / 100, yearIndex);
      const salBrut = inputs.salMode === "min4q" ? minSalaryFor4Quarters(commonParams.smic) : inputs.salaire;
      const isRes = calculateSasuIs(
        ca,
        inputs.chargesPct,
        inputs.chargesFix,
        salBrut,
        inputs.isRedThr,
        inputs.isRate / 100,
        inputs.distRate,
        inputs.divMode
      );

      res.rni = salBrut * 0.9 + isRes.divIrBase;
      res.encaissements = isRes.encaissements;
      res.cot = isRes.totalTaxes;
      res.details = {
        ca,
        salBrut,
        divBrut: isRes.divBrut,
        divNet: isRes.divNet,
        divMode: inputs.divMode,
        cot: res.cot,
      };
      break;
    }
    case "micro": {
      const ca = inputs.ca * Math.pow(1 + inputs.grow / 100, yearIndex);
      const acreOn = yearIndex === 0 && inputs.acre;
      const microRes = calculateMicro(ca, inputs.activity, acreOn);

      res.rni = microRes.baseImposable;
      res.encaissements = microRes.remuneration;
      res.cot = microRes.cotisations;

      // Warning logic
      const threshold = MICRO_THRESHOLDS[inputs.activity] || 0;
      if (ca > threshold) {
        state.consecutiveExceeds++;
      } else {
        state.consecutiveExceeds = 0;
      }

      if (state.consecutiveExceeds >= 1 && state.consecutiveExceeds < 3) {
        res.warning = "⚠️ Sortie imminente";
        res.warningClass = "proj-warning-imminent";
      } else if (ca > threshold) {
        res.warning = "❌ Dépassement";
        res.warningClass = "proj-warning-exceeded";
      } else {
        res.warning = "✅ OK";
      }
      res.details = { ca, cot: res.cot };
      break;
    }
    case "salarie": {
      let salaireAnnuel = inputs.salaireBrut;
      if (inputs.modeSaisie === "mensuel") salaireAnnuel *= 12;
      salaireAnnuel *= Math.pow(1 + inputs.salaireGrow / 100, yearIndex);

      const deco = decomposeSalariatContributions(salaireAnnuel, inputs.statut);
      const netAvantIr = salaireAnnuel - deco.totalSalarie;
      const superBrut = salaireAnnuel + deco.totalEmployeur;

      res.rni = salaireAnnuel * 0.9;
      res.encaissements = netAvantIr;
      res.cot = deco.totalEmployeur;
      res.details = {
        salaireBrut: salaireAnnuel,
        superBrut,
        chargesSal: deco.totalSalarie,
        netAvantIr,
        cot: res.cot,
      };
      break;
    }
  }

  // Deduct charges from RNI and Encaissements
  res.rni = Math.max(0, res.rni - chargesDeduct);
  res.encaissements = Math.max(0, res.encaissements - chargesDeduct);

  return res;
}

// ===================================================================================
// ==  UI BUILDERS
// ===================================================================================

function buildProjHeader(mode, scope, showWarning) {
  let headers = [];
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
        cells = `<td>Total / Moyenne</td><td class="num">–</td><td class="num">–</td><td></td><td class="num">${fmtEUR(
          sums.r
        )}</td><td class="num">–</td><td class="num">–</td><td class="num">${fmtEUR(sums.netAvantIr)}</td><td class="num">${fmtEUR(
          sums.cot
        )}</td><td class="num">${fmtEUR(sums.rni)}</td><td class="num">${fmtEUR(sums.ir)}</td><td></td><td class="num">${fmtEUR(
          sums.net
        )}</td>`;
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
// ==  MASTER FUNCTION
// ===================================================================================

function getSpouseDataForYear(yearIndex) {
  return { spouseCash: 0, baseSpouse: 0 };
}

export function handleProjection() {
  const scope = appState.projectionScope || "foyer";
  const baseKey = scope === "d2" ? "d2" : scope === "d1" ? "d1" : appState.activeDeclarant || "d1";
  const includeOther = scope === "foyer" && appState.household.status !== "single";
  const dec = appState.declarants[baseKey];
  const mode = dec ? dec.mode : "tns";
  const microPresent =
    appState.declarants.d1?.mode === "micro" ||
    (appState.household.status !== "single" && appState.declarants.d2?.mode === "micro");

  buildProjHeader(mode, scope, microPresent);

  // 1. Refresh calculations for year 1
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

  // 2. Init Params
  const startYear = val("startYear");
  const years = val("years");
  const y1_pass = val("pass");
  const passGrow = val("passGrow") / 100;
  const y1_smic = val("smicHour");
  const smicGrow = val("smicGrow") / 100;

  const tbody = document.getElementById("tblProj");
  tbody.innerHTML = "";

  const sums = {
    ca: 0,
    r: 0,
    bnc: 0,
    cot: 0,
    net: 0,
    divBrut: 0,
    divNet: 0,
    netAvantIr: 0,
    rni: 0,
    ir: 0,
    warning: microPresent && scope === "foyer" ? 1 : 0,
  };

  // State for consecutive exceeds (Micro)
  const d1State = { consecutiveExceeds: 0 };
  const d2State = { consecutiveExceeds: 0 };

  // 3. Loop Years
  for (let i = 0; i < years; i++) {
    const commonParams = {
      year: startYear + i,
      pass: y1_pass * Math.pow(1 + passGrow, i),
      smic: y1_smic * Math.pow(1 + smicGrow, i),
      spouse: getSpouseDataForYear(i),
      parts: val("parts"),
      inflationIndex: (val("inflation") / 100) * i,
    };

    // Calculate Base Declarant
    const isActiveBase = baseKey === (appState.activeDeclarant || "d1");
    const resBase = calculateDeclarantProjection(dec, i, commonParams, baseKey === "d1" ? d1State : d2State, isActiveBase);

    // Calculate Other Declarant (if Foyer)
    let resOther = { rni: 0, encaissements: 0, warning: "", warningClass: "" };
    if (includeOther) {
      const otherKey = baseKey === "d1" ? "d2" : "d1";
      const otherDec = appState.declarants[otherKey];
      const isActiveOther = otherKey === (appState.activeDeclarant || "d1");
      resOther = calculateDeclarantProjection(otherDec, i, commonParams, otherKey === "d1" ? d1State : d2State, isActiveOther);
    }

    // Combine RNI & Encaissements
    const totalRNI = resBase.rni + resOther.rni;
    const totalEnc = resBase.encaissements + resOther.encaissements;

    // Calculate IR & Net Foyer
    const irResult = calculateHouseholdIr(0, totalRNI, 0, 0, 0, commonParams.parts, commonParams.inflationIndex);
    let totalIR = irResult.totalIR;
    let netFoyer = totalEnc - totalIR;

    // Override Year 1 with exact values if needed (optional, but keeps consistency with main panel)
    if (i === 0 && scope === "foyer") {
      // We can use appState.ir values if we trust them to be up to date
      // But our calculation above should be accurate enough.
    }

    // Prepare Row Data
    let rowData = [];
    let rowClass = resBase.warningClass || resOther.warningClass || "";

    if (scope === "foyer") {
      rowData = [commonParams.year, commonParams.pass, totalRNI, totalIR, netFoyer / 12, netFoyer];
      if (microPresent) {
        const w1 = resBase.warning && resBase.warning !== "✅ OK" ? `[${baseKey.toUpperCase()}] ${resBase.warning}` : "";
        const w2 = resOther.warning && resOther.warning !== "✅ OK" ? `[${baseKey === "d1" ? "D2" : "D1"}] ${resOther.warning}` : "";
        const combinedW = [w1, w2].filter(Boolean).join(" ");
        rowData.push(combinedW || "✅ OK");
      }
      sums.rni += totalRNI;
      sums.ir += totalIR;
      sums.net += netFoyer;
    } else {
      // Detailed view for Base Declarant
      // We use resBase.details
      const d = resBase.details;
      switch (mode) {
        case "tns":
          rowData = [commonParams.year, commonParams.pass, d.ca, d.r, d.cot, totalRNI, totalIR, netFoyer / 12, netFoyer];
          sums.ca += d.ca;
          sums.r += d.r;
          sums.cot += d.cot;
          break;
        case "sasuIR":
          rowData = [commonParams.year, commonParams.pass, d.salaire, d.bnc, d.cot, totalRNI, totalIR, netFoyer / 12, netFoyer];
          sums.r += d.salaire;
          sums.bnc += d.bnc;
          sums.cot += d.cot;
          break;
        case "sasuIS":
          rowData = [
            commonParams.year,
            commonParams.pass,
            commonParams.smic,
            "SASU-IS",
            d.ca,
            d.salBrut,
            d.divBrut,
            d.divNet,
            d.divMode === "pfu" ? "PFU" : "Barème",
            d.cot,
            totalRNI,
            totalIR,
            netFoyer / 12,
            netFoyer,
          ];
          sums.ca += d.ca;
          sums.r += d.salBrut;
          sums.divBrut += d.divBrut;
          sums.divNet += d.divNet;
          sums.cot += d.cot;
          break;
        case "micro":
          rowData = [
            commonParams.year,
            commonParams.pass,
            d.ca,
            d.cot,
            totalRNI,
            totalIR,
            netFoyer / 12,
            netFoyer,
            resBase.warning,
          ];
          sums.ca += d.ca;
          sums.cot += d.cot;
          break;
        case "salarie":
          rowData = [
            commonParams.year,
            commonParams.pass,
            commonParams.smic,
            "Salariat",
            d.salaireBrut,
            d.superBrut,
            d.chargesSal,
            d.netAvantIr,
            d.cot,
            totalRNI,
            totalIR,
            netFoyer / 12,
            netFoyer,
          ];
          sums.r += d.salaireBrut;
          sums.netAvantIr += d.netAvantIr;
          sums.cot += d.cot;
          break;
      }
      sums.rni += totalRNI;
      sums.ir += totalIR;
      sums.net += netFoyer;
    }

    // Render Row
    const rowHtml = rowData
      .map((d, index) => {
        if (typeof d === "string") return `<td>${d}</td>`;
        if (index === 0) return `<td>${Math.round(d)}</td>`;
        return `<td class="num">${fmtEUR(d)}</td>`;
      })
      .join("");
    const classAttr = rowClass ? `class="${rowClass}"` : "";
    tbody.innerHTML += `<tr ${classAttr}>${rowHtml}</tr>`;
  }

  buildSummaryFooter(sums, scope === "foyer" ? "foyer" : mode);
}
