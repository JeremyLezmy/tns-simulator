/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Main application entry point.
 * Initializes the UI, sets up event listeners, and orchestrates the controllers.
 */

import { initTheme, handleThemeChange } from "./ui/theme.js";
import { initViewMode, handleViewModeChange } from "./ui/viewmode.js";
import { initNotes, handleNoteTabClick } from "./ui/notes.js";
import { handleRoundingChange } from "./controllers/irController.js";
import { handleExportCsv } from "./ui/exportCsv.js";
import { handleTnsCalculation, resetTns } from "./controllers/tnsController.js";
import { handleSasuIrCalculation, resetSasuIr } from "./controllers/sasuIRController.js";
import { handleSisuCalculation, resetSisu, updateSisuHelper, toggleSisuView } from "./controllers/sasuISController.js";
import { handleMicroCalculation, resetMicro } from "./controllers/microController.js";
import { handleSalarieCalculation, resetSalarie, updateSalaireHelper } from "./controllers/salarieController.js";
import { handleIrCalculation, syncIrInputs } from "./controllers/irController.js";
import { handleProjection } from "./controllers/projectionController.js";
import { appState } from "./state.js";
import { updateCharts } from "./ui/charts.js";

const MODE_INPUTS = {
  tns: ["ca", "caGrow", "chargesPct", "chargesFixes", "includeCsg", "deductCsg"],
  sasuIR: ["sasuSalaire", "sasuSalaireGrow", "sasuBnc", "sasuBncGrow", "psRate"],
  sasuIS: [
    "sisuCA",
    "sisuCAGrow",
    "sisuChargesPct",
    "sisuChargesFix",
    "smicHour",
    "smicGrow",
    "sisuSalaryMode",
    "sisuSalaire",
    "isRedThr",
    "isRate",
    "distRate",
    "divMode",
  ],
  micro: ["microCA", "microGrow", "microActivity", "microACRE"],
  salarie: ["salaireBrut", "salaireMode", "salaireGrow", "variablePct", "variableFixe", "statutSal"],
};

const IR_INPUTS = ["rSal", "rBnc", "rDivIR", "chargesDeduct"];
const PROJECTION_SCOPES = ["foyer", "d1", "d2"];
function initHelpPopups() {
  // 1. Process raw .hint elements (auto-wrap)
  const hints = document.querySelectorAll(".hint");
  hints.forEach((hint, idx) => {
    if (hint.dataset.enhanced === "1") return;
    const txt = (hint.textContent || "").trim();
    if (!txt) return;
    const container = document.createElement("div");
    container.className = "help-container";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "help-icon";
    btn.textContent = "?";
    const targetId = hint.id || `help-${idx}`;
    btn.dataset.target = targetId;
    hint.id = targetId;
    hint.classList.add("help-bubble");
    hint.dataset.enhanced = "1";
    const parent = hint.parentNode;
    parent.insertBefore(container, hint);
    container.appendChild(btn);
    container.appendChild(hint);
  });

  // 2. Process manual .help-container elements (link icon to bubble)
  document.querySelectorAll(".help-container").forEach((container, idx) => {
    const icon = container.querySelector(".help-icon");
    const bubble = container.querySelector(".help-bubble");
    if (icon && bubble) {
      if (!icon.dataset.target) {
        const targetId = bubble.id || `help-manual-${idx}`;
        bubble.id = targetId;
        icon.dataset.target = targetId;
      }
    }
  });

  document.addEventListener("click", (e) => {
    const isIcon = e.target.classList.contains("help-icon");
    document.querySelectorAll(".help-bubble.show").forEach((hb) => {
      if (!isIcon || hb.id !== e.target.dataset.target) hb.classList.remove("show");
    });
    if (isIcon) {
      const target = document.getElementById(e.target.dataset.target);
      if (target) target.classList.toggle("show");
    }
  });
}

