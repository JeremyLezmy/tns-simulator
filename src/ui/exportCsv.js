/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Handles the logic for exporting simulation data to a CSV file.
 */
import { val } from "../utils/dom.js";
import { appState } from "../state.js";
import { handleProjection } from "../controllers/projectionController.js";

function toCsvNumber(n, locale) {
  if (!isFinite(n)) return "";
  let s = (Math.round(n * 100) / 100).toFixed(2);
  if (locale === "fr") {
    s = s.replace(".", ",");
  }
  return s;
}

function toNumberFromEURText(t) {
  let s = String(t)
    .replace(/\s/g, "")
    .replace(/\u202f/g, "") // non-breaking space
    .replace(/[^\d\-,.]/g, "")
    .replace(",", ".");
  const f = parseFloat(s);
  return isFinite(f) ? f : 0;
}

export function handleExportCsv() {
  // Ensure latest calculations are run before exporting
  handleProjection();

  const loc = document.getElementById("csvLocale").value || "fr";
  const sep = loc === "fr" ? ";" : ",";
  const ln = (a) => a.join(sep) + "\r\n";

  let lines = [];
  lines.push(ln(["Simulateur TNS & IR", "Date", new Date().toISOString()]));
  lines.push("\r\n");

  // General Parameters
  lines.push(ln(["Paramètres généraux"]));
  lines.push(ln(["Année de départ", val("startYear")]));
  lines.push(ln(["Nombre d'années", val("years")]));
  lines.push(ln(["Inflation / index barème IR (%/an)", toCsvNumber(val("inflation"), loc)]));
  lines.push(ln(["Croissance PASS (%/an)", toCsvNumber(val("passGrow"), loc)]));
  lines.push(ln(["PASS année 1", toCsvNumber(val("pass"), loc)]));
  lines.push("\r\n");

  // Projection Data
  lines.push(ln(["Projection pluriannuelle"]));
  const headerRow = document.querySelector("#projHeaderRow");
  if (headerRow) {
    const headers = Array.from(headerRow.cells).map((th) => th.innerText);
    lines.push(ln(headers));
  }

  const dataRows = document.querySelectorAll("#tblProj tr");
  dataRows.forEach((row) => {
    const cells = Array.from(row.cells).map((td, index) => {
      // Keep text for specific columns
      if (index === 3 || (headerRow.cells.length > 8 && index === 8)) {
        return td.innerText;
      }
      return toCsvNumber(toNumberFromEURText(td.innerText), loc);
    });
    lines.push(ln(cells));
  });

  const footerRow = document.querySelector("#projFooter tr");
  if (footerRow) {
    const footerCells = Array.from(footerRow.cells).map((td, index) => {
      if (index === 0) return td.innerText;
      return toCsvNumber(toNumberFromEURText(td.innerText), loc);
    });
    lines.push(ln(footerCells));
  }

  const csv = lines.join("");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const ts = new Date();
  const pad = (n) => (n < 10 ? "0" : "") + n;
  const fname = `simulateur_${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}.csv`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
