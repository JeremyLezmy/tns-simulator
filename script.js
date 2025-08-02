/*
 * Copyright © 2025 Jérémy Lezmy.
 * Usage non commercial uniquement. Pour une utilisation commerciale,
 * contactez eremy.lezmy-robert@hotmail.fr pour obtenir une licence.
 */

/* THEME + PIN */
function applyTheme(mode) {
  var root = document.documentElement;
  root.setAttribute("data-theme", mode || "auto");
  try {
    localStorage.setItem("simv122_theme", mode || "auto");
  } catch (e) {}
}
function togglePin(v) {
  var tb = document.getElementById("topbar");
  if (v === "off") {
    tb.classList.add("unpinned");
  } else {
    tb.classList.remove("unpinned");
  }
  try {
    localStorage.setItem("simv122_pin", v);
  } catch (e) {}
}
document.addEventListener("DOMContentLoaded", function () {
  var savedTheme = null,
    savedPin = null;
  try {
    savedTheme = localStorage.getItem("simv122_theme");
    savedPin = localStorage.getItem("simv122_pin");
  } catch (e) {}

  // thème par défaut sombre si rien
  if (savedTheme) {
    var themeSel = document.getElementById("themeSel");
    if (themeSel) themeSel.value = savedTheme;
    applyTheme(savedTheme);
  } else {
    var themeSel = document.getElementById("themeSel");
    if (themeSel) themeSel.value = "dark";
    applyTheme("dark");
  }

  // pin : par défaut non épinglé
  if (savedPin) {
    setPinUI(savedPin === "on");
  } else {
    setPinUI(false);
  }

  // restore rounding etc...
  showNote("howto");
  updateAll();
});

function setPinUI(isPinned) {
  const tb = document.getElementById("topbar");
  if (!tb) return;
  const btn = document.getElementById("pinBtn");
  const emoji = document.getElementById("pinEmoji");
  const text = document.getElementById("pinText");
  const anchor = document.querySelector("header") || document.body.firstElementChild;
  const beforeAnchorTop = anchor?.getBoundingClientRect().top;

  // Appliquer l’état dans une frame pour éviter reflows intermédiaires visibles
  requestAnimationFrame(() => {
    if (isPinned) {
      tb.classList.remove("unpinned");
      emoji.textContent = "📌";
      text.textContent = "Épinglée";
      btn?.setAttribute("aria-pressed", "true");
    } else {
      tb.classList.add("unpinned");
      emoji.textContent = "📍";
      text.textContent = "Non épinglée";
      btn?.setAttribute("aria-pressed", "false");
    }
    try {
      localStorage.setItem("simv122_pin", isPinned ? "on" : "off");
    } catch (e) {}

    if (typeof refreshTopbarHeight === "function") refreshTopbarHeight();
    if (typeof updateSpacerVisibility === "function") updateSpacerVisibility();

    // Ajustement du scroll une frame après que le layout ait évolué
    requestAnimationFrame(() => {
      const afterAnchorTop = anchor?.getBoundingClientRect().top;
      if (beforeAnchorTop != null && afterAnchorTop != null) {
        const shift = afterAnchorTop - beforeAnchorTop;
        if (shift !== 0) {
          window.scrollBy(0, shift);
        }
      }
    });
  });
}

function togglePinButton() {
  const tb = document.getElementById("topbar");
  const currentlyPinned = !tb.classList.contains("unpinned");
  setPinUI(!currentlyPinned);
}

function refreshTopbarHeight() {
  const tb = document.getElementById("topbar");
  if (!tb) return;
  // mesurer la hauteur effective (y compris si elle a wrap)
  const h = tb.getBoundingClientRect().height;
  document.documentElement.style.setProperty("--topbar-h", h + "px");
}
window.addEventListener("load", refreshTopbarHeight);
window.addEventListener("resize", refreshTopbarHeight);
// Si tu as un mode où la barre change de taille (ex. pin/unpin), réactualise aussi :
const originalSetPinUI = window.setPinUI;
window.setPinUI = function (...args) {
  if (originalSetPinUI) originalSetPinUI.apply(this, args);
  refreshTopbarHeight();
  updateSpacerVisibility();
};

function updateSpacerVisibility() {
  const tb = document.getElementById("topbar");
  let spacer = document.getElementById("topbar-spacer");
  if (!spacer) {
    spacer = document.createElement("div");
    spacer.id = "topbar-spacer";
    document.body.insertBefore(spacer, document.body.firstChild.nextSibling); // juste après la topbar
  }
  const isPinned = !tb.classList.contains("unpinned");
  if (isPinned) {
    // mettre un espace égal à la hauteur réelle
    const h = tb.getBoundingClientRect().height;
    spacer.style.height = h + "px";
    spacer.style.pointerEvents = "none";
  } else {
    // plus d'espace quand ce n'est pas épinglé
    spacer.style.height = "0";
  }
}

// appeler à chaque changement pertinent
window.addEventListener("load", () => {
  refreshTopbarHeight();
  updateSpacerVisibility();
});
window.addEventListener("resize", () => {
  refreshTopbarHeight();
  updateSpacerVisibility();
});

function updateSalaireHelper() {
  const mode = document.getElementById("salaireMode").value;
  const lbl = document.querySelector('label[for="salaireBrut"]');
  if (lbl) {
    lbl.textContent = mode === "mensuel" ? "Salaire brut mensuel (€)" : "Salaire brut annuel (€)";
  }
  calcSALARIE(true); // recalcule année 1 + projection
}

function switchMode(v) {
  var tns = document.getElementById("blocTNS");
  var sasu = document.getElementById("blocSASU");
  var sisu = document.getElementById("blocSASUIS");
  var micro = document.getElementById("blocMICRO");
  var salarie = document.getElementById("blocSALARIE");
  var cashSel = document.getElementById("cashOpts");

  // Cacher tout par défaut
  tns.style.display = "none";
  sasu.style.display = "none";
  sisu.style.display = "none";
  micro.style.display = "none";
  if (salarie) salarie.style.display = "none";

  if (v === "tns") {
    tns.style.display = "block";
    document.getElementById("syncSource").value = "auto";
    cashSel.value = "you_plus_spouse";
    mainCalc(true);
    syncIR();
  } else if (v === "sasuIR") {
    sasu.style.display = "block";
    document.getElementById("syncSource").value = "auto";
    cashSel.value = "you_plus_spouse";
    calcSASU(true);
    syncIR(); // met à jour l'IR après avoir rempli les valeurs micro
    return;
  } else if (v === "sasuIS") {
    sisu.style.display = "block";
    document.getElementById("syncSource").value = "auto";
    cashSel.value = "you_plus_spouse";
    calcSISU(true);
    syncIR(); // met à jour l'IR après avoir rempli les valeurs micro
    return;
  } else if (v === "micro") {
    micro.style.display = "block";
    document.getElementById("syncSource").value = "auto";
    cashSel.value = "you_plus_spouse";
    // recalcul + projection automatique en mode micro
    calcMICRO(true);
    syncIR(); // met à jour l'IR après avoir rempli les valeurs micro
    return;
  } else if (v === "salarie") {
    if (salarie) salarie.style.display = "block";
    document.getElementById("syncSource").value = "auto";
    cashSel.value = "you_plus_spouse";
    calcSALARIE(true);
    syncIR();
    return;
  }

  // Pour les autres modes, on resynchronise
  syncIR();
}

/* Console helpers */
function log(msg) {
  var c = document.getElementById("console");
  if (!c) return;
  var t = new Date().toLocaleTimeString("fr-FR");
  c.textContent += "[" + t + "] " + msg + "\\n";
  c.scrollTop = c.scrollHeight;
}
function logIR(msg) {
  var c = document.getElementById("consoleIR");
  if (!c) return;
  var t = new Date().toLocaleTimeString("fr-FR");
  c.textContent += "[" + t + "] " + msg + "\\n";
  c.scrollTop = c.scrollHeight;
}
window.onerror = function (message, source, lineno, colno, error) {
  log("ERREUR: " + message + " (" + lineno + ":" + colno + ")");
  logIR("ERREUR: " + message + " (" + lineno + ":" + colno + ")");
  return false;
};

/* === Arrondi d'affichage === */
var DISP_DEC = 0;
function applyRounding(val) {
  DISP_DEC = val === "disp2" ? 2 : 0;
  try {
    localStorage.setItem("simv122_round", val);
  } catch (e) {}
  updateAll(true); // refresh with projection
}
// Restore saved preference
(function () {
  var saved = null;
  try {
    saved = localStorage.getItem("simv122_round");
  } catch (e) {}
  if (saved) {
    DISP_DEC = saved === "disp2" ? 2 : 0;
    var sel = document.getElementById("roundSel");
    if (sel) {
      sel.value = saved;
    }
  }
})();

// setup unique listener pour le changement de statut cadre / non-cadre
let _salaryTimeout;
(function () {
  const statutEl = document.getElementById("statutSal");
  if (!statutEl) return;
  statutEl.addEventListener("change", () => {
    const statut = statutEl.value;
    const newDefault = statut === "cadre" ? 26 : 22;
    const tauxInput = document.getElementById("tauxSalarial");
    if (!tauxInput) return;
    const current = parseFloat(tauxInput.value);
    // si c'était l'ancien défaut, on le remplace par le nouveau
    if ((statut === "cadre" && current === 22) || (statut !== "cadre" && current === 26)) {
      tauxInput.value = newDefault;
    }
    // recalculer une fois
    clearTimeout(_salaryTimeout);
    _salaryTimeout = setTimeout(() => {
      calcSALARIE(true);
    }, 50);
  });
})();

/* Utils */

// ------------ safe DOM helpers ------------
function safeSetText(id, txt) {
  var el = document.getElementById(id);
  if (el) el.textContent = txt;
}

function fmtEUR(n) {
  return isFinite(n)
    ? n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: DISP_DEC, maximumFractionDigits: DISP_DEC })
    : "–";
}
function fmtPct(n) {
  return isFinite(n) ? (n * 100).toFixed(1).replace(".", ",") + " %" : "–";
}
function val(id) {
  var el = document.getElementById(id);
  if (!el) return 0;
  var raw = (el.value || "").toString().replace(",", ".");
  var x = parseFloat(raw);
  return isFinite(x) ? x : 0;
}
// Seuils micro-entreprise 2025
const MICRO_THRESHOLDS = {
  service: 77700, // prestation de services / profession libérale
  commerce: 188700, // vente de marchandises (y compris hébergement)
};

