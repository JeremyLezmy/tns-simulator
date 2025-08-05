/*
 * Copyright © 2025 Jérémy Lezmy.
 *
 * Manages the display of notes and sources in the UI.
 */

const NOTES = {
  howto:
    "<h3>Guide d’utilisation</h3>" +
    "<ol>" +
    "<li>Choisissez le <b>mode</b> (TNS / SASU-IR / SASU-IS / Micro / Salariat) en haut.</li>" +
    "<li>Renseignez les paramètres de l’<b>année 1</b> (CA, salaires, charges, croissance, conjoint, etc.) et les champs de <b>croissance</b> (inflation, PASS, SMIC, salaire, CA, etc.).</li>" +
    "<li>Cliquez sur <b>Calculer (année 1)</b> pour déclencher le calcul spécifique au mode ; la projection se lance automatiquement ensuite.</li>" +
    "<li>Dans le bloc <b>IR du foyer</b>, choisissez si vous incluez le conjoint (<i>Vous seul(e)</i> vs <i>Vous + conjoint(e)</i>), ajustez le nombre de <b>parts</b> et activez la déduction CSG si applicable pour les TNS.</li>" +
    "<li>Comprenez les notions : <b>RNI</b> (base fiscale pour l’IR) vs <b>Net foyer</b> (flux réellement perçu = encaissements − IR).</li>" +
    "<li>Analysez les <b>warnings</b> : dépassements micro, risques PUMA/CSM, validation trimestres retraite, sortie du régime micro après deux dépassements consécutifs.</li>" +
    "<li>Exportez vos résultats détaillés via <b>CSV</b> en version française ou internationale.</li>" +
    "</ol>",
  params:
    "<h3>Paramètres & hypothèses</h3>" +
    "<ul>" +
    "<li><b>Indexation</b> : PASS, SMIC et barème IR sont indexés selon les champs d’inflation/croissance que vous fournissez.</li>" +
    "<li><b>TNS</b> : assiette A = 74 % × R ; cotisations plafonnées selon PASS (maladie ≤ 3 PASS, IJ ≤ 5 PASS, retraite, RCI, etc.) ; CSG-CRDS 9,7 % de A (dont 6,8 % est déductible si option activée, ce qui réduit le RNI).</li>" +
    "<li><b>SASU-IR</b> : salaire imposable = 90 % du brut (assimilation salarié) ; quote-part BNC s’ajoute directement ; prélèvements sociaux sur BNC/quote-part paramétrables.</li>" +
    "<li><b>SASU-IS</b> : coût employeur = brut × (1 + charges patronales) ; résultat imposable = marge − coût employeur ; IS = 15 % jusqu’au seuil PME, puis taux normal (25 %) ; dividendes distribués peuvent être taxés via le PFU (12,8 % + 17,2 % PS) ou au barème avec abattement 40 % + PS 17,2 %.</li>" +
    "<li><b>Salariat</b> : décomposition détaillée salariat/employeur (vieillesse, retraite complémentaire, maladie, chômage, AGS, formation, FNAL, CSG/CRDS, etc.). Taux effectifs affichés pour transparence.</li>" +
    "<li><b>Micro-entreprise</b> : abattement forfaitaire (34 %) → base IR = 66 % du CA ; dépassement toléré une année, deux dépassements consécutifs entraînent la sortie du régime micro.</li>" +
    "<li><b>Conjoint</b> : inclusion optionnelle. La part fiscale (base) est traitée via <i>baseSpouse</i> (66 % du CA si inclus) et le flux réel via <i>spouseCash</i>. Cela permet de dissocier ce qui entre dans la taxation de ce qui est réellement perçu.</li>" +
    "<li><b>Parts fiscales</b> : le RNI est divisé par le nombre de parts pour appliquer le barème, puis multiplié pour obtenir l'IR total.</li>" +
    "</ul>",
  sources:
    "<h3>Sources officielles & compléments</h3>" +
    "<ul>" +
    "<li><b>Barème IR 2025</b> (revenus 2024) — Service-Public : <a target='_blank' rel='noopener' href='https://www.service-public.fr/particuliers/actualites/A18045'>A18045</a> et brochure pratique IR 2025 sur impots.gouv.fr : <a target='_blank' rel='noopener' href='https://www.impots.gouv.fr/portail/files/media/1_metier/2_particulier/documentation/brochure/ir_2025/ir_2025.pdf'>IR 2025</a></li>" +
    "<li><b>PASS 2025</b> = 47 100 € — Service-Public : <a target='_blank' rel='noopener' href='https://www.service-public.fr/particuliers/actualites/A15386'>A15386</a></li>" +
    "<li><b>Seuils micro-entreprise</b> et règles de dépassement</b> — Service-Public : <a target='_blank' rel='noopener' href='https://entreprendre.service-public.fr/vosdroits/F32353'>Seuil CA Micro</a></li>" +
    "<li><b>Articles définissant le régime micro et la ventilation des cotisations</b> — Légifrance : <a target='_blank' rel='noopener' href='https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049624097'>Article D613-4 (catégories)</a> et <a target='_blank' rel='noopener' href='https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049625405'>Article D613-6 (ventilation des cotisations)</a></li>" +
    "<li><b>Réforme BNC au 1er janvier 2026</b> — Décret n°2024-484 du 30 mai 2024 (modifications des règles applicables aux professions libérales non réglementées)</b> : <a target='_blank' rel='noopener' href='https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000049646450'>Décret n°2024-484</a></li>" +
    "<li><b>IS PME</b> 15 % jusqu’à 42 500 € — Service-Public Pro : <a target='_blank' rel='noopener' href='https://entreprendre.service-public.fr/vosdroits/F23575'>F23575</a></li>" +
    "<li><b>Fiscalité des dividendes</b> : PFU ou barème + abattement 40 % — Service-Public Pro : <a target='_blank' rel='noopener' href='https://entreprendre.service-public.fr/vosdroits/F32963'>F32963</a> et particulier : <a target='_blank' rel='noopener' href='https://www.service-public.fr/particuliers/vosdroits/F34913/1_7'>F34913</a></li>" +
    "<li><b>Cotisations URSSAF</b> (TNS, micro, salariat)</b> — URSSAF liste des cotisations : <a target='_blank' rel='noopener' href='https://www.urssaf.fr/portail/home/employeur/cotisations/liste-cotisations.html'>Liste cotisations URSSAF</a></li>" +
    "<li><b>Charges patronales</b> : synthèse & méthode de calcul</b> — L'Expert-Comptable : <a target='_blank' rel='noopener' href='https://www.l-expert-comptable.com/a/532287-montant-et-calcul-des-charges-patronales.html'>Montant et calcul des charges patronales</a></li>" +
    "<li><b>Brut → Net salarié</b> : calcul détaillé</b> — L'Expert-Comptable : <a target='_blank' rel='noopener' href='https://www.l-expert-comptable.com/calculateurs/calculer-le-salaire-brut-net.html'>Calculateur brut/net</a> • PayFit : <a target='_blank' rel='noopener' href='https://payfit.com/fr/fiches-pratiques/charges-salariales/'>Charges salariales</a></li>" +
    "<li><b>Charges patronales (fiche explicative)</b> — PayFit : <a target='_blank' rel='noopener' href='https://payfit.com/fr/fiches-pratiques/charges-patronales/'>Charges patronales</a></li>" +
    "<li><b>Statut du président de SAS/SASU et régime social associé</b> — Synthèse & actualités (ex. SASU-SASU.info) : traitement en assimilé salarié, décomposition des cotisations, taux effectifs, exonérations et précisions sur la lecture du brut/net pour les dirigeants.</b> — <a target='_blank' rel='noopener' href='https://sas-sasu.info/charges-sociales-president-sas-sasu/'>SAS-SASU.info (exemple)</a></li>" +
    "<li><b>Interprétation des taux de charges</b> : explication de la distinction entre taux effectifs (charges / brut) et expressions informelles comme « 80 % de charges sociales » — synthèses pédagogiques sur brut → net et coût employeur (sources telles que L'Expert-Comptable, PayFit, etc.).</b></li>" +
    "<li><b>Validation trimestres retraite</b> : 150 × SMIC horaire brut</b> — Service-Public : <a target='_blank' rel='noopener' href='https://www.service-public.fr/particuliers/vosdroits/F1761'>F1761</a></li>" +
    "<li><b>PUMA / CSM</b> — URSSAF : <a target='_blank' rel='noopener' href='https://www.urssaf.fr/accueil/particulier/beneficiaire-puma.html'>Bénéficiaire PUMa</a></li>" +
    "</ul>" +
    "<p>⚠️ Les taux et seuils évoluent chaque année : vérifiez les sources officielles au moment de l’usage (IR, PASS, SMIC, IS, règles micro, interprétation des charges, etc.).</p>",
};

export function handleNoteTabClick(key, el) {
  const contentEl = document.getElementById("noteContent");
  if (contentEl) {
    contentEl.innerHTML = NOTES[key] || "";
  }

  const tabs = document.querySelectorAll("#notes-tabs .tab");
  tabs.forEach((tab) => tab.classList.remove("active"));

  if (el) {
    el.classList.add("active");
  }
}

export function initNotes() {
  handleNoteTabClick("howto", document.querySelector('#notes-tabs .tab[data-note="howto"]'));
}
