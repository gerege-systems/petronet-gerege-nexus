import Link from "next/link";
import type {Metadata} from "next";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleGauge,
  Fuel,
  MapPinned,
  PackageCheck,
  QrCode,
  RadioTower,
  Route,
  ShieldCheck,
  Warehouse,
} from "lucide-react";

import PetroNetShell from "@/components/petronet/PetroNetShell";
import {FlowRail, SectionHeading} from "@/components/petronet/ui";

// Энэ хуудас нүүр байсан. Нүүр нь одоо платформын landing (app/page.tsx) —
// цөмийн хэсгүүд дээр газрын зураг нэмэгдсэн — тул бүтээгдэхүүний
// танилцуулга өөрийн хаяг руу шилжив. Толгойн цэс энэ рүү заадаггүй:
// түүний зургаан холбоос нь тус бүрдээ хуудастай, энэ нь тэдгээрийг
// нэгтгэн харуулах хураангуй.
export const metadata: Metadata = {
  title: "PetroNet · Монгол Улсын шатахууны нэгдсэн сүлжээ",
  description: "Импортын гэрээнээс түгээгүүрийн хошуу хүртэлх шатахууны урсгал, нөөц, эрэлт, түгээлтийг нэгтгэх платформ.",
};

const capabilityPages = [
  {
    href: "/supply",
    index: "01",
    icon: Route,
    title: "Нийлүүлэлтийн урсгал",
    body: "Импортын гэрээ, гааль, чанарын шинжилгээ, терминал, тээврийг нэг партийн түүхээр холбоно.",
    meta: "17 цэгийн мөрдлөг",
  },
  {
    href: "/stations",
    index: "02",
    icon: Fuel,
    title: "ШТС ба PetroNet POS",
    body: "Сав, түгээгүүр, хошуу, ээлж, төлбөрийг үйлдвэрлэгчээс үл хамааран бодит цагт нэгтгэнэ.",
    meta: "Онлайн + офлайн",
  },
  {
    href: "/vouchers",
    index: "03",
    icon: QrCode,
    title: "Ваучер ба хуваарилалт",
    body: "Бодитоор ирсэн түлшнээс л эрх үүсгэж, ойр байршил, хэрэгцээ, хүлээлтээр шударга хуваарилна.",
    meta: "Нөөцлөгдсөн литр",
  },
  {
    href: "/oversight",
    index: "04",
    icon: ShieldCheck,
    title: "Хяналт ба ил тод байдал",
    body: "Нөөц, үнэ, чанар, татвар, зөрүүг нэг самбараас хянаж, өөрчлөх боломжгүй аудитын мөр үүсгэнэ.",
    meta: "15 минутаас бага",
  },
  {
    href: "/rollout",
    index: "05",
    icon: RadioTower,
    title: "Нэвтрүүлэлт ба интеграц",
    body: "POS-оос эхэлж өгөгдөл, харагдац, ваучер, хяналт руу үе шаттай тэлэх бодит замын зураг.",
    meta: "5 үе шат",
  },
];

