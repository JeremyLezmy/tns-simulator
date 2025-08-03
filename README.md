# Simulateur de situation entrepreneuriale / salariat (France) v1.7 🇫🇷

![badge-stable](https://img.shields.io/badge/version-stable-green)
![badge-france](https://img.shields.io/badge/pays-France-blue)
![badge-open-source](https://img.shields.io/badge/licence-privée-lightgrey)

> **Tout‑en‑un :** calculez en quelques secondes vos rémunérations nettes,
> cotisations, impôt sur le revenu (IR) du foyer et comparez **TNS**,
> **SASU (IR ou IS)**, **micro‑entreprise** et **salariat** sur une
> **projection pluri‑annuelle** entièrement paramétrable (inflation, PASS,
> croissance CA, salaire variable, inclusion du conjoint…).

---

## Sommaire

<!-- ancre automatique des titres existants conservée -->

- [Simulateur de situation entrepreneuriale / salariat (France) v1.7 🇫🇷](#simulateur-de-situation-entrepreneuriale--salariat-france-v17-)
  - [Sommaire](#sommaire)
  - [Fonctionnalités majeures](#fonctionnalités-majeures)
  - [Prise en main rapide](#prise-en-main-rapide)
  - [Paramètres \& combinaisons possibles](#paramètres--combinaisons-possibles)
  - [Modes de calcul détaillés](#modes-de-calcul-détaillés)
    - [1. TNS](#1-tns)
      - [TNS — EURL/EI à l’IS](#tns-eurlei-à-lis)
    - [2. SASU-IR](#2-sasu-ir)
    - [3. SASU-IS — détails, UI \& logique](#3-sasu-is--détails-ui--logique)
      - [Logique de calcul (rappel \& clarifications)](#logique-de-calcul-rappel--clarifications)
      - [UI / visualisation ajoutées pour SASU-IS](#ui--visualisation-ajoutées-pour-sasu-is)
      - [Hypothèses spécifiques SASU-IS](#hypothèses-spécifiques-sasu-is)
    - [4. Micro-entreprise](#4-micro-entreprise)
    - [5. Salariat](#5-salariat)
  - [Projection multiannuelle : algorithme](#projection-multiannuelle--algorithme)
  - [Détail des variables fiscales et flux conjoints](#détail-des-variables-fiscales-et-flux-conjoints)
  - [Sources officielles \& barèmes (avec URLs)](#sources-officielles--barèmes-avec-urls)
    - [Barèmes, seuils et variables standard](#barèmes-seuils-et-variables-standard)
    - [Ventilation des cotisations micro-sociales (hors formation)](#ventilation-des-cotisations-micro-sociales-hors-formation)
      - [1. BNC (professions libérales non réglementées, réforme 2026 — taux total 26,1 %)](#1-bnc-professions-libérales-non-réglementées-réforme-2026--taux-total-261-)
      - [2. Prestations commerciales / artisanales et vente de marchandises (BIC) \& services (taux global micro-social : 21,2 % pour BIC/service, 12,3 % pour commerce/vente)](#2-prestations-commerciales--artisanales-et-vente-de-marchandises-bic--services-taux-global-micro-social--212--pour-bicservice-123--pour-commercevente)
      - [3. CIPAV (professions libérales réglementées — taux total 23,2 % hors CFP)](#3-cipav-professions-libérales-réglementées--taux-total-232--hors-cfp)
  - [FAQ \& avertissements](#faq--avertissements)
  - [Développement](#développement)
    - [Prérequis](#prérequis)
    - [Installation / utilisation locale](#installation--utilisation-locale)
    - [Export](#export)
    - [Structure du code](#structure-du-code)
  - [Licence](#licence)

---

## Fonctionnalités majeures

| Bloc                    | Ce qu’il fait                                                          | Points clés                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Mode selector**       | Basculer entre TNS, SASU‑IR, SASU‑IS, micro, salariat                  | Réinitialisation intelligente seulement au changement de mode, synchronisation encaissements & IR               |
| **Année 1**             | Saisie complète des hypothèses et calcul détaillé                      | Remontée des cotisations, RNI, IR, net foyer, salaires, dividendes, quote‑part, etc.                            |
| **Projection N années** | Génère une série temporelle indexée                                    | Indexation PASS/SMIC/IR, croissance des CA/salaires/BNC, suivi des dépassements micro, répétition d’antécédents |
| **IR du foyer**         | Calcule le barème 2025 avec parts et conjoint                          | Décomposition par tranche, TMI, inclusion/exclusion du conjoint, déduction CSG pour TNS                         |
| **Micro‑alertes**       | Détection de dépassement de seuils micro                               | Tolérance une année, blocage après trois années consécutives de dépassement                                     |
| **Export CSV**          | Génère CSV FR ou international avec toutes les données                 | Conversion automatique des formats monétaires et numériques                                                     |
| **Console de debug**    | Journalisation technique séparée pour faciliter l’analyse              | Affiche les entrées/états à chaque recalcul (IR, projection...)                                                 |
| **UI/UX avancée**       | Thème auto/sombre/clair, barre épinglable, vue compacte, mobile forced | Préférences persistées dans `localStorage`                                                                      |
| **Accessibilité**       | Attributs ARIA, compatibilité clavier, lectures claires                | Niveau de base correct, améliorable via contributions                                                           |

---

## Prise en main rapide

1. **Choisissez** un mode (TNS / SASU‑IR / SASU‑IS / Micro / Salariat).
2. **Renseignez** les paramètres de l’année 1 : chiffre d’affaires, salaire brut, croissance, inflation, PASS, SMIC, parts fiscales, situation conjoint, etc.
3. **Cliquez** sur **Calculer (année 1)** pour générer les KPI de base.
4. Le bloc **IR du foyer** se synchronise automatiquement — ajustez :
   - si vous voulez inclure le conjoint ou non ;
   - nombre de parts fiscales ;
   - types de dividendes (PFU vs barème).
5. La **projection pluriannuelle** se construit automatiquement (ou via “Calculer la projection”) en tenant compte des croissances et indexations.
6. **Exportez** en CSV ou comparez visuellement les modes.

> Les modifications sur certains champs (comme le choix “Vous seul / Vous + conjoint”) déclenchent un recalcul automatique complet (IR + projection) grâce aux listeners.

---

## Paramètres & combinaisons possibles

<details>
<summary>🛠️  Cliquer pour la liste détaillée</summary>

- **Modes de régime** :

  - TNS (Travailleur Non Salarié)
  - SASU à l’IR
  - SASU à l’IS
  - Micro-entreprise (BNC/BIC selon activité)
  - Salariat (avec décomposition fine sal./pat.)

- **Variables ajustables** :

  - Chiffre d’affaires (CA) et croissances associées
  - Salaires de base et croissance
  - Abattements (ex. 10% sur salaire imposable SASU-IR, 40% sur dividendes barème)
  - Taux de charges patronales / salariales
  - Inclusion/exclusion du conjoint (`you_only` vs `you_plus_spouse`)
  - Nombre de parts fiscales
  - Inflation (indexation barème IR)
  - Croissance PASS, SMIC
  - Mode de distribution des dividendes (PFU vs barème)
  - Déduction CSG (TNS)
  - Statut cadre/non-cadre pour salariat (impact sur taux)
  - Mode de salaire minimum (ex. 4 trimestres SMIC pour SASU-IS)

- **Combinaisons courantes** :
  - Comparaison SASU-IR vs salariat avec conjoint inclus
  - Simulation de sortie du régime micro sur 3 ans avec dépassements successifs
  - Projection inflationnée de PASS/SMIC + évolution de revenu salarié
  - Double foyer (vous + conjoint) avec répartition micro BNC + dividendes

</details>

---

## Modes de calcul détaillés

### 1. TNS

- **Assiette** : A = 0.74 × R (R étant la rémunération nette calculée).
- **Cotisations URSSAF** (décomposées) :
  - Maladie-maternité (8,5 % plafonné à 3 PASS)
  - Indemnités journalières (0,5 % ≤ 5 PASS)
  - Retraite de base (17,75 % sur 1 PASS + 0,72 % sur 1–5 PASS)
  - Retraite complémentaire (RCI) : 8,1 % + 9,1 % (selon tranche)
  - Invalidité-décès (1,3 % sur PASS)
  - Allocations familiales (taux modulé selon niveau de A)
  - CSG-CRDS : 9,7 % de A (séparable si on neutralise)
  - CFP optionnelle
- **RNI (Revenu Net Imposable)** : = max(0, 0.9×R + baseSpouse − déduction CSG 6,8 % si activée)
- **Encaissement foyer** : R + spouseCash (si conjoint inclus)
- **Net foyer** = encaissement − IR.

#### TNS — EURL/EI à l’IS

<!-- ★ new -->

> **Pourquoi un sous‑cas ?**  
> Dans une **EURL** ou **Entreprise Individuelle (EI)** ayant **opté pour l’IS**, la société
> est soumise à l’impôt sur les sociétés, _mais_ le **gérant associé unique** reste
> affilié au régime **TNS** pour ses cotisations sociales. L’outil gère déjà la
> mécanique TNS ; cette sous‑section explicite simplement la façon dont l’IS et
> les dividendes s’enchaînent.

| Étape                         | Calcul / Règle dans le simulateur                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| Rémunération gérant **(TNS)** | Même algorithme que la section TNS principale (assiette 74 % × R, plafonds PASS, etc.) |
| **IS** sur résultat           | Barème PME 15 % puis taux normal (25 % par défaut)                                     |
| **Dividendes**                | Identiques à SASU‑IS : PFU (12,8 % + PS 17,2 %) ou barème + abattement 40 %            |
| **RNI foyer**                 | = Rémunération imposable (TNS) + dividendes imposables + baseSpouse                    |
| **Net foyer**                 | = Flux net TNS + dividendes nets + spouseCash − IR                                     |

**Particularités prises en charge :**

- La **CSG déductible** sur la rémunération TNS reste
  applicable, même si la structure est à l’IS.
- Les dividendes remontent dans la base fiscale **selon l’option
  PFU / barème**, comme pour la SASU‑IS.
- Les taux effectifs de cotisations restent ceux du TNS (donc
  **plus bas** que pour l’assimilé salarié).

### 2. SASU-IR

- _Ajout visuel :_ badges « IR » sur les KPI de la vue synthèse pour
  identifier rapidement la part imposable. <!-- purely UI note -->
- _Quote‑part BNC :_ l’appli permet désormais d’**indexer distinctement** la
  croissance de la quote‑part BNC (utilisez `bncGrow`).
- _Rémunération :_ vous pouvez choisir entre **montant fixe** ou
  **pourcentage du CA** grâce au nouveau champ `salaryPctOfCA` (si > 0,
  l’outil ignore `salaryFixed`).

### 3. SASU-IS — détails, UI & logique

- Salaire (brut) : application de charges patronales et salariales selon taux fournis.
- Résultat imposable = marge − coût employeur (salaire + charges patronales).
- **IS** :
  - 15 % jusqu’au seuil PME (42 500 €), puis taux normal (25 % ou ce qui est défini pour 2025).
- Dividendes distribués après IS :
  - PFU : 12,8 % IR + 17,2 % prélèvements sociaux
  - Barème : abattement 40 %, puis IR au barème + PS 17,2 %.
- **RNI** agrège salaire imposable, dividendes (selon mode), + conjoint.

#### Logique de calcul (rappel & clarifications)

- **Chemin complet du chiffre d’affaires au net perçu par le dirigeant** :

  1. CA
  2. - Charges externes et fixes
  3. = Marge avant rémunération
  4. - Salaire brut
  5. (Affiché) Charges **salariales** — **visibilité uniquement** : elles font partie du brut, _elles ne sont pas retraitées une seconde fois_ dans le résultat imposable. Ce poste est inséré entre « Salaire brut » et « Charges patronales » pour aider la lecture (séparation visuelle des composantes de la rémunération).
  6. - Charges **patronales**
  7. = Coût employeur total
  8. = Marge − Coût employeur → Résultat imposable à l’IS
  9. Calcul de l’IS (15 % sur le seuil PME, puis taux normal).
  10. Déduction de l’IS → Résultat après IS
  11. Distribution partielle ou totale en dividendes (PFU ou barème)
  12. Somme finale perçue = Net salaire + Dividendes nets

- **Pourquoi les charges salariales apparaissent sans « doubler » le retrait du brut ?**  
  Les charges salariales sont _comprises_ dans le salaire brut. Le résultat imposable est construit en soustrayant le coût employeur (salaire brut + charges patronales) de la marge. Afficher « Charges salariales » sert uniquement à éclairer l’utilisateur sur la ventilation du brut en net (et à calculer les taux effectifs) sans les retrancher une deuxième fois. Cette mise en forme vise la transparence du chemin comptable, pas une double déduction.

- **Taux effectifs affichés (~20,8 % salariales, ~30,2 % patronales pour 30k brut)** :  
  Ce sont des taux _effectifs_ calculés comme le rapport entre les charges et le brut (ex : charges salariales / brut). Ils ne sont pas « anormaux ». L’idée courante que « les charges sociales représentent 80 % » est souvent une tournure informelle qui confond plusieurs notions : elle peut désigner la somme des charges (salariales + patronales) rapportée au salaire net ou être une approximation de l’écart total entre coût employeur et net perçu. En pratique, les taux affichés ici sont la décomposition précise de ce que paye l’assimilé-salarié (salarié + employeur) par rapport au brut déclaré, et correspondent à des méthodes de calcul classiques de brut → net / coût employeur.

#### UI / visualisation ajoutées pour SASU-IS

- **Tableau « Vue synthèse »** :

  - Ajout de lignes surlignées (visuelles) séparant les grandes étapes :
    - Charges externes / fixes
    - Rémunération dirigeant (avec sous-ligne « Charges salariales » affichée pour lecture)
    - Charges patronales
    - Résultat imposable à l’IS
    - IS et résultat après IS
    - Dividendes (bruts / nets selon mode)
    - Encaissements dirigeant finaux (Net salaire + dividendes)

- **Tableau « Détail charges rémunération dirigeant »** :

  - Ventilation détaillée des cotisations (comme pour le salariat), avec des lignes surlignées ou visuellement distinctes pour distinguer :
    - Bases
    - Taux effectifs salariés
    - Montants salariés
    - Taux effectifs patronaux
    - Montants patronaux
  - Totaux récapitulatifs en pied de tableau (base, % et montants) mis à jour dynamiquement.

- **Comportement du switch de vue** :
  - Permet basculer entre « vue synthèse » et « détail charges » tout en gardant les taux calculés synchronisés.
  - Les boutons indiquent visuellement l’état actif (classe `active`).

#### Hypothèses spécifiques SASU-IS

- Coût employeur = salaire brut + charges patronales calculées à partir d’une décomposition « assimilé salarié ».
- Résultat imposable = marge (CA − charges externes/fixes) − coût employeur.
- IS :
  - 15 % jusqu’au « seuil PME » (éligible) sur la part correspondante.
  - Taux normal (par défaut 25 %) au-delà de ce seuil.
- Dividendes :
  - Option PFU (12,8 % + prélèvements sociaux 17,2 %) ou barème (abattement 40 % puis IR + PS 17,2 %).
  - Le choix influe sur la ligne « Dividendes nets perçus ».

### 4. Micro-entreprise

- **Seuils 2025** :
  - Prestation de services / professions libérales : 77 700 €
  - Vente de marchandises : 188 700 €
- **Abattement** : forfaitaire de 34 % → base IR = 66 % du CA (pour BNC).
- **Projection** : tolérance un dépassement annuel.
  - Après deux années consécutives de dépassement, troisième dépassement bloque (sortie automatique).
- **RNI foyer** : 0,66 × CA + baseSpouse (si conjoint inclus).
- **Net foyer** : CA + spouseCash − IR.

### 5. Salariat

- **Décomposition des cotisations** (salariales + patronales) :
  - Assurance maladie
  - Vieillesse plafonnée / déplafonnée
  - Retraite complémentaire (RC Tr.1/Tr.2, CEG, CET)
  - Chômage, AGS
  - FNAL, CSA
  - Formation professionnelle, apprentissage
  - Prévoyance / APEC (cadre)
  - CSG imposable & non imposable, CRDS
- **Net avant IR** = brut − charges salariales.
- **Super brut** = brut + charges patronales.
- **RNI** = 0.9 × brutTotal (imposable) + baseSpouse.
- **IR** : calcul sur les parts.
- Encaissement foyer = net salarial + spouseCash − IR.

---

## Projection multiannuelle : algorithme

1. **Recalcul de l’année 1** pour figer les bases (cohérence entre les KPI et la première ligne).
2. Boucle sur `k = 0…n−1` :
   - Indexation de PASS, SMIC, salaires, CA, BNC selon croissances renseignées.
   - Calcul du conjoint :
     - `spouseGrossCA = spouseCA0 × (1 + growth)^k`
     - `spouseCash = includeSpouse ? 0.66 × spouseGrossCA : 0` (flux réel)
     - `baseSpouse = includeSpouse ? 0.66 × spouseGrossCA : 0` (base fiscale)
   - Calcul par mode (TNS, SASU-IR, SASU-IS, micro, salariat).
   - Calcul du RNI, IR, encaissements, net mensuel / annuel.
   - Application des overrides année 1 pour assurer stabilités des affichages.
3. **Accumulation des totaux** et rendu des lignes + footer sommaire.

---

## Détail des variables fiscales et flux conjoints

- `spouseCash` : flux monétaire réel perçu par le foyer venant du conjoint (micro-BNC à 66 % du CA si inclus).
- `baseSpouse` : base imposable utilisée dans le calcul du RNI (identique à `spouseCash` pour micro, mais concept distinct pour garder la séparation entre fiscalité et flux).
- `RNI` : Revenu Net Imposable du foyer (agrège salaires imposables, BNC, dividendes selon mode, et base du conjoint le cas échéant, moins certaines déductions comme la déductibilité partielle de la CSG pour TNS).
- `IR` : Impôt sur le revenu calculé via `computeTaxFromBareme`, multiplié par le nombre de parts.
- `enc` / `encaissement` : total perçu (selon mode) avant IR, y compris conjoint si choisi.
- `netFoyer` : encaissement − IR.

---

## Sources officielles & barèmes (avec URLs)

### Barèmes, seuils et variables standard

| Élément                                             | Valeur / description                                    | Source                                                                                                                                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PASS 2025                                           | 47 100 €                                                | Service-Public, actualité “PASS 2025” : https://www.service-public.fr/particuliers/actualites/A15386                                                                                                               |
| Barème IR 2025                                      | Tranches : 0 % / 11 % / 30 % / 41 % / 45 % (indexables) | Service-Public : https://www.service-public.fr/particuliers/actualites/A18045 et brochure IR 2025 https://www.impots.gouv.fr/portail/files/media/1_metier/2_particulier/documentation/brochure/ir_2025/ir_2025.pdf |
| Seuils micro                                        | 77 700 € services/libérales, 188 700 € commerce         | Service-Public “Seuil CA Micro” : https://entreprendre.service-public.fr/vosdroits/F32353                                                                                                                          |
| PFU (flat tax) dividendes                           | 12,8 % IR + 17,2 % prélèvements sociaux                 | Service-Public : https://entreprendre.service-public.fr/vosdroits/F32963 et https://www.service-public.fr/particuliers/vosdroits/F34913/1_7                                                                        |
| IS PME 15 %                                         | Jusqu’à 42 500 €                                        | Service-Public Pro : https://entreprendre.service-public.fr/vosdroits/F23575                                                                                                                                       |
| Calcul des cotisations URSSAF (salarié & employeur) | Liste exhaustive des cotisations                        | URSSAF : https://www.urssaf.fr/accueil/employeur/cotisations/liste-cotisations.html                                                                                                                                |
| Charges patronales                                  | Calcul détaillé                                         | L'Expert-Comptable : https://www.l-expert-comptable.com/a/532287-montant-et-calcul-des-charges-patronales.html <br/> PayFit : https://payfit.com/fr/fiches-pratiques/charges-patronales/                           |
| Charges salariales                                  | Calcul détaillé                                         | L'Expert-Comptable : https://www.l-expert-comptable.com/calculateurs/calculer-le-salaire-brut-net.html <br/> PayFit : https://payfit.com/fr/fiches-pratiques/charges-salariales/                                   |

> **Compléments utiles** :
>
> - https://www.urssaf.fr/accueil.html
> - https://www.autoentrepreneur.urssaf.fr/portail/accueil.html (régime micro)
> - https://www.economie.gouv.fr/particuliers/impots-et-fiscalite (documentation IR / PFU)
> - https://sas-sasu.info/charges-sociales-president-sas-sasu/ ; https://www.legalstart.fr/fiches-pratiques/sasu/charges-sociales-sasu/Statut du président de SAS/SASU et régime social associé, traitement en assimilé salarié, décomposition des cotisations, taux effectifs, exonérations et précisions sur la lecture du brut/net pour les dirigeants.

---

### Ventilation des cotisations micro-sociales (hors formation)

La part globale prélevée en micro-entreprise (BIC/BNC/CIPAV) se décompose selon des branches définies réglementairement. Pour les professions libérales non CIPAV (BNC), la réforme entrée en vigueur au 1er janvier 2026 modifie la répartition. Les références principales sont les articles D613-4 et D613-6 du Code de la sécurité sociale, et pour les BNC la réforme issue du décret n°2024-484 du 30 mai 2024.

#### 1. BNC (professions libérales non réglementées, réforme 2026 — taux total 26,1 %)

| Branche                                                          | Répartition officielle (%) | Part effective sur le CA (≈ 26,1 % × part) |
| ---------------------------------------------------------------- | -------------------------- | ------------------------------------------ |
| Assurance maladie-maternité                                      | 3,00 %                     | ≈ 0,783 %                                  |
| Invalidité-décès                                                 | 3,25 %                     | ≈ 0,848 %                                  |
| Retraite de base                                                 | 44,85 %                    | ≈ 11,71 %                                  |
| Retraite complémentaire                                          | 17,70 %                    | ≈ 4,62 %                                   |
| CSG/CRDS (dont une part est déductible selon règles spécifiques) | 31,20 %                    | ≈ 8,14 %                                   |

_Sources :_

- Article D613-6 du Code de la sécurité sociale (ventilation des cotisations) : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049625405
- Décret n°2024-484 du 30 mai 2024 (réforme BNC 2026) : _URL à renseigner depuis Légifrance_

#### 2. Prestations commerciales / artisanales et vente de marchandises (BIC) & services (taux global micro-social : 21,2 % pour BIC/service, 12,3 % pour commerce/vente)

| Branche                     | Répartition approximative (%) | Part effective sur le CA (selon taux global)                                |
| --------------------------- | ----------------------------- | --------------------------------------------------------------------------- |
| Assurance maladie-maternité | 8,9 %                         | 21,2 % × 8,9 % ≈ 1,89 % (BIC/service) ou 12,3 % × 8,9 % ≈ 1,09 % (commerce) |
| Invalidité-décès            | 3,1 %                         | ≈ 0,66 % (BIC/service) ou ≈ 0,38 % (commerce)                               |
| Retraite de base            | 41,8 %                        | ≈ 8,87 % (BIC/service) ou ≈ 5,14 % (commerce)                               |
| Retraite complémentaire     | 16,5 %                        | ≈ 3,50 % (BIC/service) ou ≈ 2,03 % (commerce)                               |
| CSG/CRDS                    | 29,7 %                        | ≈ 6,30 % (BIC/service) ou ≈ 3,65 % (commerce)                               |

_Sources :_

- Article D613-6 du Code de la sécurité sociale (ventilation des cotisations) : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049625405

> Remarque : pour les activités de vente de marchandises / hébergement, le taux global est inférieur (12,3 % hors CFP) ; la ventilation interne utilise les mêmes proportions appliquées à ce taux réduit.

#### 3. CIPAV (professions libérales réglementées — taux total 23,2 % hors CFP)

| Branche                        | Répartition officielle (%) |
| ------------------------------ | -------------------------- |
| Maladie-maternité              | 9,3 %                      |
| Prestations maladie en espèces | 0,9 %                      |
| Invalidité-décès               | 1,4 %                      |
| Vieillesse de base 1°          | 23,45 %                    |
| Vieillesse de base 2°          | 5,35 %                     |
| Retraite complémentaire        | 25,6 %                     |
| CSG/CRDS                       | 34,0 %                     |

_Sources :_

- Article D613-6 du Code de la sécurité sociale : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049625405
- Article D613-4 (catégorisation des micro-entrepreneurs) : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049624097

---

## FAQ & avertissements

- **Puis-je modifier les taux futurs (PASS / SMIC / inflation) ?**  
  Oui. Les champs de croissance permettent d’anticiper l’évolution : PASS (`passGrow`), SMIC (`smicGrow`), inflation (impact sur barème IR).

- **Quelle est la différence entre `spouseCash` et `baseSpouse` ?**  
  `spouseCash` est le flux réel intégré dans le net foyer. `baseSpouse` est ce qui compte pour déterminer le RNI du foyer (base fiscale). Ils coïncident pour micro (66 % du CA du conjoint) mais restent conceptuellement séparés pour éviter de confondre encaissement et assiette fiscale.

- **Comment est gérée la déduction CSG (6,8 %) pour TNS ?**  
  Optionnellement activable. Elle réduit le RNI et donc diminue l'IR du foyer pour les TNS en reflétant la part déductible de CSG.

- **Micro-entreprise : que se passe-t-il avec les dépassements ?**  
  Un dépassement isolé génère une alerte. Deux années consécutives affichent un avertissement plus sérieux. Trois dépassements consécutifs **bloquent** le régime micro (sortie automatique), conformément à la réglementation.

- **Est-ce que les arrondis faussent les totaux ?**  
  Les arrondis à l’affichage (0 ou 2 décimales selon configuration) peuvent créer de petites différences d’affichage, mais les calculs internes conservent une précision suffisante pour la prise de décision.

- **Le simulateur remplace-t-il une déclaration officielle ?**  
  Non. C’est un outil d’estimation. Pour la validité juridique/fiscale, se référer aux documents officiels et, idéalement, à un expert-comptable.

---

## Développement

Ce projet est entièrement front-end : aucun build complexe requis, tout tourne dans le navigateur.

### Prérequis

- Navigateur moderne (Chrome, Firefox, Safari)
- Pas d’API serveur nécessaire, tout est en JavaScript pur.

### Installation / utilisation locale

```bash
git clone https://github.com/JeremyLezmy/tns-simulator
cd tns-simulator
# Ouvrir index.html dans le navigateur (double-clic ou via un serveur statique)
```

Optionnel : lancer un serveur pour éviter certains blocages CORS/FS :

```bash
npx serve .
```

### Export

- CSV exportable (format français avec `;` ou international avec `,`)
- Tous les blocs (TNS, SASU, Salariat, IR) sont sérialisés dans le fichier avec leurs valeurs d’entrée et de projection.

### Structure du code

```
├── index.html        # interface utilisateur / layout
├── styles.css        # thème / responsive / accessibilité
├── script.js         # moteur : calculs TNS, SASU-IR, SASU-IS, micro, salariat, IR, projection
```

Conventions :

- JavaScript moderne (ES2020), `camelCase` pour les variables, fonctions documentées via commentaires JSDoc.
- UI state persisté via `localStorage` (thème, pin, arrondi, view mode).

---

## Licence

**Copyright © 2025 Jérémy Lezmy. Tous droits réservés.**

> Ce simulateur est fourni **pour usage non commercial uniquement**. Toute réutilisation ou redistribution dans un contexte commercial (vente, intégration payante, rebranding, produit SaaS, etc.) nécessite une **licence commerciale écrite explicite**.

**Usage interdit sans accord** :

- Revente ou inclusion dans un produit payant.
- Redistribution dans un outil commercial sans autorisation.
- Publication / packaging sous une marque tierce sans contrat.

Pour obtenir une licence commerciale ou poser une question contractuelle :
**[jeremy.lezmy-robert@hotmail.fr](mailto:jeremy.lezmy-robert@hotmail.fr)**

> Remarque : en l’absence de licence open source explicite, **tous droits sont réservés** sauf mention contraire dans un contrat écrit.

---
