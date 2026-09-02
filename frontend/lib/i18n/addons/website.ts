/**
 * website — The public site: what PetroNet is, before anyone signs in.
 *
 * Энэ бол платформын танилцуулга биш, бүтээгдэхүүнийх. petronet.mn руу орж
 * ирсэн хүн «модульт дижитал үйлчилгээний нээлттэй цөм» хайгаагүй — жолооч
 * хамгийн ойрын түгээгүүрээ, ШТС эзэмшигч кассаа, зохицуулагч нөөцөө хайж
 * ирсэн. Тиймээс энд байгаа мөрүүд шатахууны гинжин хэлхээний тухай ярина;
 * доор нь ямар платформ дээр ажиллаж байгааг `docs.petronet.mn` тайлбарлана.
 */
export const website = {
  // ─── Толгой ба хөл ────────────────────────────────────────────────────────
  // Цэсний дараалал нь урсгалын дараалал: түлш хаанаас ирж, хаана хадгалагдаж,
  // хэнд, ямар дүрмээр очиж, хэн хянадаг. Газрын зураг эхэлж байгаа нь
  // аргументын хэсэг биш — олон нийтийн ирдэг цорын ганц шалтгаан.
  "website.menu.map": { mn: "Газрын зураг", en: "Map" },
  "website.menu.supply": { mn: "Урсгал", en: "Supply chain" },
  "website.menu.stations": { mn: "ШТС ба POS", en: "Stations and POS" },
  "website.menu.vouchers": { mn: "Ваучер", en: "Vouchers" },
  "website.menu.oversight": { mn: "Хяналт", en: "Oversight" },
  "website.menu.rollout": { mn: "Нэвтрүүлэлт", en: "Rollout" },
  // Бүтээгдэхүүнээс гарч нийтлэгдсэн баримт руу орно. Бусад зүйл нь энэ
  // сайтын дотор тул энэ ганцыг гарч байгаагаар нь тэмдэглэнэ.
  "website.menu.docs": { mn: "Баримт бичиг", en: "Documentation" },
  "website.menu.toggle": { mn: "Цэс", en: "Menu" },

  "website.brand.tagline": { mn: "Шатахууны нэгдсэн сүлжээ", en: "The national fuel network" },
  "website.footer.lede": {
    mn: "Монгол Улсын шатахууны урсгал, эрэлт нийлүүлэлтийн нэгдсэн платформ.",
    en: "Mongolia's integrated platform for fuel flow, demand and supply.",
  },
  "website.footer.model": { mn: "Төр–хувийн түншлэлийн дэд бүтэц", en: "Public–private partnership infrastructure" },

  "website.action.sign_in": { mn: "Нэвтрэх", en: "Sign in" },
  "website.action.platform_sign_in": { mn: "Платформд нэвтрэх", en: "Sign in to the platform" },
  "website.action.eid_sign_in": { mn: "eID-ээр нэвтрэх", en: "Sign in with eID" },
  "website.action.see_features": { mn: "Боломжийг үзэх", en: "See what it does" },
  "website.action.rollout_plan": { mn: "Нэвтрүүлэх төлөвлөгөө", en: "The rollout plan" },
  "website.action.roadmap": { mn: "Замын зураг үзэх", en: "See the roadmap" },

  // ─── Нүүр — эхний дэлгэц ──────────────────────────────────────────────────
  // Гарчиг нь нэг өгүүлбэр, дунд нь тодруулсан хэсэгтэй тул орчуулгын дотор
  // markup бичихийн оронд хоёр хэсгээр хадгална: хэл бүр өөрийн таслалтыг
  // сонгоно.
  "website.hero.kicker": {
    mn: "Монгол Улсын шатахууны нэгдсэн сүлжээ",
    en: "Mongolia's national fuel network",
  },
  "website.hero.title_lead": { mn: "Литр бүрийн замыг", en: "Every litre's journey," },
  "website.hero.title_accent": { mn: "нэг урсгалаар.", en: "in one flow." },
  "website.hero.lede": {
    mn: "PetroNet импортын гэрээнээс түгээгүүрийн хошуу хүртэлх хөдөлгөөнийг холбож, нөөц, эрэлт, түгээлтийг таамгаар биш бодит хэмжилтээр удирдана.",
    en: "PetroNet links every movement from the import contract to the pump nozzle, so stock, demand and distribution are managed from measurements rather than guesswork.",
  },
  "website.hero.proof_stock": { mn: "Бодит нөөц", en: "Measured stock" },
  "website.hero.proof_offline": { mn: "Офлайн ажиллагаа", en: "Works offline" },
  "website.hero.proof_vendor": { mn: "Үйлдвэрлэгчээс үл хамаарна", en: "Vendor-independent" },

  // Хажуугийн самбарын гурван тоо. Эдгээр нь хэмжилт БИШ, зорилт — доорх
  // «зорилтот» гэсэн мөр нь чимэг биш, тэр ялгааг хэлж байгаа юм.
  "website.metric.latency": { mn: "Мэдээллийн саатал", en: "Data latency" },
  "website.metric.latency_value": { mn: "< 15 мин", en: "< 15 min" },
  "website.metric.target": { mn: "зорилтот", en: "target" },
  "website.metric.reconcile": { mn: "Тулгалтын зөрүү", en: "Reconciliation gap" },
  "website.metric.reconcile_note": { mn: "импорт → түгээлт", en: "import → dispensed" },
  "website.metric.resilience": { mn: "Системийн тэсвэр", en: "Resilience" },
  "website.metric.resilience_note": { mn: "оргил ачаалалд", en: "at peak load" },

  // Гинжин хэлхээний зурвас — нүүр ба /supply хоёрын аль алинд. Зургаан
  // зогсоол, тус бүр нь юуг бүртгэдгээрээ нэрлэгдэнэ.
  "website.rail.import": { mn: "Импорт", en: "Import" },
  "website.rail.import_note": { mn: "Гэрээ · Ачилт", en: "Contract · loading" },
  "website.rail.border": { mn: "Хил", en: "Border" },
  "website.rail.border_note": { mn: "Гааль · Чанар", en: "Customs · quality" },
  "website.rail.terminal": { mn: "Терминал", en: "Terminal" },
  "website.rail.terminal_note": { mn: "Сав · Нөөц", en: "Tanks · stock" },
  "website.rail.transport": { mn: "Тээвэр", en: "Transport" },
  "website.rail.transport_note": { mn: "GPS · Цахим лац", en: "GPS · e-seal" },
  "website.rail.station": { mn: "ШТС", en: "Station" },
  "website.rail.station_note": { mn: "Сав · Хошуу", en: "Tanks · nozzles" },
  "website.rail.dispensed": { mn: "Түгээлт", en: "Dispensed" },
  "website.rail.dispensed_note": { mn: "Баримт · Тулгалт", en: "Receipt · reconciliation" },

  // ─── Гол шийдэл ───────────────────────────────────────────────────────────
  "website.statement.label": { mn: "Системийн гол шийдэл", en: "The design decision" },
  "website.statement.title_lead": { mn: "Ваучер бол амлалт биш.", en: "A voucher is not a promise." },
  "website.statement.title_accent": { mn: "Нөөцлөгдсөн литр.", en: "It is a reserved litre." },
  "website.statement.body": {
    mn: "ШТС-ын савд түлш бодитоор орж, ATG хэмжилтээр баталгаажсан тэр мөчид л ваучер үүснэ. Ингэснээр систем байгаа нөөцөөсөө илүү амлахгүй, жолооч хаана түлш байгааг таах шаардлагагүй болно.",
    en: "A voucher exists only once fuel has physically entered a station's tank and the tank gauge has confirmed it. The system cannot promise more than it holds, and a driver never has to guess where the fuel is.",
  },
  "website.statement.link": { mn: "Хуваарилалт хэрхэн ажиллах вэ", en: "How allocation works" },

  // ─── Таван ажлын орон зай ─────────────────────────────────────────────────
  "website.cap.eyebrow": { mn: "Нэг платформ · Таван ажлын орон зай", en: "One platform · five workspaces" },
  "website.cap.title": { mn: "Шатахууны бүтэн гинжин хэлхээ", en: "The whole fuel chain" },
  "website.cap.lede": {
    mn: "Зөвхөн танилцуулга биш — оролцогч бүр өөрийн ажил, мэдээлэл, шийдвэрийн орон зайтай ажиллаж буй систем.",
    en: "Not a brochure: every participant has a workspace of their own, with their own data and their own decisions.",
  },
  "website.cap.supply_title": { mn: "Нийлүүлэлтийн урсгал", en: "The supply chain" },
  "website.cap.supply_body": {
    mn: "Импортын гэрээ, гааль, чанарын шинжилгээ, терминал, тээврийг нэг партийн түүхээр холбоно.",
    en: "Import contract, customs, laboratory results, terminal and transport joined into one batch history.",
  },
  "website.cap.supply_meta": { mn: "17 цэгийн мөрдлөг", en: "17 tracked nodes" },
  "website.cap.stations_title": { mn: "ШТС ба PetroNet POS", en: "Stations and PetroNet POS" },
  "website.cap.stations_body": {
    mn: "Сав, түгээгүүр, хошуу, ээлж, төлбөрийг үйлдвэрлэгчээс үл хамааран бодит цагт нэгтгэнэ.",
    en: "Tanks, dispensers, nozzles, shifts and payments in real time, whoever built the forecourt.",
  },
  "website.cap.stations_meta": { mn: "Онлайн + офлайн", en: "Online and offline" },
  "website.cap.vouchers_title": { mn: "Ваучер ба хуваарилалт", en: "Vouchers and allocation" },
  "website.cap.vouchers_body": {
    mn: "Бодитоор ирсэн түлшнээс л эрх үүсгэж, ойр байршил, хэрэгцээ, хүлээлтээр шударга хуваарилна.",
    en: "Entitlements are minted only from fuel that has arrived, then shared out by proximity, need and time waited.",
  },
  "website.cap.vouchers_meta": { mn: "Нөөцлөгдсөн литр", en: "Reserved litres" },
  "website.cap.oversight_title": { mn: "Хяналт ба ил тод байдал", en: "Oversight and transparency" },
  "website.cap.oversight_body": {
    mn: "Нөөц, үнэ, чанар, татвар, зөрүүг нэг самбараас хянаж, өөрчлөх боломжгүй аудитын мөр үүсгэнэ.",
    en: "Stock, prices, quality, tax and discrepancies on one board, over an audit trail that cannot be rewritten.",
  },
  "website.cap.oversight_meta": { mn: "15 минутаас бага", en: "Under 15 minutes" },
  "website.cap.rollout_title": { mn: "Нэвтрүүлэлт ба интеграц", en: "Rollout and integration" },
  "website.cap.rollout_body": {
    mn: "POS-оос эхэлж өгөгдөл, харагдац, ваучер, хяналт руу үе шаттай тэлэх бодит замын зураг.",
    en: "A staged road from POS to data, visibility, vouchers and oversight — measured at every step.",
  },
  "website.cap.rollout_meta": { mn: "5 үе шат", en: "Five phases" },

  // ─── Хоёр горим ───────────────────────────────────────────────────────────
  // Энэ хэсэг нэг л асуултад хариулна: хямрал өнгөрвөл яах вэ. Хариулт нь
  // хямралын хэрэгслийг нураахгүй, өөр ажилд эргүүлнэ.
  "website.modes.eyebrow": { mn: "Хоёр горим · Нэг дэд бүтэц", en: "Two modes · one infrastructure" },
  "website.modes.title": { mn: "Хямралд хуваарилна. Энгийн үед хянана.", en: "It rations in a crisis. It supervises the rest of the time." },
  "website.modes.lede": {
    mn: "Түр арга хэмжээ биш — тайван үед үнэ цэнээ үргэлжлүүлэн өгдөг улсын суурь дэд бүтэц.",
    en: "Not an emergency measure: infrastructure that keeps earning its place once the emergency is over.",
  },
  "website.modes.crisis_tag": { mn: "ХЯМРАЛЫН ГОРИМ", en: "CRISIS MODE" },
  "website.modes.crisis_title": { mn: "Эрэлтийг бодит нөөцөд тааруулна", en: "Demand is matched to real stock" },
  "website.modes.crisis_1": { mn: "Лимит, квотыг 5 минутаас бага хугацаанд өөрчлөх", en: "Limits and quotas change in under five minutes" },
  "website.modes.crisis_2": { mn: "Ойр ШТС-д цагийн цонхтой ваучер санал болгох", en: "Time-windowed vouchers at the nearest station" },
  "website.modes.crisis_3": { mn: "Түргэн, тээвэр, хүнс, эмийн тусгай нөөц хамгаалах", en: "Reserves ring-fenced for ambulances, transport, food and medicine" },
  "website.modes.normal_tag": { mn: "ЭНГИЙН ГОРИМ", en: "NORMAL MODE" },
  "website.modes.normal_title": { mn: "Зах зээлийг бодит мэдээллээр хянана", en: "The market is supervised from real data" },
  "website.modes.normal_1": { mn: "Татвар, үнэ, чанар, нөөцийн мониторинг", en: "Tax, price, quality and stock monitoring" },
  "website.modes.normal_2": { mn: "Импорт–хадгалалт–борлуулалтын автомат тулгалт", en: "Automatic import–storage–sales reconciliation" },
  "website.modes.normal_3": { mn: "Хэрэглээний прогноз ба стратегийн нөөцийн дохиолол", en: "Demand forecasting and strategic-reserve alerts" },

  // ─── Экосистем ────────────────────────────────────────────────────────────
  "website.eco.label": { mn: "Нэгдсэн экосистем", en: "One ecosystem" },
  "website.eco.title": { mn: "Өгөгдөл тусдаа системд түгжигдэхгүй.", en: "The data stops being locked in separate systems." },
  "website.eco.lede": {
    mn: "PetroNet төрийн болон бизнесийн одоо байгаа системүүдийг сольж устгахгүй — баталгаатай өгөгдлийн нэг урсгалд холбоно.",
    en: "PetroNet does not replace the state and business systems already in use. It joins them into one verified flow.",
  },
  "website.eco.customs": { mn: "Гаалийн мэдүүлэг", en: "Customs declarations" },
  "website.eco.registry": { mn: "Иргэн ба тээврийн хэрэгсэл", en: "Citizens and vehicles" },
  "website.eco.atg": { mn: "Савны түвшин, температур", en: "Tank level and temperature" },
  "website.eco.pump": { mn: "Хошууны гүйлгээ", en: "Nozzle transactions" },
  "website.eco.ebarimt": { mn: "НӨАТ ба төлбөр", en: "VAT and payment" },
  "website.eco.state": { mn: "Аудит ба тайлан", en: "Audit and reporting" },
  "website.eco.pump_name": { mn: "Түгээгүүр", en: "Dispensers" },
  "website.eco.state_name": { mn: "Төрийн хяналт", en: "State oversight" },

  // ─── Төгсгөлийн уриалга ───────────────────────────────────────────────────
  "website.cta.sequence": { mn: "POS → ӨГӨГДӨЛ → ХАРАГДАЦ → ВАУЧЕР → ХЯНАЛТ", en: "POS → DATA → VISIBILITY → VOUCHERS → OVERSIGHT" },
  "website.cta.title": { mn: "Эхний бодит үнэ цэнэ ШТС-аас эхэлнэ.", en: "The first real value starts at the station." },

  // ─── Газрын зураг ─────────────────────────────────────────────────────────
  "website.map.eyebrow": { mn: "ЯГ ОДОО", en: "RIGHT NOW" },
  "website.map.title": { mn: "Улсын шатахуун түгээх станцууд", en: "The country's filling stations" },
  "website.map.lede": {
    mn: "Бүртгэгдсэн ШТС бүр, тэдгээрийн түлшний төрөл, нөөцийн түвшин. Тэмдэглэгээн дээр дарж дэлгэрэнгүйг харна.",
    en: "Every registered station, the grades it carries and how full its tanks are. Tap a pin for the rest.",
  },
  "website.map.full": { mn: "Бүтэн дэлгэцээр нээх", en: "Open the full map" },

  // ─── PetroNet System-ийн хаягууд ────────────────────────────────────────────────
  "website.service.eyebrow": { mn: "PETRONET SYSTEM", en: "PETRONET SYSTEM" },
  "website.service.title": { mn: "Платформын хажууд юу ажиллаж байна вэ", en: "What runs beside the platform" },
  "website.service.lede": {
    mn: "PetroNet бол нэг хаяг биш. Консол, дата агуулах, нөөцлөлт, хяналт, баримт бичиг тус бүр өөрийн хаягтай. Эхнийх нь бидний биш — иргэнийг таних үндэсний дэд бүтэц.",
    en: "PetroNet is not one hostname. The console, the warehouse, the backup store, the monitoring stack and the manual each answer on their own address. The first is not ours — it is the national identity infrastructure.",
  },

  "website.service.eid_title": { mn: "eID Mongolia", en: "eID Mongolia" },
  "website.service.eid_body": {
    mn: "Иргэнийг таних үндэсний дэд бүтэц. Энэ платформ нууц үг хадгалахын оронд түүн рүү асууна — QR, регистр, эсвэл App2App.",
    en: "The national identity infrastructure. Rather than keeping a password, this platform asks it — by QR, registration number or App2App.",
  },
  "website.service.admin_title": { mn: "Операторын консол", en: "Operator console" },
  "website.service.admin_body": {
    mn: "Байгууллага үүсгэх, түдгэлзүүлэх, эрх олгох, audit унших. Хэрэглэгчийн бүртгэлээс тусдаа identity, тусдаа cookie.",
    en: "Create and suspend organisations, grant capabilities, read the audit trail. A separate identity and cookie from a user account.",
  },
  "website.service.dwh_title": { mn: "Дата агуулах", en: "Data warehouse" },
  "website.service.dwh_body": {
    mn: "Үйл ажиллагааны системүүдээс өдөр бүр татаж, цэвэрлэж, бизнесийн хэлээр загварчилсан нэг агуулах. Дээр нь BI ба AI давхарга.",
    en: "One warehouse fed daily from the operational systems, cleaned and modelled in business language. BI and an AI layer on top.",
  },
  "website.service.backups_title": { mn: "Нөөцлөлт", en: "Backups" },
  "website.service.backups_body": {
    mn: "Өдөр бүр 03:15-д. Хостыг орхихоосоо өмнө шифрлэгдэж, эх сервер нь түүхээ устгаж чадахгүй сан руу очно.",
    en: "Daily at 03:15. Encrypted before it leaves the host, into a store whose history the source server cannot delete.",
  },
  "website.service.monitor_title": { mn: "Хяналт", en: "Monitoring" },
  "website.service.monitor_body": {
    mn: "Хэмжүүр, лог, trace, сэрэмжлүүлэг. Хэмжигдээгүй зүйл эвдэрсэн ч мэдэгддэггүй тул энэ нь нэмэлт биш, суурь.",
    en: "Metrics, logs, traces and alerts. What is not measured fails silently, which is why this is a foundation rather than an extra.",
  },
  "website.service.docs_title": { mn: "Баримт бичиг", en: "Documentation" },
  "website.service.docs_body": {
    mn: "Кодоос уншиж бичсэн архитектур, модуль, танилт, ажиллагаа. Долоон хэлээр.",
    en: "Architecture, modules, identity and operations — written from the code. In seven languages.",
  },

  // ─── Хөл ба нэвтэрсэн хүний нүүр ──────────────────────────────────────────
  "website.message.footer_note": {
    mn: "Apache 2.0 · Go · Next.js · PostgreSQL",
    en: "Apache 2.0 · Go · Next.js · PostgreSQL",
  },
  // Зөвхөн өөрийн нэрээр зогсож буй суулгац доор нь юу байгааг хэлнэ. `{brand}`
  // биш: энэ өгүүлбэр доод давхаргыг нэрлэдэг тул суулгацын нэрийг тавибал
  // PetroNet өөрийгөө өөр дээрээ суурилсан гэж зарлана.
  "website.message.powered_by": {
    mn: "Gerege Nexus дээр суурилсан",
    en: "Powered by Gerege Nexus",
  },

  // Нэвтэрсэн хүний hero: eID картын оронд ирсэн гэрээ.
  "website.action.my_contracts": { mn: "Надад ирсэн гэрээ", en: "My incoming contracts" },
  "website.action.open_platform": { mn: "Платформ руу", en: "Open the platform" },
  "website.view.hero_inbox_title": { mn: "Танд ирсэн гэрээ", en: "Contracts sent to you" },
  "website.view.hero_inbox_empty": {
    mn: "Одоогоор хариу хүлээж буй гэрээ алга.",
    en: "Nothing is waiting for your signature right now.",
  },
  "website.view.hero_inbox_new": { mn: "Шинэ", en: "New" },
  "website.view.hero_inbox_opened": { mn: "Уншсан", en: "Opened" },
  "website.view.hero_inbox_more": { mn: "өөр гэрээ", en: "more" },
} as const;
