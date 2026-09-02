"use client";

import Link from "next/link";
import {ArrowRight} from "lucide-react";

import {useAccess} from "@/lib/access";
import {useI18n} from "@/lib/i18n";

/**
 * Нүүрний үндсэн товч — хэн харж байгаагаас хамаарна.
 *
 * Нэвтэрсэн хүнд «Нэвтрэх» гэж санал болгох нь түүнийг аль хэдийн байгаа
 * газарт нь дахин уриаж байгаа хэрэг: тэр хүн ажлын орон зай руугаа орох
 * товч хайж байна.
 *
 * `me` нь эхний client render дээр null тул сервертэй ижил markup гарч,
 * hydration зөрөхгүй — нэвтрээгүй зочинд юу ч анивчихгүй.
 */
export default function HeroActions() {
  const {t} = useI18n();
  const {me} = useAccess();

  return (
    <div className="pn-actions">
      {me ? (
        <Link href="/apps" className="pn-button pn-button--primary">
          {t("website.action.open_platform")} <ArrowRight />
        </Link>
      ) : (
        <Link href="/login" className="pn-button pn-button--primary">
          {t("website.action.sign_in")} <ArrowRight />
        </Link>
      )}
      <Link href="/rollout" className="pn-button pn-button--ghost">
        {t("website.action.rollout_plan")}
      </Link>
    </div>
  );
}