function captureInputs(ids = []) {
  const obj = {};
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox") {
      obj[id] = el.checked;
    } else {
      obj[id] = el.value;
    }
  });
  return obj;
}

function restoreInputs(data = {}) {
  Object.entries(data).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox") {
      el.checked = Boolean(value);
    } else {
      el.value = value;
    }
  });
}

function snapshotActiveDeclarant() {
  const decKey = appState.activeDeclarant || "d1";
  const dec = appState.declarants[decKey];
  if (!dec) return;

  const mode = document.getElementById("modeSel")?.value || "tns";
  dec.mode = mode;
  dec.inputs[mode] = captureInputs(MODE_INPUTS[mode]);
  dec.inputs.ir = captureInputs(IR_INPUTS);

  dec.computed.tns = JSON.parse(JSON.stringify(appState.tns));
  dec.computed.sasuIr = JSON.parse(JSON.stringify(appState.sasuIr));
  dec.computed.sasuIs = JSON.parse(JSON.stringify(appState.sasuIs));
  dec.computed.micro = JSON.parse(JSON.stringify(appState.micro));
  dec.computed.salarie = JSON.parse(JSON.stringify(appState.salarie));
}

function restoreDeclarant(decKey) {
  const dec = appState.declarants[decKey];
  if (!dec) return;
  appState.activeDeclarant = decKey;

  const mode = dec.mode || "tns";
  const title = document.getElementById("modeTitle");
  if (title) {
    title.textContent = `Mode principal · Déclarant ${decKey === "d1" ? "1" : "2"}`;
  }
  document.getElementById("modeSel").value = mode;
  restoreInputs(dec.inputs[mode]);
  restoreInputs(dec.inputs.ir);

  // Restore computed states so IR/déductions peuvent se baser dessus immédiatement
  appState.tns = { ...appState.tns, ...dec.computed.tns };
  appState.sasuIr = { ...appState.sasuIr, ...dec.computed.sasuIr };
  appState.sasuIs = { ...appState.sasuIs, ...dec.computed.sasuIs };
  appState.micro = { ...appState.micro, ...dec.computed.micro };
  appState.salarie = { ...appState.salarie, ...dec.computed.salarie };

  switchMode(mode);
}

function updateHouseholdParts() {
  const status = document.getElementById("familyStatus")?.value || "single";
  const children = Math.max(0, parseInt(document.getElementById("childrenCount")?.value || "0", 10) || 0);
  const guardMode = document.getElementById("guardMode")?.value || "exclusive";

  appState.household.status = status;
  appState.household.children = children;
  appState.household.guardMode = guardMode;

  const base = status === "single" ? 1 : 2;
  const extra =
    guardMode === "alternate"
      ? Math.min(children, 2) * 0.25 + Math.max(children - 2, 0) * 0.5
      : Math.min(children, 2) * 0.5 + Math.max(children - 2, 0);
  const majIsolé =
    status === "single" && children > 0
      ? guardMode === "alternate"
        ? children === 1
          ? 0.25
          : 0.5
        : 0.5
      : 0;

  const parts = base + extra + majIsolé;
  appState.household.parts = parts;

  const partsInput = document.getElementById("parts");
  if (partsInput) {
    partsInput.value = parts.toFixed(2);
    partsInput.setAttribute("readonly", "true");
  }
  const hint = document.getElementById("partsHint");
  if (hint) {
    const statusTxt = status === "single" ? "Célibataire / séparé" : "Marié / Pacsé";
    const detail =
      guardMode === "alternate"
        ? "Garde alternée simplifiée : +0,25 part/enfant (x2) puis +0,5 à partir du 3ᵉ."
        : "Charge principale : +0,5 part pour les 2 premiers enfants puis +1 part dès le 3ᵉ.";
    hint.textContent = `${statusTxt} · ${children} enfant(s) · Parts calculées = ${parts.toFixed(2)}. ${detail}`;
  }

  // Déverrouiller/masquer le tab D2 si besoin
  const d2Tab = document.getElementById("tab-d2");
  if (d2Tab) {
    if (status === "single") {
      d2Tab.classList.add("disabled");
      if (appState.activeDeclarant !== "d1") {
        snapshotActiveDeclarant();
        restoreDeclarant("d1");
      }
    } else {
      d2Tab.classList.remove("disabled");
    }
  }
  const projD2 = document.getElementById("projTabD2");
  if (projD2) {
    projD2.classList.toggle("disabled", status === "single");
    if (status === "single" && appState.projectionScope === "d2") {
      appState.projectionScope = "foyer";
      setProjectionScope("foyer", false);
    }
  }

  handleIrCalculation(true);
}

