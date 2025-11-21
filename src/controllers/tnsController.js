/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Controller for the TNS mode.
 */
import { val, safeSetText, log } from "../utils/dom.js";
import { fmtEUR, fmtPct } from "../utils/format.js";
import { solveForR } from "../models/tns.js";
import { appState } from "../state.js";
import { syncIrInputs } from "./irController.js";
import { handleProjection } from "./projectionController.js";
import { updateCharts } from "../ui/charts.js";

function updateTnsUI(dispo, R, cot, ca, includeCsg) {
  // KPIs
  safeSetText("margeOut", fmtEUR(dispo));
  safeSetText("Rout", fmtEUR(R));
  safeSetText("Rratio", `R / CA : ${fmtPct(R / Math.max(ca, 1))}`);
  safeSetText("cotHorsCsg", fmtEUR(cot.cotSansCSG));
  safeSetText("cotHorsCsgPct", `soit ${fmtPct(cot.cotSansCSG / Math.max(R, 1))} de R`);
  safeSetText("csgOut", fmtEUR(cot.csg));
  const totalContributions = cot.cotSansCSG + (val("includeCsg") ? cot.csg : 0);
  safeSetText("totalTns", fmtEUR(totalContributions));
  safeSetText("totalTnsPct", `soit ${fmtPct(totalContributions / Math.max(R, 1))} de R`);

  // Details Table
  const items = [
    ["A = 74 % × R", cot.A],
    ["Maladie-maternité", cot.maladie],
    ["Indemnités journalières", cot.ij],
    ["Retraite de base", cot.retBase],
    ["Retraite complémentaire RCI", cot.rci],
    ["Invalidité-décès", cot.id],
    ["Allocations familiales modulées", cot.af],
    ["CFP", val("cfp")],
  ];
  const rows = items
    .map(([label, value]) => {
      const pr = R > 0 ? value / R : 0;
      return `<tr><td>${label}</td><td class="num">${fmtEUR(value)}</td><td class="num">${fmtPct(pr)}</td></tr>`;
    })
    .join("");
  document.getElementById("tblTns").innerHTML = rows;

  safeSetText("sumHorsCsg", fmtEUR(cot.cotSansCSG));
  safeSetText("sumHorsCsgPct", R > 0 ? fmtPct(cot.cotSansCSG / R) : "–");
  safeSetText("sumCsg", fmtEUR(cot.csg));
  safeSetText("sumCsgPct", R > 0 ? fmtPct(cot.csg / R) : "–");
  safeSetText("sumTot", fmtEUR(cot.total));
  safeSetText("sumTotPct", R > 0 ? fmtPct(cot.total / R) : "–");

  // Update Chart
  updateCharts("tns", {
    net: R,
    cotis: cot.cotSansCSG,
    csg: cot.csg,
    details: cot,
    ca: ca,
    dispo: dispo,
    includeCsg: includeCsg,
  });
}

export function handleTnsCalculation(triggerProjection = false) {
  const ca = val("ca");
  const chargesPct = val("chargesPct");
  const chargesFixes = val("chargesFixes");
  const PASS = val("pass");
  const CFP = val("cfp");
  const includeCsg = document.getElementById("includeCsg").value === "1";

  const dispo = ca * (1 - chargesPct / 100) - chargesFixes;
  const { R, cot } = solveForR(dispo, PASS, CFP, includeCsg);

  // Update state
  appState.tns.R = R;
  appState.tns.A = cot.A;
  appState.tns.cotisations = cot;
  appState.tns.dispo = dispo;

  const dec = appState.declarants[appState.activeDeclarant];
  if (dec) {
    dec.computed.tns = { ...appState.tns };
  }

  // Update UI
  updateTnsUI(dispo, R, cot, ca, includeCsg);

  log(`TNS Calc: CA=${ca}, R=${R.toFixed(0)}`);

  if (document.getElementById("modeSel").value === "tns") {
    syncIrInputs();
  }
  if (triggerProjection) {
    handleProjection();
  }
}

export function resetTns() {
  document.getElementById("ca").value = 100000;
  document.getElementById("chargesPct").value = 3;
  document.getElementById("chargesFixes").value = 0;
  document.getElementById("includeCsg").value = "1";
  handleTnsCalculation(true);
}
