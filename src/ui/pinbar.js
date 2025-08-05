/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Manages the pinning behavior of the topbar.
 */
import { getItem, setItem } from "../utils/storage.js";

const PIN_STORAGE_KEY = "simv122_pin";
const HEADER_ID = "app-header";
const SPACER_ID = "app-header-spacer"; // <-- ID MIS À JOUR ICI

function refreshHeaderHeight() {
  const header = document.getElementById(HEADER_ID);
  if (!header) return;
  const h = header.getBoundingClientRect().height;
  document.documentElement.style.setProperty("--topbar-h", `${h}px`);
}

function updateSpacerVisibility() {
  const header = document.getElementById(HEADER_ID);
  const spacer = document.getElementById(SPACER_ID); // <-- ID MIS À JOUR ICI
  if (!header || !spacer) return;

  const isPinned = !header.classList.contains("unpinned");
  if (isPinned) {
    const h = header.getBoundingClientRect().height;
    spacer.style.height = `${h}px`;
  } else {
    spacer.style.height = "0";
  }
}

function setPinUI(isPinned) {
  const header = document.getElementById(HEADER_ID);
  const btn = document.getElementById("pinBtn");
  const emoji = document.getElementById("pinEmoji");
  const text = document.getElementById("pinText");

  if (!header || !btn || !emoji || !text) return;

  const refElement = document.querySelector("header.container");
  const rectBefore = refElement ? refElement.getBoundingClientRect() : { top: 0 };

  requestAnimationFrame(() => {
    if (isPinned) {
      header.classList.remove("unpinned");
      emoji.textContent = "📌";
      text.textContent = "Épinglée";
      btn.setAttribute("aria-pressed", "true");
    } else {
      header.classList.add("unpinned");
      emoji.textContent = "📍";
      text.textContent = "Non épinglée";
      btn.setAttribute("aria-pressed", "false");
    }
    setItem(PIN_STORAGE_KEY, isPinned ? "on" : "off");

    refreshHeaderHeight();
    updateSpacerVisibility();

    requestAnimationFrame(() => {
      const rectAfter = refElement ? refElement.getBoundingClientRect() : { top: 0 };
      const shift = rectAfter.top - rectBefore.top;

      if (Math.abs(shift) > 1) {
        window.scrollBy(0, shift);
      }
    });
  });
}

export function handlePinToggle() {
  const header = document.getElementById(HEADER_ID);
  if (!header) return;
  const currentlyPinned = !header.classList.contains("unpinned");
  setPinUI(!currentlyPinned);
}

export function initPinbar() {
  const savedPin = getItem(PIN_STORAGE_KEY);
  setPinUI(savedPin !== "off");

  window.addEventListener("resize", () => {
    refreshHeaderHeight();
    updateSpacerVisibility();
  });
  window.addEventListener("load", () => {
    refreshHeaderHeight();
    updateSpacerVisibility();
  });
}