/* NOTES */
var NOTES = {
  howto:
    "<h3>Guide d’utilisation</h3>" +
    "<ol>" +
    "<li>Choisissez le <b>mode</b> (TNS / SASU-IR / SASU-IS) en haut.</li>" +
    "<li>Renseignez les paramètres de l’<b>année 1</b> et les <b>croissances</b>.</li>" +
    "<li>Cliquez sur <b>Calculer (année 1)</b> (selon le mode) – la projection se lance automatiquement.</li>" +
    "<li>Le bloc <b>IR du foyer</b> se synchronise avec le mode et agrège salaires, BNC/quote-part, dividendes (au barème si choisi), et le micro-BNC du conjoint.</li>" +
    "<li>Le <b>Net foyer</b> = encaissements (selon le mode) − IR. Il diffère du <b>RNI</b> (base fiscale).</li>" +
    "<li>Exportez via <b>CSV</b> (FR/Intl).</li>" +
    "</ol>",
  params:
    "<h3>Paramètres & hypothèses</h3>" +
    "<ul>" +
    "<li><b>PASS</b> & <b>barème IR</b> indexés par vos champs d’inflation.</li>" +
    "<li><b>TNS</b> : assiette A=74 % × R ; postes mal./IJ/retraite/RCI/ID/AF plafonnés en PASS ; CSG-CRDS 9,7 % de A (option de neutralisation IS).</li>" +
    "<li><b>SASU-IR</b> : salaire imposable = 90 % brut ; PS sur quote-part au taux paramétré (9,7 % ou 17,2 %).</li>" +
    "<li><b>SASU-IS</b> : coût employeur = brut × (1 + charges patronales %) ; résultat imposable = marge − coût employeur ; IS = 15 % sur la fraction ≤ seuil PME, puis taux normal ; dividendes = % du résultat après IS ; PFU (12,8 % + 17,2 %) ou barème (abattement 40 % + PS 17,2 %).</li>" +
    "<li><b>SMIC & trimestres</b> : 1 trimestre = <b>150 × SMIC horaire brut</b> ; 4 trimestres = 600 × SMIC horaire brut.</li>" +
    "<li><b>PUMA</b> : en l’absence de revenus d’activité, la CSM peut être due. Le simulateur signale simplement le risque (pas de calcul fin).</li>" +
    "<li>Les taux de cotisations <b>assimilé salarié</b> varient selon statut (cadre/non cadre, exonérations). On laisse des <b>taux moyens</b> modifiables.</li>" +
    "<li><b>Micro-entreprise</b> : les seuils de chiffre d’affaires annuels dépendent de la nature de l’activité (prestations de services/professions libérales ≈ " +
    fmtEUR(MICRO_THRESHOLDS.service) +
    ", vente de marchandises ≈ " +
    fmtEUR(MICRO_THRESHOLDS.commerce) +
    "). Un dépassement ponctuel est toléré une année ; en cas de dépassement pendant <b>deux années consécutives</b>, vous sortez automatiquement du régime micro et basculez au régime réel à partir du 1er janvier suivant. Voir la rubrique correspondante pour détails et sources.</li>" +
    "</ul>",
  sources:
    "<h3>Sources officielles</h3>" +
    "<ul>" +
    "<li>Barème IR 2025 (revenus 2024) — Service-Public : <a target='_blank' rel='noopener' href='https://www.service-public.fr/particuliers/actualites/A18045'>A18045</a></li>" +
    "<li>Brochure pratique IR 2025 — impots.gouv : <a target='_blank' rel='noopener' href='https://www.impots.gouv.fr/www2/fichiers/documentation/brochure/ir_2025/accueil.htm'>IR 2025</a></li>" +
    "<li>PASS 2025 = 47 100 € — Service-Public : <a target='_blank' rel='noopener' href='https://www.service-public.fr/particuliers/actualites/A15386'>A15386</a></li>" +
    "<li>IS — Taux normal 25 % et réduit 15 % (seuil 42 500 €) — Service-Public Pro : <a target='_blank' rel='noopener' href='https://entreprendre.service-public.fr/vosdroits/F23575'>F23575</a></li>" +
    "<li>Dividendes : PFU ou barème + abattement 40 % — Service-Public Pro : <a target='_blank' rel='noopener' href='https://entreprendre.service-public.fr/vosdroits/F32963'>F32963</a> • Service-Public Particulier : <a target='_blank' rel='noopener' href='https://www.service-public.fr/particuliers/vosdroits/F34913/1_7'>F34913</a></li>" +
    "<li>Validation des trimestres : <b>150 × SMIC horaire brut</b> — Service-Public : <a target='_blank' rel='noopener' href='https://www.service-public.fr/particuliers/vosdroits/F1761'>F1761</a></li>" +
    "<li>PUMA / CSM — URSSAF : <a target='_blank' rel='noopener' href='https://www.urssaf.fr/accueil/particulier/beneficiaire-puma.html'>Bénéficiaire PUMa</a></li>" +
    "<li>Dépassement des seuils micro-entreprise : tolérance sur une année, sortie automatique après deux années consécutives <a target='_blank' rel='noopener' href='https://entreprendre.service-public.fr/vosdroits/F32353'>Seuil CA Micro</a></li>" +
    "</ul>" +
    "<p>Vérifiez chaque année les taux exacts (barème IR, PASS, SMIC, IS) et conditions PME pour l’IS à 15 %.</p>",
};
function showNote(key, el) {
  var c = document.getElementById("noteContent");
  c.innerHTML = NOTES[key] || "";
  var tabs = document.querySelectorAll(".tabs .tab");
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove("active");
  }
  if (el) el.classList.add("active");
}
showNote("howto");

/* IR */
function computeTaxFromBareme(baseParPart, indexPct) {
  var factor = 1 + indexPct / 100;
  var steps = [
    { from: 0, to: 11497 * factor, rate: 0.0 },
    { from: 11497 * factor, to: 29315 * factor, rate: 0.11 },
    { from: 29315 * factor, to: 83823 * factor, rate: 0.3 },
    { from: 83823 * factor, to: 180294 * factor, rate: 0.41 },
    { from: 180294 * factor, to: Infinity, rate: 0.45 },
  ];
  var slices = [],
    tax = 0,
    tmi = 0,
    taxedBase = 0;
  for (var i = 0; i < steps.length; i++) {
    var a = steps[i].from,
      b = steps[i].to,
      r = steps[i].rate;
    var base = Math.max(0, Math.min(baseParPart, b) - a);
    if (base > 0) {
      var t = base * r;
      slices.push({ base: base, rate: r, tax: t });
      tax += t;
      taxedBase += base;
      tmi = r;
      if (baseParPart <= b) break;
    }
  }
  return { tax: tax, tmiRate: tmi, slices: slices, taxedBase: taxedBase, steps: steps };
}
function buildIrTable(res, parts) {
  var rows = res.slices
    .map(function (s, idx) {
      return (
        "<tr><td>Tranche " +
        (idx + 1) +
        '</td><td class="num">' +
        fmtEUR(s.base) +
        '</td><td class="num">' +
        (s.rate * 100).toFixed(0) +
        ' %</td><td class="num">' +
        fmtEUR(s.tax) +
        "</td></tr>"
      );
    })
    .join("");
  if (!rows) rows = '<tr><td colspan="4" class="muted">Aucune tranche taxée</td></tr>';
  document.getElementById("tblIr").innerHTML = rows;
  document.getElementById("sumBasePart").textContent = fmtEUR(res.taxedBase);
  document.getElementById("sumTaxPart").textContent = fmtEUR(res.tax);
  document.getElementById("sumBaseFoyer").textContent = fmtEUR(res.taxedBase * parts);
  document.getElementById("sumTaxFoyer").textContent = fmtEUR(res.tax * parts);
}
function calcIR() {
  var parts = Math.max(1, val("parts"));
  var rSal = val("rSal"),
    rBnc = val("rBnc"),
    rDivIR = val("rDivIR");
  var caSp = val("caSpouse");
  var rawCashPref = document.getElementById("cashOpts").value;
  var cashPref = getNormalizedCashPref(rawCashPref);
  var includeSpouse = cashPref === "you_plus_spouse";
  // cas micro : s'assurer que rBnc reflète l'abattement même si on a choisi "Vous seul"
  if (document.getElementById("modeSel").value === "micro") {
    var micro = window.__MICRO_state || {};
    var baseMicroBnc = 0.66 * (micro.ca || 0);
    document.getElementById("rSal").value = 0;
    document.getElementById("rBnc").value = Math.round(baseMicroBnc);
    document.getElementById("rDivIR").value = 0;

    // rafraîchir les variables locales après écriture pour que le reste du calcul utilise les bons
    rSal = val("rSal");
    rBnc = val("rBnc");
    rDivIR = val("rDivIR");
  }

  // base conjoint conditionnée
  var baseSpouse = includeSpouse ? 0.66 * (caSp * 12) : 0;

  var dedCsg = 0;
  if (document.getElementById("deductCsg").value === "1" && window.__A_tns) {
    dedCsg = 0.068 * window.__A_tns;
  }
  // debug log des entrées
  logIR(`calcIR start: mode=${document.getElementById("modeSel").value}, cashOpts=${document.getElementById("cashOpts").value}`);
  logIR(`  inputs: rSal=${rSal}, rBnc=${rBnc}, rDivIR=${rDivIR}, caSpouse=${caSp}`);

  // déterminer si conjoint inclus
  logIR(`  cashPref normalized: ${cashPref}, includeSpouse=${includeSpouse}`);
  // Calcul du RNI (conjoint inclus uniquement si demandé)
  var RNI = Math.max(0, rSal + rBnc + rDivIR + baseSpouse - dedCsg);
  if (document.getElementById("modeSel").value === "micro") {
    logIR(`micro RNI before tax: ${RNI}, parts=${parts}, base par part=${(RNI / parts).toFixed(2)}`);
  }

  var res = computeTaxFromBareme(RNI / parts, val("inflation"));
  var IR = res.tax * parts;

  safeSetText("rniFoyer", fmtEUR(RNI));
  safeSetText("irOut", fmtEUR(IR));
  safeSetText("tmiOut", (res.tmiRate * 100).toFixed(0) + " %");
  buildIrTable(res, parts);

  // Encaissements : "Vous seul(e)" vs "Vous + Conjoint(e)"
  var mainMode = document.getElementById("modeSel").value;
  const syncSrc = document.getElementById("syncSource").value || "auto";
  const useManual = syncSrc === "manual";

  var enc = 0;
  /* Encaissement net du/de la conjoint(e) :
       – micro‑BNC : 66 % du CA (= même base que RNI)
       – sinon     : 100 % (adapter ici si vous modélisez d’autres cas) */
  var spouseCash = includeSpouse ? 0.66 * caSp * 12 : 0;

  if (useManual) {
    // === Mode Manuel : on s’appuie sur vos champs saisis ===
    enc = rSal + rBnc + rDivIR + spouseCash;
  } else {
    // === Mode Auto : logique existante par mode principal ===
    if (mainMode === "tns") {
      enc += window.__Rout || 0;
    } else if (mainMode === "sasuIR") {
      enc += (window.__SASUSalaire || 0) + (window.__SASUBnc || 0);
    } else if (mainMode === "sasuIS") {
      enc += (window.__SISU_NetSal || 0) + (window.__SISU_DivNet || 0);
    } else if (mainMode === "micro") {
      enc += window.__MICRO_state?.ca || 0;
    } else if (mainMode === "salarie") {
      enc += window.__SALARIE_state?.netAvantIR || 0;
    } else {
      enc += rSal + rBnc + rDivIR; // fallback
    }
    enc += spouseCash;
  }

  var net = enc - IR;
  safeSetText("netFoyer", fmtEUR(net));

  window.__IR_state = {
    parts: parts,
    rSal: rSal,
    rBnc: rBnc,
    rDivIR: rDivIR,
    baseSpouse: baseSpouse,
    dedCsg: dedCsg,
    RNI: RNI,
    res: res,
    IR: IR,
    enc: enc,
    net: net,
    mode: mainMode,
    cashPref: cashPref,
    microAbattementApplied: mainMode === "micro",
  };
}

