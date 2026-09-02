"use client";

import {Activity, Archive, ArrowUpRight, BookOpen, Database, Fingerprint, ShieldCheck} from "lucide-react";

import {SectionHeading} from "./ui";
import type {Service, ServiceId} from "@/lib/services";
import {useI18n} from "@/lib/i18n";

const ICONS: Record<ServiceId, typeof Activity> = {
  eid: Fingerprint,
  admin: ShieldCheck,
  dwh: Database,
  backups: Archive,
  monitor: Activity,
  docs: BookOpen,
};

/**
 * Энэ суулгацын хажууд ажиллаж буй зүйлс, хаягтайгаа.
 *
 * Бусад хэсэг PetroNet юу хийдгийг ярина; энэ нь юу нь ажиллаж байгааг нэрлэж,
 * хаягийг нь гардуулна. Бүтэн танилцуулгыг уншаад баримт бичиг өөрийн хаягтай
 * гэдгийг мэдэхгүй үлдсэн зочин буруу зүйл уншсан байна.
 *
 * Карт бүхэлдээ холбоос — доор нь «дэлгэрэнгүй» гэсэн ганц үг биш. Таван газарт
 * товч шиг харагдаад нэг л газраа хариу өгдөг карт нь жижиг, давтагдсан
 * урам хугаралт.
 *
 * Шинэ таб: эдгээр нь өөрсдийн нэвтрэлттэй тусдаа систем бөгөөд уншиж буй
 * хуудсыг нь нэвтрэх дэлгэцээр солих нь хоёуланг нь алдана.
 *
 * Тохируулаагүй бол огт зурагдахгүй — `lib/services.ts` дээрх шалтгаан: хүрэхгүй
 * хаяг заасан карт нь картгүй байхаас дор.
 */
export default function Services({services}: {services: Service[]}) {
  const {t} = useI18n();
  if (services.length === 0) return null;

  return (
    <section className="pn-section pn-section--soft" id="services">
      <div className="pn-container">
        <SectionHeading
          label={t("website.service.eyebrow")}
          title={t("website.service.title")}
          body={t("website.service.lede")}
        />
        <div className="pn-feature-grid">
          {services.map((service) => {
            const Icon = ICONS[service.id];
            return (
              <a
                key={service.id}
                className="pn-feature-card"
                href={service.href}
                target="_blank"
                rel="noopener"
              >
                <div className="pn-feature-card__icon"><Icon /></div>
                {/* Хаяг нь өөрөө гардуулж буй зүйл. `new URL` — утга нь
                    уншигдах үедээ аль хэдийн бүтэн URL гэж шалгагдсан. */}
                <span>{new URL(service.href).host}</span>
                <h3>{t(service.title)} <ArrowUpRight /></h3>
                <p>{t(service.body)}</p>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
