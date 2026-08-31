"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Fuel } from "lucide-react";

import PetroNetHeader from "./PetroNetHeader";
import {useBrand} from "@/lib/brandContext";

export default function PetroNetShell({children}: {children: ReactNode}) {
  const brand = useBrand();
  return (
    <div className="pn-site">
      <PetroNetHeader />
      {children}
      <footer className="pn-footer">
        <div className="pn-container pn-footer__top">
          <Link href="/" className="pn-brand pn-brand--footer" aria-label={`${brand.shortName} нүүр хуудас`}>
            <span className="pn-brand__mark"><Fuel /></span>
            <span><b>{brand.shortName.toUpperCase()}</b><small>Шатахууны нэгдсэн сүлжээ</small></span>
          </Link>
          <p>Монгол Улсын шатахууны урсгал, эрэлт нийлүүлэлтийн нэгдсэн платформ.</p>
          <div className="pn-footer__links">
            <Link href="/map">Газрын зураг</Link>
            <Link href="/supply">Урсгал</Link>
            <Link href="/stations">ШТС</Link>
            <Link href="/vouchers">Ваучер</Link>
            <Link href="/oversight">Хяналт</Link>
            <Link href="/rollout">Нэвтрүүлэлт</Link>
          </div>
        </div>
        <div className="pn-container pn-footer__bottom">
          <span>© 2026 Gerege Systems · {brand.shortName}</span>
          <span>Төр–хувийн түншлэлийн дэд бүтэц</span>
          <Link href="/login">Платформд нэвтрэх <ArrowUpRight /></Link>
        </div>
      </footer>
    </div>
  );
}
