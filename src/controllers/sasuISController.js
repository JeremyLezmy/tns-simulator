/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Controller for the SASU à l'IS mode.
 */
import { val, safeSetText, log } from "../utils/dom.js";
import { fmtEUR, fmtPct } from "../utils/format.js";
import { calculateSasuIs, minSalaryFor4Quarters } from "../models/sasuIS.js";
import { appState } from "../state.js";
import { syncIrInputs } from "./irController.js";
import { handleProjection } from "./projectionController.js";
import { updateCharts } from "../ui/charts.js";

export function toggleSisuView(view) {
  const g = document.getElementById("tblSISUWrapper");
  const d = document.getElementById("tblSISUChargesWrapper");
  const v = document.getElementById("sisuVisualWrapper");
  const bg = document.getElementById("btnViewGlobal");
  const bd = document.getElementById("btnViewCharges");
  const bv = document.getElementById("btnViewVisual");

  // Hide all
  g.style.display = "none";
  d.style.display = "none";
  if (v) v.style.display = "none";
  
  // Remove all active states
  bg.classList.remove("active");
  bd.classList.remove("active");
  if (bv) bv.classList.remove("active");

  // Show selected view
  if (view === "charges") {
    d.style.display = "block";
    bd.classList.add("active");
  } else if (view === "visual" && v) {
    v.style.display = "block";
    if (bv) bv.classList.add("active");
  } else {
    // Default to global
    g.style.display = "block";
    bg.classList.add("active");
  }
}

export function updateSisuHelper() {
  const mode = document.getElementById("sisuSalaryMode").value;
  const smic = val("smicHour");
  const minSal = minSalaryFor4Quarters(smic);
  const salInput = document.getElementById("sisuSalaire");

  safeSetText("sisuMinInfo", `Seuil 4 trimestres ≈ ${fmtEUR(minSal)}`);

  if (mode === "min4q") {
    salInput.value = Math.round(minSal);
    salInput.setAttribute("disabled", "");
    salInput.classList.add("disabled-input");
  } else {
    salInput.removeAttribute("disabled");
    salInput.classList.remove("disabled-input");
  }
}

