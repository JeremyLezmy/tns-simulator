# tns-simulator

**Simulateur TNS / SASU (IR / IS) + Salariat pour la France**
À partir du chiffre d’affaires ou d’un salaire brut, calcule rémunération, cotisations, impôts, net foyer et projection pluriannuelle.
Version : v1.4 (front-end statique, JavaScript/HTML/CSS, côté client).

## Sommaire

- [tns-simulator](#tns-simulator)
  - [Sommaire](#sommaire)
  - [🧠 Résumé](#-résumé)
  - [🚀 Fonctionnalités principales](#-fonctionnalités-principales)
    - [Modes supportés](#modes-supportés)
    - [Projection pluriannuelle](#projection-pluriannuelle)
    - [Synchronisation et agrégation](#synchronisation-et-agrégation)
    - [Export / UI](#export--ui)
  - [🧮 Micro-entreprise : extension \& règles](#-micro-entreprise--extension--règles)
  - [📦 Installation / Utilisation](#-installation--utilisation)
  - [🛠 Détails techniques](#-détails-techniques)
    - [Structure](#structure)
    - [Points d’entrée importants](#points-dentrée-importants)
  - [📚 Notes \& Sources](#-notes--sources)
  - [🔐 Licence](#-licence)
    - [Licence par défaut : **Usage non commercial uniquement**](#licence-par-défaut--usage-non-commercial-uniquement)
  - [🧩 Contribution](#-contribution)
  - [🔄 Roadmap / Améliorations possibles](#-roadmap--améliorations-possibles)
  - [🧪 Tests \& Vérification](#-tests--vérification)
  - [⚠️ Limitations / Avertissements](#️-limitations--avertissements)
  - [🛡 Sécurité](#-sécurité)
  - [📝 Exemple d’usage rapide](#-exemple-dusage-rapide)
  - [📬 Contact](#-contact)
  - [🧾 Fichiers importants](#-fichiers-importants)

---

## 🧠 Résumé

Ce projet aide un dirigeant (TNS, SASU à l’IR, SASU à l’IS, salarié ou micro-entreprise) à simuler, à partir d’un chiffre d’affaires ou d’un salaire brut :

* Sa rémunération effective (brute/net), ses cotisations (salariales et patronales), impôts (IR, IS, PFU/barème), dividendes, etc.
* Le revenu imposable du foyer, incluant conjoint(e) micro-BNC.
* La projection sur plusieurs années avec indexation (inflation, PASS, SMIC, croissance).
* La décomposition détaillée des charges en mode salariat avec distinction claire salarié / employeur et ajustements.
* Le suivi des règles spécifiques comme le dépassement du seuil de micro-entreprise (tolérance, sortie).

---

## 🚀 Fonctionnalités principales

### Modes supportés

* **TNS (EURL / EI à l’IS)** : calcul de la rémunération via résolution pour pleine rémunération, cotisations TNS détaillées, neutralisation CSG optionnelle pour l’IR.
* **SASU à l’IR** : transparence fiscale, salaire imposable (−10%), BNC, prélèvements sociaux sur quote-part.
* **SASU à l’IS** : combinaison salaire + dividendes, calcul de l’IS (15% réduit jusqu’au seuil PME, puis taux normal), PFU ou barème pour les dividendes.
* **Salariat** : saisie de salaire brut (avec variable fixe/%) ; décomposition salariale complète en charges salariales et patronales avec affichage en tableau à double en-tête, ajustements pour conciliations d'arrondis, calcul du net avant IR, synchronisation automatique vers l’IR du foyer.
* **Micro-entreprise** : gestion du seuil selon type d’activité, warnings en cas de dépassements successifs, blocage après trois années consécutives dépassées.

### Projection pluriannuelle

* Indexation du barème IR par inflation.
* Croissance du PASS, SMIC, CA, salaires, BNC, etc.
* Détection des dépassements de seuil pour la micro-entreprise (toléré pendant deux années consécutives, sortie forcée à la troisième).
* Ligne par année avec détail : revenus, impôts, net, cotisations, distinction de mode (dont salariat avec super-brut, charges séparées, RNI, IR).
* Mise en évidence de la ligne de total/moyenne dans le footer de la projection.

### Synchronisation et agrégation

* Synchronisation automatique de la source principale vers le calcul de l’IR du foyer (TNS, SASU-IR, SASU-IS, Salariat, Micro).
* Encaissements agrégés (dirigeant + conjoint).
* Calcul de l’IR progressif détaillé avec tranches, TMI, base fiscale, net foyer.

### Export / UI

* Export CSV (format français `;` ou international `,`).
* Gestion du thème (sombre / clair / auto), épinglage de la barre, arrondis d’affichage.
* Réinitialisation par mode, affichage dynamique des KPI.
* Tableau détaillé pour le salariat avec header fixe, différenciation salarié / employeur, et ligne total mise en évidence.
* Notes & sources intégrées avec explication des hypothèses fiscales.

---

## 🧮 Micro-entreprise : extension & règles

La micro-entreprise est gérée avec :

* Choix du type d’activité :

  * `service` / profession libérale (seuil ≈ 77 700 € en 2025),
  * `commerce` (ventes, hébergement) (seuil ≈ 188 700 € en 2025).
* **Détection de dépassement** du seuil :

  * Un dépassement isolé est **toléré**.
  * Deux années consécutives de dépassement sont **toujours tolérées** (dernier avertissement).
  * Trois années consécutives de dépassement entraînent une **sortie forcée du régime micro** (blocage signalé visuellement).
* Affichage d’un **warning** clair dans la projection, avec stylisation si blocage.
* Référence dans les notes expliquant la règle (avec lien vers sources officielles).

---

## 📦 Installation / Utilisation

Ce projet est entièrement front-end : aucun build n’est nécessaire.

1. **Cloner le dépôt**

   ```bash
   git clone https://github.com/JeremyLezmy/tns-simulator
   cd tns-simulator
   ```

2. **Ouvrir dans un navigateur**
   Ouvre `index.html` dans ton navigateur (double-clic ou `open index.html`).

3. **Paramétrer l’année 1 et projections**

   * Choisir mode de rémunération (TNS / SASU-IR / SASU-IS / Salariat / Micro).
   * Saisir CA, salaires, croissances, inflation, PASS, SMIC, etc.
   * Cliquer sur “Calculer” pour l’année 1, puis sur “Calculer la projection”.

4. **Exporter les résultats**

   * Choisir le format CSV (fr / intl).
   * Cliquer sur `Exporter CSV` pour télécharger le fichier.

---

## 🛠 Détails techniques

### Structure

* `index.html` : interface et structure (modes, contrôle, projection, notes).
* `script.js` : logique complète de simulation (IR, IS, TNS, SASU, Salariat, micro-entreprise, projection, export, UI state, synchronisation).
* `styles.css` : thème, layout responsive, mise en évidence (total, warnings), tableau à header fixe pour le salariat.

### Points d’entrée importants

* `mainCalc()` : calcule le mode TNS.
* `calcSASU()` : calcule SASU à l’IR.
* `calcSISU()` : calcule SASU à l’IS.
* `calcSALARIE()` : calcule l’état salariat complet, décompose les charges salariales/patronales, met à jour les KPI et synchronise l’IR.
* `decomposeSalariatDetailed(...)` : répartit salarié / employeur en postes avec ajustements et totaux.
* `calcMICRO()` : calcul micro-entreprise avec gestion du dépassement.
* `projectYears()` : projection pluriannuelle, inclut logique de blocage micro et consolidation des modes.
* `computeTaxFromBareme()` : cœur du calcul de l’IR progressif.
* `syncIR()` : synchronisation de la source principale vers les champs IR.
* `exportCSV()` : génère l’export complet.

---

## 📚 Notes & Sources

La simulation s’appuie sur :

* Barème de l’IR (indexé par inflation).
* Seuils et taux du PASS / SMIC / cotisations.
* Règles micro-entreprise (tolérance, sortie après trois dépassements consécutifs).
* Règles SASU (IS réduit, PFU vs barème).
* Décomposition des charges en salariat (salarié vs employeur).
* Sources officielles recommandées (impots.gouv.fr, service-public.fr, URSSAF).

*(L’utilisateur est invité à vérifier chaque année les taux exacts.)*

---

## 🔐 Licence

### Licence par défaut : **Usage non commercial uniquement**

> **Copyright © 2025 Jérémy Lezmy. Tous droits réservés.**
> Ce projet est mis à disposition **pour un usage non commercial uniquement**.
> Toute utilisation commerciale (vente, redistribution dans un produit payant, inclusion dans une offre monétisée, rebranding à des fins lucratives, etc.) est interdite **sans licence commerciale écrite explicite**.

**Exemples d’usages interdits sans accord** :

* Revente ou inclusion du simulateur comme fonctionnalité payante dans un produit.
* Redistribution dans un outil logiciel commercial sans autorisation.
* Vente directe du code ou d’un binaire dérivé.

Pour obtenir une **licence commerciale**, contacter :
`jeremy.lezmy-robert@hotmail.fr`
Un accord pourra être signé (contrat de licence) définissant l’étendue, la durée, et la contrepartie.

> Remarque : l’absence de licence open source explicite signifie que, juridiquement, **tous droits sont réservés** sauf accord contraire. Ce README, le fichier `LICENSE` et les en-têtes de fichiers servent de clarification contractuelle.

---

## 🧩 Contribution

Les contributions sont bienvenues, avec quelques conditions :

* Si tu proposes du code, tu acceptes que les contributions puissent être réutilisées selon la licence du projet (usage non commercial par défaut).
* Pour toute contribution destinée à être re-licenciée ou utilisée commercialement, **un accord explicite** devra être clarifié.
* Ouvre une issue pour discuter de la fonctionnalité ou soumets un pull request avec description claire, tests (si pertinents), et justification.

---

## 🔄 Roadmap / Améliorations possibles

* Extraction modulaire des calculs fiscaux pour tests unitaires.
* Interface d’achat/génération de licence commerciale.
* Support de scénarios multi-foyers ou de statuts mixtes.
* Internationalisation (au-delà de la France).
* Historique & export plus riche (JSON, PDF).
* Simulation “what-if” interactive (scénarios alternatifs).
* Amélioration de la granularité de décomposition salariat (taux réels par régime).

---

## 🧪 Tests & Vérification

Actuellement aucune suite automatisée incluse. Pour fiabiliser :

* Extraire les fonctions clés (`computeTaxFromBareme`, `tnsCotisations`, `calcSISU`, `calcSALARIE`, `calcMICRO`) dans un module testable.
* Ajouter des cas de référence connus (ex : CA seuil micro, dépassements successifs, comparaison salariat vs SASU).
* Valider manuellement les projections sur 3+ années.

---

## ⚠️ Limitations / Avertissements

* Estimations : les calculs sont des approximations basées sur des taux “moyens”; certains régimes ou cas particuliers peuvent diverger.
* Règles fiscales évoluent : vérifie les seuils, taux d’imposition, et conditions chaque année.
* Micro-entreprise : simplification du revenu imposable (le CA est assimilé pour le foyer).
* Salariat : la décomposition est pondérée et ne remplace pas une fiche de paie officielle, les taux réels peuvent varier selon conventions et situations.
* Ce simulateur **ne remplace pas** un conseil fiscal professionnel.

---

## 🛡 Sécurité

* Côté client uniquement : pas de backend, donc pas de stockage serveur des données.
* Données sensibles restent dans la session utilisateur (localStorage pour préférences).
* Aucune collecte externe intégrée.

---

## 📝 Exemple d’usage rapide

1. Choisis “Salariat”, définis ton salaire brut annuel (optionnellement variable % ou fixe) et ton statut (cadre / non-cadre).
2. Clique sur “Calculer (Salariat année 1)”.
3. Observe la décomposition des charges avec distinction salarié / employeur, le net avant IR et les KPI.
4. Lance “Calculer la projection” : vérifie l’évolution année par année, l’IR du foyer et le net dispo.
5. Exporte en CSV pour partager ou archiver.

---

## 📬 Contact

Jérémy Lezmy
Email : `jeremy.lezmy-robert@hotmail.fr`
Repo : [https://github.com/JeremyLezmy/tns-simulator](https://github.com/JeremyLezmy/tns-simulator)

---

## 🧾 Fichiers importants

* `index.html` : UI / structure.
* `script.js` : logique de simulation.
* `styles.css` : présentation et thèmes.
* `LICENSE` : conditions d’usage (non commercial par défaut).
* `README.md` : documentation (ce fichier).
