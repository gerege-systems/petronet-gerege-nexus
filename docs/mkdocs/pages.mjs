/**
 * Publication manifests — one per site.
 *
 * Data only, and the one place the published site's shape is decided: stage.mjs
 * builds both the MkDocs tree and its navigation from this list, so a page that
 * is not here is not published, and a page that is here without a file fails
 * the build rather than appearing empty.
 */
export const PAGES = [
  {src: "README.md", slug: "index", title: "Тойм", group: "Танилцуулга", lang: "mn"},
  {src: "docs/README_EN.md", slug: "overview-en", title: "Overview", group: "Танилцуулга", lang: "en"},
  {src: "docs/README_AR.md", slug: "overview-ar", title: "نظرة عامة", group: "Танилцуулга", lang: "ar", rtl: true},
  {src: "docs/README_ZH.md", slug: "overview-zh", title: "概览", group: "Танилцуулга", lang: "zh"},
  {src: "docs/README_FR.md", slug: "overview-fr", title: "Aperçu", group: "Танилцуулга", lang: "fr"},
  {src: "docs/README_RU.md", slug: "overview-ru", title: "Обзор", group: "Танилцуулга", lang: "ru"},
  {src: "docs/README_ES.md", slug: "overview-es", title: "Resumen", group: "Танилцуулга", lang: "es"},

  {src: "docs/DEPLOYMENT.md", slug: "deployment", title: "PetroNet System", group: "Танилцуулга"},


  {src: "docs/README.md", slug: "documents", title: "Баримтын индекс", group: "Платформ"},
  {src: "docs/ARCHITECTURE.md", slug: "architecture", title: "Архитектур", group: "Платформ"},
  {src: "docs/IDENTITY.md", slug: "identity", title: "Танилт ба эрх", group: "Платформ"},

  {src: "docs/MODULES.md", slug: "modules", title: "Модуль бичих", group: "Модуль"},
  {src: "docs/REPORTS.md", slug: "reports", title: "Тайлан", group: "Модуль"},
  {src: "docs/SIGNING.md", slug: "signing", title: "Баримт ба гарын үсэг", group: "Модуль"},

  {src: "docs/OPERATIONS.md", slug: "operations", title: "Ажиллагаа", group: "Ажиллагаа"},
  {src: "docs/RUNBOOKS.md", slug: "runbooks", title: "Гарын авлага", group: "Ажиллагаа"},

  {src: "docs/SHELL_CONTRACT.md", slug: "shell-contract", title: "Bridge гэрээ", group: "Клиент"},
  {src: "docs/NATIVE-APPS.md", slug: "native-apps", title: "Native клиентүүд", group: "Клиент"},
  {src: "docs/TRANSLATION.md", slug: "translation", title: "Орчуулга", group: "Клиент"},

  {src: "CONTRIBUTING.md", slug: "contributing", title: "Хувь нэмэр оруулах", group: "Төслийн журам"},
  {src: "docs/CONTRIBUTING_EN.md", slug: "contributing-en", title: "Contributing (EN)", group: "Төслийн журам"},
  {src: "SECURITY.md", slug: "security", title: "Аюулгүй байдал", group: "Төслийн журам"},
  {src: "docs/SECURITY_EN.md", slug: "security-en", title: "Security policy (EN)", group: "Төслийн журам"},
  {src: "CODE_OF_CONDUCT.md", slug: "code-of-conduct", title: "Ёс зүйн дүрэм", group: "Төслийн журам"},
  {src: "docs/CODE_OF_CONDUCT_EN.md", slug: "code-of-conduct-en", title: "Code of conduct (EN)", group: "Төслийн журам"},
];


/**
 * plan.petronet.mn — төслийн баримт.
 *
 * Яагаад тусдаа сайт вэ: docs.petronet.mn нь **бүтээгдэхүүнийг** тайлбарладаг —
 * архитектур, модуль, ажиллагаа, гарын авлага. Эдгээр нь өөр асуултад
 * хариулна: захиалагч юу шаардсан, бид юуг хэзээ барих вэ, дэлхий үүнийг
 * хэрхэн шийдсэн бэ. Тэр хоёр нь өөр уншигч, өөр амьдралын мөчлөгтэй —
 * төлөвлөгөө сар бүр өөрчлөгддөг бол ажиллагааны баримт кодтойгоо хамт
 * хөдөлдөг — тиймээс нэг цэсэнд хольсон нь хоёуланд нь саад болдог байв.
 *
 * `petronet-plan.md` энд БАЙХГҮЙ. Тэр нь дотоод баримт (`classification:
 * internal`) бөгөөд репод байгаа ч нийтлэгдэхгүй: жагсаалтад байхгүй хуудас
 * нийтлэгдэхгүй гэсэн дүрэм нь энэ файлын гол зорилго.
 */
export const PLAN_PAGES = [
  {src: "plan/system-requirements.md", slug: "index", title: "Системийн шаардлага", group: "Шаардлага"},
  {src: "plan/PLAN.md", slug: "plan", title: "Хөгжүүлэлтийн төлөвлөгөө", group: "Төлөвлөгөө"},
  {src: "plan/BENCHMARKS.md", slug: "benchmarks", title: "Дэлхийн жишиг", group: "Төлөвлөгөө"},
];