function updateSisuUI(result) {
  // 1. Mise à jour des tuiles KPI
  safeSetText("sisuKpiSal", fmtEUR(result.salBrut));
  safeSetText("sisuKpiRes", fmtEUR(result.resImposable));
  safeSetText("sisuKpiIS", fmtEUR(result.isTotal));
  safeSetText("sisuKpiDivBrut", fmtEUR(result.divBrut));
  safeSetText("sisuKpiDivNet", fmtEUR(result.divNet));

  // 2. Mise à jour des champs de taux (désactivés)
  const deco = result.contributions;
  const effRateSal = result.salBrut > 0 ? deco.totalSalarie / result.salBrut : 0;
  const effRatePat = result.salBrut > 0 ? deco.totalEmployeur / result.salBrut : 0;
  const rateSalInput = document.getElementById("rateSal");
  const ratePatInput = document.getElementById("ratePat");
  if (rateSalInput) rateSalInput.value = (effRateSal * 100).toFixed(1);
  if (ratePatInput) ratePatInput.value = (effRatePat * 100).toFixed(1);

  // 3. Construction de la table de synthèse
  const chargesPct = val("sisuChargesPct");
  const blocSociete = [
    ["CA", val("sisuCA")],
    [`Charges externes (${chargesPct.toFixed(1).replace(".", ",")} %)`, (-val("sisuCA") * chargesPct) / 100],
    ["Autres charges fixes", -val("sisuChargesFix")],
    ["Marge avant rémunérations", result.marge, true],
    [`Salaire brut`, -result.salBrut],
    [`Charges patronales (${(effRatePat * 100).toFixed(1).replace(".", ",")} %)`, -deco.totalEmployeur],
    ["Coût employeur total", -result.costEmployeur, true],
    ["Résultat imposable IS", result.resImposable, true],
    ["IS total", -result.isTotal],
    ["Résultat après IS", result.resApresIS, true],
    ["↦ <strong>Flux dirigeant</strong>", ""],
  ];
  const blocDirigeant = [
    [`Salaire Net perçu (avant IR)`, result.netSal],
    [`Dividendes nets perçus (${document.getElementById("divMode").value === "pfu" ? "PFU" : "avant IR"})`, result.divNet],
  ];
  const stages = ["Marge avant rémunérations", "Coût employeur total", "Résultat imposable IS", "Résultat après IS"];
  const sisuTbody = document.getElementById("tblSISU");
  if (sisuTbody) {
    sisuTbody.innerHTML = [...blocSociete, ...blocDirigeant]
      .map(([label, value]) => {
        const isStage = stages.includes(label.replace(/<[^>]+>/g, ""));
        const vFmt = typeof value === "number" ? fmtEUR(value) : "";
        return `<tr class="${isStage ? "stage-row" : ""}"><td>${label}</td><td class="num">${vFmt}</td></tr>`;
      })
      .join("");
  }
  safeSetText("sumSISUEnc", fmtEUR(result.encaissements));

  // 4. Construction de la table de détail des charges (avec catégories)
  const chargesTbody = document.querySelector("#tblSISUCharges tbody");
  if (chargesTbody) {
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
      ],
      Famille: ["Allocations familiales"],
      Autres: ["FNAL 0,10 %", "CSA 0,30 %", "Formation professionnelle", "Taxe apprentissage"],
    };

    for (const [cat, labels] of Object.entries(catMap)) {
      let catHtml = "";
      labels.forEach((label) => {
        const p = deco.breakdown[label];
        if (!p) return; // Ignore les lignes non applicables (ex: Prévoyance si non-cadre)
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
    chargesTbody.innerHTML = rowsHtml;
  }

  // 5. Mise à jour du footer de la table de détail
  safeSetText("sisuCharges-base", fmtEUR(result.salBrut));
  safeSetText("sisuCharges-sal-pct", `${(effRateSal * 100).toFixed(1).replace(".", ",")} %`);
  safeSetText("sisuCharges-sal-mt", fmtEUR(deco.totalSalarie));
  safeSetText("sisuCharges-emp-pct", `${(effRatePat * 100).toFixed(1).replace(".", ",")} %`);
  safeSetText("sisuCharges-emp-mt", fmtEUR(deco.totalEmployeur));

  // Update Chart
  const chargesExtVal = (val("sisuCA") * val("sisuChargesPct")) / 100 + val("sisuChargesFix");
  updateCharts("sasuIS", {
    chargesExt: chargesExtVal,
    chargesSoc: deco.totalEmployeur + deco.totalSalarie + (result.psDiv || 0),
    is: result.isTotal,
    net: result.netSal + result.divNet,
  });
}

export function handleSisuCalculation(triggerProjection = false) {
  updateSisuHelper(); // Ensure salary is correct before calculation

  const salBrut = val("sisuSalaire");
  const result = calculateSasuIs(
    val("sisuCA"),
    val("sisuChargesPct"),
    val("sisuChargesFix"),
    salBrut,
    val("isRedThr"),
    val("isRate") / 100,
    val("distRate"),
    document.getElementById("divMode").value
  );

  // Update state
  appState.sasuIs = {
    salBrut: result.salBrut,
    netSal: result.netSal,
    divBrut: result.divBrut,
    divNet: result.divNet,
    divIrBase: result.divIrBase,
    is: result.isTotal,
    ps: result.psDiv,
    divMode: document.getElementById("divMode").value,
    encaissements: result.encaissements,
  };
  const dec = appState.declarants[appState.activeDeclarant];
  if (dec) {
    dec.computed.sasuIs = { ...appState.sasuIs, totalTaxes: result.totalTaxes };
  }

  // Update UI
  updateSisuUI(result);

  log(`SASU-IS Calc: CA=${val("sisuCA")}, Salaire Brut=${salBrut.toFixed(0)}`);

  if (document.getElementById("modeSel").value === "sasuIS") {
    syncIrInputs();
  }
  if (triggerProjection) {
    handleProjection();
  }
}

export function resetSisu() {
  document.getElementById("sisuCA").value = 100000;
  document.getElementById("sisuChargesPct").value = 3;
  document.getElementById("sisuChargesFix").value = 0;
  document.getElementById("sisuSalaryMode").value = "min4q";
  document.getElementById("isRedThr").value = 42500;
  document.getElementById("isRate").value = 25;
  document.getElementById("distRate").value = 100;
  document.getElementById("divMode").value = "pfu";
  handleSisuCalculation(true);
}
