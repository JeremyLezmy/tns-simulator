/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Centralized state management for the application.
 * This avoids using global `window` variables and makes data flow more explicit.
 */

export const appState = {
  // TNS state
  tns: {
    R: 0,
    A: 0,
    cotisations: {},
    dispo: 0,
  },
  // SASU-IR state
  sasuIr: {
    salaire: 0,
    bnc: 0,
    psDue: 0,
    salImp: 0,
  },
  // SASU-IS state
  sasuIs: {
    salBrut: 0,
    netSal: 0,
    divBrut: 0,
    divNet: 0,
    divIrBase: 0, // portion of dividend subject to bareme IR
    is: 0,
    ps: 0,
    divMode: "pfu",
  },
  // Micro-entreprise state
  micro: {
    ca: 0,
    grow: 0,
    activity: "bnc",
    threshold: 0,
    exceeds: false,
    acreOn: false,
    consecutiveExceeds: 0,
    cotTotal: 0,
    remuneration: 0,
  },
  // Salarié state
  salarie: {
    brutTotal: 0,
    netAvantIR: 0,
    chargesSalariales: 0,
    chargesPatronales: 0,
    superBrut: 0,
  },
  // IR state for the household
  ir: {
    RNI: 0,
    IR: 0,
    net: 0,
    tmi: 0,
    cashPref: "you_plus_spouse",
    mode: "tns",
  },
  // Display options
  ui: {
    rounding: 0, // 0 or 2 decimals
  },
};
