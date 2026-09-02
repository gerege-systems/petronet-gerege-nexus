# PetroNet System

**Mongolia's integrated fuel monitoring and management platform**

**PetroNet** collects the import, storage, distribution and retail of petroleum
products across Mongolia into one data flow, watches it in real time, and gives
the regulator, the fuel companies and the driver the same numbers. It is built
for the Mineral Resources and Petroleum Authority (MRPAM) and replaces the
current **mpetro** system — see the [system requirements](https://plan.petronet.mn/).

<p>
  <a href="../README.md"><img src="assets/icons/flag-mn.png" width="18" height="18" alt=""> Монгол</a>
  &nbsp;·&nbsp;
  <a href="README_AR.md"><img src="assets/icons/flag-ar.png" width="18" height="18" alt=""> العربية</a>
  &nbsp;·&nbsp;
  <a href="README_ZH.md"><img src="assets/icons/flag-zh.png" width="18" height="18" alt=""> 中文</a>
  &nbsp;·&nbsp;
  <img src="assets/icons/flag-en.png" width="18" height="18" alt=""> <b>English</b>
  &nbsp;·&nbsp;
  <a href="README_FR.md"><img src="assets/icons/flag-fr.png" width="18" height="18" alt=""> Français</a>
  &nbsp;·&nbsp;
  <a href="README_RU.md"><img src="assets/icons/flag-ru.png" width="18" height="18" alt=""> Русский</a>
  &nbsp;·&nbsp;
  <a href="README_ES.md"><img src="assets/icons/flag-es.png" width="18" height="18" alt=""> Español</a>
</p>

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](../LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.26-00ADD8.svg)](https://go.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black.svg)](https://nextjs.org)

---

## Contents

- [The problem](#the-problem)
- [What the platform does](#what-the-platform-does)
- [The design decision](#the-design-decision)
- [Chain of custody](#chain-of-custody)
- [What already exists](#what-already-exists)
- [How it is built](#how-it-is-built)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Testing](#testing)
- [Security](#security)
- [Documentation index](#documentation-index)

---

## The problem

Mongolia has more than 200 fuel companies, over 110 storage depots and more than
1,500 filling stations. Their data lives in two systems that do not talk to each
other, and most of it is typed in **by hand**, once or twice a week.

There is no single place that can answer, right now, how many litres of which
grade are where. So national reserves are managed by estimate, and when supply
tightens the only instruments left are blunt ones — odd-and-even plate days, a
flat ₮50,000 cap per fill, queues.

That is not only a supply problem. It is an information problem, and information
problems are the kind software can actually solve.

## What the platform does

| | | Public page |
| --- | --- | --- |
| 1 | **Chain of custody** — import contract → customs → laboratory → terminal → transport → station tank → nozzle → customer. Every litre is traceable back to the batch it came from. | [`/supply`](https://petronet.mn/supply) |
| 2 | **Station POS** — a driver layer that speaks to dispensers and tank gauges of any make, from a modern forecourt controller down to a pulse counter, and keeps selling when the network is gone. | [`/stations`](https://petronet.mn/stations) |
| 3 | **Vouchers** — entitlements minted only from fuel that has physically arrived, then allocated by proximity, need and time waited. | [`/vouchers`](https://petronet.mn/vouchers) |
| 4 | **State oversight** — stock, price, quality, tax and discrepancy on one board, over an audit trail that cannot be rewritten. | [`/oversight`](https://petronet.mn/oversight) |

It runs in two modes on one set of rails. In a crisis it rations: limits and
quotas change in minutes, priority classes keep their reserve, vouchers go out
with a time window. The rest of the time it supervises: tax, price, quality and
stock monitoring, automatic import-to-sale reconciliation, demand forecasting
and strategic-reserve alerts.

## The design decision

> **A voucher is not a promise. It is a reserved litre.**

A voucher comes into existence only after fuel has physically entered a
station's tank and the automatic tank gauge has confirmed the level rise.

Two things follow. The system can never promise more than it holds, so the
queue has nothing to form around. And a station that does not report its
deliveries generates no vouchers, so nobody is sent to it — compliance is
enforced by the design rather than by an inspector.

## Chain of custody

| Stage | What is recorded | Where it comes from |
| --- | --- | --- |
| Import | Contract, supplier, grade, tonnage, Incoterms, price, expected date | Importer portal / API |
| Border | Declaration number, HS code, duties, crossing point | Customs |
| Quality | Octane, density, sulphur, water, laboratory certificate | Accredited laboratory |
| Metrology | Observed litres, temperature, density → **litres at 15 °C** | ASTM D1250 / API MPMS 11.1 |
| Terminal | Tank, capacity, level, free capacity, strategic-reserve transfers | Tank gauges |
| Transport | Tanker, driver, loaded volume, destination, GPS track, e-seal | Carrier module |
| Station | Received volume, level rise, discrepancy, receiving staff | Tank gauge + confirmation |
| Nozzle | Totalizer, per-transaction litres and amount, shift readings | Forecourt controller |
| Customer | Entitlement, voucher, redemption, receipt, VAT | PetroNet + e-Barimt |

Each node reconciles against the one before it, so a discrepancy names when,
where and in whose custody it appeared.

## What already exists

Not a plan — a record of what is in the repository, with tests, run against a
real PostgreSQL. The full list, and what comes next, is in
[the development plan](https://plan.petronet.mn/plan/).

- Registry of depots and stations, plate numbers, status, XYP verification
- Product reference with JODI classification, seven grades
- Regulator permissions, with a row-level policy behind them
- Policy as data — limits, tolerances, deadlines, changeable without a release
- Station technical inventory (classes A–D)
- Reporting periods, submissions, lines and conclusions
- Validation rules — balance, continuity, capacity, deviation, metrology
- 15 °C volume correction (ASTM D1250 / API MPMS 11.1)
- Report versioning and a hash chain over it
- Excel template export and import
- Review workflow — approve, return, four-eyes
- Movements, with plate number, closing state and discrepancy
- National daily aggregate, coverage, days of stock remaining
- Missing-data detection and a coverage-gap report
- Reconciliation ΔA–ΔE
- Seven reports as Excel and CSV, scheduled and emailed
- Open data: the daily national aggregate at `/api/v1/petro/public/daily`
- The company reporting screen and the regulator screen

## How it is built

PetroNet is a **Level 2 distribution** of the
[Gerege Nexus](https://github.com/gerege-systems/open-gerege-nexus) platform.
There is no core code in this repository — one line of `go.mod` is the whole of
it. What lives here is the fuel business logic (`modules/petro/`) and the map,
operator screens and public pages built for it (`frontend/`).

The module registers its own routes, menus, permissions and migrations through
the public `pkg/nexus` contract and compiles into a single Go binary. Identity,
tenancy, RBAC, SSO, reporting and the audit trail come from the platform and are
not rewritten here.

The deployment authenticates people itself: its own sign-in, its own OIDC
issuer, its own database. Citizens are identified through
[eID Mongolia](https://eidmongolia.mn) rather than a password this system would
have to keep.

## Repository layout

```
main.go                   Registers the petro module and starts the platform host
modules/petro/            The fuel module: registry, reports, oversight, vouchers
  migrations/             This module's SQL, one history
cmd/petro-import/         Importer for the existing mpetro data
catalog/                  App catalogue, manifests and version chronicle
frontend/                 Next.js web client — public site, map, operator screens
deploy/                   Dockerfile, compose stack, monitoring, backup scripts
nginx/                    The six vhosts this deployment answers on
docs/                     This documentation, in seven languages
```

## Getting started

Prerequisites: Go 1.26+, Node.js 20+, PostgreSQL 16+ (or Docker).

```bash
# Everything at once
docker compose -f deploy/docker-compose.yml up -d

# Or the API on its own
go run .

# And the web client
cd frontend && npm ci && npm run dev
```

The web client answers on [http://localhost:3000](http://localhost:3000).

A deployment with no organisation yet sends every visitor to `/setup`. The token
that wizard asks for is written to the API log once, at boot:

```bash
docker logs gerege_petronet_backend 2>&1 | grep -i "setup token"
```

## Configuration

The complete list is in [`.env.example`](../.env.example). The values that
decide how a deployment behaves:

| Variable | Description |
| --- | --- |
| `PUBLIC_ORIGIN` | Where this instance answers. Defines CORS, the OIDC issuer and the eID callback in one place |
| `PETRONET_POSTGRES_PASSWORD` | This stack's own database |
| `SSO_DEFAULT_CLIENT_SECRET` | The platform refuses to start in production without it |
| `BRAND_*` | The deployment's name, description, colours and icons |
| `SERVICE_URL_*` | The addresses of the console, warehouse, backups, monitoring and documentation. Only the ones set are drawn on the front page |
| `EID_RP_UUID` / `EID_RP_SECRET` | The eID relying-party pair. Without them eID sign-in is unavailable |
| `CONTROL_PLANE_HOST` | The hostname the operator console answers on, and nowhere else |
| `PROMETHEUS_URL` | Where the console reads platform health from |

## Deployment

The production host carries `/opt/petronet/` — `src/` (this repository), `.env`
(chmod 600) and `brand/`. Updating is two commands:

```bash
cd /opt/petronet/src && git pull && ./deploy.sh
```

`deploy.sh` builds both the backend and the web image from this repository, so
the API, the map and the operator screens always ship at one revision.

Six hostnames stand beside each other: the platform (`petronet.mn`), the
operator console (`admin.`), monitoring (`monitor.`), the warehouse map
(`dwh.`), this documentation (`docs.`) and the backup notes (`backups.`). What
each is, and the traps in the nginx configuration, are in
[this deployment's document](DEPLOYMENT.md).

## Testing

```bash
go vet ./... && go test -race ./...     # Go: unit and PostgreSQL integration
cd frontend && npm test && npm run build
```

CI runs both on every push and pull request, and builds both Docker images.

## Security

- Session tokens are random 256-bit values; only their SHA-256 digest is stored.
- Passwords are hashed with bcrypt, and sign-in attempts are rate limited.
- Tenant data is isolated by a database role, a tenant context and row-level
  security on the declared tables. The regulator's reach is a policy in SQL, not
  a check in a handler.
- Report versions are chained by hash, so an approved submission cannot be
  edited without the chain saying so.
- The operator console has its own identity, cookie, audit trail and database
  role, and answers only on `CONTROL_PLANE_HOST`.

Report vulnerabilities as described in [`SECURITY.md`](../SECURITY.md).

## Documentation index

| Document | Description |
| --- | --- |
| [Documentation hub](README.md) | Every document and translation |
| [System requirements](https://plan.petronet.mn/) | What the customer asked for |
| [Development plan](https://plan.petronet.mn/plan/) | What is built, what comes next, and the acceptance criteria |
| [Benchmarks](https://plan.petronet.mn/benchmarks/) | How other countries solved this, and what failed |
| [This deployment](DEPLOYMENT.md) | Hostnames, ports, backups — only this host |
| [Architecture](ARCHITECTURE.md) | The planes, the schemas, how data is isolated |
| [Writing a module](MODULES.md) | The `pkg/nexus` contract |
| [Operations](OPERATIONS.md) | Deployment, monitoring, backup and restore |
| [Runbooks](RUNBOOKS.md) | When something breaks |
| [Translation](TRANSLATION.md) | The language policy and the generator |
| [Contributing](../CONTRIBUTING.md) · [Security](../SECURITY.md) · [Code of conduct](../CODE_OF_CONDUCT.md) | Project conduct |

---

## License

Copyright (c) 2026 **Gerege Systems Development Team, Gerege Nomadica
Foundation**. Distributed under the Apache 2.0 License — see
[`LICENSE`](../LICENSE).

Flag icons by [Flaticon](https://www.flaticon.com/)
([attribution](assets/icons/ATTRIBUTION.md)).
