/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Controller for the SASU à l'IR mode.
 */
import { val, safeSetText, log } from "../utils/dom.js";
import { fmtEUR } from "../utils/format.js";
import { calculateSasuIr } from "../models/sasuIR.js";
import { appState } from "../state.js";
import { syncIrInputs } from "./irController.js";
import { handleProjection } from "./projectionController.js";
import { updateCharts } from "../ui/charts.js";

function updateSasuIrUI(result) {
  safeSetText("sasuSalaireImp", fmtEUR(result.salImp));
  safeSetText("sasuPs", fmtEUR(result.psDue));
  safeSetText("sasuRni", fmtEUR(result.rni));
  safeSetText("sasuPsRateText", `Taux appliqué : ${(val("psRate") * 100).toFixed(1).replace(".", ",")} %`);

  const items = [
    ["Salaire brut", result.salaire],
    ["Salaire imposable", result.salImp],
    ["Quote-part BNC", result.bnc],
    ["PS sur quote-part", result.psDue],
  ];
  const rows = items.map(([label, value]) => `<tr><td>${label}</td><td class="num">${fmtEUR(value)}</td></tr>`).join("");
  document.getElementById("tblSasu").innerHTML = rows;
  safeSetText("sumSasuEnc", fmtEUR(result.encaissements));

  // Update Chart
  updateCharts("sasuIR", {
    salaireBrut: result.salaire,
    bncBrut: result.bnc,
    bncNet: result.bnc - result.psDue,
    psAmount: result.psDue,
  });
}

export function handleSasuIrCalculation(triggerProjection = false) {
  const salaire = val("sasuSalaire");
  const bnc = val("sasuBnc");
  const psRate = val("psRate");

  const result = calculateSasuIr(salaire, bnc, psRate);

  // Update state
  appState.sasuIr = result;
  const dec = appState.declarants[appState.activeDeclarant];
  if (dec) dec.computed.sasuIr = { ...result };

  // Update UI
  updateSasuIrUI(result);

  log(`SASU-IR Calc: Salaire=${salaire}, BNC=${bnc}`);

  if (document.getElementById("modeSel").value === "sasuIR") {
    syncIrInputs();
  }
  if (triggerProjection) {
    handleProjection();
  }
}

export function resetSasuIr() {
  document.getElementById("sasuSalaire").value = 12000;
  document.getElementById("sasuBnc").value = 84000;
  document.getElementById("psRate").value = 0.097;
  handleSasuIrCalculation(true);
}
