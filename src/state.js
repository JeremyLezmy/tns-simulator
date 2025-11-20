/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Centralized state management for the application.
 * This avoids using global `window` variables and makes data flow more explicit.
 */

function defaultModeInputs() {
  return {
    tns: { ca: 100000, caGrow: 5, chargesPct: 3, chargesFixes: 0, includeCsg: "1" },
    sasuIR: { sasuSalaire: 12000, sasuSalaireGrow: 3, sasuBnc: 84000, sasuBncGrow: 3, psRate: 0.097 },
    sasuIS: {
      sisuCA: 100000,
      sisuCAGrow: 5,
      sisuChargesPct: 3,
      sisuChargesFix: 0,
      sisuSalaryMode: "min4q",
      smicHour: 11.65,
      smicGrow: 3,
      sisuSalaire: 0,
      isRedThr: 42500,
      isRate: 25,
      distRate: 100,
      divMode: "pfu",
    },
    micro: { microCA: 70000, microGrow: 5, microActivity: "bnc", microACRE: false },
    salarie: {
      salaireBrut: 50000,
      salaireMode: "annuel",
      salaireGrow: 3,
      variablePct: 0,
      variableFixe: 0,
      statutSal: "noncadre",
    },
    ir: { rSal: 0, rBnc: 0, rDivIR: 0, chargesDeduct: 0, deductCsg: "1" },
  };
}

export function createDeclarant() {
  return {
    mode: "tns",
    inputs: defaultModeInputs(),
    computed: {
      tns: { R: 0, A: 0, cotisations: {}, dispo: 0 },
      sasuIr: { salaire: 0, bnc: 0, psDue: 0, encaissements: 0, salImp: 0, rni: 0 },
      sasuIs: {
        salBrut: 0,
        netSal: 0,
        divBrut: 0,
        divNet: 0,
        divIrBase: 0,
        is: 0,
        ps: 0,
        divMode: "pfu",
        encaissements: 0,
        totalTaxes: 0,
      },
      micro: { ca: 0, cotisations: 0, remuneration: 0, baseImposable: 0, acreOn: false, activity: "bnc", totalRate: 0 },
      salarie: { brutTotal: 0, netAvantIR: 0, chargesSalariales: 0, chargesPatronales: 0, superBrut: 0 },
      ir: { RNI: 0, IR: 0, net: 0, tmi: 0 },
    },
  };
}

export const appState = {
  activeDeclarant: "d1",
  projectionScope: "foyer",
  household: {
    status: "single",
    children: 0,
    guardMode: "exclusive",
    parts: 1,
  },
  declarants: {
    d1: createDeclarant(),
    d2: createDeclarant(),
  },
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
    baseImposable: 0,
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
