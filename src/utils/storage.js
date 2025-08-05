/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * A safe wrapper for localStorage to handle user preferences.
 */

/**
 * Safely retrieves an item from localStorage.
 * @param {string} key - The key of the item to retrieve.
 * @returns {string|null} The value of the item, or null if not found or an error occurs.
 */
export function getItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.error("Could not access localStorage:", e);
    return null;
  }
}

/**
 * Safely sets an item in localStorage.
 * @param {string} key - The key of the item to set.
 * @param {string} value - The value to set.
 */
export function setItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error("Could not access localStorage:", e);
  }
}
