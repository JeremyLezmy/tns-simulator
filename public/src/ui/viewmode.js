/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Manages the responsive view mode (auto, mobile, desktop).
 */
import { getItem, setItem } from "../utils/storage.js";

const VIEW_MODE_KEY = "view_mode";

export function handleViewModeChange(mode) {
  const root = document.documentElement;
  root.classList.remove("force-mobile", "force-desktop");
  if (mode === "mobile") root.classList.add("force-mobile");
  else if (mode === "desktop") root.classList.add("force-desktop");
  setItem(VIEW_MODE_KEY, mode);
}

export function initViewMode() {
  const savedMode = getItem(VIEW_MODE_KEY) || "auto";
  const viewModeSel = document.getElementById("viewMode");
  if (viewModeSel) {
    viewModeSel.value = savedMode;
  }
  handleViewModeChange(savedMode);
}
