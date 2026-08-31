"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import PetroMap from "@/components/petro/PetroMap";
import { useI18n } from "@/lib/i18n";

/**
 * Улсын ШТС-ууд, нүүр хуудсан дээр.
 *
 * Бусад хэсэг нь платформын тухай ярина; энэ нь түүн дээр ажиллаж буй зүйлийг
 * ХАРУУЛНА. Нүүр хуудас руу орж ирсэн жолоочид «нэгдсэн сүлжээ» гэсэн өгүүлбэр
 * биш, хамгийн ойрын түгээгүүр хэрэгтэй.
 *
 * Бүтэн дэлгэцийн `/map`-тай яг нэг компонент — хоёр хувилбар байвал нэг нь
 * хоцордог. Ялгаа нь хоёрхон prop:
 *
 *   locate=false     нүүр хуудас руу зүгээр орсон хүнээс байршлын зөвшөөрөл
 *                    гуйхгүй. Тэр асуулт нь хүн зураг руу өөрөө орох үед
 *                    утгатай болно.
 *   initialZoom=5    улс бүтнээрээ. Нэг хотод ойртсон зураг нь энд гарч буй
 *                    хамрах хүрээний тухай асуултад худал хариулна.
 *
 * Өндөр нь vh-ээр: зураг өөрөө дотоод хэмжээгүй (бүх зүйл нь absolute) тул
 * эцэг элемент нь өндрөө хэлж өгөх ёстой, эс бөгөөс MapLibre canvas-аа 300x150
 * хэвээр үлдээнэ. `min()` нь өндөр дэлгэц дээр хэсэг нь хуудсыг залгихаас
 * хамгаална.
 */
export default function StationMap() {
  const { t } = useI18n();

  return (
    <section className="gp-section" id="map">
      <div className="gp-heading">
        <span>{t("website.map.eyebrow")}</span>
        <h2>{t("website.map.title")}</h2>
        <p>{t("website.map.lede")}</p>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl ring-1 ring-black/10"
        style={{ height: "min(70vh, 620px)" }}
      >
        <PetroMap locate={false} initialZoom={5} />
      </div>

      <p className="mt-3 text-sm">
        <Link href="/map" className="inline-flex items-center gap-1 font-medium">
          {t("website.map.full")} <ArrowUpRight className="h-4 w-4" />
        </Link>
      </p>
    </section>
  );
}
