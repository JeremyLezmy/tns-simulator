/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Main application entry point.
 * Initializes the UI, sets up event listeners, and orchestrates the controllers.
 */

import { initTheme, handleThemeChange } from "./ui/theme.js";
import { initPinbar, handlePinToggle } from "./ui/pinbar.js";
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
    document.getElementById("syncSource").value = "auto";
    document.getElementById("cashOpts").value = "you_plus_spouse";

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

function setupEventListeners() {
  // Topbar Actions
  document.getElementById("modeSel")?.addEventListener("change", (e) => switchMode(e.target.value));
  document.getElementById("themeSel")?.addEventListener("change", (e) => handleThemeChange(e.target.value));
  document.getElementById("roundSel")?.addEventListener("change", (e) => handleRoundingChange(e.target.value === "disp2" ? 2 : 0));
  document.getElementById("viewMode")?.addEventListener("change", (e) => handleViewModeChange(e.target.value));
  document.getElementById("pinBtn")?.addEventListener("click", handlePinToggle);
  document.getElementById("exportCsvBtn")?.addEventListener("click", handleExportCsv);
  document.getElementById("notes-tabs")?.addEventListener("click", (e) => {
    if (e.target.matches(".tab")) {
      handleNoteTabClick(e.target.dataset.note, e.target);
    }
  });

  // General parameters trigger projection update
  const generalInputs = ["startYear", "years", "inflation", "passGrow", "pass", "cfp"];
  generalInputs.forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => handleProjection());
  });

  // TNS Controls
  document.getElementById("calcTnsBtn")?.addEventListener("click", () => handleTnsCalculation(true));
  document.getElementById("resetTnsBtn")?.addEventListener("click", resetTns);
  const tnsInputs = ["ca", "caGrow", "chargesPct", "chargesFixes", "includeCsg"];
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
  const irInputs = ["parts", "rSal", "rBnc", "rDivIR", "caSpouse", "growth", "deductCsg"];
  irInputs.forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => handleIrCalculation(true));
  });
  document.getElementById("syncSource")?.addEventListener("change", syncIrInputs);
  document.getElementById("cashOpts")?.addEventListener("change", () => handleIrCalculation(true));
  document.getElementById("spouseActivity")?.addEventListener("change", () => handleIrCalculation(true));
  document.getElementById("spouseACRE")?.addEventListener("change", () => handleIrCalculation(true));

  // Projection Control
  document.getElementById("projectYearsBtn")?.addEventListener("click", handleProjection);
}

// --- App Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  // Initialize UI components
  initTheme();
  initPinbar();
  initViewMode();
  initNotes();

  // Set up all event listeners
  setupEventListeners();

  // Run initial calculations
  updateAllCalculations();
});