function syncIR() {
  const src = document.getElementById("syncSource").value || "auto";
  if (src === "manual") {
    calcIR();
    return;
  }

  const mode = document.getElementById("modeSel").value;

  if (mode === "tns") {
    document.getElementById("rSal").value = Math.round(0.9 * (window.__Rout || 0));
    document.getElementById("rBnc").value = 0;
    document.getElementById("rDivIR").value = 0;
  } else if (mode === "sasuIR") {
    document.getElementById("rSal").value = Math.round(0.9 * (window.__SASUSalaire || 0));
    document.getElementById("rBnc").value = Math.round(window.__SASUBnc || 0);
    document.getElementById("rDivIR").value = 0;
  } else if (mode === "sasuIS") {
    const salImp = 0.9 * (window.__SISU_SalBrut || 0);
    document.getElementById("rSal").value = Math.round(salImp);
    document.getElementById("rBnc").value = 0;
    document.getElementById("rDivIR").value = Math.round(window.__SISU_DivIRBase || 0);
  } else if (mode === "micro") {
    const micro = window.__MICRO_state || {};
    document.getElementById("rSal").value = 0;
    document.getElementById("rBnc").value = Math.round(0.66 * (micro.ca || 0));
    document.getElementById("rDivIR").value = 0;
  } else if (mode === "salarie") {
    const salImp = 0.9 * (window.__SALARIE_state?.brutTotal || 0);
    document.getElementById("rSal").value = Math.round(salImp);
    document.getElementById("rBnc").value = 0;
    document.getElementById("rDivIR").value = 0;
  }

  calcIR();
}

function getNormalizedCashPref(raw) {
  // Carte les anciennes valeurs vers les deux nouveaux cas.
  // Tout ce qui contient "spouse" ou qui est explicite avec conjoint -> you_plus_spouse
  // Les variantes "only" ou sans conjoint -> you_only
  if (!raw) return "you_plus_spouse"; // défaut
  raw = raw.toString().toLowerCase();
  if (raw.includes("only") && !raw.includes("spouse")) return "you_only";
  if (raw.includes("you_only")) return "you_only";
  if (raw.includes("you_plus_spouse")) return "you_plus_spouse";
  // les anciens :
  if (
    raw.match(/_spouse$/) ||
    raw.includes("spouse") ||
    raw.includes("sasu_bnc_spouse") ||
    raw.includes("sasu_is_spouse") ||
    raw === "tns_spouse" ||
    raw === "micro_spouse"
  ) {
    return "you_plus_spouse";
  }
  return "you_only";
}

/* TNS */
function tnsCotisations(R, PASS, includeCsg, CFP) {
  var A = 0.74 * R;
  var A_pass = Math.min(A, PASS);
  var maladie = 0.085 * Math.min(A, 3 * PASS);
  var ij = 0.005 * Math.min(A, 5 * PASS);
  var retBase = 0.1775 * A_pass + 0.0072 * Math.min(Math.max(A - PASS, 0), 4 * PASS);
  var rci = 0.081 * A_pass + 0.091 * Math.min(Math.max(A - PASS, 0), 3 * PASS);
  var id = 0.013 * A_pass;
  var af = 0;
  if (A > 1.4 * PASS) af = 0.031 * A;
  else if (A > 1.1 * PASS) {
    var rate = ((A - 1.1 * PASS) / (0.3 * PASS)) * 0.031;
    af = rate * A;
  }
  var cotSansCSG = maladie + ij + retBase + rci + id + af + (CFP || 0);
  var csg = 0.097 * A;
  var total = cotSansCSG + csg;
  if (!includeCsg) total = cotSansCSG;
  return { A: A, maladie: maladie, ij: ij, retBase: retBase, rci: rci, id: id, af: af, cotSansCSG: cotSansCSG, csg: csg, total: total };
}
function solveRForFullRemu(CA, chargesPct, chargesFixes, PASS, includeCsg, CFP) {
  var dispo = CA * (1 - chargesPct / 100) - (chargesFixes || 0);
  if (dispo <= 0) return { R: 0, dispo: dispo, cot: tnsCotisations(0, PASS, includeCsg, CFP) };
  var lo = 0,
    hi = Math.max(200000, dispo * 1.5);
  for (var i = 0; i < 20; i++) {
    var needHi = hi + tnsCotisations(hi, PASS, includeCsg, CFP).total;
    if (needHi >= dispo) break;
    hi *= 1.5;
  }
  var R = 0,
    cot = null;
  for (var j = 0; j < 150; j++) {
    var mid = (lo + hi) / 2;
    cot = tnsCotisations(mid, PASS, includeCsg, CFP);
    var need = mid + cot.total;
    if (Math.abs(need - dispo) < 0.5) {
      R = mid;
      break;
    }
    if (need > dispo) hi = mid;
    else lo = mid;
    R = mid;
  }
  cot = tnsCotisations(R, PASS, includeCsg, CFP);
  return { R: R, dispo: dispo, cot: cot };
}
function fillTnsTable(R, cot) {
  var items = [
    ["A = 74 % × R", cot.A],
    ["Maladie-maternité (8,5 % ≤ 3 PASS)", cot.maladie],
    ["Indemnités journalières (0,5 % ≤ 5 PASS)", cot.ij],
    ["Retraite de base (17,75 % ≤ PASS + 0,72 % 1–5 PASS)", cot.retBase],
    ["Retraite complémentaire RCI (8,1 % ≤ PASS + 9,1 % 1–4 PASS)", cot.rci],
    ["Invalidité-décès (1,3 % ≤ PASS)", cot.id],
    ["Allocations familiales modulées", cot.af],
  ];
  var rows = items
    .map(function (it) {
      var pr = R > 0 ? it[1] / R : 0;
      return "<tr><td>" + it[0] + '</td><td class="num">' + fmtEUR(it[1]) + '</td><td class="num">' + fmtPct(pr) + "</td></tr>";
    })
    .join("");
  document.getElementById("tblTns").innerHTML = rows;
  document.getElementById("sumHorsCsg").textContent = fmtEUR(cot.cotSansCSG);
  document.getElementById("sumHorsCsgPct").textContent = R > 0 ? fmtPct(cot.cotSansCSG / R) : "–";
  document.getElementById("sumCsg").textContent = fmtEUR(cot.csg);
  document.getElementById("sumCsgPct").textContent = R > 0 ? fmtPct(cot.csg / R) : "–";
  var tot = cot.cotSansCSG + cot.csg;
  document.getElementById("sumTot").textContent = fmtEUR(tot);
  document.getElementById("sumTotPct").textContent = R > 0 ? fmtPct(tot / R) : "–";
  window.__TNS_state = { R: R, cot: cot, items: items, tot: tot };
}
function mainCalc(triggerProj) {
  var PASS = val("pass");
  var includeCsg = document.getElementById("includeCsg").value === "1";
  var CFP = Math.max(0, val("cfp"));
  var CA = val("ca");
  var chargesPct = val("chargesPct");
  var chargesFixes = val("chargesFixes");
  var res = solveRForFullRemu(CA, chargesPct, chargesFixes, PASS, includeCsg, CFP);
  var R = res.R,
    dispo = res.dispo,
    cot = res.cot;
  window.__Rout = R;
  window.__A_tns = cot.A;
  document.getElementById("margeOut").textContent = fmtEUR(dispo);
  document.getElementById("Rout").textContent = fmtEUR(R);
  document.getElementById("Rratio").textContent = "R / CA : " + fmtPct(R / Math.max(CA, 1));
  document.getElementById("cotHorsCsg").textContent = fmtEUR(cot.cotSansCSG);
  document.getElementById("cotHorsCsgPct").textContent = "soit " + fmtPct(cot.cotSansCSG / Math.max(R, 1)) + " de R";
  document.getElementById("csgOut").textContent = fmtEUR(cot.csg);
  var total = cot.cotSansCSG + (includeCsg ? cot.csg : 0);
  document.getElementById("totalTns").textContent = fmtEUR(total);
  document.getElementById("totalTnsPct").textContent = "soit " + fmtPct(total / Math.max(R, 1)) + " de R";
  fillTnsTable(R, cot);
  if (document.getElementById("modeSel").value === "tns") {
    document.getElementById("syncSource").value = "auto";
    // document.getElementById("cashOpts").value = "you_plus_spouse";
  }
  syncIR();
  if (triggerProj) projectYears();
  log("mainCalc — CA=" + CA + " R=" + Math.round(R));
}

/* SASU IR */
function calcSASU(triggerProj) {
  var salaire = Math.max(0, val("sasuSalaire"));
  var bnc = Math.max(0, val("sasuBnc"));
  var ps = Math.max(0, parseFloat(document.getElementById("psRate").value) || 0.097);
  var salImp = 0.9 * salaire;
  var psDue = ps * bnc;
  window.__SASUSalaire = salaire;
  window.__SASUBnc = bnc;
  document.getElementById("sasuSalaireImp").textContent = fmtEUR(salImp);
  document.getElementById("sasuPs").textContent = fmtEUR(psDue);
  document.getElementById("sasuPsRateText").textContent = "Taux appliqué : " + (ps * 100).toFixed(1).replace(".", ",") + " %";
  document.getElementById("sasuRni").textContent = fmtEUR(salImp + bnc);
  var items = [
    ["Salaire brut", salaire],
    ["Salaire imposable (-10%)", salImp],
    ["Quote-part BNC", bnc],
    ["PS sur quote-part", psDue],
  ];
  var rows = items
    .map(function (it) {
      return "<tr><td>" + it[0] + '</td><td class="num">' + fmtEUR(it[1]) + "</td></tr>";
    })
    .join("");
  document.getElementById("tblSasu").innerHTML = rows;
  document.getElementById("sumSasuEnc").textContent = fmtEUR(salaire + bnc);
  if (document.getElementById("modeSel").value === "sasuIR") {
    document.getElementById("syncSource").value = "auto";
    // document.getElementById("cashOpts").value = "you_plus_spouse";
  }
  if (document.getElementById("syncSource").value === "auto") {
    syncIR();
  }
  window.__SASU_state = { salaire: salaire, salImp: salImp, bnc: bnc, psRate: ps, psDue: psDue };
  if (triggerProj) projectYears();
  log("calcSASU — salaire=" + salaire + " bnc=" + bnc);
}

