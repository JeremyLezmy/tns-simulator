/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Formatting utility functions for numbers, currency, and percentages.
 */
import { appState } from "../state.js";

/**
 * Formats a number as EUR currency.
 * @param {number} n - The number to format.
 * @returns {string} The formatted currency string.
 */
export function fmtEUR(n) {
  return isFinite(n)
    ? n.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: appState.ui.rounding,
        maximumFractionDigits: appState.ui.rounding,
      })
    : "–";
}

/**
 * Formats a number as a percentage string.
 * @param {number} n - The number to format (e.g., 0.25 for 25%).
 * @returns {string} The formatted percentage string.
 */
export function fmtPct(n) {
  return isFinite(n) ? (n * 100).toFixed(1).replace(".", ",") + " %" : "–";
}
