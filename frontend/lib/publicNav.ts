import type {TranslationKey} from "@/lib/i18n";

/**
 * Нийтийн сайтын цэс — толгой ба хөл хоёрын аль алинд.
 *
 * Нэг жагсаалт байгаа нь чимэг биш: толгой, хөл хоёр тус тусдаа бичигдсэн үед
 * хуудас нэмэх нь хоёр газарт засвар шаарддаг байсан бөгөөд аль нэгийг нь
 * мартах нь сайт дотроо өөрийгөө үгүйсгэсэн хоёр цэстэй болно.
 *
 * Дараалал нь урсгалын дараалал — түлш хаанаас ирж, хэнд, ямар дүрмээр очиж,
 * хэн хянадаг. Газрын зураг нь тэрнээс өмнө: нийтийн ирдэг цорын ганц шалтгаан
 * аргументын араас байх ёсгүй.
 */
export const PUBLIC_NAV: {href: string; label: TranslationKey}[] = [
  {href: "/map", label: "website.menu.map"},
  {href: "/supply", label: "website.menu.supply"},
  {href: "/stations", label: "website.menu.stations"},
  {href: "/vouchers", label: "website.menu.vouchers"},
  {href: "/oversight", label: "website.menu.oversight"},
  {href: "/rollout", label: "website.menu.rollout"},
];
