/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Manages the pinning behavior of the topbar.
 */
import { getItem, setItem } from "../utils/storage.js";

const PIN_STORAGE_KEY = "simv122_pin";
const HEADER_ID = "app-header";
const SPACER_ID = "app-header-spacer";

function refreshHeaderHeight() {
  const header = document.getElementById(HEADER_ID);
  if (!header) return;
  const h = header.getBoundingClientRect().height;
  document.documentElement.style.setProperty("--topbar-h", `${h}px`);
}

function updateSpacerVisibility() {
  const header = document.getElementById(HEADER_ID);
  const spacer = document.getElementById(SPACER_ID);
  if (!header || !spacer) return;

  const isPinned = !header.classList.contains("unpinned");
  if (isPinned) {
    const h = header.getBoundingClientRect().height;
    spacer.style.height = `${h}px`;
  } else {
    spacer.style.height = "0";
  }
}

// ✅ MODIFICATION 1 : On ajoute un paramètre `isInitialLoad`
function setPinUI(isPinned, isInitialLoad = false) {
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

    // ✅ MODIFICATION 2 : On n'exécute le scroll que si ce n'est PAS le chargement initial
    if (!isInitialLoad) {
      requestAnimationFrame(() => {
        const rectAfter = refElement ? refElement.getBoundingClientRect() : { top: 0 };
        const shift = rectAfter.top - rectBefore.top;

        if (Math.abs(shift) > 1) {
          window.scrollBy(0, shift);
        }
      });
    }
  });
}

export function handlePinToggle() {
  const header = document.getElementById(HEADER_ID);
  if (!header) return;
  const currentlyPinned = !header.classList.contains("unpinned");
  // On appelle SANS le deuxième paramètre (il sera `false` par défaut)
  setPinUI(!currentlyPinned);
}

export function initPinbar() {
  const savedPin = getItem(PIN_STORAGE_KEY);
  // ✅ MODIFICATION 3 : On passe `true` pour indiquer que c'est le chargement initial
  setPinUI(savedPin !== "off", true);

  window.addEventListener("resize", () => {
    refreshHeaderHeight();
    updateSpacerVisibility();
  });
  window.addEventListener("load", () => {
    // Ces appels sont un peu redondants mais ne font pas de mal, on les laisse.
    refreshHeaderHeight();
    updateSpacerVisibility();
  });
}