/* SASU IS */
function minSalary4Quarters(smicHour) {
  return 600 * smicHour;
} // 150 × smic × 4
function updateSISUHelper() {
  var mode = document.getElementById("sisuSalaryMode").value;
  var smic = val("smicHour");
  var min = minSalary4Quarters(smic);
  var info = "Seuil 4 trimestres (brut annuel) ≈ 600 × SMIC horaire = " + fmtEUR(min);
  document.getElementById("sisuMinInfo").textContent = info;
  if (mode === "min4q") {
    document.getElementById("sisuSalaire").value = Math.round(min);
  }
}
function calcSISU(triggerProj) {
  var CA = val("sisuCA");
  var chargesPct = val("sisuChargesPct");
  var chargesFix = val("sisuChargesFix");
  var marge = CA * (1 - chargesPct / 100) - chargesFix;

  var smic = val("smicHour");
  var salMode = document.getElementById("sisuSalaryMode").value;
  var salBrut = salMode === "min4q" ? minSalary4Quarters(smic) : val("sisuSalaire");

  var rateSal = val("rateSal") / 100,
    ratePat = val("ratePat") / 100;
  var costEmployeur = salBrut * (1 + ratePat);
  var salNet = salBrut * (1 - rateSal);

  var resImposable = Math.max(0, marge - costEmployeur);

  var isRedThr = val("isRedThr");
  var isRate = val("isRate") / 100;
  var isRed = Math.min(resImposable, Math.max(0, isRedThr)) * 0.15;
  var isNorm = Math.max(0, resImposable - Math.max(0, isRedThr)) * isRate;
  var isTotal = isRed + isNorm;

  var resApresIS = Math.max(0, resImposable - isTotal);
  var distRate = val("distRate") / 100;
  var divBrut = resApresIS * distRate;

  var divMode = document.getElementById("divMode").value;
  var psDiv = 0.172 * divBrut;
  var irDivPFU = 0.128 * divBrut;
  var divNetPFU = divBrut - psDiv - irDivPFU;
  var divIRBase = 0.6 * divBrut; // abattement 40 %
  var divNetBareme = divBrut - psDiv; // IR payé via barème

  // Save globals for IR & Net
  window.__SISU_SalBrut = salBrut;
  window.__SISU_NetSal = salNet;
  window.__SISU_DivBrut = divBrut;
  window.__SISU_DivIRBase = divMode === "bareme" ? divIRBase : 0;
  window.__SISU_DivNet = divMode === "pfu" ? divNetPFU : divNetBareme;
  window.__SISU_IS = isTotal;
  window.__SISU_PS = psDiv;
  window.__SISU_DivMode = divMode;

  // KPIs
  document.getElementById("sisuKpiSal").textContent = fmtEUR(salBrut);
  document.getElementById("sisuKpiRes").textContent = fmtEUR(resImposable);
  document.getElementById("sisuKpiIS").textContent = fmtEUR(isTotal);
  document.getElementById("sisuKpiDivBrut").textContent = fmtEUR(divBrut);
  document.getElementById("sisuKpiDivNet").textContent = fmtEUR(window.__SISU_DivNet);

  // Table details
  var items = [
    ["CA", CA],
    ["Charges externes (" + chargesPct.toFixed(1).replace(".", ",") + " %)", -CA * (chargesPct / 100)],
    ["Autres charges fixes", -chargesFix],
    ["Marge avant rémunérations", marge],
    ["Salaire brut", -salBrut],
    ["Charges patronales (" + (ratePat * 100).toFixed(1).replace(".", ",") + " %)", -salBrut * ratePat],
    ["Coût employeur total", -costEmployeur],
    ["Résultat imposable IS", resImposable],
    ["IS 15 % (jusqu’au seuil)", -isRed],
    ["IS taux normal", -isNorm],
    ["IS total", -isTotal],
    ["Résultat après IS", resApresIS],
    ["Dividendes bruts (" + (distRate * 100).toFixed(0) + " % distrib.)", -divBrut],
    ["Prélèvements sociaux sur dividendes (17,2 %)", -psDiv],
  ];
  if (divMode === "pfu") {
    items.push(["IR sur dividendes (PFU 12,8 %)", -irDivPFU]);
    items.push(["Dividendes nets perçus (PFU)", divNetPFU]);
  } else {
    items.push(["Base imposable IR (abattement 40 %)", divIRBase]);
    items.push(["Dividendes nets perçus (avant IR barème)", divNetBareme]);
  }

  var rows = items
    .map(function (it) {
      return "<tr><td>" + it[0] + '</td><td class="num">' + fmtEUR(it[1]) + "</td></tr>";
    })
    .join("");
  document.getElementById("tblSISU").innerHTML = rows;
  document.getElementById("sumSISUEnc").textContent = fmtEUR(salNet + window.__SISU_DivNet);

  // Sync IR if selected
  if (document.getElementById("modeSel").value === "sasuIS") {
    document.getElementById("syncSource").value = "auto";
    // document.getElementById("cashOpts").value = "you_plus_spouse";
  }
  if (document.getElementById("syncSource").value === "auto") {
    syncIR();
  }
  if (triggerProj) projectYears();
}

/* Micro */
function calcMICRO(triggerProj) {
  var ca = Math.max(0, val("microCA"));
  var grow = val("microGrow") / 100;
  var activity = document.getElementById("microActivity").value; // 'service' ou 'commerce'
  var threshold = MICRO_THRESHOLDS[activity] || MICRO_THRESHOLDS.service;

  // Vérifier dépassement ponctuel
  var warningEl = document.getElementById("microWarning");
  var detailEl = document.getElementById("microWarningDetail");
  var exceeds = ca > threshold;

  // Stocker état pour projection
  window.__MICRO_state = {
    ca: ca,
    grow: grow,
    activity: activity,
    threshold: threshold,
    exceeds: exceeds,
  };

  document.getElementById("microKpiCA").textContent = fmtEUR(ca);

  // Première année : tolérance si dépassement unique
  var message = "";
  if (exceeds) {
    message = "⚠️ CA annuel dépasse le seuil de " + fmtEUR(threshold) + ' pour l’activité "' + activity + '".';
    warningEl.textContent = "Dépassement (à surveiller)";
    warningEl.classList.add("warn");
    detailEl.innerHTML =
      "Vous dépassez le seuil autorisé pour la micro-entreprise cette année. Si ce dépassement se répète deux années consécutives, vous passerez automatiquement au régime réel au 1er janvier suivant. Voir Notes pour les règles complètes.";
  } else {
    message = "✅ CA sous le seuil de " + fmtEUR(threshold) + ".";
    warningEl.textContent = "OK";
    warningEl.classList.remove("warn");
    warningEl.classList.add("ok");
    detailEl.textContent = "";
  }

  log("calcMICRO — CA=" + ca.toFixed(0) + " activité=" + activity + " seuil=" + threshold + (exceeds ? " (dépassement)" : ""));
  if (triggerProj) projectYears();
}

function getSalaireAnnuel() {
  var mode = document.getElementById("salaireMode").value;
  var raw = val("salaireBrut");
  if (mode === "mensuel") {
    return raw * 12;
  }
  return raw;
}

/**
 * Calcule l’état salarial (brut total, charges, net, super brut) pour une année donnée.
 * @param {number} salaireBrutAnnuel - base annuelle (fixe + variable non encore appliqué)
 * @param {number} variablePct - en fraction (0.2 pour 20%)
 * @param {number} variableFixe - montant fixe
 * @param {string} statut - 'cadre' ou autre
 * @param {number} tauxSalarial - en fraction (0.22 pour 22%)
 * @param {number} tauxPatronal - en fraction
 * @returns {object} état calculé
 */
function getSalaryState(salaireBrutAnnuel, variablePct, variableFixe, statut, tauxSalarial, tauxPatronal) {
  // rémunération totale brute = fixe + variable
  var variable = salaireBrutAnnuel * variablePct + variableFixe;
  var brutTotal = salaireBrutAnnuel + variable;

  // taux salarial effectif : si on fournit un taux différent du défaut, on l’utilise
  var defaultTaux = statut === "cadre" ? 0.26 : 0.22;
  var tauxSal = tauxSalarial != null && tauxSalarial !== defaultTaux ? tauxSalarial : defaultTaux;

  // charges salariales et net
  var chargesSalariales = brutTotal * tauxSal;
  var netAvantIR = Math.max(0, brutTotal - chargesSalariales);

  // coût employeur (super brut)
  var chargesPatronales = brutTotal * tauxPatronal;
  var superBrut = brutTotal * (1 + tauxPatronal);

  return {
    brutTotal,
    netAvantIR,
    chargesSalariales,
    chargesPatronales,
    superBrut,
  };
}

/**
 * Décomposition complète des cotisations – barème 2025
 * Retourne un objet « parts » : { label → { base, salarie, employeur } }
 * Les postes identiques côté sal. et pat. portent le même label ; ils seront fusionnés
 * ensuite dans calcSALARIE.
 */
