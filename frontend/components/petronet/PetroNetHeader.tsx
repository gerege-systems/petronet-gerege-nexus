"use client";

import {useEffect, useRef, useState} from "react";
import Link from "next/link";
import {Fuel, Menu, X} from "lucide-react";
import {usePathname} from "next/navigation";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import {PUBLIC_NAV} from "@/lib/publicNav";
import {useBrand} from "@/lib/brandContext";
import {useI18n} from "@/lib/i18n";

/**
 * Нийтийн сайтын цорын ганц толгой.
 *
 * Урьд нь хоёр байсан: платформын `SiteHeader` нүүр дээр, энэ нь бүтээгдэхүүний
 * хуудсууд дээр. Логон дээр дарсан хүн өөр өнгө, өөр цэстэй хуудсанд ирдэг
 * байсан бөгөөд аль нь ч нөгөөгөө нэрлэдэггүй байв — нэг домэйн дээрх хоёр
 * сайт. Одоо энэ нэг нь бүх нийтийн хуудсанд үйлчилнэ.
 *
 * Хэлний сонголт энд байгаа нь нэмэлт биш: сайт долоон хэлтэй бөгөөд өмнө нь
 * зөвхөн нүүрэн дээр байсан тул `/supply` руу орсон уншигч хэлээ солих аргагүй
 * болдог байв.
 *
 * Баримт бичиг нь цорын ганц гадагш гарах холбоос — тиймээс шинэ таб, `noopener`.
 * Хаяг нь энэ суулгацынх (`BRAND_DOCS_URL`).
 */
export default function PetroNetHeader() {
  const brand = useBrand();
  const {t} = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  return (
    <header className="pn-header" ref={header}>
      <div className="pn-container pn-header__inner">
        <Link href="/" className="pn-brand" aria-label={brand.shortName}>
          <span className="pn-brand__mark"><Fuel /></span>
          <span><b>{brand.shortName.toUpperCase()}</b><small>{t("website.brand.tagline")}</small></span>
        </Link>
        <nav className={`pn-nav${open ? " is-open" : ""}`} aria-label={t("website.menu.toggle")}>
          {PUBLIC_NAV.map((item) => (
            <Link key={item.href} href={item.href} className={pathname === item.href ? "is-active" : ""}>
              {t(item.label)}
            </Link>
          ))}
          <a href={brand.docsUrl} target="_blank" rel="noopener noreferrer">
            {t("website.menu.docs")}
          </a>
          {/* Утсан дээр толгойн мөрийн хоёр удирдлага энэ самбарт унана: цэсээ
              нээсэн хүн хэлээ солих, нэвтрэх хоёрыг нь эндээс олно. */}
          <span className="pn-nav__locale"><LanguageSwitcher /></span>
          <Link href="/login" className="pn-nav__login">{t("website.action.sign_in")}</Link>
        </nav>
        <div className="pn-header__actions">
          <LanguageSwitcher />
          <Link href="/login" className="pn-header__login">{t("website.action.platform_sign_in")}</Link>
        </div>
        <button
          className="pn-menu-button"
          type="button"
          aria-label={t("website.menu.toggle")}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
