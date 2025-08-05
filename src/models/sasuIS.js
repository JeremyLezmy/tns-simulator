/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * SASU à l'IS calculation model.
 */
import { decomposeSasuPresidentContributions } from "./salarie.js";

export function minSalaryFor4Quarters(smicHour) {
  return 600 * smicHour;
}

export function calculateSasuIs(ca, chargesPct, chargesFix, salBrut, isRedThr, isRate, distRate, divMode) {
  const marge = ca * (1 - chargesPct / 100) - chargesFix;

  // Contributions
  const deco = decomposeSasuPresidentContributions(salBrut);
  const totalSal = deco.totalSalarie;
  const totalEmp = deco.totalEmployeur;
  const costEmployeur = salBrut + totalEmp;
  const netSal = salBrut - totalSal;

  // IS Calculation
  const resImposable = Math.max(0, marge - costEmployeur);
  const isRed = Math.min(resImposable, isRedThr) * 0.15;
  const isNorm = Math.max(0, resImposable - isRedThr) * isRate;
  const isTotal = isRed + isNorm;
  const resApresIS = Math.max(0, resImposable - isTotal);

  // Dividends
  const divBrut = resApresIS * (distRate / 100);
  const psDiv = 0.172 * divBrut;
  const irDivPFU = 0.128 * divBrut;
  const divNetPFU = divBrut - psDiv - irDivPFU;
  const divIrBase = 0.6 * divBrut; // For bareme option
  const divNetBareme = divBrut - psDiv;

  const divNet = divMode === "pfu" ? divNetPFU : divNetBareme;
  const totalTaxes = totalSal + totalEmp + isTotal + psDiv + (divMode === "pfu" ? irDivPFU : 0);

  return {
    marge,
    salBrut,
    netSal,
    costEmployeur,
    resImposable,
    isTotal,
    resApresIS,
    divBrut,
    divNet,
    divIrBase,
    psDiv,
    totalTaxes,
    encaissements: netSal + divNet,
    contributions: deco,
  };
}