function decomposeSalariatDetailed(brutTotal, statut) {
  const PASS = val("pass"); // PASS annuel (input UI)
  const T1_LIMIT = PASS; // Tranche 1  (0 → PASS)
  const T2_LIMIT = 8 * PASS; // Tranche 2  (PASS → 8 PASS)
  /* ---------- Seuils SMIC pour exonérations --------- */
  const smicHour = val("smicHour") || 11.65; // champ déjà présent dans l’UI
  const smicMensuel = smicHour * 151.67; // 35 h hebdo × 52/12
  const smicAnnuel = smicMensuel * 12;
  const seuilMAL_AF = 2.5 * smicAnnuel; // maladie réduite (7 %)
  const seuilAF = 3.5 * smicAnnuel; // AF réduites (3,45 %)

  /* === CALCUL DES MONTANTS === */
  const sal = {
    vieillesse_deplaf: 0.004 * brutTotal,
    vieillesse_plaf: 0.069 * Math.min(brutTotal, PASS),
    rc_tr1: 0.0315 * Math.min(brutTotal, T1_LIMIT),
    rc_tr2: 0.0864 * Math.max(0, Math.min(brutTotal, T2_LIMIT) - T1_LIMIT),
    ceg_tr1: 0.0086 * Math.min(brutTotal, T1_LIMIT),
    ceg_tr2: 0.0108 * Math.max(0, Math.min(brutTotal, T2_LIMIT) - T1_LIMIT),
    cet: 0.0014 * Math.max(0, brutTotal - PASS),
    apec: statut === "cadre" ? 0.00024 * Math.min(brutTotal, 4 * PASS) : 0,
    csg_imp: 0.024 * 0.9825 * brutTotal,
    csg_non_imp: 0.068 * 0.9825 * brutTotal,
    crds: 0.005 * 0.9825 * brutTotal,
  };

  const emp = {
    maladie: (brutTotal <= seuilMAL_AF ? 0.07 : 0.13) * brutTotal,
    vieillesse_deplaf: 0.0202 * brutTotal,
    vieillesse_plaf: 0.0855 * Math.min(brutTotal, PASS),
    alloc_fam: (brutTotal <= seuilAF ? 0.0345 : 0.0525) * brutTotal,
    chomage: 0.04 * Math.min(brutTotal, 4 * PASS),
    ags: 0.002 * Math.min(brutTotal, 4 * PASS),
    rc_tr1: 0.0472 * Math.min(brutTotal, T1_LIMIT),
    rc_tr2: 0.1295 * Math.max(0, Math.min(brutTotal, T2_LIMIT) - T1_LIMIT),
    ceg_tr1: 0.0129 * Math.min(brutTotal, T1_LIMIT),
    ceg_tr2: 0.0162 * Math.max(0, Math.min(brutTotal, T2_LIMIT) - T1_LIMIT),
    cet: 0.0021 * Math.max(0, brutTotal - PASS),
    prevoyance: statut === "cadre" ? 0.015 * Math.min(brutTotal, PASS) : 0,
    fnal: 0.001 * Math.min(brutTotal, PASS),
    csa: 0.003 * brutTotal,
    formation: 0.0055 * brutTotal, // entreprise < 11 salariés
    apprentissage: 0.0068 * brutTotal,
  };

  /* === PUSH AVEC BASE & LABEL COMMUNS === */
  const parts = {};
  function push(label, base, salarie, employeur) {
    parts[label] = { base, salarie, employeur };
  }

  // libellés harmonisés
  push("Assurance maladie", brutTotal, 0, emp.maladie);
  push("Assurance vieillesse déplaf.", brutTotal, sal.vieillesse_deplaf, emp.vieillesse_deplaf);
  push("Assurance vieillesse plaf.", Math.min(brutTotal, PASS), sal.vieillesse_plaf, emp.vieillesse_plaf);
  push("Allocations familiales", brutTotal, 0, emp.alloc_fam);
  push("Assurance chômage", Math.min(brutTotal, 4 * PASS), 0, emp.chomage);
  push("AGS", Math.min(brutTotal, 4 * PASS), 0, emp.ags);

  push("Formation professionnelle", brutTotal, 0, emp.formation);
  push("Apprentissage", brutTotal, 0, emp.apprentissage);

  push("Retraite compl. Tr. 1", Math.min(brutTotal, T1_LIMIT), sal.rc_tr1, emp.rc_tr1);
  push("Retraite compl. Tr. 2", Math.max(0, Math.min(brutTotal, T2_LIMIT) - T1_LIMIT), sal.rc_tr2, emp.rc_tr2);
  push("CEG Tr. 1", Math.min(brutTotal, T1_LIMIT), sal.ceg_tr1, emp.ceg_tr1);
  push("CEG Tr. 2", Math.max(0, Math.min(brutTotal, T2_LIMIT) - T1_LIMIT), sal.ceg_tr2, emp.ceg_tr2);
  push("CET (> PASS)", Math.max(0, brutTotal - PASS), sal.cet, emp.cet);
  if (statut === "cadre") push("Prévoyance cadres", Math.min(brutTotal, PASS), 0, emp.prevoyance);
  if (statut === "cadre") push("APEC", Math.min(brutTotal, 4 * PASS), sal.apec, 0);

  push("FNAL 0,10 %", Math.min(brutTotal, PASS), 0, emp.fnal);
  push("CSA 0,30 %", brutTotal, 0, emp.csa);

  // contributions fiscales
  push("CSG imposable", 0.9825 * brutTotal, sal.csg_imp, 0);
  push("CSG non‑imposable", 0.9825 * brutTotal, sal.csg_non_imp, 0);
  push("CRDS", 0.9825 * brutTotal, sal.crds, 0);

  // totaux
  const totalSal = Object.values(parts).reduce((s, p) => s + p.salarie, 0);
  const totalEmp = Object.values(parts).reduce((s, p) => s + p.employeur, 0);

  return {
    breakdown: parts,
    totalSalarie: totalSal,
    totalEmployeur: totalEmp,
    tauxEffectifSalarial: totalSal / brutTotal,
    tauxEffectifPatronal: totalEmp / brutTotal,
  };
}

function calcSALARIE(triggerProj) {
  const salaireDeBase = getSalaireAnnuel();
  const variablePct = val("variablePct") / 100;
  const variableFixe = val("variableFixe");
  const brutTotal = salaireDeBase + salaireDeBase * variablePct + variableFixe;

  const statut = document.getElementById("statutSal").value;

  /* === Décomposition fine === */
  const deco = decomposeSalariatDetailed(brutTotal, statut);

  /* === AGRÉGATION PAR LIBELLÉ (fusion sal. + pat.) === */
  const aggregated = {};
  let totalSal = 0,
    totalEmp = 0;

  // 1) fusionne salarie + employeur par libellé
  for (const [label, p] of Object.entries(deco.breakdown)) {
    if (label === "total") continue;
    if (!aggregated[label]) aggregated[label] = { base: p.base, sal: 0, emp: 0 };
    aggregated[label].base = Math.max(aggregated[label].base, p.base); // garde assiette max
    aggregated[label].sal += p.salarie;
    aggregated[label].emp += p.employeur;
    totalSal += p.salarie;
    totalEmp += p.employeur;
  }

  /* --- catégories pour séparateurs --- */
  const catMap = {
    Santé: ["Assurance maladie", "CSG imposable", "CSG non‑imposable", "CRDS"],
    Retraite: [
      "Assurance vieillesse déplaf.",
      "Assurance vieillesse plaf.",
      "Retraite compl. Tr. 1",
      "Retraite compl. Tr. 2",
      "CEG Tr. 1",
      "CEG Tr. 2",
      "CET (> PASS)",
      "Prévoyance cadres",
      "APEC",
    ],
    Famille: ["Allocations familiales", "FNAL 0,10 %"],
    "Chômage / AGS": ["Assurance chômage", "AGS"],
    Autres: ["Formation professionnelle", "Taxe apprentissage", "CSA 0,30 %"],
  };

  /* 2) construit les lignes avec séparateurs */
  const rows = [];
  const alreadyPrinted = new Set();

  for (const [cat, labels] of Object.entries(catMap)) {
    // ligne titre catégorie
    rows.push(`<tr class="cat-row"><td colspan="6">${cat}</td></tr>`);
    labels.forEach((label) => {
      const p = aggregated[label];
      if (!p) return; // poste absent
      alreadyPrinted.add(label);
      const pctSal = p.base ? (p.sal / p.base) * 100 : 0;
      const pctEmp = p.base ? (p.emp / p.base) * 100 : 0;
      rows.push(`
      <tr>
        <td>${label}</td>
        <td class="num">${fmtEUR(p.base)}</td>
        <td class="num">${pctSal.toFixed(2).replace(".", ",")} %</td>
        <td class="num">${fmtEUR(p.sal)}</td>
        <td class="num">${pctEmp.toFixed(2).replace(".", ",")} %</td>
        <td class="num">${fmtEUR(p.emp)}</td>
      </tr>`);
    });
  }

  /* 3) Postes non classés éventuels */
  for (const label in aggregated) {
    if (alreadyPrinted.has(label)) continue;
    const p = aggregated[label];
    const pctSal = p.base ? (p.sal / p.base) * 100 : 0;
    const pctEmp = p.base ? (p.emp / p.base) * 100 : 0;
    rows.push(`
    <tr>
      <td>${label}</td>
      <td class="num">${fmtEUR(p.base)}</td>
      <td class="num">${pctSal.toFixed(2).replace(".", ",")} %</td>
      <td class="num">${fmtEUR(p.sal)}</td>
      <td class="num">${pctEmp.toFixed(2).replace(".", ",")} %</td>
      <td class="num">${fmtEUR(p.emp)}</td>
    </tr>`);
  }

  /* === KPI + Footer === */
  const superBrut = brutTotal + totalEmp;
  const netAvantIR = brutTotal - totalSal;

  safeSetText("salBrutKpi", fmtEUR(brutTotal));
  safeSetText("salChargesSalariales", fmtEUR(totalSal));
  safeSetText("salChargesPatronales", fmtEUR(totalEmp));
  safeSetText("salSuperBrut", fmtEUR(superBrut));
  safeSetText("salNet", fmtEUR(netAvantIR));

  document.querySelector("#tblSalariatDetail tbody").innerHTML = rows.join("");

  document.getElementById("total-sal-pct").textContent = ((totalSal / brutTotal) * 100).toFixed(1).replace(".", ",") + " %";
  document.getElementById("total-emp-pct").textContent = ((totalEmp / brutTotal) * 100).toFixed(1).replace(".", ",") + " %";
  document.getElementById("total-sal-mt").textContent = fmtEUR(totalSal);
  document.getElementById("total-emp-mt").textContent = fmtEUR(totalEmp);
  document.getElementById("total-base").textContent = fmtEUR(brutTotal);

  /* === MàJ des deux champs taux désactivés === */
  document.getElementById("tauxSalarial").value = (deco.tauxEffectifSalarial * 100).toFixed(1);
  document.getElementById("tauxPatronal").value = (deco.tauxEffectifPatronal * 100).toFixed(1);
  /* === Exporte l’état pour syncIR() & projectYears() === */
  window.__SALARIE_state = {
    brutTotal: brutTotal,
    netAvantIR: netAvantIR,
    chargesSalariales: totalSal,
    chargesPatronales: totalEmp,
    superBrut: superBrut,
  };

  /* === Sync IR + projection éventuelle === */
  if (document.getElementById("modeSel").value === "salarie") {
    document.getElementById("syncSource").value = "auto";
    // document.getElementById("cashOpts").value = "you_plus_spouse";
    syncIR();
  }
  if (triggerProj) projectYears();
}

function buildProjHeader(mode) {
  let ths;
  if (mode === "salarie") {
    ths = [
      "<th>Année</th>",
      '<th class="num">PASS</th>',
      '<th class="num">SMIC h.</th>',
      "<th>Mode</th>",
      '<th class="num">Salaire brut</th>',
      '<th class="num">Super brut</th>',
      '<th class="num">Charges salariales</th>',
      '<th class="num">Net avant IR</th>',
      '<th class="num">Cotis. patronales</th>',
      '<th class="num">RNI foyer</th>',
      '<th class="num">IR</th>',
      '<th class="num">Net foyer mens.</th>',
      '<th class="num">Net foyer</th>',
    ];
  } else {
    ths = [
      "<th>Année</th>",
      '<th class="num">PASS</th>',
      '<th class="num">SMIC h.</th>',
      "<th>Mode</th>",
      '<th class="num">CA</th>',
      '<th class="num">R/Salaire</th>',
      '<th class="num">BNC</th>',
      '<th class="num">Div. bruts</th>',
      '<th class="num">Div. nets</th>',
      "<th>Mode div.</th>",
      '<th class="num">Cotis/IS/PS</th>',
      '<th class="num">RNI foyer</th>',
      '<th class="num">IR</th>',
      '<th class="num">Net foyer mens.</th>',
      '<th class="num">Net foyer</th>',
    ];
    if (mode === "micro") ths.push("<th>Warning micro</th>");
  }
  // écrase systématiquement
  document.getElementById("projHeaderRow").innerHTML = ths.join("");
}

