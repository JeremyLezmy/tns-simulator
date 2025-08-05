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
  document.documentElement.setAttribute("data-theme", mode || "auto");
  setItem(THEME_STORAGE_KEY, mode || "auto");
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
  handleThemeChange(savedTheme);
}