function handleDeclarantTabClick(decKey) {
  if (decKey !== "d1" && appState.household.status === "single") {
    return;
  }
  snapshotActiveDeclarant();
  restoreDeclarant(decKey);

  // Sync projection scope if it was set to a specific declarant
  if (appState.projectionScope === "d1" || appState.projectionScope === "d2") {
    appState.projectionScope = decKey;
    document.getElementById("projTabD1")?.classList.toggle("active", decKey === "d1");
    document.getElementById("projTabD2")?.classList.toggle("active", decKey === "d2");
    handleProjection();
  }

  const d1Tab = document.getElementById("tab-d1");
  const d2Tab = document.getElementById("tab-d2");
  if (d1Tab && d2Tab) {
    d1Tab.classList.toggle("active", decKey === "d1");
    d2Tab.classList.toggle("active", decKey === "d2");
  }
}

function setProjectionScope(scope, switchDeclarant = true) {
  if (!PROJECTION_SCOPES.includes(scope)) return;
  if (scope === "d2" && appState.household.status === "single") return;

  appState.projectionScope = scope;
  if (switchDeclarant) {
    if (scope === "d1") handleDeclarantTabClick("d1");
    if (scope === "d2") handleDeclarantTabClick("d2");
  }
  document.getElementById("projTabFoyer")?.classList.toggle("active", scope === "foyer");
  document.getElementById("projTabD1")?.classList.toggle("active", scope === "d1");
  document.getElementById("projTabD2")?.classList.toggle("active", scope === "d2");
  handleProjection();
}

// --- Main App Controller ---

function switchMode(mode) {
  const blocs = {
    tns: document.getElementById("blocTNS"),
    sasuIR: document.getElementById("blocSASU"),
    sasuIS: document.getElementById("blocSASUIS"),
    micro: document.getElementById("blocMICRO"),
    salarie: document.getElementById("blocSALARIE"),
  };

  // Hide all blocs
  for (const key in blocs) {
    if (blocs[key]) blocs[key].style.display = "none";
  }

  // Show the selected one and trigger its calculation
  if (blocs[mode]) {
    blocs[mode].style.display = "block";

    appState.declarants[appState.activeDeclarant].mode = mode;
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
  syncIrInputs();
}

function updateAllCalculations() {
  const mode = document.getElementById("modeSel").value;
  switchMode(mode);
}

function initFloatingControls() {
  const scrollBtn = document.getElementById("scrollTopBtn");
  // Theme toggle is handled in ui/theme.js

  if (scrollBtn) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        scrollBtn.classList.remove("hidden");
      } else {
        scrollBtn.classList.add("hidden");
      }
    });
    scrollBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