function buildSummaryFooter(mode, sums, n) {
  const tfoot = document.getElementById("projFooter");
  if (!tfoot) return;
  tfoot.innerHTML = ""; // reset

  const tr = document.createElement("tr");
  tr.className = "summary";

  if (mode === "salarie") {
    tr.innerHTML = `
      <td>Total / Moyenne</td>
      <td class="num">–</td>
      <td class="num">–</td>
      <td></td>
      <td class="num">${fmtEUR(sums.sumR)}</td>
      <td class="num">–</td>
      <td class="num">–</td>
      <td class="num">–</td>
      <td class="num">${fmtEUR(sums.sumCot)}</td>
      <td class="num">${fmtEUR(sums.sumRNI)}</td>
      <td class="num">${fmtEUR(sums.sumIR)}</td>
      <td></td>
      <td class="num">${fmtEUR(sums.sumNet)}</td>
    `;
  } else {
    const extra = mode === "micro" ? "<td></td>" : "";
    tr.innerHTML = `
      <td>Total / Moyenne</td>
      <td class="num">–</td>
      <td class="num">–</td>
      <td></td>
      <td class="num">${fmtEUR(sums.sumCA)}</td>
      <td class="num">${fmtEUR(sums.sumR)}</td>
      <td class="num">${fmtEUR(sums.sumB)}</td>
      <td class="num">${fmtEUR(sums.sumDivB)}</td>
      <td class="num">${fmtEUR(sums.sumDivN)}</td>
      <td></td>
      <td class="num">${fmtEUR(sums.sumCot)}</td>
      <td class="num">${fmtEUR(sums.sumRNI)}</td>
      <td class="num">${fmtEUR(sums.sumIR)}</td>
      <td></td>
      <td class="num">${fmtEUR(sums.sumNet)}</td>
      ${extra}
    `;
  }

  tfoot.appendChild(tr);
}

/* PROJECTION */
function projectYears() {
  var mode = document.getElementById("modeSel").value;
  buildProjHeader(mode);
  if (mode === "tns") {
    mainCalc(false);
  } else if (mode === "sasuIR") {
    calcSASU(false);
  } else if (mode === "salarie") {
    calcSALARIE(false);
  } else {
    calcSISU(false);
  }
  calcIR();
  // ===================================================================
  // SAUVEGARDE des chiffres année 1 déjà calculés par calcIR() --------
  // ===================================================================
  const irStateY1 = window.__IR_state || {};
  const RNI_Y1 = irStateY1.RNI || 0;
  const IR_Y1 = irStateY1.IR || 0;
  const Net_Y1 = irStateY1.net || 0;
  const NetMens_Y1 = Net_Y1 / 12;
  // nous réutiliserons ces valeurs plus bas pour la 1re ligne du tableau

  var y0 = Math.round(val("startYear") || 2025);
  var n = Math.max(1, Math.round(val("years") || 1));
  var infl = val("inflation");
  var pass0 = val("pass");
  var gPass = val("passGrow") / 100;

  var smic0 = val("smicHour") || 11.65;
  var gSmic = document.getElementById("smicGrow") ? val("smicGrow") / 100 : 0.02;

  var spouseCA0 = val("caSpouse") * 12;
  var gSp = val("growth") / 100;

  var tbody = document.getElementById("tblProj");
  tbody.innerHTML = "";
  var sumCA = 0,
    sumR = 0,
    sumB = 0,
    sumDivB = 0,
    sumDivN = 0,
    sumCot = 0,
    sumRNI = 0,
    sumIR = 0,
    sumNet = 0;

  var PASS = pass0;
  var SMIC = smic0;

  // TNS / SASU-IS base inputs
  var CA = mode === "tns" ? val("ca") : mode === "sasuIS" ? val("sisuCA") : 0;
  var gCA = mode === "tns" ? val("caGrow") / 100 : mode === "sasuIS" ? val("sisuCAGrow") / 100 : 0;
  var chargesPct = mode === "tns" ? val("chargesPct") : mode === "sasuIS" ? (val("sisuChargesPct") / 100) * 100 : 0; // attention format
  var chargesFix0 = mode === "tns" ? val("chargesFixes") : mode === "sasuIS" ? val("sisuChargesFix") : 0;
  var CFP = Math.max(0, val("cfp"));
  var includeCsg = document.getElementById("includeCsg").value === "1";

  // SASU-IR
  var sal0IR = val("sasuSalaire");
  var gSalIR = val("sasuSalaireGrow") / 100;
  var bnc0 = val("sasuBnc");
  var gBnc = val("sasuBncGrow") / 100;
  var ps = Math.max(0, parseFloat(document.getElementById("psRate").value) || 0.097);

  // SASU-IS
  var salModeIS = document.getElementById("sisuSalaryMode") ? document.getElementById("sisuSalaryMode").value : "manual";
  var sal0IS = val("sisuSalaire");
  var rateSal = val("rateSal") / 100,
    ratePat = val("ratePat") / 100;
  var isRedThr = val("isRedThr");
  var isRate = val("isRate") / 100;
  var distRate = val("distRate") / 100;
  var divMode = document.getElementById("divMode") ? document.getElementById("divMode").value : "pfu";

  // ---- Salariat : base et croissance ----
  var salInputMode = document.getElementById("salaireMode").value || "annuel";
  var sal0Input = val("salaireBrut"); // valeur rentrée
  var sal0 = salInputMode === "mensuel" ? sal0Input * 12 : sal0Input; // annualise si besoin
  var gSal = val("salaireGrow") / 100; // nouvel input ajouté

  for (var k = 0; k < n; k++) {
    var year = y0 + k;
    if (k > 0) {
      PASS = PASS * (1 + gPass);
      SMIC = SMIC * (1 + gSmic);
      CA = CA * (1 + gCA);
      sal0IR = sal0IR * (1 + gSalIR);
      bnc0 = bnc0 * (1 + gBnc);
      sal0 = sal0 * (1 + gSal);
    }

    var parts = Math.max(1, val("parts"));
    var indexBar = infl * k;

    // Préférence encaissement conjoint / calcul une fois par itération
    var rawCashPref = document.getElementById("cashOpts").value;
    var cashPref = getNormalizedCashPref(rawCashPref);
    var includeSpouse = cashPref === "you_plus_spouse";

    // CA du conjoint (brut) avec croissance
    var spouseGrossCA = spouseCA0 * Math.pow(1 + gSp, k);
    // Encaissement réel et base imposable (abattement 34% équivalent à 0.66)
    var spouseCash = includeSpouse ? 0.66 * spouseGrossCA : 0;
    var baseSpouse = includeSpouse ? 0.66 * spouseGrossCA : 0;

    if (mode === "tns") {
      var res = solveRForFullRemu(CA, chargesPct, chargesFix0, PASS, includeCsg, CFP);
      var R = res.R;
      var cot = res.cot;
      var cotTot = cot.cotSansCSG + (includeCsg ? cot.csg : 0);
      var rSal = 0.9 * R;
      var dedCsg = document.getElementById("deductCsg").value === "1" ? 0.068 * cot.A : 0;
      var RNI = Math.max(0, rSal + baseSpouse - dedCsg);
      var irRes = computeTaxFromBareme(RNI / parts, indexBar);
      var IR = irRes.tax * parts;
      var enc = R + spouseCash;
      var net = enc - IR;
      var netMens = net / 12;
      /* --- forcer cohérence année 1 avec bloc KPI --- */
      if (k === 0) {
        RNI = RNI_Y1;
        IR = IR_Y1;
        net = Net_Y1;
        netMens = NetMens_Y1;
      }

      var tr = `
        <tr>
          <td>${year}</td>
          <td class="num">${fmtEUR(PASS)}</td>
          <td class="num">${fmtEUR(SMIC)}</td>
          <td>TNS</td>
          <td class="num">${fmtEUR(CA)}</td>
          <td class="num">${fmtEUR(R)}</td>
          <td class="num">–</td>
          <td class="num">–</td>
          <td class="num">–</td>
          <td>–</td>
          <td class="num">${fmtEUR(cotTot)}</td>
          <td class="num">${fmtEUR(RNI)}</td>
          <td class="num">${fmtEUR(IR)}</td>
          <td class="num">${fmtEUR(netMens)}</td>
          <td class="num">${fmtEUR(net)}</td>
        </tr>
        `.trim();
      tbody.innerHTML += tr;
      sumCA += CA;
      sumR += R;
      sumCot += cotTot;
      sumRNI += RNI;
      sumIR += IR;
      sumNet += net;
    } else if (mode === "sasuIR") {
      var salaire = sal0IR;
      var bnc = bnc0;
      var salImp = 0.9 * salaire;
      var psDue = ps * bnc;
      var RNI2 = Math.max(0, salImp + bnc + baseSpouse);
      var irRes2 = computeTaxFromBareme(RNI2 / parts, indexBar);
      var IR2 = irRes2.tax * parts;
      var enc2 = salaire + bnc + spouseCash;
      var net2 = enc2 - IR2;
      var netMens = net2 / 12;
      if (k === 0) {
        RNI2 = RNI_Y1;
        IR2 = IR_Y1;
        net2 = Net_Y1;
        netMens = NetMens_Y1;
      }

      var tr2 = `
      <tr class="salary-highlight">
        <td>${year}</td>
        <td class="num">${fmtEUR(PASS)}</td>
        <td class="num">${fmtEUR(SMIC)}</td>
        <td>SASU-IR</td>
        <td class="num">–</td>
        <td class="num">${fmtEUR(salaire)}</td>
        <td class="num">${fmtEUR(bnc)}</td>
        <td class="num">–</td>
        <td class="num">–</td>
        <td>–</td>
        <td class="num">${fmtEUR(psDue)}</td>
        <td class="num">${fmtEUR(RNI2)}</td>
        <td class="num">${fmtEUR(IR2)}</td>
        <td class="num">${fmtEUR(netMens)}</td>
        <td class="num">${fmtEUR(net2)}</td>
      </tr>
      `.trim();
      tbody.innerHTML += tr2;
      sumR += salaire;
      sumB += bnc;
      sumCot += psDue;
      sumRNI += RNI2;
      sumIR += IR2;
      sumNet += net2;
    } else if (mode === "micro") {
      var microState = window.__MICRO_state || {};
      // gérer correctement la CA micro avec sa propre croissance
      var prevCA =
        k === 0
          ? microState.ca
          : window.__MICRO_projection && window.__MICRO_projection.caHistory
          ? window.__MICRO_projection.caHistory[k - 1]
          : microState.ca;
      var caYear = prevCA * (k === 0 ? 1 : 1 + (microState.grow || 0));
      if (!window.__MICRO_projection) window.__MICRO_projection = { exceedHistory: [], caHistory: [] };
      window.__MICRO_projection.caHistory[k] = caYear;

      var exceeds = caYear > (microState.threshold || MICRO_THRESHOLDS.service);
      /* base taxable : 66 % du CA micro + évent. conjoint */
      var RNI = Math.max(0, 0.66 * caYear + baseSpouse);
      var irRes = computeTaxFromBareme(RNI / parts, indexBar);
      var IR = irRes.tax * parts;
      var enc = caYear + spouseCash;
      var net = enc - IR;
      var netMens = net / 12;
      if (k === 0) {
        RNI = RNI_Y1;
        IR = IR_Y1;
        net = Net_Y1;
        netMens = NetMens_Y1;
      }

      // historique dépassement (comme précédemment)
      if (!window.__MICRO_projection) {
        window.__MICRO_projection = { exceedHistory: [] };
      }
      var prevExceed = exceeds;
      window.__MICRO_projection.exceedHistory[k] = prevExceed;

      var blocked = false;
      if (
        k >= 2 &&
        window.__MICRO_projection.exceedHistory[k - 2] &&
        window.__MICRO_projection.exceedHistory[k - 1] &&
        window.__MICRO_projection.exceedHistory[k]
      ) {
        blocked = true;
      }

      var extraClass = blocked ? ' class="proj-blocked"' : "";
      var warningText = "";
      if (blocked) {
        warningText = "❌ Trois dépassements consécutifs : sortie du régime micro.";
      } else if (prevExceed) {
        var consec = k >= 1 && window.__MICRO_projection.exceedHistory[k - 1] ? 2 : 1;
        if (consec === 2) {
          warningText = "⚠️ Deux années d’affilée (dernier toléré).";
        } else {
          warningText = "⚠️ Dépassement cette année.";
        }
      } else {
        warningText = "✅ Sous le seuil.";
      }

      var tr = `
      <tr${extraClass}>
        <td>${year}</td>
        <td class="num">${fmtEUR(PASS)}</td>
        <td class="num">${fmtEUR(SMIC)}</td>
        <td>Micro-entreprise</td>
        <td class="num">${fmtEUR(caYear)}</td>
        <td class="num">–</td>
        <td class="num">–</td>
        <td class="num">–</td>
        <td class="num">–</td>
        <td>–</td>
        <td class="num">–</td>
        <td class="num">${fmtEUR(RNI)}</td>
        <td class="num">${fmtEUR(IR)}</td>
        <td class="num">${fmtEUR(netMens)}</td>
        <td class="num">${fmtEUR(net)}</td>
        <td>${warningText}</td>
      </tr>
      `.trim();
      tbody.innerHTML += tr;
      sumCA += caYear;
      sumCot += 0;
      sumRNI += RNI;
      sumIR += IR;
      sumNet += net;
    } else if (mode === "salarie") {
      // reconstruire dynamiquement l'état salarial avec croissance
      var statut = document.getElementById("statutSal").value;
      var tauxSalarialVal = val("tauxSalarial") / 100;
      var tauxPatronalVal = val("tauxPatronal") / 100;
      var salaireBaseAnnuel = sal0 * Math.pow(1 + gSal, k);
      var variablePct = val("variablePct") / 100;
      var variableFixe = val("variableFixe");
      var dynamicSalState = getSalaryState(salaireBaseAnnuel, variablePct, variableFixe, statut, tauxSalarialVal, tauxPatronalVal);

      var brutTotal = dynamicSalState.brutTotal;
      var netAvantIR = dynamicSalState.netAvantIR;
      var chargesSalariales = dynamicSalState.chargesSalariales;
      var chargesPatronalesDyn = dynamicSalState.chargesPatronales;
      var superBrut = dynamicSalState.superBrut;

      var salImp = 0.9 * brutTotal;
      var RNI = Math.max(0, salImp + baseSpouse);
      var irRes = computeTaxFromBareme(RNI / parts, indexBar);
      var IR = irRes.tax * parts;

      var enc = netAvantIR + spouseCash;
      var net = enc - IR;
      var netMens = net / 12;
      if (k === 0) {
        RNI = RNI_Y1;
        IR = IR_Y1;
        net = Net_Y1;
        netMens = NetMens_Y1;
      }

      var tr = `
      <tr class="salary-highlight">
        <td>${year}</td>
        <td class="num">${fmtEUR(PASS)}</td>
        <td class="num">${fmtEUR(SMIC)}</td>
        <td>Salariat</td>
        <td class="num">${fmtEUR(brutTotal)}</td>             <!-- Salaire brut -->
        <td class="num">${fmtEUR(superBrut)}</td>            <!-- Super brut -->
        <td class="num">${fmtEUR(chargesSalariales)}</td>    <!-- Charges salariales -->
        <td class="num">${fmtEUR(netAvantIR)}</td>           <!-- Net avant IR -->
        <td class="num">${fmtEUR(chargesPatronalesDyn)}</td> <!-- Cotis. patronales -->
        <td class="num">${fmtEUR(RNI)}</td>                 <!-- RNI foyer -->
        <td class="num">${fmtEUR(IR)}</td>                  <!-- IR -->
        <td class="num">${fmtEUR(netMens)}</td>             <!-- net mensuel -->
        <td class="num">${fmtEUR(net)}</td>                 <!-- Net foyer -->
      </tr>
      `.trim();

      tbody.innerHTML += tr;

      sumR += brutTotal;
      sumCot += chargesPatronalesDyn;
      sumRNI += RNI;
      sumIR += IR;
      sumNet += net;
    } else {
      // SASU-IS fallback
      var salBrut = salModeIS === "min4q" ? 600 * SMIC : sal0IS;
      var coutEmp = salBrut * (1 + ratePat);
      var salNet = salBrut * (1 - rateSal);
      var marge = CA * (1 - val("sisuChargesPct") / 100) - val("sisuChargesFix");
      var resImp = Math.max(0, marge - coutEmp);
      var isRed = Math.min(resImp, Math.max(0, isRedThr)) * 0.15;
      var isNorm = Math.max(0, resImp - Math.max(0, isRedThr)) * isRate;
      var isTot = isRed + isNorm;
      var apIS = Math.max(0, resImp - isTot);
      var divBrut = apIS * distRate;
      var psDiv = 0.172 * divBrut;
      var irPFU = 0.128 * divBrut;
      var divNetPFU = divBrut - psDiv - irPFU;
      var divIRBase = 0.6 * divBrut;
      var divNetBareme = divBrut - psDiv;
      var RNI = 0.9 * salBrut + (includeSpouse ? baseSpouse : 0) + (divMode === "bareme" ? divIRBase : 0);
      var irRes = computeTaxFromBareme(RNI / parts, indexBar);
      var IR = irRes.tax * parts;
      var divNet = divMode === "pfu" ? divNetPFU : divNetBareme;
      var enc = salNet + divNet + (includeSpouse ? spouseCash : 0);
      var net = enc - IR;
      var netMens = net / 12;
      if (k === 0) {
        RNI = RNI_Y1;
        IR = IR_Y1;
        net = Net_Y1;
        netMens = NetMens_Y1;
      }

      var cotLike = salBrut * ratePat + psDiv + (divMode === "pfu" ? irPFU : 0) + isTot;
      var tr3 = `
      <tr>
        <td>${year}</td>
        <td class="num">${fmtEUR(PASS)}</td>
        <td class="num">${fmtEUR(SMIC)}</td>
        <td>SASU-IS</td>
        <td class="num">${fmtEUR(CA)}</td>
        <td class="num">${fmtEUR(salBrut)}</td>
        <td class="num">–</td>
        <td class="num">${fmtEUR(divBrut)}</td>
        <td class="num">${fmtEUR(divNet)}</td>
        <td>${divMode === "pfu" ? "PFU" : "Barème"}</td>
        <td class="num">${fmtEUR(cotLike)}</td>
        <td class="num">${fmtEUR(RNI)}</td>
        <td class="num">${fmtEUR(IR)}</td>
        <td class="num">${fmtEUR(netMens)}</td>
        <td class="num">${fmtEUR(net)}</td>
      </tr>
      `.trim();
      tbody.innerHTML += tr3;
      sumCA += CA;
      sumR += salBrut;
      sumDivB += divBrut;
      sumDivN += divNet;
      sumCot += cotLike;
      sumRNI += RNI;
      sumIR += IR;
      sumNet += net;
    }
  }
  // rebuild summary/footer row proprement alignée
  buildSummaryFooter(
    mode,
    {
      sumCA,
      sumR,
      sumB,
      sumDivB,
      sumDivN,
      sumCot,
      sumRNI,
      sumIR,
      sumNet,
    },
    n
  );

  safeSetText("pCA", fmtEUR(sumCA));
  safeSetText("pR", fmtEUR(sumR));
  safeSetText("pBNC", fmtEUR(sumB));
  safeSetText("pDivB", fmtEUR(sumDivB));
  safeSetText("pDivN", fmtEUR(sumDivN));
  safeSetText("pCot", fmtEUR(sumCot));
  safeSetText("pRNI", fmtEUR(sumRNI));
  safeSetText("pIR", fmtEUR(sumIR));
  safeSetText("pNet", fmtEUR(sumNet));
}

