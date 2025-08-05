/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * DOM manipulation helper functions.
 */

/**
 * Safely sets the text content of an element by its ID.
 * @param {string} id - The ID of the element.
 * @param {string} text - The text to set.
 */
export function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
  }
}

/**
 * Gets the numerical value from an input element by its ID.
 * @param {string} id - The ID of the input element.
 * @returns {number} The parsed number, or 0 if invalid.
 */
export function val(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const raw = (el.value || "").toString().replace(",", ".");
  const x = parseFloat(raw);
  return isFinite(x) ? x : 0;
}

/**
 * A simple console logger for debugging purposes.
 * @param {string} id - The ID of the console element.
 * @param {string} msg - The message to log.
 */
function logToConsole(id, msg) {
  const c = document.getElementById(id);
  if (!c) return;
  const t = new Date().toLocaleTimeString("fr-FR");
  c.textContent += `[${t}] ${msg}\n`;
  c.scrollTop = c.scrollHeight;
}

export function log(msg) {
  logToConsole("console", msg);
}

export function logIR(msg) {
  logToConsole("consoleIR", msg);
}

// Global error handler
window.onerror = function (message, source, lineno, colno, error) {
  const errorMsg = `ERREUR: ${message} (${lineno}:${colno})`;
  log(errorMsg);
  logIR(errorMsg);
  return false;
};
