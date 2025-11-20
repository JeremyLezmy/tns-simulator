/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Controller for the Micro-entreprise mode.
 */
import { val, safeSetText, log } from "../utils/dom.js";
import { fmtEUR, fmtPct } from "../utils/format.js";
import { calculateMicro, MICRO_THRESHOLDS, getSocialWeights, getMicroRates } from "../models/micro.js";
import { appState } from "../state.js";
import { syncIrInputs } from "./irController.js";
import { handleProjection } from "./projectionController.js";

function updateMicroUI(result, ca, activity, acreOn) {
  // KPIs
  safeSetText("microKpiCA", fmtEUR(ca));
  safeSetText("microKpiCot", fmtEUR(result.cotisations));
  safeSetText("microKpiRem", fmtEUR(result.remuneration));

  // Warning
  const threshold = MICRO_THRESHOLDS[activity] || MICRO_THRESHOLDS.service;
  const exceeds = ca > threshold;
  const warningEl = document.getElementById("microWarning");
  const detailEl = document.getElementById("microWarningDetail");
  if (exceeds) {
    warningEl.textContent = "Dépassement";
    warningEl.classList.add("warn");
    warningEl.classList.remove("ok");
    detailEl.textContent = "Le CA dépasse le seuil de la micro-entreprise.";
  } else {
    warningEl.textContent = "OK";
    warningEl.classList.remove("warn");
    warningEl.classList.add("ok");
    detailEl.textContent = "";
  }

  // --- LOGIQUE DE LA TABLE DÉTAILLÉE RESTAURÉE ---
  let rows = "";
  const socialWeights = getSocialWeights(activity);
  const { base: baseRate, cfp: cfpRate } = getMicroRates(activity);
  const socialRateAfterAcre = acreOn ? baseRate / 2 : baseRate;

  const labels = {
    maladie: "Assurance maladie-maternité",
    invalidite: "Assurance invalidité-décès",
    retBase: "Retraite de base",
    retCompl: "Retraite complémentaire",
    csg: "CSG/CRDS",
    prestations_maladie: "Prestations maladie en espèces",
    vieillesse_base_1: "Vieillesse de base 1°",
    vieillesse_base_2: "Vieillesse de base 2°",
    vieillesse_compl: "Retraite complémentaire",
  };

  for (const key in socialWeights) {
    const weight = socialWeights[key];
    const effectiveRate = weight * socialRateAfterAcre;
    const amount = ca * effectiveRate;
    const displayName = labels[key] || key.replace("_", " ");
    rows += `<tr>
            <td>${displayName}</td>
            <td class="num">${(effectiveRate * 100).toFixed(2).replace(".", ",")} %</td>
            <td class="num">${fmtEUR(amount)}</td>
        </tr>`;
  }

  // Add CFP row
  rows += `<tr>
        <td>Contribution formation prof.</td>
        <td class="num">${(cfpRate * 100).toFixed(2).replace(".", ",")} %</td>
        <td class="num">${fmtEUR(ca * cfpRate)}</td>
    </tr>`;

  document.getElementById("tblMicro").innerHTML = rows;
  safeSetText("sumMicroPct", `${(result.totalRate * 100).toFixed(2).replace(".", ",")} %`);
  safeSetText("sumMicroTot", fmtEUR(result.cotisations));
}

export function handleMicroCalculation(triggerProjection = false) {
  const ca = val("microCA");
  const activity = document.getElementById("microActivity").value;
  const acreOn = document.getElementById("microACRE").checked;

  const result = calculateMicro(ca, activity, acreOn);

  appState.micro = { ...appState.micro, ...result, ca, activity, acreOn };
  const dec = appState.declarants[appState.activeDeclarant];
  if (dec) {
    dec.computed.micro = { ...result, ca, activity, acreOn };
  }
  updateMicroUI(result, ca, activity, acreOn);

  log(`Micro Calc: CA=${ca}, Activité=${activity}`);

  if (document.getElementById("modeSel").value === "micro") {
    syncIrInputs();
  }
  if (triggerProjection) {
    handleProjection();
  }
}

export function resetMicro() {
  document.getElementById("microCA").value = 70000;
  document.getElementById("microGrow").value = 5;
  document.getElementById("microActivity").value = "bnc";
  document.getElementById("microACRE").checked = false;
  handleMicroCalculation(true);
}
