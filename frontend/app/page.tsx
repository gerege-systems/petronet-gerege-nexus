import Link from "next/link";
import { redirect } from "next/navigation";
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

import PetroMap from "@/components/petro/PetroMap";
import HeroActions from "@/components/petronet/HeroActions";
import PetroNetShell from "@/components/petronet/PetroNetShell";
import Services from "@/components/petronet/Services";
import { FlowRail } from "@/components/petronet/FlowRail";
import { SectionHeading } from "@/components/petronet/ui";
import Translated from "@/components/petronet/Translated";
import { servicesFromEnv } from "@/lib/services";
import { setupRequiredOnServer } from "@/lib/setup";

/**
 * The front door of petronet.mn.
 *
 * Энэ хуудас урьд нь цөмийн платформын танилцуулга байсан — identity, SSO,
 * модуль, апп стор. Тэр нь өөр бүтээгдэхүүний аргумент: petronet.mn руу орж
 * ирсэн хүн жолооч, ШТС эзэмшигч, эсвэл зохицуулагч бөгөөд гурвуулаа шатахууны
 * тухай асуулттай ирсэн. Бүтээгдэхүүний танилцуулга нь `/product` дээр байсан
 * ч түүн рүү нэг ч цэс заадаггүй байв — нэг домэйн дээр хоёр сайт, аль нь ч
 * нөгөөгөө нэрлэдэггүй. Тэр хоёрыг энд нэгтгэв.
 *
 * Дараалал нь асуултын дараалал. Энэ юу вэ (hero). Түлш хаана байна вэ
 * (газрын зураг — нийтийн ирдэг цорын ганц шалтгаан). Яагаад ажиллах ёстой юм
 * (ваучерийн шийдэл). Хэн юу хийх вэ (таван орон зай). Хямрал өнгөрвөл яах вэ
 * (хоёр горим). Юутай холбогдох вэ (экосистем). Хаанаас эхлэх вэ (уриалга).
 *
 * Платформын гүн — архитектур, RBAC, долоон locale — энд байхгүй. Тэдгээр нь
 * `docs.petronet.mn`-д бүрэн, долоон хэлээр бичигдсэн бөгөөд нүүр хуудсанд
 * давхардуулах нь хоёр газарт хадгалагдаж, нэг нь хоцордог гэсэн үг.
 */

// Дүрслэлийн өмнө суулгацын төлөвийг асуух тул хүсэлт бүрд зурагдана.
export const dynamic = "force-dynamic";

const CAPABILITIES = [
  {href: "/supply",    index: "01", icon: Route,       title: "website.cap.supply_title",    body: "website.cap.supply_body",    meta: "website.cap.supply_meta"},
  {href: "/stations",  index: "02", icon: Fuel,        title: "website.cap.stations_title",  body: "website.cap.stations_body",  meta: "website.cap.stations_meta"},
  {href: "/vouchers",  index: "03", icon: QrCode,      title: "website.cap.vouchers_title",  body: "website.cap.vouchers_body",  meta: "website.cap.vouchers_meta"},
  {href: "/oversight", index: "04", icon: ShieldCheck, title: "website.cap.oversight_title", body: "website.cap.oversight_body", meta: "website.cap.oversight_meta"},
  {href: "/rollout",   index: "05", icon: RadioTower,  title: "website.cap.rollout_title",   body: "website.cap.rollout_body",   meta: "website.cap.rollout_meta"},
] as const;

const INTEGRATIONS = [
  {icon: PackageCheck, name: "ГЕГ",           body: "website.eco.customs"},
  {icon: MapPinned,    name: "ХУР",           body: "website.eco.registry"},
  {icon: Warehouse,    name: "ATG",           body: "website.eco.atg"},
  {icon: Fuel,         name: "website.eco.pump_name",  body: "website.eco.pump"},
  {icon: QrCode,       name: "e-Barimt",      body: "website.eco.ebarimt"},
  {icon: ShieldCheck,  name: "website.eco.state_name", body: "website.eco.state"},
] as const;