export default function PetroNetHome() {
  return (
    <PetroNetShell>
      <main>
        <section className="pn-hero">
          <div className="pn-container pn-hero__grid">
            <div className="pn-hero__copy">
              <div className="pn-kicker"><span /> Монгол Улсын шатахууны нэгдсэн сүлжээ</div>
              <h1>Литр бүрийн замыг <em>нэг урсгалаар.</em></h1>
              <p>
                PetroNet импортын гэрээнээс түгээгүүрийн хошуу хүртэлх хөдөлгөөнийг холбож,
                нөөц, эрэлт, түгээлтийг бодит мэдээллээр удирдана.
              </p>
              <div className="pn-actions">
                <a href="#capabilities" className="pn-button pn-button--primary">
                  Боломжуудыг үзэх <ArrowRight />
                </a>
                <Link href="/rollout" className="pn-button pn-button--ghost">
                  Нэвтрүүлэх төлөвлөгөө
                </Link>
              </div>
              <div className="pn-hero__proof" aria-label="PetroNet-ийн үндсэн зарчим">
                <span><Check /> Бодит нөөц</span>
                <span><Check /> Офлайн ажиллагаа</span>
                <span><Check /> Үйлдвэрлэгчээс үл хамаарна</span>
              </div>
            </div>

            <div className="pn-operations" aria-label="Шатахууны урсгалын жишиг самбар">
              <div className="pn-operations__top">
                <div>
                  <span className="pn-live"><i /> УРСГАЛ ХЭВИЙН</span>
                  <strong>Үндэсний харагдац</strong>
                </div>
                <time>08:42 · шинэчлэгдсэн</time>
              </div>
              <div className="pn-operations__map">
                <div className="pn-map-grid" />
                <span className="pn-route pn-route--one" />
                <span className="pn-route pn-route--two" />
                <span className="pn-map-node pn-map-node--border"><i /> Сүхбаатар<small>Хил · хүлээн авсан</small></span>
                <span className="pn-map-node pn-map-node--depot"><i /> Толгойт<small>Терминал · 82%</small></span>
                <span className="pn-map-node pn-map-node--station"><i /> УБ / БЗД<small>ШТС · 68%</small></span>
                <div className="pn-tank">
                  <span style={{height: "72%"}} />
                  <b>АИ-92</b>
                  <small>72%</small>
                </div>
              </div>
              <div className="pn-operations__metrics">
                <div><small>Мэдээллийн саатал</small><strong>&lt; 15 мин</strong><span>зорилтот</span></div>
                <div><small>Тулгалтын зөрүү</small><strong>&lt; 0.5%</strong><span>импорт → түгээлт</span></div>
                <div><small>Системийн тэсвэр</small><strong>99.5%+</strong><span>оргил ачаалалд</span></div>
              </div>
            </div>
          </div>
          <div className="pn-container"><FlowRail compact /></div>
        </section>

        <section className="pn-statement">
          <div className="pn-container pn-statement__grid">
            <div className="pn-statement__lead">
              <span className="pn-section-label">Системийн гол шийдэл</span>
              <h2>Ваучер бол амлалт биш.<br /><em>Нөөцлөгдсөн литр.</em></h2>
            </div>
            <div className="pn-statement__body">
              <p>
                ШТС-ын савд түлш бодитоор орж, ATG хэмжилтээр баталгаажсан тэр мөчид л
                ваучер үүснэ. Ингэснээр систем байгаа нөөцөөсөө илүү амлахгүй,
                жолооч хаана түлш байгааг таах шаардлагагүй болно.
              </p>
              <Link href="/vouchers" className="pn-text-link">Хуваарилалт хэрхэн ажиллах вэ <ArrowRight /></Link>
            </div>
          </div>
        </section>

        <section className="pn-section" id="capabilities">
          <div className="pn-container">
            <SectionHeading
              label="Нэг платформ · Таван ажлын орон зай"
              title="Шатахууны бүтэн гинжин хэлхээ"
              body="Зөвхөн landing биш — оролцогч бүр өөрийн ажил, мэдээлэл, шийдвэрийн орон зайтай бодит платформ."
            />
            <div className="pn-capability-grid">
              {capabilityPages.map(({href, index, icon: Icon, title, body, meta}) => (
                <Link href={href} className="pn-capability" key={href}>
                  <div className="pn-capability__head"><span>{index}</span><Icon /></div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                  <footer><span>{meta}</span><ChevronRight /></footer>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="pn-section pn-section--blueprint">
          <div className="pn-container">
            <SectionHeading
              inverse
              label="Хоёр горим · Нэг дэд бүтэц"
              title="Хямралд хуваарилна. Энгийн үед хянана."
              body="Түр арга хэмжээ биш — тайван үед үнэ цэнээ үргэлжлүүлэн өгдөг улсын суурь дэд бүтэц."
            />
            <div className="pn-modes">
              <article>
                <div className="pn-mode-icon"><CircleGauge /></div>
                <span>CRISIS MODE</span>
                <h3>Эрэлтийг бодит нөөцөд тааруулна</h3>
                <ul>
                  <li>Лимит, квотыг 5 минутаас бага хугацаанд өөрчлөх</li>
                  <li>Ойр ШТС-д цагийн цонхтой ваучер санал болгох</li>
                  <li>Түргэн, тээвэр, хүнс, эмийн тусгай нөөц хамгаалах</li>
                </ul>
              </article>
              <article>
                <div className="pn-mode-icon"><BarChart3 /></div>
                <span>NORMAL MODE</span>
                <h3>Зах зээлийг бодит мэдээллээр хянана</h3>
                <ul>
                  <li>Татвар, үнэ, чанар, нөөцийн мониторинг</li>
                  <li>Импорт–хадгалалт–борлуулалтын автомат тулгалт</li>
                  <li>Хэрэглээний прогноз ба стратегийн нөөцийн дохиолол</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="pn-section">
          <div className="pn-container pn-ecosystem">
            <div>
              <span className="pn-section-label">Нэгдсэн экосистем</span>
              <h2>Өгөгдөл тусдаа системд түгжигдэхгүй.</h2>
              <p>PetroNet төрийн болон бизнесийн одоо байгаа системүүдийг сольж устгахгүй — баталгаатай өгөгдлийн нэг урсгалд холбоно.</p>
            </div>
            <div className="pn-integration-grid">
              {[
                [PackageCheck, "ГЕГ", "Гаалийн мэдүүлэг"],
                [MapPinned, "ХУР", "Иргэн ба тээврийн хэрэгсэл"],
                [Warehouse, "ATG", "Савны түвшин, температур"],
                [Fuel, "Түгээгүүр", "Хошууны гүйлгээ"],
                [QrCode, "e-Barimt", "НӨАТ ба төлбөр"],
                [ShieldCheck, "Төрийн хяналт", "Аудит ба тайлан"],
              ].map(([Icon, title, body]) => {
                const IntegrationIcon = Icon as typeof Fuel;
                return <div key={title as string}><IntegrationIcon /><span><b>{title as string}</b><small>{body as string}</small></span></div>;
              })}
            </div>
          </div>
        </section>

        <section className="pn-cta-band">
          <div className="pn-container">
            <div>
              <span>POS → ӨГӨГДӨЛ → ХАРАГДАЦ → ВАУЧЕР → ХЯНАЛТ</span>
              <h2>Эхний бодит үнэ цэнэ ШТС-аас эхэлнэ.</h2>
            </div>
            <Link href="/rollout" className="pn-button pn-button--light">Замын зураг үзэх <ArrowRight /></Link>
          </div>
        </section>
      </main>
    </PetroNetShell>
  );
}
