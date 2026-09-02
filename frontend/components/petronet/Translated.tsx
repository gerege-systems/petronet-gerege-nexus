"use client";

import {type DictionaryKey, useI18n} from "@/lib/i18n";

/**
 * Нэг орчуулагдсан мөр, сервер дээр зурагдаж буй хуудасны дотор.
 *
 * Нүүр хуудас нь сервер компонент — системийн төлөв, хаягуудыг илгээхээсээ
 * өмнө уншдаг — харин толь нь уншигчийн хэлээс хамаардаг тул клиент талд
 * амьдардаг. Бүх хуудсыг клиент болгох нь тэр хоёр уншилтыг browser руу
 * шилжүүлнэ; оронд нь мөр бүр өөрөө клиент навч болно.
 */
export default function Translated({k, vars}: {k: DictionaryKey; vars?: Record<string, string | number>}) {
  const {t} = useI18n();
  return <>{t(k, vars)}</>;
}
