# PetroNet Eco System

**La plataforma integrada de vigilancia y gestión de combustibles de Mongolia**

**PetroNet** reúne en un solo flujo de datos la importación, el almacenamiento,
la distribución y la venta minorista de productos petrolíferos en Mongolia, la
vigila en tiempo real y ofrece al regulador, a las compañías de combustible y al
conductor las mismas cifras. El sistema se construye para la Autoridad de
Recursos Minerales y Petróleo (AMGTG) y sustituye al sistema **mpetro** actual —
véanse los [requisitos del sistema](https://plan.petronet.mn/).

<p>
  <a href="../README.md"><img src="assets/icons/flag-mn.png" width="18" height="18" alt=""> Монгол</a>
  &nbsp;·&nbsp;
  <a href="README_AR.md"><img src="assets/icons/flag-ar.png" width="18" height="18" alt=""> العربية</a>
  &nbsp;·&nbsp;
  <a href="README_ZH.md"><img src="assets/icons/flag-zh.png" width="18" height="18" alt=""> 中文</a>
  &nbsp;·&nbsp;
  <a href="README_EN.md"><img src="assets/icons/flag-en.png" width="18" height="18" alt=""> English</a>
  &nbsp;·&nbsp;
  <a href="README_FR.md"><img src="assets/icons/flag-fr.png" width="18" height="18" alt=""> Français</a>
  &nbsp;·&nbsp;
  <a href="README_RU.md"><img src="assets/icons/flag-ru.png" width="18" height="18" alt=""> Русский</a>
  &nbsp;·&nbsp;
  <img src="assets/icons/flag-es.png" width="18" height="18" alt=""> <b>Español</b>
</p>

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](../LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.26-00ADD8.svg)](https://go.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black.svg)](https://nextjs.org)

---

## Contenido

- [El problema](#el-problema)
- [Qué hace la plataforma](#qué-hace-la-plataforma)
- [La decisión de diseño](#la-decisión-de-diseño)
- [Cadena de custodia](#cadena-de-custodia)
- [Lo que ya existe](#lo-que-ya-existe)
- [Cómo está construido](#cómo-está-construido)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Puesta en marcha](#puesta-en-marcha)
- [Configuración](#configuración)
- [Despliegue](#despliegue)
- [Pruebas](#pruebas)
- [Seguridad](#seguridad)
- [Índice de documentación](#índice-de-documentación)

---

## El problema

Mongolia tiene más de 200 compañías de combustible, más de 110 depósitos y más
de 1.500 estaciones de servicio. Sus datos viven en dos sistemas que no se
hablan, y la mayor parte se introduce **a mano**, una o dos veces por semana.

No hay un solo lugar capaz de responder, ahora mismo, cuántos litros de qué
grado hay y dónde. Así que la reserva nacional se gestiona por estimación, y
cuando el suministro se tensa solo quedan instrumentos toscos: matrículas pares
e impares, un tope único de ₮50.000 por repostaje, colas.

No es únicamente un problema de suministro. Es un problema de información, y esa
es exactamente la clase de problema que el software sí sabe resolver.

## Qué hace la plataforma

| | | Página pública |
| --- | --- | --- |
| 1 | **Cadena de custodia** — contrato de importación → aduana → laboratorio → terminal → transporte → tanque de la estación → surtidor → cliente. Cada litro se rastrea hasta el lote del que procede. | [`/supply`](https://petronet.mn/supply) |
| 2 | **TPV de estación** — una capa de controladores que habla con surtidores y medidores de nivel de cualquier fabricante, desde un controlador de pista moderno hasta un contador de impulsos, y sigue vendiendo sin red. | [`/stations`](https://petronet.mn/stations) |
| 3 | **Vales** — derechos generados solo a partir del combustible que ha llegado de verdad, repartidos por cercanía, necesidad y tiempo de espera. | [`/vouchers`](https://petronet.mn/vouchers) |
| 4 | **Supervisión estatal** — existencias, precio, calidad, impuestos y desviaciones en un único panel, sobre un rastro de auditoría que no puede reescribirse. | [`/oversight`](https://petronet.mn/oversight) |

Dos modos sobre una misma infraestructura. En crisis raciona: los límites y las
cuotas cambian en minutos, las categorías prioritarias conservan su reserva, los
vales salen con una ventana horaria. El resto del tiempo supervisa: seguimiento
de impuestos, precios, calidad y existencias, conciliación automática
importación–almacenamiento–venta, previsión de demanda y alertas sobre la
reserva estratégica.

## La decisión de diseño

> **Un vale no es una promesa. Es un litro reservado.**

Un vale solo existe una vez que el combustible ha entrado físicamente en el
tanque de una estación y el medidor automático ha confirmado la subida de nivel.

De ahí se siguen dos cosas. El sistema nunca puede prometer más de lo que tiene,
así que la cola no tiene alrededor de qué formarse. Y una estación que no
declara sus entregas no genera ningún vale, de modo que no se envía a nadie
allí: el cumplimiento lo impone el diseño, no un inspector.

## Cadena de custodia

| Etapa | Qué se registra | Origen |
| --- | --- | --- |
| Importación | Contrato, proveedor, grado, tonelaje, Incoterms, precio, fecha prevista | Portal del importador / API |
| Frontera | Número de declaración, código SA, aranceles, punto de paso | Aduana |
| Calidad | Octanaje, densidad, azufre, agua, certificado de laboratorio | Laboratorio acreditado |
| Metrología | Litros observados, temperatura, densidad → **litros a 15 °C** | ASTM D1250 / API MPMS 11.1 |
| Terminal | Tanque, capacidad, nivel, capacidad libre, traspasos a la reserva estatal | Medidores de nivel |
| Transporte | Cisterna, conductor, volumen cargado, destino, traza GPS, precinto electrónico | Módulo del transportista |
| Estación | Volumen recibido, subida de nivel, desviación, personal receptor | Medidor + confirmación |
| Surtidor | Totalizador, litros e importe por transacción, lecturas de turno | Controlador de pista |
| Cliente | Derecho, vale, canje, recibo, IVA | PetroNet + e-Barimt |

Cada nodo se concilia con el anterior, de modo que una desviación indica cuándo,
dónde y bajo la custodia de quién apareció.

## Lo que ya existe

No es un plan, sino un registro de lo que hay en el repositorio, con pruebas y
ejecutado contra un PostgreSQL real. La lista completa y lo que viene después
están en el [plan de desarrollo](https://plan.petronet.mn/plan/).

- Registro de depósitos y estaciones, matrículas, estado, verificación por XYP
- Catálogo de productos con clasificación JODI, siete grados
- Permisos del regulador, con una política a nivel de fila detrás
- La política como dato — límites, tolerancias, plazos, modificables sin una nueva versión
- Inventario técnico de estaciones (clases A–D)
- Periodos de reporte, presentaciones, líneas y conclusiones
- Reglas de validación — balance, continuidad, capacidad, desviación, metrología
- Corrección de volumen a 15 °C (ASTM D1250 / API MPMS 11.1)
- Versionado de informes y cadena de hash sobre él
- Exportación e importación de plantillas Excel
- Flujo de revisión — aprobar, devolver, cuatro ojos
- Movimientos, con matrícula, estado de cierre y desviación
- Agregado nacional diario, cobertura, días de existencias restantes
- Detección de datos no recibidos e informe de huecos de cobertura
- Conciliación ΔA–ΔE
- Siete informes en Excel y CSV, programados y enviados por correo
- Datos abiertos: el agregado nacional diario en `/api/v1/petro/public/daily`
- La pantalla de reporte de las empresas y la pantalla del regulador

## Cómo está construido

PetroNet es una **distribución de nivel 2** de la plataforma
[Gerege Nexus](https://github.com/gerege-systems/open-gerege-nexus). En este
repositorio no hay código del núcleo: una línea de `go.mod` es todo. Lo que vive
aquí es la lógica de negocio del combustible (`modules/petro/`) y el mapa, las
pantallas de operación y las páginas públicas construidas para ella
(`frontend/`).

El módulo registra sus rutas, menús, permisos y migraciones mediante el contrato
público `pkg/nexus` y se compila en un único binario de Go. Identidad,
multiinquilino, RBAC, SSO, informes y rastro de auditoría vienen de la
plataforma y no se reescriben aquí.

El despliegue autentica por sí mismo: su propio inicio de sesión, su propio
emisor OIDC, su propia base de datos. A los ciudadanos los identifica
[eID Mongolia](https://eidmongolia.mn), no una contraseña que este sistema
tendría que custodiar.

## Estructura del repositorio

```
main.go                   Registra el módulo petro e inicia el host de la plataforma
modules/petro/            El módulo de combustible: registro, informes, supervisión, vales
  migrations/             El SQL de este módulo, una sola historia
cmd/petro-import/         Importador de los datos existentes de mpetro
catalog/                  Catálogo de aplicaciones, manifiestos y crónica de versiones
frontend/                 Cliente web Next.js — sitio público, mapa, pantallas de operación
deploy/                   Dockerfile, pila compose, monitorización, scripts de copia
nginx/                    Los seis hosts virtuales de este despliegue
docs/                     Esta documentación, en siete idiomas
```

## Puesta en marcha

Requisitos: Go 1.26+, Node.js 20+, PostgreSQL 16+ (o Docker).

```bash
# Todo a la vez
docker compose -f deploy/docker-compose.yml up -d

# O solo la API
go run .

# Y el cliente web
cd frontend && npm ci && npm run dev
```

El cliente web responde en [http://localhost:3000](http://localhost:3000).

Un despliegue sin organización envía a todo visitante a `/setup`. El token que
pide ese asistente se escribe una vez en el registro de la API al arrancar:

```bash
docker logs gerege_petronet_backend 2>&1 | grep -i "setup token"
```

## Configuración

La lista completa está en [`.env.example`](../.env.example). Los valores que
deciden cómo se comporta un despliegue:

| Variable | Descripción |
| --- | --- |
| `PUBLIC_ORIGIN` | Dónde responde esta instancia. Define en un solo sitio el CORS, el emisor OIDC y la devolución de llamada de eID |
| `PETRONET_POSTGRES_PASSWORD` | La base de datos propia de esta pila |
| `SSO_DEFAULT_CLIENT_SECRET` | Sin él la plataforma se niega a arrancar en producción |
| `BRAND_*` | Nombre, descripción, colores e iconos del despliegue |
| `SERVICE_URL_*` | Direcciones de la consola, el almacén, las copias, la monitorización y la documentación. En la portada solo se dibujan las configuradas |
| `EID_RP_UUID` / `EID_RP_SECRET` | El par relying-party de eID. Sin él no hay inicio de sesión con eID |
| `CONTROL_PLANE_HOST` | El nombre de host en el que responde la consola de operación, y solo ese |
| `PROMETHEUS_URL` | De dónde lee la consola la salud de la plataforma |

## Despliegue

El host de producción lleva `/opt/petronet/` — `src/` (este repositorio), `.env`
(chmod 600) y `brand/`. Actualizar son dos órdenes:

```bash
cd /opt/petronet/src && git pull && ./deploy.sh
```

`deploy.sh` construye desde este repositorio las dos imágenes, backend y web, de
modo que la API, el mapa y las pantallas de operación salen siempre en una misma
revisión.

Seis nombres de host conviven: la plataforma (`petronet.mn`), la consola de
operación (`admin.`), la monitorización (`monitor.`), el mapa del almacén de
datos (`dwh.`), esta documentación (`docs.`) y las notas de copias de seguridad
(`backups.`). Qué es cada uno, y las trampas de la configuración de nginx, están
en [el documento de este despliegue](DEPLOYMENT.md).

## Pruebas

```bash
go vet ./... && go test -race ./...     # Go: unitarias e integración con PostgreSQL
cd frontend && npm test && npm run build
```

CI ejecuta ambas en cada push y cada pull request, y construye las dos imágenes
de Docker.

## Seguridad

- Los tokens de sesión son valores aleatorios de 256 bits; solo se almacena su
  resumen SHA-256.
- Las contraseñas se cifran con bcrypt y los intentos de inicio de sesión están
  limitados por frecuencia.
- Los datos de cada organización se aíslan con un rol de base de datos, un
  contexto de inquilino y seguridad a nivel de fila en las tablas declaradas. El
  alcance del regulador es una política en SQL, no una comprobación en un
  manejador.
- Las versiones de informe están encadenadas por hash, así que una presentación
  aprobada no puede editarse sin que la cadena lo diga.
- La consola de operación tiene su propia identidad, cookie, rastro de auditoría
  y rol de base de datos, y responde únicamente en `CONTROL_PLANE_HOST`.

Informe de vulnerabilidades según se describe en [`SECURITY.md`](../SECURITY.md).

## Índice de documentación

| Documento | Descripción |
| --- | --- |
| [Centro de documentación](README.md) | Todos los documentos y traducciones |
| [Requisitos del sistema](https://plan.petronet.mn/) | Qué pidió el cliente |
| [Plan de desarrollo](https://plan.petronet.mn/plan/) | Qué está hecho, qué viene y los criterios de aceptación |
| [Referencias internacionales](https://plan.petronet.mn/benchmarks/) | Cómo lo resolvieron otros países y qué falló |
| [Este despliegue](DEPLOYMENT.md) | Nombres de host, puertos, copias — solo este host |
| [Arquitectura](ARCHITECTURE.md) | Los planos, los esquemas, el aislamiento de datos |
| [Escribir un módulo](MODULES.md) | El contrato `pkg/nexus` |
| [Operación](OPERATIONS.md) | Despliegue, monitorización, copia y restauración |
| [Runbooks](RUNBOOKS.md) | Cuando algo se rompe |
| [Traducción](TRANSLATION.md) | La política lingüística y el generador |
| [Contribuir](../CONTRIBUTING.md) · [Seguridad](../SECURITY.md) · [Código de conducta](../CODE_OF_CONDUCT.md) | Normas del proyecto |

---

## Licencia

Copyright (c) 2026 **Gerege Systems Development Team, Gerege Nomadica
Foundation**. Distribuido bajo la licencia Apache 2.0 — véase
[`LICENSE`](../LICENSE).

Iconos de banderas por [Flaticon](https://www.flaticon.com/)
([atribución](assets/icons/ATTRIBUTION.md)).