function setupEventListeners() {
  // Topbar Actions
  document.getElementById("modeSel")?.addEventListener("change", (e) => switchMode(e.target.value));
  document.getElementById("tab-d1")?.addEventListener("click", () => handleDeclarantTabClick("d1"));
  document.getElementById("tab-d2")?.addEventListener("click", () => handleDeclarantTabClick("d2"));
  // Theme is now handled in initFloatingControls, but we keep the change handler for compatibility if needed
  // document.getElementById("themeSel")?.addEventListener("change", (e) => handleThemeChange(e.target.value));
  document.getElementById("roundSel")?.addEventListener("change", (e) => handleRoundingChange(e.target.value === "disp2" ? 2 : 0));
  document.getElementById("viewMode")?.addEventListener("change", (e) => handleViewModeChange(e.target.value));
  // PinBtn removed
  document.getElementById("exportCsvBtn")?.addEventListener("click", handleExportCsv);
  document.getElementById("notes-tabs")?.addEventListener("click", (e) => {
    if (e.target.matches(".tab")) {
      handleNoteTabClick(e.target.dataset.note, e.target);
    }
  });
  document.getElementById("projTabFoyer")?.addEventListener("click", () => setProjectionScope("foyer", false));
  document.getElementById("projTabD1")?.addEventListener("click", () => setProjectionScope("d1", true));
  document.getElementById("projTabD2")?.addEventListener("click", () => setProjectionScope("d2", true));

  // General parameters trigger projection update
  const generalInputs = ["startYear", "years", "inflation", "passGrow", "pass", "cfp"];
  generalInputs.forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => handleProjection());
  });

  // Household
  ["familyStatus", "childrenCount", "guardMode"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", updateHouseholdParts);
    document.getElementById(id)?.addEventListener("input", updateHouseholdParts);
  });

  // TNS Controls
  document.getElementById("calcTnsBtn")?.addEventListener("click", () => handleTnsCalculation(true));
  document.getElementById("resetTnsBtn")?.addEventListener("click", resetTns);
  const tnsInputs = ["ca", "caGrow", "chargesPct", "chargesFixes", "includeCsg", "deductCsg"];
  tnsInputs.forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => handleTnsCalculation(true));
  });

  // SASU-IR Controls
  document.getElementById("calcSasuIrBtn")?.addEventListener("click", () => handleSasuIrCalculation(true));
  document.getElementById("resetSasuIrBtn")?.addEventListener("click", resetSasuIr);
  const sasuIrInputs = ["sasuSalaire", "sasuSalaireGrow", "sasuBnc", "sasuBncGrow", "psRate"];
  sasuIrInputs.forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => handleSasuIrCalculation(true));
  });

  // SASU-IS Controls
  document.getElementById("calcSisuBtn")?.addEventListener("click", () => handleSisuCalculation(true));
  document.getElementById("resetSISUBtn")?.addEventListener("click", resetSisu);
  const sisuInputs = [
    "sisuCA",
    "sisuCAGrow",
    "sisuChargesPct",
    "sisuChargesFix",
    "smicHour",
    "smicGrow",
    "sisuSalaire",
    "isRedThr",
    "isRate",
    "distRate",
    "divMode",
  ];
  sisuInputs.forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => handleSisuCalculation(true));
  });
  document.getElementById("sisuSalaryMode")?.addEventListener("change", () => {
    updateSisuHelper();
    handleSisuCalculation(true);
  });
  document.getElementById("btnViewGlobal")?.addEventListener("click", () => toggleSisuView("global"));
  document.getElementById("btnViewCharges")?.addEventListener("click", () => toggleSisuView("charges"));

  // Micro-entreprise Controls
  document.getElementById("calcMicroBtn")?.addEventListener("click", () => handleMicroCalculation(true));
  document.getElementById("resetMicroBtn")?.addEventListener("click", resetMicro);
  const microInputs = ["microCA", "microGrow", "microActivity", "microACRE"];
  microInputs.forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => handleMicroCalculation(true));
  });

  // Salarié Controls
  document.getElementById("calcSalarieBtn")?.addEventListener("click", () => handleSalarieCalculation(true));
  document.getElementById("resetSalarieBtn")?.addEventListener("click", resetSalarie);
  const salarieInputs = ["salaireBrut", "salaireGrow", "variablePct", "variableFixe", "statutSal"];
  salarieInputs.forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => handleSalarieCalculation(true));
  });
  document.getElementById("salaireMode")?.addEventListener("change", updateSalaireHelper);

  // IR Controls
  const irInputs = ["rSal", "rBnc", "rDivIR", "chargesDeduct", "deductCsg"];
  irInputs.forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => handleIrCalculation(true));
  });
  document.getElementById("deductCsg")?.addEventListener("change", () => handleIrCalculation(true));

  // Projection Control
  document.getElementById("projectYearsBtn")?.addEventListener("click", handleProjection);
}

