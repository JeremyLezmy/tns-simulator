/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Controller for the Impôt sur le Revenu (IR) and household calculation.
 */
import { val, safeSetText, logIR } from "../utils/dom.js";
import { fmtEUR, fmtPct } from "../utils/format.js";
import { calculateHouseholdIr } from "../models/ir.js";
import { appState } from "../state.js";
import { handleProjection } from "./projectionController.js";
import { getAbatementRate } from "../models/micro.js";

function updateIrUI(RNI, totalIR, tmi, irResult, netFoyer, netAvantIr) {
  safeSetText("rniFoyer", fmtEUR(RNI));
  safeSetText("irOut", fmtEUR(totalIR));
  safeSetText("tmiOut", fmtPct(tmi));
  safeSetText("netFoyer", fmtEUR(netFoyer));
  safeSetText("netAvantIrFoyer", fmtEUR(netAvantIr));

  const parts = appState.household.parts || val("parts");
  const rows = irResult.slices
    .map(
      (s, idx) => `
        <tr>
            <td>Tranche ${idx + 1}</td>
            <td class="num">${fmtEUR(s.base)}</td>
            <td class="num">${(s.rate * 100).toFixed(0)} %</td>
            <td class="num">${fmtEUR(s.tax)}</td>
        </tr>
    `
    )
    .join("");
  document.getElementById("tblIr").innerHTML = rows || '<tr><td colspan="4" class="muted">Aucune tranche taxée</td></tr>';

  safeSetText("sumBasePart", fmtEUR(irResult.taxedBase));
  safeSetText("sumTaxPart", fmtEUR(irResult.tax));
  safeSetText("sumBaseFoyer", fmtEUR(irResult.taxedBase * parts));
  safeSetText("sumTaxFoyer", fmtEUR(totalIR));
}

function updateDeductCsgControl(mode) {
  const select = document.getElementById("deductCsg");
  const hint = document.getElementById("deductCsgHint");
  if (!select || !hint) return;

  const wasDisabled = select.disabled;

  if (mode === "tns") {
    select.disabled = false;
    if (wasDisabled && select.dataset.lastTnsValue) {
      select.value = select.dataset.lastTnsValue;
    }
    delete select.dataset.lastTnsValue;
    hint.textContent = "Option TNS (EURL/EI) : la part déductible de la CSG (6,8 %) est soustraite de votre revenu imposable.";
    return;
  }

  if (!select.disabled) {
    select.dataset.lastTnsValue = select.value;
  }
  select.value = "0";
  select.disabled = true;
  hint.textContent = "Grisé hors mode TNS : la CSG déductible n'est pas applicable et est forcée à \"Non\".";
}

function updateMainBncHint(mode) {
  const hintEl = document.getElementById("rBncHint");
  if (!hintEl) return;

  if (mode !== "micro") {
    hintEl.textContent = "";
    hintEl.style.display = "none";
    return;
  }

  const abatement = getAbatementRate(appState.micro.activity);
  const abatementPct = (abatement * 100).toFixed(0);
  const taxablePct = ((1 - abatement) * 100).toFixed(0);
  const ca = appState.micro.ca || 0;
  const baseImposable = Number.isFinite(appState.micro.baseImposable) ? appState.micro.baseImposable : ca * (1 - abatement);
  const abatementAmount = ca * abatement;

  hintEl.style.display = "block";
  hintEl.textContent = `Micro : abattement ${abatementPct} % → base imposable ${taxablePct} % du CA (CA ${fmtEUR(
    ca
  )} – abattement ${fmtEUR(abatementAmount)} = ${fmtEUR(baseImposable)}).`;
}