function resetMICRO() {
  document.getElementById("microCA").value = 70000;
  document.getElementById("microGrow").value = 5;
  document.getElementById("microActivity").value = "service";
  calcMICRO(true);
}

function resetSALARIE() {
  document.getElementById("salaireBrut").value = 50000;
  document.getElementById("salaireMode").value = "annuel";
  document.getElementById("variablePct").value = 0;
  document.getElementById("variableFixe").value = 0;
  document.getElementById("tauxSalarial").value = 22;
  document.getElementById("tauxPatronal").value = 42;
  calcSALARIE(true);
}

function getTauxSalarialParDefaut() {
  var statut = document.getElementById("statutSal").value;
  return statut === "cadre" ? 0.26 : 0.22; // 26% cadre, 22% non-cadre (approx)
}

/* EXPORT CSV */
function toCsvNumber(n, locale) {
  if (!isFinite(n)) return "";
  var s = (Math.round(n * 100) / 100).toFixed(2);
  if (locale === "fr") {
    s = s.replace(".", ",");
  }
  return s;
}
function csvEscape(text, locale) {
  if (text == null) return "";
  var t = String(text);
  if (locale === "fr") {
    if (t.indexOf(";") >= 0 || t.indexOf("\n") >= 0 || t.indexOf('"') >= 0) {
      t = '"' + t.replace(/"/g, '""') + '"';
    }
  } else {
    if (t.indexOf(",") >= 0 || t.indexOf("\n") >= 0 || t.indexOf('"') >= 0) {
      t = '"' + t.replace(/"/g, '""') + '"';
    }
  }
  return t;
}
function toNumberFromEURText(t, locale) {
  var s = String(t);
  s = s
    .replace(/\s/g, "")
    .replace(/\u202f/g, "")
    .replace(/[^\d\-,.]/g, "");
  s = s.replace(/\./g, "").replace(",", ".");
  var f = parseFloat(s);
  return isFinite(f) ? f : 0;
}
function exportCSV() {
  // Ensure latest calculations
  var mode = document.getElementById("modeSel").value;
  if (mode === "tns") {
    mainCalc(false);
  } else if (mode === "sasuIR") {
    calcSASU(false);
  } else {
    calcSISU(false);
  }
  calcIR();
  projectYears();

  var loc = document.getElementById("csvLocale").value || "fr";
  var sep = loc === "fr" ? ";" : ",";
  function ln(a) {
    return a.join(sep) + "\r\n";
  }

  var lines = [];
  lines.push(ln(["Simulateur TNS & IR v12.2", "Date", new Date().toISOString()]));
  lines.push("\r\n");

  // Paramètres généraux
  lines.push(ln(["Paramètres généraux"]));
  lines.push(ln(["Année de départ", Math.round(val("startYear"))]));
  lines.push(ln(["Nombre d'années", Math.round(val("years"))]));
  lines.push(ln(["Inflation / index barème IR (%/an)", toCsvNumber(val("inflation"), loc)]));
  lines.push(ln(["Croissance PASS (%/an)", toCsvNumber(val("passGrow"), loc)]));
  lines.push(ln(["PASS année 1", toCsvNumber(val("pass"), loc)]));
  lines.push(ln(["SMIC horaire année 1", toCsvNumber(val("smicHour"), loc)]));
  lines.push("\r\n");

  // TNS (année 1)
  var tns = window.__TNS_state || {};
  var cot = tns.cot || { A: 0, cotSansCSG: 0, csg: 0 };
  lines.push(ln(["TNS année 1"]));
  lines.push(ln(["CA", toCsvNumber(val("ca"), loc)]));
  lines.push(ln(["Charges %", toCsvNumber(val("chargesPct"), loc)]));
  lines.push(ln(["Charges fixes", toCsvNumber(val("chargesFixes"), loc)]));
  lines.push(ln(["R (rémunération)", toCsvNumber(tns.R || 0, loc)]));
  lines.push(ln(["A (assiette)", toCsvNumber(cot.A || 0, loc)]));
  lines.push(ln(["Cotisations hors CSG", toCsvNumber(cot.cotSansCSG || 0, loc)]));
  lines.push(ln(["CSG-CRDS", toCsvNumber(cot.csg || 0, loc)]));
  lines.push("\r\n");

  // SASU IR (année 1)
  var sasu = window.__SASU_state || { salaire: 0, salImp: 0, bnc: 0, psRate: 0, psDue: 0 };
  lines.push(ln(["SASU-IR année 1"]));
  lines.push(ln(["Salaire brut", toCsvNumber(sasu.salaire, loc)]));
  lines.push(ln(["Salaire imposable (−10%)", toCsvNumber(sasu.salImp, loc)]));
  lines.push(ln(["BNC", toCsvNumber(sasu.bnc, loc)]));
  lines.push(ln(["PS (taux %)", toCsvNumber((sasu.psRate || 0) * 100, loc)]));
  lines.push(ln(["PS dus", toCsvNumber(sasu.psDue, loc)]));
  lines.push("\r\n");

  // SASU IS (année 1)
  var salBrut = window.__SISU_SalBrut || 0;
  var divBrut = window.__SISU_DivBrut || 0;
  var divNet = window.__SISU_DivNet || 0;
  var isTot = window.__SISU_IS || 0;
  var psDiv = window.__SISU_PS || 0;
  lines.push(ln(["SASU-IS année 1"]));
  lines.push(ln(["CA", toCsvNumber(val("sisuCA"), loc)]));
  lines.push(ln(["Charges %", toCsvNumber(val("sisuChargesPct"), loc)]));
  lines.push(ln(["Charges fixes", toCsvNumber(val("sisuChargesFix"), loc)]));
  lines.push(ln(["Salaire brut retenu", toCsvNumber(salBrut, loc)]));
  lines.push(ln(["Dividendes bruts", toCsvNumber(divBrut, loc)]));
  lines.push(ln(["Dividendes nets", toCsvNumber(divNet, loc)]));
  lines.push(ln(["IS total", toCsvNumber(isTot, loc)]));
  lines.push(ln(["PS sur dividendes", toCsvNumber(psDiv, loc)]));
  lines.push("\r\n");

  // IR année 1
  var ir = window.__IR_state || {
    parts: 2,
    rSal: 0,
    rBnc: 0,
    rDivIR: 0,
    baseSpouse: 0,
    dedCsg: 0,
    RNI: 0,
    res: { slices: [], taxedBase: 0, tax: 0 },
    IR: 0,
    net: 0,
    mode: "tns_spouse",
  };
  lines.push(ln(["IR du foyer (année 1)"]));
  lines.push(ln(["Parts", toCsvNumber(ir.parts, loc)]));
  lines.push(ln(["Salaire imposable", toCsvNumber(ir.rSal, loc)]));
  lines.push(ln(["BNC/Bénéfices", toCsvNumber(ir.rBnc, loc)]));
  lines.push(ln(["Dividendes (base barème après abattement)", toCsvNumber(ir.rDivIR, loc)]));
  lines.push(ln(["Base imposable conjoint", toCsvNumber(ir.baseSpouse, loc)]));
  lines.push(ln(["Déduction CSG 6,8% (TNS)", toCsvNumber(ir.dedCsg, loc)]));
  lines.push(ln(["RNI (revenu net imposable) foyer", toCsvNumber(ir.RNI, loc)]));
  lines.push(ln(["IR total", toCsvNumber(ir.IR, loc)]));
  lines.push("\r\n");

  // Projection
  lines.push(ln(["Projection pluriannuelle"]));
  lines.push(
    ln([
      "Année",
      "PASS",
      "SMIC",
      "Mode",
      "CA",
      "R/Salaire",
      "BNC",
      "Dividendes bruts",
      "Dividendes nets",
      "Mode div.",
      "Cotis/IS/PS",
      "RNI",
      "IR",
      "Net",
    ])
  );
  var rows = document.querySelectorAll("#tblProj tr");
  for (var r = 0; r < rows.length; r++) {
    var tds = rows[r].querySelectorAll("td");
    var vals = [];
    for (var c = 0; c < tds.length; c++) {
      vals.push(tds[c].innerText);
    }
    for (var i = 0; i < vals.length; i++) {
      // keep 'Mode' and 'Mode div.' as text
      if (i in { 3: 1, 9: 1 }) continue;
      var num = toNumberFromEURText(vals[i], loc);
      if (num !== 0 || vals[i].match(/[€\d]/)) {
        vals[i] = toCsvNumber(num, loc);
      }
    }
    lines.push(ln(vals));
  }

  var csv = lines.join("");
  var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  var ts = new Date();
  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }
  var fname =
    "simulateur_v12_2_" +
    ts.getFullYear() +
    pad(ts.getMonth() + 1) +
    pad(ts.getDate()) +
    "_" +
    pad(ts.getHours()) +
    pad(ts.getMinutes()) +
    pad(ts.getSeconds()) +
    (loc === "fr" ? "_fr" : "_intl") +
    ".csv";
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 2000);
}

