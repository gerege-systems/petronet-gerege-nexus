/*
 * PetroNet System
 * Copyright (c) 2026 Gerege Systems Development Team, Gerege Nomadica Foundation
 * Distributed under the Apache 2.0 License.
 */

/**
 * Дэвсгэр зургийг өөрийн origin-оос үйлчлэх.
 *
 * # Яагаад прокси, шууд татахгүй вэ
 *
 * Тайл өөр хостод байна. Браузер шууд татвал CORS-ын тохиргоо нь тэдний
 * гарт үлдэнэ; нэг л буруу толгой бүх тайлыг унагаана. Мөн улсын хэмжээний
 * систем панн хийх болгондоо өөр багийн серверийг цохих нь тэдний ачааллын
 * тооцоонд ороогүй хэрнээ бидний ажиллагаа тэдний uptime дээр тогтоно.
 * Нэг origin болгосноор хоёулаа алга болно: CORS байхгүй, толгой алдах юм
 * байхгүй.
 *
 * # Продакшны заагийг энд үлдээв
 *
 * `MAP_RASTER_UPSTREAM` нь байт хаанаас ирэхийг заана. Өөрийн тайл сервер
 * рүү заахад клиент талд юу ч өөрчлөгдөхгүй — style нь энэ origin-ы
 * `/basemap/{z}/{x}/{y}`-ыг л асуудаг.
 *
 * Өмнө нь энд вектор тайл, фонт (glyphs) прокси хийдэг хоёр дахь зам байсан.
 * Вектор эх сурвалж Улаанбаатараас цааш хоосон байсан тул түүн дээр барьсан
 * давхаргууд улсын хэмжээнд ажиллахгүй байв; тэдгээрийг хассан бөгөөд энэ
 * файлд растер л үлдэв.
 */

/**
 * Анхдагч нь OpenStreetMap-ийн нийтийн тайл сервер — **туршилтын** анхдагч.
 * OSM-ийн ашиглалтын журам их ачааллыг хориглодог тул продакшнд
 * `MAP_RASTER_UPSTREAM`-ыг өөрийн эсвэл гэрээт үйлчилгээ рүү зааж өгнө.
 */
const DEFAULT_RASTER = "https://tile.openstreetmap.org";

/** Растер тайл сервер талаас хаанаас татагдахыг заана. */
export function rasterUpstream(): string {
  return (process.env.MAP_RASTER_UPSTREAM || DEFAULT_RASTER).replace(/\/$/, "");
}

/**
 * Нэг өдөр, долоо хоногийн stale-while-revalidate.
 *
 * Дэвсгэр зураг өөрчлөгдөх нь сар аар хэмжигдэх ажил. Хуучирсан тайлын үнэ
 * нь өнгөрсөн долоо хоногийн барилга; кэшгүйн үнэ нь панн бүр сүлжээгээр
 * дахин явах явдал.
 */
function cacheHeaders(): Record<string, string> {
  return { "cache-control": "public, max-age=86400, stale-while-revalidate=604800" };
}

/**
 * Нэг растер тайлыг татаж, өөрчлөхгүйгээр буцаана.
 *
 * `User-Agent` нь заавал: OSM нэргүй клиентийг хаадаг бөгөөд хаалт нь
 * газрын зураг бүхэлдээ алга болох хэлбэрээр илэрдэг. Прокси нь серверийн
 * талд байгаа тул энэ нэр биднийх — хэн ачаалж байгааг тэд харж чадна, тэр
 * нь зөв.
 */
export async function proxyRasterTile(z: number, x: number, y: number): Promise<Response> {
  // Тайлын индекс мужаасаа гарсан бол дээд урсгал руу огт явуулахгүй.
  const max = 2 ** z;
  if (!Number.isInteger(z) || z < 0 || z > 19 || x < 0 || x >= max || y < 0 || y >= max) {
    return new Response("tile out of range", { status: 400 });
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${rasterUpstream()}/${z}/${x}/${y}.png`, {
      cache: "no-store",
      headers: {
        Accept: "image/png,image/*",
        "User-Agent": "PetroNet System (petronet.mn; operations@petronet.mn)",
      },
    });
  } catch {
    // Тайл хост хүрэхгүй байна. 500 биш 502: энэ процесс эрүүл, түүний
    // түшиглэж буй зүйл эрүүл биш — ажиглалт хоёрыг ялгаж чадах ёстой.
    return new Response("map upstream unreachable", { status: 502 });
  }
  if (!upstreamResponse.ok) {
    return new Response(null, { status: upstreamResponse.status });
  }
  return new Response(upstreamResponse.body, {
    status: 200,
    headers: {
      "content-type": upstreamResponse.headers.get("content-type") || "image/png",
      ...cacheHeaders(),
    },
  });
}