export function handleIrCalculation(triggerProjection = false) {
  // Met à jour l'IR saisi du déclarant actif
  const activeKey = appState.activeDeclarant || "d1";
  const activeDec = appState.declarants[activeKey];
  if (activeDec) {
    activeDec.inputs.ir = {
      rSal: val("rSal"),
      rBnc: val("rBnc"),
      rDivIR: val("rDivIR"),
      chargesDeduct: val("chargesDeduct"),
    };
  }

  const parts = appState.household.parts || val("parts");
  const mode = document.getElementById("modeSel").value;
  updateDeductCsgControl(mode);

  updateMainBncHint(mode);

  const decList = appState.household.status === "single" ? ["d1"] : ["d1", "d2"];
  let rSalTot = 0,
    rBncTot = 0,
    rDivTot = 0,
    dedTotal = 0,
    encaissementsFoyer = 0;

  decList.forEach((key) => {
    const dec = appState.declarants[key];
    if (!dec) return;
    const inputs = dec.inputs?.ir || {};
    const modeInputs = dec.inputs?.[dec.mode] || {};
    const rSal = Number(inputs.rSal) || 0;
    const rBnc = Number(inputs.rBnc) || 0;
    const rDivIR = Number(inputs.rDivIR) || 0;
    const chargesDeduct = Number(inputs.chargesDeduct) || 0;

    rSalTot += rSal;
    rBncTot += rBnc;
    rDivTot += rDivIR;

    // Fix: Pour le déclarant actif, on prend la valeur en direct du DOM si on est en mode TNS
    let dedCsgFlag = "0";
    if (dec.mode === "tns") {
      if (key === activeKey) {
         dedCsgFlag = document.getElementById("deductCsg")?.value || "0";
      } else {
         dedCsgFlag = modeInputs.deductCsg ?? inputs.deductCsg ?? "0";
      }
    }
    
    const dedCsg = dedCsgFlag === "1" && dec.computed?.tns?.A > 0 ? 0.068 * dec.computed.tns.A : 0;
    dedTotal += dedCsg + chargesDeduct;

    switch (dec.mode) {
      case "tns":
        encaissementsFoyer += dec.computed?.tns?.R || 0;
        break;
      case "sasuIR":
        encaissementsFoyer += dec.computed?.sasuIr?.encaissements || 0;
        break;
      case "sasuIS":
        encaissementsFoyer += dec.computed?.sasuIs?.encaissements || 0;
        break;
      case "micro":
        encaissementsFoyer += dec.computed?.micro?.remuneration || 0;
        break;
      case "salarie":
        encaissementsFoyer += dec.computed?.salarie?.netAvantIR || 0;
        break;
      default:
        break;
    }

    encaissementsFoyer -= chargesDeduct;
  });

  const { RNI, totalIR, tmi, irResult } = calculateHouseholdIr(rSalTot, rBncTot, rDivTot, 0, dedTotal, parts, 0);

  const netFoyer = encaissementsFoyer - totalIR;

  // Update state
  appState.ir = { RNI, IR: totalIR, net: netFoyer, tmi };

  // Update UI
  updateIrUI(RNI, totalIR, tmi, irResult, netFoyer, encaissementsFoyer);

  logIR(`IR Calc: RNI=${RNI.toFixed(0)}, IR=${totalIR.toFixed(0)}, Net=${netFoyer.toFixed(0)}`);

  if (triggerProjection) {
    handleProjection();
  }
}

export function syncIrInputs() {
  const mode = document.getElementById("modeSel").value;
  let rSal = 0,
    rBnc = 0,
    rDivIR = 0;

  switch (mode) {
    case "tns":
      rSal = appState.tns.R * 0.9;
      break;
    case "sasuIR":
      rSal = appState.sasuIr.salaire; // Pas d'abattement 10%
      rBnc = appState.sasuIr.bnc;
      break;
    case "sasuIS":
      rSal = appState.sasuIs.salBrut * 0.9;
      rDivIR = appState.sasuIs.divIrBase;
      break;
    case "micro":
      rBnc = appState.micro.baseImposable;
      break;
    case "salarie":
      rSal = appState.salarie.brutTotal * 0.9;
      break;
  }

  // Update label based on mode
  const lbl = document.getElementById("lblRSal");
  if (lbl) {
    if (mode === "sasuIR") {
      lbl.textContent = "Salaires imposables (pas d'abattement 10%) €";
    } else {
      lbl.textContent = "Salaires imposables (après -10 %) €";
    }
  }

  document.getElementById("rSal").value = Math.round(rSal);
  document.getElementById("rBnc").value = Math.round(rBnc);
  document.getElementById("rDivIR").value = Math.round(rDivIR);
  const dec = appState.declarants[appState.activeDeclarant];
  if (dec?.inputs?.ir) {
    const charges = Number(dec.inputs.ir.chargesDeduct) || 0;
    document.getElementById("chargesDeduct").value = Math.round(charges);
  }
  const tnsInputs = dec?.inputs?.tns;
  if (tnsInputs && typeof tnsInputs.deductCsg !== "undefined") {
    document.getElementById("deductCsg").value = tnsInputs.deductCsg;
  }

  // LA CORRECTION EST ICI :
  // On recalcule l'IR mais on ne redéclenche PAS la projection depuis ici.
  // La projection sera déclenchée par la fonction qui a appelé syncIrInputs à l'origine.
  handleIrCalculation(false);
}

export function handleRoundingChange(decimals) {
  appState.ui.rounding = decimals;
  // Trigger a full recalculation and redraw of the UI
  const mode = document.getElementById("modeSel").value;
  switch (mode) {
    case "tns":
      handleTnsCalculation(true);
      break;
    case "sasuIR":
      handleSasuIrCalculation(true);
      break;
    case "sasuIS":
      handleSisuCalculation(true);
      break;
    case "micro":
      handleMicroCalculation(true);
      break;
    case "salarie":
      handleSalarieCalculation(true);
      break;
  }
}
