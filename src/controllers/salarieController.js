/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Controller for the Salarié (employee) mode.
 */
import { val, safeSetText, log } from "../utils/dom.js";
import { fmtEUR } from "../utils/format.js";
import { decomposeSalariatContributions } from "../models/salarie.js";
import { appState } from "../state.js";
import { syncIrInputs } from "./irController.js";
import { handleProjection } from "./projectionController.js";

export function getSalaireAnnuel() {
  const mode = document.getElementById("salaireMode").value;
  const raw = val("salaireBrut");
  return mode === "mensuel" ? raw * 12 : raw;
}

export function updateSalaireHelper() {
  const mode = document.getElementById("salaireMode").value;
  const lbl = document.querySelector('label[for="salaireBrut"]');
  if (lbl) {
    lbl.textContent = mode === "mensuel" ? "Salaire brut mensuel (€)" : "Salaire brut annuel (€)";
  }
  handleSalarieCalculation(true);
}

function updateSalarieUI(brutTotal, deco) {
  const netAvantIR = brutTotal - deco.totalSalarie;
  const superBrut = brutTotal + deco.totalEmployeur;

  // KPIs
  safeSetText("salBrutKpi", fmtEUR(brutTotal));
  safeSetText("salChargesSalariales", fmtEUR(deco.totalSalarie));
  safeSetText("salChargesPatronales", fmtEUR(deco.totalEmployeur));
  safeSetText("salSuperBrut", fmtEUR(superBrut));
  safeSetText("salNet", fmtEUR(netAvantIR));

  // Disabled rate inputs
  const effRateSal = brutTotal > 0 ? deco.totalSalarie / brutTotal : 0;
  const effRatePat = brutTotal > 0 ? deco.totalEmployeur / brutTotal : 0;
  document.getElementById("tauxSalarial").value = (effRateSal * 100).toFixed(1);
  document.getElementById("tauxPatronal").value = (effRatePat * 100).toFixed(1);

  // --- LOGIQUE D'AFFICHAGE DE LA TABLE DÉTAILLÉE CORRIGÉE ---
  const tbody = document.querySelector("#tblSalariatDetail tbody");
  let rowsHtml = "";
  const catMap = {
    Santé: ["Assurance maladie", "CSG imposable", "CSG non-imposable", "CRDS"],
    Retraite: [
      "Assurance vieillesse déplaf.",
      "Assurance vieillesse plaf.",
      "Retraite compl. Tr. 1",
      "Retraite compl. Tr. 2",
      "CEG Tr. 1",
      "CEG Tr. 2",
      "CET (> PASS)",
      "Prévoyance cadres",
      "APEC",
    ],
    Famille: ["Allocations familiales"],
    "Chômage / AGS": ["Assurance chômage", "AGS"],
    Autres: ["FNAL 0,10 %", "CSA 0,30 %", "Formation professionnelle", "Taxe apprentissage"],
  };

  for (const [cat, labels] of Object.entries(catMap)) {
    let catHtml = "";
    labels.forEach((label) => {
      const p = deco.breakdown[label];
      if (!p) return;
      const pctSal = p.base ? (p.salarie / p.base) * 100 : 0;
      const pctEmp = p.base ? (p.employeur / p.base) * 100 : 0;
      catHtml += `
            <tr>
                <td>${label}</td>
                <td class="num">${fmtEUR(p.base)}</td>
                <td class="num">${pctSal.toFixed(2).replace(".", ",")} %</td>
                <td class="num">${fmtEUR(p.salarie)}</td>
                <td class="num">${pctEmp.toFixed(2).replace(".", ",")} %</td>
                <td class="num">${fmtEUR(p.employeur)}</td>
            </tr>`;
    });
    if (catHtml) {
      rowsHtml += `<tr class="cat-row"><td colspan="6">${cat}</td></tr>` + catHtml;
    }
  }
  tbody.innerHTML = rowsHtml;
  // --- FIN DE LA CORRECTION ---

  // Footer
  safeSetText("total-base", fmtEUR(brutTotal));
  safeSetText("total-sal-pct", `${(effRateSal * 100).toFixed(1)} %`);
  safeSetText("total-sal-mt", fmtEUR(deco.totalSalarie));
  safeSetText("total-emp-pct", `${(effRatePat * 100).toFixed(1)} %`);
  safeSetText("total-emp-mt", fmtEUR(deco.totalEmployeur));
}

export function handleSalarieCalculation(triggerProjection = false) {
  const salaireBase = getSalaireAnnuel();
  const variablePct = val("variablePct") / 100;
  const variableFixe = val("variableFixe");
  const brutTotal = salaireBase + salaireBase * variablePct + variableFixe;
  const statut = document.getElementById("statutSal").value;

  const deco = decomposeSalariatContributions(brutTotal, statut);

  // Update state
  appState.salarie = {
    brutTotal,
    netAvantIR: brutTotal - deco.totalSalarie,
    chargesSalariales: deco.totalSalarie,
    chargesPatronales: deco.totalEmployeur,
    superBrut: brutTotal + deco.totalEmployeur,
  };

  // Update UI
  updateSalarieUI(brutTotal, deco);

  log(`Salarié Calc: Brut=${brutTotal.toFixed(0)}`);

  if (document.getElementById("modeSel").value === "salarie") {
    syncIrInputs();
  }
  if (triggerProjection) {
    handleProjection();
  }
}

export function resetSalarie() {
  document.getElementById("salaireBrut").value = 50000;
  document.getElementById("salaireMode").value = "annuel";
  document.getElementById("variablePct").value = 0;
  document.getElementById("variableFixe").value = 0;
  document.getElementById("statutSal").value = "noncadre";
  handleSalarieCalculation(true);
}
