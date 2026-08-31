"use client";

import {useEffect, useRef, useState} from "react";
import Link from "next/link";
import {Fuel, Menu, X} from "lucide-react";
import {usePathname} from "next/navigation";
import {useBrand} from "@/lib/brandContext";

const navigation = [
  // First, because it is the only entry a member of the public came for. The
  // rest of this menu explains the platform to somebody evaluating it.
  {href: "/map", label: "Газрын зураг"},
  {href: "/supply", label: "Урсгал"},
  {href: "/stations", label: "ШТС ба POS"},
  {href: "/vouchers", label: "Ваучер"},
  {href: "/oversight", label: "Хяналт"},
  {href: "/rollout", label: "Нэвтрүүлэлт"},
];

export default function PetroNetHeader() {
  const brand = useBrand();
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
        <Link href="/" className="pn-brand" aria-label={`${brand.shortName} нүүр хуудас`}>
          <span className="pn-brand__mark"><Fuel /></span>
          <span><b>{brand.shortName.toUpperCase()}</b><small>Шатахууны нэгдсэн сүлжээ</small></span>
        </Link>
        <nav className={`pn-nav${open ? " is-open" : ""}`} aria-label="Үндсэн цэс">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className={pathname === item.href ? "is-active" : ""}>
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="pn-nav__login">Нэвтрэх</Link>
        </nav>
        <Link href="/login" className="pn-header__login">Платформд нэвтрэх</Link>
        <button
          className="pn-menu-button"
          type="button"
          aria-label={open ? "Цэс хаах" : "Цэс нээх"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