// --- App Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  // Initialize UI components
  initTheme();
  initFloatingControls();
  initViewMode();
  initNotes();
  // Init help popups
  initHelpPopups();

  // Set up all event listeners
  setupEventListeners();

  updateHouseholdParts();

  // Run initial calculations
  updateAllCalculations();
});

// Expose toggle function for TNS charts
window.toggleTnsView = function(view) {
  console.log('[toggleTnsView] Called with view:', view);
  const detailWrapper = document.getElementById("tnsDetailWrapper");
  const visualWrapper = document.getElementById("tnsVisualWrapper");
  const btnDetail = document.getElementById("btnViewTnsDetail");
  const btnVisual = document.getElementById("btnViewTnsVisual");

  if (view === "visual") {
    detailWrapper.style.display = "none";
    visualWrapper.style.display = "block";
    btnDetail.classList.remove("active");
    btnVisual.classList.add("active");
    
    // Trigger recalculation to replay animation (same as theme change)
    console.log('[Toggle] Triggering TNS recalculation');
    document.getElementById("calcTnsBtn")?.click();
  } else {
    detailWrapper.style.display = "block";
    visualWrapper.style.display = "none";
    btnDetail.classList.add("active");
    btnVisual.classList.remove("active");
  }
};



window.toggleSasuIRView = function(view) {
  const detailWrapper = document.getElementById("sasuIRDetailWrapper");
  const visualWrapper = document.getElementById("sasuIRVisualWrapper");
  const btnDetail = document.getElementById("btnViewSasuIRDetail");
  const btnVisual = document.getElementById("btnViewSasuIRVisual");

  if (view === "visual") {
    detailWrapper.style.display = "none";
    visualWrapper.style.display = "block";
    btnDetail.classList.remove("active");
    btnVisual.classList.add("active");
  } else {
    detailWrapper.style.display = "block";
    visualWrapper.style.display = "none";
    btnDetail.classList.add("active");
    btnVisual.classList.remove("active");
  }
};

window.toggleSisuView = toggleSisuView;

window.toggleMicroView = function(view) {
  const detailWrapper = document.getElementById("microDetailWrapper");
  const visualWrapper = document.getElementById("microVisualWrapper");
  const btnDetail = document.getElementById("btnViewMicroDetail");
  const btnVisual = document.getElementById("btnViewMicroVisual");

  if (view === "visual") {
    detailWrapper.style.display = "none";
    visualWrapper.style.display = "block";
    btnDetail.classList.remove("active");
    btnVisual.classList.add("active");
  } else {
    detailWrapper.style.display = "block";
    visualWrapper.style.display = "none";
    btnDetail.classList.add("active");
    btnVisual.classList.remove("active");
  }
};

window.toggleSalarieView = function(view) {
  const detailWrapper = document.getElementById("salarieDetailWrapper");
  const visualWrapper = document.getElementById("salarieVisualWrapper");
  const btnDetail = document.getElementById("btnViewSalarieDetail");
  const btnVisual = document.getElementById("btnViewSalarieVisual");

  if (view === "visual") {
    detailWrapper.style.display = "none";
    visualWrapper.style.display = "block";
    btnDetail.classList.remove("active");
    btnVisual.classList.add("active");
  } else {
    detailWrapper.style.display = "block";
    visualWrapper.style.display = "none";
    btnDetail.classList.add("active");
    btnVisual.classList.remove("active");
  }
};

