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
import { getMicroRates, getAbatementRate } from "../models/micro.js";

function updateIrUI(RNI, totalIR, tmi, irResult, netFoyer) {
  safeSetText("rniFoyer", fmtEUR(RNI));
  safeSetText("irOut", fmtEUR(totalIR));
  safeSetText("tmiOut", fmtPct(tmi));
  safeSetText("netFoyer", fmtEUR(netFoyer));

  const parts = val("parts");
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

function computeSpouseCashAndBase(isFirstYear = true) {
  if (document.getElementById("cashOpts").value !== "you_plus_spouse") {
    return { spouseCash: 0, baseSpouse: 0 };
  }
  const caSpouse = val("caSpouse");
  const activity = document.getElementById("spouseActivity").value;
  const acreOn = isFirstYear && document.getElementById("spouseACRE").checked;

  const { base, cfp } = getMicroRates(activity);
  const socialRate = acreOn ? base / 2 : base;
  const totalRate = socialRate + cfp;

  const cotisations = caSpouse * totalRate;
  const spouseCash = caSpouse - cotisations;
  const abatement = getAbatementRate(activity);
  const baseSpouse = caSpouse * (1 - abatement);

  // Update hint text
  const hintEl = document.getElementById("spouseBaseHint");
  if (hintEl) {
    const pct = ((1 - abatement) * 100).toFixed(0);
    hintEl.textContent = `Base imposable conjointe = ${pct} % × CA annuel (abattement ${(abatement * 100).toFixed(0)} %).`;
  }

  return { spouseCash, baseSpouse };
}

export function handleIrCalculation(triggerProjection = false) {
  const rSal = val("rSal");
  const rBnc = val("rBnc");
  const rDivIR = val("rDivIR");
  const parts = val("parts");
  const dedCsg = document.getElementById("deductCsg").value === "1" && appState.tns.A > 0 ? 0.068 * appState.tns.A : 0;

  const { spouseCash, baseSpouse } = computeSpouseCashAndBase();

  const { RNI, totalIR, tmi, irResult } = calculateHouseholdIr(rSal, rBnc, rDivIR, baseSpouse, dedCsg, parts, 0);

  let encaissementsFoyer = spouseCash;
  const mode = document.getElementById("modeSel").value;
  switch (mode) {
    case "tns":
      encaissementsFoyer += appState.tns.R;
      break;
    case "sasuIR":
      encaissementsFoyer += appState.sasuIr.encaissements;
      break;
    case "sasuIS":
      encaissementsFoyer += appState.sasuIs.encaissements;
      break;
    case "micro":
      encaissementsFoyer += appState.micro.remuneration;
      break;
    case "salarie":
      encaissementsFoyer += appState.salarie.netAvantIR;
      break;
  }

  const netFoyer = encaissementsFoyer - totalIR;

  // Update state
  appState.ir = { RNI, IR: totalIR, net: netFoyer, tmi };

  // Update UI
  updateIrUI(RNI, totalIR, tmi, irResult, netFoyer);

  logIR(`IR Calc: RNI=${RNI.toFixed(0)}, IR=${totalIR.toFixed(0)}, Net=${netFoyer.toFixed(0)}`);

  if (triggerProjection) {
    handleProjection();
  }
}

export function syncIrInputs() {
  const syncSrc = document.getElementById("syncSource").value;
  if (syncSrc === "manual") {
    handleIrCalculation(true);
    return;
  }

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