export default async function PetroNetHome() {
  // Байгууллагагүй суулгац дээр зочин байхгүй — зөвхөн суулгасан хүн байгаа
  // бөгөөд түүнд хэрэгтэй цорын ганц зүйл нь шидтэн. Энэ хуудасны хэлэх бүхэн
  // тэнд худал: хэн ч нэвтэрч чадахгүй, газрын зураг хоосон, ШТС бүртгэгдээгүй.
  if (await setupRequiredOnServer()) redirect("/setup");
  // Хаягуудыг сервер дээр уншина: браузерын `process.env` нь зөвхөн build-д
  // шигтгэсэн зүйлийг агуулдаг бөгөөд эдгээр нь образынх биш, суулгацынх.
  const services = servicesFromEnv();

  return (
    <PetroNetShell>
      <main>
        <section className="pn-hero">
          <div className="pn-container pn-hero__grid">
            <div className="pn-hero__copy">
              <div className="pn-kicker"><span /> <Translated k="website.hero.kicker" /></div>
              <h1>
                <Translated k="website.hero.title_lead" /> <em><Translated k="website.hero.title_accent" /></em>
              </h1>
              <p><Translated k="website.hero.lede" /></p>
              <HeroActions />
              <div className="pn-hero__proof">
                <span><Check /> <Translated k="website.hero.proof_stock" /></span>
                <span><Check /> <Translated k="website.hero.proof_offline" /></span>
                <span><Check /> <Translated k="website.hero.proof_vendor" /></span>
              </div>
            </div>

            {/* Хажуугийн самбар нь урьд нь зурсан жишээ байв — Сүхбаатар,
                Толгойт, 68% гэсэн зохиосон тоонууд «LIVE» гэсэн шошготой.
                Одоо тэр хүрээнд бодит газрын зураг сууна: харуулах зүйл
                байхад зурсан зургийг үзүүлэх шалтгаан алга. Доорх гурван тоо
                нь хэмжилт биш ЗОРИЛТ бөгөөд тэгж бичигдсэн. */}
            <div className="pn-operations">
              <div className="pn-operations__top">
                <div>
                  <span className="pn-live"><i /> <Translated k="website.map.eyebrow" /></span>
                  <strong><Translated k="website.map.title" /></strong>
                </div>
                <Link href="/map" className="pn-text-link">
                  <Translated k="website.map.full" /> <ArrowRight />
                </Link>
              </div>
              <div className="pn-operations__map">
                {/* locate=false — нүүр рүү зүгээр орсон хүнээс байршлын
                    зөвшөөрөл гуйхгүй; тэр асуулт нь хүн зураг руу өөрөө орох
                    үед утгатай. initialZoom=5 — улс бүтнээрээ. */}
                <PetroMap locate={false} initialZoom={5} />
              </div>
              <div className="pn-operations__metrics">
                <div><small><Translated k="website.metric.latency" /></small><strong><Translated k="website.metric.latency_value" /></strong><span><Translated k="website.metric.target" /></span></div>
                <div><small><Translated k="website.metric.reconcile" /></small><strong>&lt; 0.5%</strong><span><Translated k="website.metric.reconcile_note" /></span></div>
                <div><small><Translated k="website.metric.resilience" /></small><strong>99.5%+</strong><span><Translated k="website.metric.resilience_note" /></span></div>
              </div>
            </div>
          </div>
          <div className="pn-container"><FlowRail compact /></div>
        </section>

        <section className="pn-statement">
          <div className="pn-container pn-statement__grid">
            <div className="pn-statement__lead">
              <span className="pn-section-label"><Translated k="website.statement.label" /></span>
              <h2>
                <Translated k="website.statement.title_lead" />
                <br />
                <em><Translated k="website.statement.title_accent" /></em>
              </h2>
            </div>
            <div className="pn-statement__body">
              <p><Translated k="website.statement.body" /></p>
              <Link href="/vouchers" className="pn-text-link">
                <Translated k="website.statement.link" /> <ArrowRight />
              </Link>
            </div>
          </div>
        </section>

        <section className="pn-section" id="capabilities">
          <div className="pn-container">
            <SectionHeading
              label={<Translated k="website.cap.eyebrow" />}
              title={<Translated k="website.cap.title" />}
              body={<Translated k="website.cap.lede" />}
            />
            <div className="pn-capability-grid">
              {CAPABILITIES.map(({href, index, icon: Icon, title, body, meta}) => (
                <Link href={href} className="pn-capability" key={href}>
                  <div className="pn-capability__head"><span>{index}</span><Icon /></div>
                  <h3><Translated k={title} /></h3>
                  <p><Translated k={body} /></p>
                  <footer><span><Translated k={meta} /></span><ChevronRight /></footer>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="pn-section pn-section--blueprint">
          <div className="pn-container">
            <SectionHeading
              inverse
              label={<Translated k="website.modes.eyebrow" />}
              title={<Translated k="website.modes.title" />}
              body={<Translated k="website.modes.lede" />}
            />
            <div className="pn-modes">
              <article>
                <div className="pn-mode-icon"><CircleGauge /></div>
                <span><Translated k="website.modes.crisis_tag" /></span>
                <h3><Translated k="website.modes.crisis_title" /></h3>
                <ul>
                  <li><Translated k="website.modes.crisis_1" /></li>
                  <li><Translated k="website.modes.crisis_2" /></li>
                  <li><Translated k="website.modes.crisis_3" /></li>
                </ul>
              </article>
              <article>
                <div className="pn-mode-icon"><BarChart3 /></div>
                <span><Translated k="website.modes.normal_tag" /></span>
                <h3><Translated k="website.modes.normal_title" /></h3>
                <ul>
                  <li><Translated k="website.modes.normal_1" /></li>
                  <li><Translated k="website.modes.normal_2" /></li>
                  <li><Translated k="website.modes.normal_3" /></li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="pn-section">
          <div className="pn-container pn-ecosystem">
            <div>
              <span className="pn-section-label"><Translated k="website.eco.label" /></span>
              <h2><Translated k="website.eco.title" /></h2>
              <p><Translated k="website.eco.lede" /></p>
            </div>
            <div className="pn-integration-grid">
              {INTEGRATIONS.map(({icon: Icon, name, body}) => (
                <div key={name}>
                  <Icon />
                  <span>
                    <b>{name.startsWith("website.") ? <Translated k={name} /> : name}</b>
                    <small><Translated k={body} /></small>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Services services={services} />

        <section className="pn-cta-band">
          <div className="pn-container">
            <div>
              <span><Translated k="website.cta.sequence" /></span>
              <h2><Translated k="website.cta.title" /></h2>
            </div>
            <Link href="/rollout" className="pn-button pn-button--light">
              <Translated k="website.action.roadmap" /> <ArrowRight />
            </Link>
          </div>
        </section>
      </main>
    </PetroNetShell>
  );
}