/* Init */
function updateAll() {
  calcSASU(false);
  mainCalc(false);
  calcSISU(false);
  syncIR();
  projectYears();
}
// (function(){ updateAll(); showNote('howto'); })();

function detectMobileView() {
  if (window.innerWidth <= 840) {
    document.documentElement.classList.add("is-mobile");
  } else {
    document.documentElement.classList.remove("is-mobile");
  }
}
window.addEventListener("resize", detectMobileView);
detectMobileView(); // initial

// quand on change "Vous seul" vs "Vous + conjoint", il faut rafraîchir l'IR
document.getElementById("cashOpts")?.addEventListener("change", function () {
  // ne pas écraser syncSource ici, il reste ce qu'il est
  calcIR();
  projectYears();
});

function toggleViewMode(mode) {
  const root = document.documentElement;
  root.classList.remove("force-mobile", "force-desktop");
  if (mode === "mobile") root.classList.add("force-mobile");
  else if (mode === "desktop") root.classList.add("force-desktop");
  // optionnel : sauvegarde
  try {
    localStorage.setItem("view_mode", mode);
  } catch {}
}
(function () {
  const saved = (() => {
    try {
      return localStorage.getItem("view_mode");
    } catch {
      return null;
    }
  })();
  if (saved) {
    document.getElementById("viewMode").value = saved;
    toggleViewMode(saved);
  }
})();
function toggleCompact(on) {
  if (on) document.documentElement.classList.add("compact");
  else document.documentElement.classList.remove("compact");
}

// Remets les principaux champs TNS/SASU à leurs valeurs d'origine et recalcule
function resetAll() {
  // valeurs par défaut (tu peux ajuster si tu les gardes ailleurs)
  document.getElementById("ca").value = 100000;
  document.getElementById("chargesPct").value = 3;
  document.getElementById("chargesFixes").value = 0;
  document.getElementById("includeCsg").value = "1";
  document.getElementById("sasuSalaire").value = 12000;
  document.getElementById("sasuBnc").value = 84000;
  document.getElementById("sisuCA").value = 150000;
  document.getElementById("sisuChargesPct").value = 3;
  document.getElementById("sisuChargesFix").value = 0;
  document.getElementById("sisuSalaire").value = 20000;
  // recalcul forcé
  updateAll();
  projectYears();
}

// Réinitialise uniquement la partie SASU à l'IR
function resetSASU() {
  document.getElementById("sasuSalaire").value = 12000;
  document.getElementById("sasuSalaireGrow").value = 0;
  document.getElementById("sasuBnc").value = 84000;
  document.getElementById("sasuBncGrow").value = 5;
  document.getElementById("psRate").value = 0.097;
  calcSASU(true);
}

// Recalcule les années de projection en fonction des inputs "Année de départ", "Nombre d'années", inflation, PASS, etc.
function updateYears() {
  // Forcer recalcul de l'année 1 puis projection
  var mode = document.getElementById("modeSel").value;
  if (mode === "tns") {
    mainCalc(true);
  } else if (mode === "sasuIR") {
    calcSASU(true);
  } else {
    calcSISU(true);
  }
  calcIR();
  projectYears();
}

function ensureConsole(id) {
  var c = document.getElementById(id);
  if (!c) {
    c = document.createElement("pre");
    c.id = id;
    c.style.maxHeight = "200px";
    c.style.overflow = "auto";
    c.style.background = "#111";
    c.style.color = "#eee";
    c.style.padding = "6px";
    c.style.fontSize = "12px";
    // tu peux l'insérer dans un container existant si tu en as un ; ici on le met en fin de body
    document.body.appendChild(c);
  }
  return c;
}
function log(msg) {
  var c = ensureConsole("console");
  var t = new Date().toLocaleTimeString("fr-FR");
  c.textContent += "[" + t + "] " + msg + "\n";
  c.scrollTop = c.scrollHeight;
}
function logIR(msg) {
  var c = ensureConsole("consoleIR");
  var t = new Date().toLocaleTimeString("fr-FR");
  c.textContent += "[" + t + "] " + msg + "\n";
  c.scrollTop = c.scrollHeight;
}

// à la fin de script.js
window.applyTheme = applyTheme;
window.togglePin = togglePin;
window.switchMode = switchMode;
window.applyRounding = applyRounding;
window.mainCalc = mainCalc;
window.calcSASU = calcSASU;
window.calcSISU = calcSISU;
window.projectYears = projectYears;
window.exportCSV = exportCSV;
window.resetAll = resetAll;
window.resetSASU = resetSASU;
window.updateYears = updateYears;
window.updateAll = updateAll;
window.syncIR = syncIR;
window.showNote = showNote;
window.calcIR = calcIR;
window.updateMobileHint = detectMobileView; // exposer si besoin
window.toggleCompact = toggleCompact;
window.calcMICRO = calcMICRO;
window.resetMICRO = resetMICRO;
