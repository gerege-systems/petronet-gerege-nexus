/*
 * PetroNet Eco System
 * Copyright (c) 2026 Gerege Systems Development Team, Gerege Nomadica Foundation
 * Distributed under the Apache 2.0 License.
 *
 * Газрын зургийн загвар — нэг дэвсгэр, нэг эх сурвалж.
 *
 * Өмнө нь энд хоёр байсан: вектор тайлан дээр барьсан хорин дөрвөн давхарга
 * (ус, хашаа, замын шатлал, барилгын 2D ба 3D, таван төрлийн шошго) ба тэдний
 * доор растер дэвсгэр. Тэр хоёр нэг л газар — Улаанбаатарт — давхцаж
 * ажилладаг байсан бөгөөд бусад газар вектор нь хоосон байсан тул үнэндээ
 * растер ганцаараа ажиллаж байв.
 *
 * Хоёр эх сурвалж нь хоёр удаа татах, хоёр удаа алдаа гаргах, хоёр удаа
 * тохируулах гэсэн үг. Нэг нь улсын хэмжээнд ажилладаг байхад нөгөө нь
 * нийслэлд л ажилладаг бол сонголт нь тодорхой.
 *
 * Растер дэвсгэрт газар усны нэр, замын нэр шигтгэгдсэн байдаг тул шошгын
 * давхарга ч, тэдний фонт (glyphs) ч хэрэггүй. Энэ файлд үлдсэн зүйл нь
 * дэвсгэрийн өнгө ба зураг хоёр; ШТС, тээврийн давхаргуудыг PetroMap өөрөө
 * нэмнэ.
 */

import type { StyleSpecification } from "maplibre-gl";

const DEFAULT_BASEMAP = "/basemap/{z}/{x}/{y}";

/**
 * Растер дэвсгэр.
 *
 * Хаягийг `/basemap/{z}/{x}/{y}` — өөрийн origin. Байт нь хаанаас ирэхийг
 * сервер тал шийднэ (`MAP_RASTER_UPSTREAM`), клиент мэдэх шаардлагагүй.
 */
export function basemapURL(): string {
  return process.env.NEXT_PUBLIC_MAP_BASEMAP_URL || DEFAULT_BASEMAP;
}

/**
 * Mongolia, rounded outward a little so border towns and GPS drift are not
 * pulled back to the capital.
 *
 * Дэвсгэр нь дэлхий даяар байгаа ч энэ систем нь Монголын ШТС-ийн тухай:
 * хилээс гадуур төвлөрсөн зураг нь буруу байрлалаас өөр юу ч хэлэхгүй.
 */
export const MONGOLIA_BOUNDS = { minLat: 41.4, maxLat: 52.3, minLon: 87.5, maxLon: 120.2 };

/** Sükhbaatar Square — where the map opens when we have nothing better. */
export const ULAANBAATAR = { lat: 47.9185, lon: 106.9175 };

export function isCovered(lat: number, lon: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  if (lat === 0 && lon === 0) return false; // a dropped fix arrives as 0,0
  return (
    lat >= MONGOLIA_BOUNDS.minLat &&
    lat <= MONGOLIA_BOUNDS.maxLat &&
    lon >= MONGOLIA_BOUNDS.minLon &&
    lon <= MONGOLIA_BOUNDS.maxLon
  );
}

export function fuelMapStyle(): StyleSpecification {
  return {
    version: 8,
    name: "Gerege Fuel",
    sources: {
      // Улс даяар нэг ижил: Ховд, Чойбалсан, Дархан дээр Улаанбаатартай
      // адил зураг гарна. Өмнөх вектор эх сурвалж эдгээр дээр хоосон
      // хариулдаг байсан.
      basemap: { type: "raster", tiles: [basemapURL()], tileSize: 256, minzoom: 0, maxzoom: 19,
        attribution: "© OpenStreetMap" },
    },
    layers: [
      { id: "bg", type: "background", paint: { "background-color": "#f5f3ef" } },
      // Ханалтыг бага зэрэг бууруулсан нь: ШТС, тээврийн тэмдэглэгээ дээрээс
      // нь уншигдахуйц байх ёстой, растер нь өөрөө бүрэн ханалттай зурагтай.
      { id: "basemap", type: "raster", source: "basemap",
        paint: { "raster-opacity": 0.9, "raster-saturation": -0.2 } },
    ],
  } as StyleSpecification;
}
