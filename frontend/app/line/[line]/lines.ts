import type { ShellLine } from "@/lib/shell";

/**
 * Шугам бүрийн нүүр дэлгэцийн агуулга.
 *
 * Дөрвөн шугам, дөрвөн ӨӨР дэлгэц. Ялгаа нь платформ биш ХАНДЛАГА: хүн
 * төхөөрөмжтэй бие махбодоор хэрхэн харьцдаг вэ гэдэг нь дэлгэцийн нягтрал,
 * товчны хэмжээ, юуг эхэнд тавихыг шийднэ. Ширээн дээрх Mac ба зогсож байгаа
 * хүний хүрдэг kiosk хоёр ижил дэлгэц байх ёсгүй.
 *
 * Яг тэр шалтгаанаар Mac ба Windows хоёр НЭГ дэлгэц: хүн тэр хоёрын аль
 * дээр нь ч сандал дээр суугаад, гар талдаа байлгаж ажилладаг. Тэдгээрийг
 * тусад нь бичих гэсэн оролдлого нь ижил дэлгэцийг өөр үгээр хоёр удаа
 * бичихэд хүргэсэн. Платформ ялгах шаардлага үнэхээр гарвал бүрхүүл
 * `window.GeregeShell.platform`-оор өөрийгөө хэлдэг — дэлгэц дотроос
 * салаалж болно.
 *
 * Үйлдлүүд нь PetroNet-ийн ӨӨРИЙН замууд: хангамжийн гинж, ШТС, ваучер,
 * хяналт. Цөмийн ерөнхий дэлгэцүүд (апп дэлгүүр, эрх, төхөөрөмж) нь ажлын
 * ширээн дээр л үлдэнэ — талбар дээр байгаа хүнд тэдгээр хэрэггүй.
 */
export type LinePosture = "desk" | "hand" | "public";

export interface LineAction {
  label: string;
  hint: string;
  href: string;
  /** `page.tsx`-ийн ICONS дотор байх нэр. Байхгүй нэр нь хоосон дөрвөлжин зурна. */
  icon: string;
}

export interface LineContent {
  eyebrow: string;
  title: string;
  lede: string;
  posture: LinePosture;
  /**
   * Шугамын өнгө. Дөрвүүлэн PetroNet-ийн вэб палитраас (`app/petronet.css`)
   * гаралтай — тэгснээр native хүрээн доторх ажлын муж вэбтэйгээ нэг
   * бүтээгдэхүүн шиг уншигдана.
   */
  alloy: string;
  /** `rgb(<triple> / <alpha>)`-д зориулсан задалсан хэлбэр. */
  alloyRGB: string;
  actions: LineAction[];
}

export const LINE_ORDER: ShellLine[] = ["desktop", "mobile", "kiosk", "pos"];

export const LINES: Record<ShellLine, LineContent> = {
  desktop: {
    eyebrow: "PETRONET · DESKTOP ШУГАМ",
    title: "Ажлын ширээ",
    lede: "Урт ээлж, гар талдаа: импортоос хошуу хүртэлх гинж, агуулахын үлдэгдэл, үеийн тайлан — нэг хүрээн дотор, цонх нэмэгдэхгүй.",
    posture: "desk",
    alloy: "#0064DF",
    alloyRGB: "0 100 223",
    actions: [
      { label: "Хангамжийн гинж", hint: "Гэрээ, гааль, чанар, тээвэр", href: "/supply", icon: "package" },
      { label: "Агуулах, ШТС", hint: "Объект, сав, үлдэгдэл", href: "/petro/depots", icon: "boxes" },
      { label: "Улсын хяналт", hint: "Нөөц, үнэ, зөрүү, дохиолол", href: "/oversight", icon: "landmark" },
      { label: "Тайлан", hint: "Үеийн тайлан ирүүлэх, засах", href: "/petro/report", icon: "file" },
      { label: "Апп дэлгүүр", hint: "Модуль асаах, унтраах", href: "/apps", icon: "grid" },
    ],
  },
  mobile: {
    eyebrow: "PETRONET · MOBILE ШУГАМ",
    title: "Талбар дээр",
    lede: "Хөдөлгөөнд байхад хэрэгтэй нь: хаана юу байгааг харах, ачилтаа батлах, ваучер уншуулах. Гар оролт багатай.",
    posture: "hand",
    alloy: "#13A9C7",
    alloyRGB: "19 169 199",
    actions: [
      { label: "Газрын зураг", hint: "Ойрын ШТС, түлшний төрөл, нөөц", href: "/map", icon: "map" },
      { label: "Тээвэр", hint: "Цистерн, ачилт, хүргэлт", href: "/petro/shipments", icon: "truck" },
      { label: "Ваучер", hint: "Эрх шалгах, уншуулж бүртгэх", href: "/vouchers", icon: "receipt" },
      { label: "Профайл", hint: "Хэл, төхөөрөмж, нэвтрэлт", href: "/profile", icon: "settings" },
    ],
  },
  kiosk: {
    eyebrow: "PETRONET · KIOSK ШУГАМ",
    title: "Өөртөө үйлчлэх цэг",
    lede: "Иргэн өөрөө eID-ээрээ баталгаажаад өдрийн эрх, ваучераа авна. Ээлж дуусахад дэлгэц өөрөө цэвэрлэгдэнэ.",
    posture: "public",
    alloy: "#F5A800",
    alloyRGB: "245 168 0",
    actions: [
      { label: "Үйлчилгээ эхлүүлэх", hint: "eID-аар таниулж эхэлнэ", href: "/kiosk", icon: "scan" },
      { label: "Ойрын ШТС", hint: "Түлшний төрөл, нөөцийн түвшин", href: "/map", icon: "map" },
    ],
  },
  pos: {
    eyebrow: "PETRONET · POS ШУГАМ",
    title: "Кассын цэг",
    lede: "Ээлжийн ажилтан нэвтэрч, хошуу, сав, ваучераа барина. Интернэт тасарсан ч борлуулалт зогсохгүй.",
    posture: "public",
    alloy: "#0D9B68",
    alloyRGB: "13 155 104",
    actions: [
      { label: "Хошуу, сав", hint: "Ээлж, түгээгүүр, үлдэгдэл", href: "/stations", icon: "fuel" },
      { label: "Дэлгэц түгжих", hint: "Киоск горим", href: "/kiosk", icon: "shield-check" },
      { label: "Төхөөрөмж", hint: "Бүртгэл, ээлж, тохиргоо", href: "/settings/devices", icon: "monitor-cog" },
    ],
  },
};

export function isLine(value: string): value is ShellLine {
  return value in LINES;
}
