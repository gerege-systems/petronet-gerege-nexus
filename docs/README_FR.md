# PetroNet System

**La plateforme intégrée de surveillance et de gestion des carburants de Mongolie**

**PetroNet** rassemble en un seul flux de données l'importation, le stockage, la
distribution et la vente au détail des produits pétroliers en Mongolie, le
surveille en temps réel, et donne au régulateur, aux compagnies pétrolières et
à l'automobiliste les mêmes chiffres. Le système est construit pour l'Autorité
des ressources minérales et du pétrole (AMGTG) et remplace le système **mpetro**
actuel — voir les [exigences système](https://plan.petronet.mn/).

PetroNet System n'est **pas une application, c'est un écosystème**. Un
automobiliste, une station, une compagnie pétrolière et le régulateur font
quatre métiers différents, et chacun dispose d'une plateforme bâtie pour le
sien. En dessous, tous partagent un même jeu de données, une même identité et
une même piste d'audit.

<p>
  <a href="../README.md"><img src="assets/icons/flag-mn.png" width="18" height="18" alt=""> Монгол</a>
  &nbsp;·&nbsp;
  <a href="README_AR.md"><img src="assets/icons/flag-ar.png" width="18" height="18" alt=""> العربية</a>
  &nbsp;·&nbsp;
  <a href="README_ZH.md"><img src="assets/icons/flag-zh.png" width="18" height="18" alt=""> 中文</a>
  &nbsp;·&nbsp;
  <a href="README_EN.md"><img src="assets/icons/flag-en.png" width="18" height="18" alt=""> English</a>
  &nbsp;·&nbsp;
  <img src="assets/icons/flag-fr.png" width="18" height="18" alt=""> <b>Français</b>
  &nbsp;·&nbsp;
  <a href="README_RU.md"><img src="assets/icons/flag-ru.png" width="18" height="18" alt=""> Русский</a>
  &nbsp;·&nbsp;
  <a href="README_ES.md"><img src="assets/icons/flag-es.png" width="18" height="18" alt=""> Español</a>
</p>

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](../LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.26-00ADD8.svg)](https://go.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black.svg)](https://nextjs.org)

---

## Sommaire

- [Le problème](#le-problème)
- [Ce que fait la plateforme](#ce-que-fait-la-plateforme)
- [L'écosystème](#lécosystème)
- [La décision de conception](#la-décision-de-conception)
- [Chaîne de traçabilité](#chaîne-de-traçabilité)
- [Ce qui existe déjà](#ce-qui-existe-déjà)
- [Comment c'est construit](#comment-cest-construit)
- [Structure du dépôt](#structure-du-dépôt)
- [Démarrage](#démarrage)
- [Configuration](#configuration)
- [Déploiement](#déploiement)
- [Tests](#tests)
- [Sécurité](#sécurité)
- [Index de la documentation](#index-de-la-documentation)

---

## Le problème

La Mongolie compte plus de 200 compagnies pétrolières, plus de 110 dépôts et
plus de 1 500 stations-service. Leurs données vivent dans deux systèmes qui ne
se parlent pas, et l'essentiel y est saisi **à la main**, une ou deux fois par
semaine.

Aucun endroit ne peut répondre, maintenant, à la question : combien de litres de
quel carburant, et où. Les réserves nationales sont donc pilotées à l'estime, et
dès que l'approvisionnement se tend il ne reste que des instruments grossiers —
plaques paires et impaires, plafond uniforme de 50 000 ₮ par plein, files
d'attente.

Ce n'est pas seulement un problème d'approvisionnement. C'est un problème
d'information, et c'est précisément le genre de problème qu'un logiciel sait
résoudre.

## Ce que fait la plateforme

| | | Page publique |
| --- | --- | --- |
| 1 | **Chaîne de traçabilité** — contrat d'importation → douane → laboratoire → terminal → transport → cuve de la station → pistolet → client. Chaque litre remonte au lot dont il provient. | [`/supply`](https://petronet.mn/supply) |
| 2 | **POS de station** — une couche de pilotes qui parle aux distributeurs et aux jaugeurs de toutes marques, du contrôleur de piste moderne au simple compteur d'impulsions, et qui continue de vendre sans réseau. | [`/stations`](https://petronet.mn/stations) |
| 3 | **Bons** — des droits créés uniquement à partir du carburant réellement arrivé, puis répartis selon la proximité, le besoin et le temps d'attente. | [`/vouchers`](https://petronet.mn/vouchers) |
| 4 | **Contrôle de l'État** — stocks, prix, qualité, fiscalité et écarts sur un même tableau, au-dessus d'une piste d'audit inaltérable. | [`/oversight`](https://petronet.mn/oversight) |

Deux modes sur une seule infrastructure. En crise, elle rationne : limites et
quotas changent en quelques minutes, les catégories prioritaires gardent leur
réserve, les bons partent avec une fenêtre horaire. Le reste du temps, elle
surveille : fiscalité, prix, qualité et stocks, rapprochement automatique
importation–stockage–vente, prévision de la demande et alertes sur la réserve
stratégique.

## L'écosystème

| Plateforme | Pour qui | Ce qu'elle porte |
| --- | --- | --- |
| Plateforme citoyenne | Automobilistes et citoyens | La station la plus proche, ses carburants, son niveau, le droit journalier et le bon. L'identité vient d'eID |
| Portail des compagnies | Compagnies pétrolières | Registre des dépôts et des stations, niveaux des cuves, dépôt et correction des déclarations de chaque période |
| Centre de commandement du régulateur | AMGTG et inspecteurs | Agrégat national quotidien, jours de stock, lacunes de couverture, écarts de rapprochement et alertes |
| POS et agent de bord en station | Stations-service | Pistolets, cuves, postes, paiement et reçus sur une base locale : la vente ne s'arrête pas avec le réseau |
| Entrepôt et analytique | Analystes et direction | Alimenté chaque jour depuis les systèmes opérationnels, nettoyé, modélisé en langage métier, avec BI et prévision |
| Console et observabilité | Exploitants | Organisations, droits et audit derrière leur propre connexion, à côté des métriques, alertes et sauvegardes |

Sous l'ensemble : un seul binaire Go, une seule base, une seule identité — ici
écosystème veut dire beaucoup d'espaces de travail, pas beaucoup de serveurs.
Vers l'extérieur, il se relie à la douane, au registre d'État, à e-Barimt, à eID
et aux jaugeurs installés sur le terrain.

## La décision de conception

> **Un bon n'est pas une promesse. C'est un litre réservé.**

Un bon n'existe qu'une fois le carburant physiquement entré dans la cuve d'une
station et la hausse de niveau confirmée par le jaugeur automatique.

Deux conséquences. Le système ne peut jamais promettre plus qu'il ne détient :
la file n'a plus de raison de se former. Et une station qui ne déclare pas ses
livraisons ne génère aucun bon, donc personne n'y est envoyé — la conformité est
imposée par la conception, pas par un inspecteur.

## Chaîne de traçabilité

| Étape | Ce qui est enregistré | Source |
| --- | --- | --- |
| Importation | Contrat, fournisseur, qualité, tonnage, Incoterms, prix, date attendue | Portail importateur / API |
| Frontière | Numéro de déclaration, code SH, droits, point de passage | Douane |
| Qualité | Indice d'octane, densité, soufre, eau, certificat de laboratoire | Laboratoire accrédité |
| Métrologie | Litres observés, température, densité → **litres à 15 °C** | ASTM D1250 / API MPMS 11.1 |
| Terminal | Cuve, capacité, niveau, capacité libre, transferts vers la réserve d'État | Jaugeurs |
| Transport | Camion-citerne, chauffeur, volume chargé, destination, trace GPS, scellé électronique | Module transporteur |
| Station | Volume reçu, hausse de niveau, écart, agent réceptionnaire | Jaugeur + confirmation |
| Pistolet | Totaliseur, litres et montant par transaction, relevés de poste | Contrôleur de piste |
| Client | Droit, bon, utilisation, reçu, TVA | PetroNet + e-Barimt |

Chaque nœud se rapproche du précédent : un écart désigne donc immédiatement le
moment, le lieu et la garde sous laquelle il est apparu.

## Ce qui existe déjà

Ce n'est pas un plan mais un relevé de ce qui se trouve dans le dépôt, testé et
exécuté sur un vrai PostgreSQL. La liste complète et la suite sont dans le
[plan de développement](https://plan.petronet.mn/plan/).

- Registre des dépôts et des stations, plaques, statut, vérification via XYP
- Référentiel produits avec classification JODI, sept qualités
- Droits du régulateur, adossés à une politique au niveau des lignes
- La politique comme donnée — limites, tolérances, échéances, modifiables sans livraison
- Inventaire technique des stations (classes A–D)
- Périodes de déclaration, dépôts, lignes et conclusions
- Règles de validation — balance, continuité, capacité, écart, métrologie
- Correction de volume à 15 °C (ASTM D1250 / API MPMS 11.1)
- Versionnement des rapports et chaîne de hachage au-dessus
- Export et import de modèles Excel
- Circuit de revue — approuver, retourner, quatre yeux
- Mouvements, avec plaque, état de clôture et écart
- Agrégat national quotidien, couverture, jours de stock restants
- Détection des données manquantes et rapport sur les lacunes de couverture
- Rapprochement ΔA–ΔE
- Sept rapports en Excel et CSV, planifiés et envoyés par courriel
- Données ouvertes : l'agrégat national quotidien sur `/api/v1/petro/public/daily`
- L'écran de déclaration des entreprises et l'écran du régulateur

## Comment c'est construit

PetroNet est une **distribution de niveau 2** de la plateforme
[Gerege Nexus](https://github.com/gerege-systems/open-gerege-nexus). Ce dépôt ne
contient aucun code du noyau — une ligne de `go.mod` en est la totalité. Ce qui
vit ici, c'est la logique métier carburant (`modules/petro/`) ainsi que la
carte, les écrans d'exploitation et les pages publiques bâties pour elle
(`frontend/`).

Le module enregistre ses routes, menus, permissions et migrations via le contrat
public `pkg/nexus` et se compile dans un seul binaire Go. Identité, multi-tenance,
RBAC, SSO, reporting et piste d'audit viennent de la plateforme et ne sont pas
réécrits ici.

Le déploiement authentifie lui-même : sa propre connexion, son propre émetteur
OIDC, sa propre base. Les citoyens sont identifiés par
[eID Mongolia](https://eidmongolia.mn) plutôt que par un mot de passe que ce
système devrait conserver.

## Structure du dépôt

```
main.go                   Enregistre le module petro et démarre l'hôte plateforme
modules/petro/            Le module carburant : registre, rapports, contrôle, bons
  migrations/             Le SQL de ce module, une seule histoire
cmd/petro-import/         Importateur des données mpetro existantes
catalog/                  Catalogue d'applications, manifestes et chronique de versions
frontend/                 Client web Next.js — site public, carte, écrans d'exploitation
deploy/                   Dockerfile, pile compose, supervision, scripts de sauvegarde
nginx/                    Les six hôtes virtuels de ce déploiement
docs/                     Cette documentation, en sept langues
```

## Démarrage

Prérequis : Go 1.26+, Node.js 20+, PostgreSQL 16+ (ou Docker).

```bash
# Tout d'un coup
docker compose -f deploy/docker-compose.yml up -d

# Ou l'API seule
go run .

# Et le client web
cd frontend && npm ci && npm run dev
```

Le client web répond sur [http://localhost:3000](http://localhost:3000).

Un déploiement sans organisation envoie tout visiteur vers `/setup`. Le jeton que
demande cet assistant est écrit une fois dans le journal de l'API au démarrage :

```bash
docker logs gerege_petronet_backend 2>&1 | grep -i "setup token"
```

## Configuration

La liste complète est dans [`.env.example`](../.env.example). Les valeurs qui
décident du comportement d'un déploiement :

| Variable | Description |
| --- | --- |
| `PUBLIC_ORIGIN` | Où répond cette instance. Définit en un seul endroit le CORS, l'émetteur OIDC et le rappel eID |
| `PETRONET_POSTGRES_PASSWORD` | La base de données propre à cette pile |
| `SSO_DEFAULT_CLIENT_SECRET` | Sans lui, la plateforme refuse de démarrer en production |
| `BRAND_*` | Nom, description, couleurs et icônes du déploiement |
| `SERVICE_URL_*` | Adresses de la console, de l'entrepôt, des sauvegardes, de la supervision et de la documentation. Seules celles renseignées sont affichées en page d'accueil |
| `EID_RP_UUID` / `EID_RP_SECRET` | Le couple relying-party eID. Sans lui, la connexion eID est indisponible |
| `CONTROL_PLANE_HOST` | Le nom d'hôte — et le seul — sur lequel répond la console d'exploitation |
| `PROMETHEUS_URL` | D'où la console lit la santé de la plateforme |

## Déploiement

L'hôte de production porte `/opt/petronet/` — `src/` (ce dépôt), `.env`
(chmod 600) et `brand/`. La mise à jour tient en deux commandes :

```bash
cd /opt/petronet/src && git pull && ./deploy.sh
```

`deploy.sh` construit depuis ce dépôt les deux images, backend et web : l'API, la
carte et les écrans d'exploitation sortent donc toujours à la même révision.

Six noms d'hôte se tiennent côte à côte : la plateforme (`petronet.mn`), la
console d'exploitation (`admin.`), la supervision (`monitor.`), la carte de
l'entrepôt de données (`dwh.`), cette documentation (`docs.`) et les notes de
sauvegarde (`backups.`). Ce qu'est chacun, et les pièges de la configuration
nginx, sont dans [le document de ce déploiement](DEPLOYMENT.md).

## Tests

```bash
go vet ./... && go test -race ./...     # Go : unitaires et intégration PostgreSQL
cd frontend && npm test && npm run build
```

La CI exécute les deux à chaque push et chaque pull request, et construit les
deux images Docker.

## Sécurité

- Les jetons de session sont des valeurs aléatoires de 256 bits ; seule leur
  empreinte SHA-256 est stockée.
- Les mots de passe sont hachés avec bcrypt et les tentatives de connexion sont
  limitées en fréquence.
- Les données d'un locataire sont isolées par un rôle de base, un contexte de
  locataire et la sécurité au niveau des lignes sur les tables déclarées. La
  portée du régulateur est une politique en SQL, pas un test dans un gestionnaire.
- Les versions de rapport sont chaînées par hachage : un dépôt approuvé ne peut
  être modifié sans que la chaîne le dise.
- La console d'exploitation a sa propre identité, son cookie, sa piste d'audit et
  son rôle de base, et ne répond que sur `CONTROL_PLANE_HOST`.

Signalez les vulnérabilités comme décrit dans [`SECURITY.md`](../SECURITY.md).

## Index de la documentation

| Document | Description |
| --- | --- |
| [Centre de documentation](README.md) | Tous les documents et traductions |
| [Exigences système](https://plan.petronet.mn/) | Ce que le client a demandé |
| [Plan de développement](https://plan.petronet.mn/plan/) | Ce qui est fait, la suite, et les critères d'acceptation |
| [Références internationales](https://plan.petronet.mn/benchmarks/) | Comment d'autres pays ont résolu cela, et ce qui a échoué |
| [Ce déploiement](DEPLOYMENT.md) | Noms d'hôtes, ports, sauvegardes — cet hôte uniquement |
| [Architecture](ARCHITECTURE.md) | Les plans, les schémas, l'isolation des données |
| [Écrire un module](MODULES.md) | Le contrat `pkg/nexus` |
| [Exploitation](OPERATIONS.md) | Déploiement, supervision, sauvegarde et restauration |
| [Runbooks](RUNBOOKS.md) | Quand quelque chose casse |
| [Traduction](TRANSLATION.md) | La politique linguistique et le générateur |
| [Contribuer](../CONTRIBUTING.md) · [Sécurité](../SECURITY.md) · [Code de conduite](../CODE_OF_CONDUCT.md) | Règles du projet |

---

## Licence

Copyright (c) 2026 **Gerege Systems Development Team, Gerege Nomadica
Foundation**. Distribué sous licence Apache 2.0 — voir [`LICENSE`](../LICENSE).

Icônes de drapeaux par [Flaticon](https://www.flaticon.com/)
([attribution](assets/icons/ATTRIBUTION.md)).
