/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Manages the application's color theme.
 */
import { getItem, setItem } from "../utils/storage.js";
import { updateCharts } from "./charts.js";
import { appState } from "../state.js";

const THEME_STORAGE_KEY = "simv122_theme";

/**
 * Applies a theme to the root element.
 * @param {string} mode - The theme mode ('dark', 'light', 'auto').
 */
export function handleThemeChange(mode) {
  const finalMode = mode === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", finalMode);
  setItem(THEME_STORAGE_KEY, finalMode);
  
  // Refresh visible charts with new theme colors
  refreshVisibleCharts();
}

function refreshVisibleCharts() {
  // Helper to refresh a specific mode if visible
  const refreshMode = (wrapperId, mode, dataBuilder) => {
    const wrapper = document.getElementById(wrapperId);
    if (wrapper && wrapper.style.display !== "none") {
      // Small delay to ensure CSS variables are updated
      setTimeout(() => {
        const data = dataBuilder();
        if (data) {
           updateCharts(mode, data, false); // Don't force recreation, just update colors
        }
      }, 50);
    }
  };

  // TNS
  refreshMode("tnsVisualWrapper", "tns", () => {
    const d = appState.tns;
    return (d && d.R !== undefined) ? {
      net: d.R,
      cotis: d.cotisations?.cotSansCSG || 0,
      csg: d.cotisations?.csg || 0
    } : null;
  });

  // SASU IR
  refreshMode("sasuIRVisualWrapper", "sasuIR", () => {
    // Need to fetch latest calculation from controller or state
    // For now, we trigger a recalculation if possible or use stored state if available
    // Since we don't store SASU IR detailed results in appState global object same way as TNS yet,
    // we might need to rely on the controller to update it.
    // A simpler approach: Trigger the calculation button click which updates everything including charts
    document.getElementById("calcSasuIrBtn")?.click();
    return null; 
  });
  
  // For other modes, we can simulate a calc button click to refresh everything including charts with new colors
  // This is safer than reconstructing data manually here
  if (document.getElementById("tnsVisualWrapper")?.style.display !== "none") {
     document.getElementById("calcTnsBtn")?.click();
  }
  // We already handled TNS manually above, but clicking calc is also fine.
  // Let's stick to the manual data construction for TNS as it's cleaner if we have data.
  
  // SASU IS
  if (document.getElementById("sisuVisualWrapper")?.style.display !== "none") {
    document.getElementById("calcSisuBtn")?.click();
  }
  
  // Micro
  if (document.getElementById("microVisualWrapper")?.style.display !== "none") {
    document.getElementById("calcMicroBtn")?.click();
  }
  
  // Salarié
  if (document.getElementById("salarieVisualWrapper")?.style.display !== "none") {
    document.getElementById("calcSalarieBtn")?.click();
  }
}

/**
 * Initializes the theme from localStorage or sets a default.
 */
export function initTheme() {
  const savedTheme = getItem(THEME_STORAGE_KEY) || "dark"; // Default to dark
  
  const toggleBtn = document.getElementById("themeToggle");
  if (toggleBtn) {
    const updateIcon = (mode) => {
      toggleBtn.textContent = mode === "dark" ? "🌙" : "☀️";
      toggleBtn.setAttribute("aria-label", `Thème ${mode}`);
    };
    
    // Set initial state
    updateIcon(savedTheme);
    
    // Attach listener
    toggleBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || savedTheme;
      const next = current === "dark" ? "light" : "dark";
      handleThemeChange(next);
      updateIcon(next);
    });
  }
  
  // Apply initial theme
  handleThemeChange(savedTheme);
}
