/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Manages the application's color theme.
 */
import { getItem, setItem } from "../utils/storage.js";

const THEME_STORAGE_KEY = "simv122_theme";

/**
 * Applies a theme to the root element.
 * @param {string} mode - The theme mode ('dark', 'light', 'auto').
 */
export function handleThemeChange(mode) {
  const finalMode = mode === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", finalMode);
  setItem(THEME_STORAGE_KEY, finalMode);
}


/**
 * Initializes the theme from localStorage or sets a default.
 */
export function initTheme() {
  const savedTheme = getItem(THEME_STORAGE_KEY) || "dark"; // Default to dark
  const themeSel = document.getElementById("themeSel");
  if (themeSel) {
    themeSel.value = savedTheme;
  }
  const toggleBtn = document.getElementById("themeToggle");
  if (toggleBtn) {
    const updateIcon = (mode) => {
      toggleBtn.textContent = mode === "dark" ? "🌙" : mode === "light" ? "☀️" : "🌓";
      toggleBtn.setAttribute("aria-label", `Thème ${mode}`);
    };
    updateIcon(savedTheme);
    toggleBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || savedTheme;
      const next = current === "dark" ? "light" : "dark";
      if (themeSel) themeSel.value = next;
      handleThemeChange(next);
      updateIcon(next);
    });
  }
  handleThemeChange(savedTheme);
}
