"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Fuel } from "lucide-react";

import PetroNetHeader from "./PetroNetHeader";
import { PUBLIC_NAV } from "@/lib/publicNav";
import { DEFAULT_BRAND } from "@/lib/brand";
import { useBrand } from "@/lib/brandContext";
import { useI18n } from "@/lib/i18n";

/**
 * Нийтийн сайтын хүрээ: толгой, агуулга, хөл.
 *
 * Хөлийн холбоосууд толгойныхтой нэг жагсаалтаас (`nav.ts`) — хоёр газарт
 * бичигдсэн цэс нь эрт орой хэзээ нэгэн цагт зөрдөг.
 */
export default function PetroNetShell({children}: {children: ReactNode}) {
  const brand = useBrand();
  const {t} = useI18n();
  // Өөрийн нэрээр зогсож буй суулгац доор нь юу байгааг хэлнэ; цөм өөрөө бол
  // хэлэх зүйлгүй — «Nexus, Nexus дээр суурилсан» гэсэн мөр өөрийгөө өөртөө
  // тайлбарлана.
  const rebranded = brand.name !== DEFAULT_BRAND.name;

  return (
    <div className="pn-site">
      <PetroNetHeader />
      {children}
      <footer className="pn-footer">
        <div className="pn-container pn-footer__top">
          <Link href="/" className="pn-brand pn-brand--footer" aria-label={brand.shortName}>
            <span className="pn-brand__mark"><Fuel /></span>
            <span><b>{brand.shortName.toUpperCase()}</b><small>{t("website.brand.tagline")}</small></span>
          </Link>
          <p>{t("website.footer.lede")}</p>
          <div className="pn-footer__links">
            {PUBLIC_NAV.map((item) => (
              <Link key={item.href} href={item.href}>{t(item.label)}</Link>
            ))}
            <a href={brand.docsUrl} target="_blank" rel="noopener noreferrer">{t("website.menu.docs")}</a>
          </div>
        </div>
        <div className="pn-container pn-footer__bottom">
          <span>© 2026 Gerege Systems · {brand.shortName}</span>
          <span>{t("website.footer.model")}</span>
          {rebranded && <span>{t("website.message.powered_by")}</span>}
          <Link href="/login">{t("website.action.platform_sign_in")} <ArrowUpRight /></Link>
        </div>
      </footer>
    </div>
  );
}
