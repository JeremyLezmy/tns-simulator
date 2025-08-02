# Simulateur TNS · SASU · Salariat & IR v1.5.1 🇫🇷

> **Tout-en-un :** calculez en quelques secondes vos rémunérations nettes, cotisations,
> impôt sur le revenu (IR) du foyer et comparez **TNS**, **SASU (IR ou IS)**,
> **micro-entreprise** et **salariat** sur une **projection pluri-annuelle** entièrement
> paramétrable (inflation, PASS, croissance CA, salaire variable, inclusion du conjoint…).

---

## Sommaire

- [Simulateur TNS · SASU · Salariat \& IR v1.5.1 🇫🇷](#simulateur-tns--sasu--salariat--ir-v151-)
  - [Sommaire](#sommaire)
  - [Fonctionnalités majeures](#fonctionnalités-majeures)
  - [Prise en main rapide](#prise-en-main-rapide)
  - [Paramètres \& combinaisons possibles](#paramètres--combinaisons-possibles)
  - [Modes de calcul détaillés](#modes-de-calcul-détaillés)
    - [1. TNS](#1-tns)
    - [2. SASU-IR](#2-sasu-ir)
    - [3. SASU-IS](#3-sasu-is)
    - [4. Micro-entreprise](#4-micro-entreprise)
    - [5. Salariat](#5-salariat)
  - [Projection multiannuelle : algorithme](#projection-multiannuelle--algorithme)
  - [Détail des variables fiscales et flux conjoints](#détail-des-variables-fiscales-et-flux-conjoints)
  - [Sources officielles \& barèmes (avec URLs)](#sources-officielles--barèmes-avec-urls)
    - [Barèmes, seuils et variables standard](#barèmes-seuils-et-variables-standard)
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
| **Mode selector**       | Basculer entre TNS, SASU-IR, SASU-IS, micro, salariat                  | Réinitialisation intelligente seulement au changement de mode, synchronisation encaissements & IR               |
| **Année 1**             | Saisie complète des hypothèses et calcul détaillé                      | Remontée des cotisations, RNI, IR, net foyer, salaires, dividendes, quote-part, etc.                            |
| **Projection N années** | Génère une série temporelle indexée                                    | Indexation PASS/SMIC/IR, croissance des CA/salaires/BNC, suivi des dépassements micro, répétition d’antécédents |
| **IR du foyer**         | Calcule le barème 2025 avec parts et conjoint                          | Décomposition par tranche, TMI, inclusion/exclusion du conjoint, déduction CSG pour TNS                         |
| **Micro-alertes**       | Détection de dépassement de seuils micro                               | Tolérance une année, blocage après trois années consécutives de dépassement                                     |
| **Export CSV**          | Génère CSV FR ou international avec toutes les données                 | Conversion automatique des formats monétaires et numeriques                                                     |
| **Console de debug**    | Journalisation technique séparée pour faciliter l’analyse              | Affiche les entrées/états à chaque recalcul (IR, projection...)                                                 |
| **UI/UX avancée**       | Thème auto/sombre/clair, barre épinglable, vue compacte, mobile forced | Préférences persistées dans `localStorage`                                                                      |
| **Accessibilité**       | Attributs ARIA, compatibilité clavier, lectures claires                | Niveau de base correct, améliorable via contributions                                                           |

---

## Prise en main rapide

1. Choisissez un mode (TNS / SASU-IR / SASU-IS / Micro / Salariat).
2. Renseignez les paramètres de l’année 1 : chiffre d’affaires, salaire brut, croissance, inflation, PASS, SMIC, parts fiscales, situation conjoint, etc.
3. Cliquez sur **Calculer (année 1)** pour générer les KPI de base.
4. Le bloc **IR du foyer** se synchronise automatiquement — ajustez :
   - si vous voulez inclure le conjoint ou non ;
   - nombre de parts fiscales ;
   - types de dividendes (PFU vs barème).
5. La projection pluriannuelle se construit automatiquement (ou via “Calculer la projection”) en tenant compte des croisances et indexations.
6. Exportez en CSV ou comparez visuellement les modes.

> Les modifications sur certains champs (comme le choix “Vous seul / Vous + conjoint”) déclenchent un recalcul automatique complet (IR + projection) grâce aux listeners.

---

## Paramètres & combinaisons possibles

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

### 2. SASU-IR

- Salaire **assimilé salarié** : 90 % du brut est imposable (autre part peut être charges internes).
- Quote-part BNC : additionnelle.
- PS sur quote-part (par défaut 9,7 %, paramétrable).
- **RNI foyer** = salaire imposable + BNC + baseSpouse.
- **IR** : barème progressif multiplié par parts.

### 3. SASU-IS

- Salaire (brut) : application de charges patronales et salariales selon taux fournis.
- Résultat imposable = marge − coût employeur (salaire + charges patronales).
- **IS** :
  - 15 % jusqu’au seuil PME (42 500 €), puis taux normal (25 % ou ce qui est défini pour 2025).
- Dividendes distribués après IS :
  - PFU : 12,8 % IR + 17,2 % prélèvements sociaux
  - Barème : abattement 40 %, puis IR au barème + PS 17,2 %.
- **RNI** agrège salaire imposable, dividendes (selon mode), + conjoint.

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
| Calcul des cotisations URSSAF (salarié & employeur) | Liste exhaustive des cotisations                        | URSSAF : https://www.urssaf.fr/portail/home/employeur/cotisations/liste-cotisations.html                                                                                                                           |
| Charges patronales                                  | Calcul détaillé                                         | L'Expert-Comptable : https://www.l-expert-comptable.com/a/532287-montant-et-calcul-des-charges-patronales.html <br/> PayFit : https://payfit.com/fr/fiches-pratiques/charges-patronales/                           |
| Charges salariales                                  | Calcul détaillé                                         | L'Expert-Comptable : https://www.l-expert-comptable.com/calculateurs/calculer-le-salaire-brut-net.html <br/> PayFit : https://payfit.com/fr/fiches-pratiques/charges-salariales/                                   |

> **Compléments utiles** :
>
> - https://www.urssaf.fr/accueil.html
> - https://www.autoentrepreneur.urssaf.fr/portail/accueil.html (régime micro)
> - https://www.economie.gouv.fr/particuliers/impots-et-fiscalite (documentation IR / PFU)

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
