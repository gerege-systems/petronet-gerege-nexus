/*
 * PetroNet Eco System
 * Copyright (c) 2026 Gerege Systems Development Team, Gerege Nomadica Foundation
 * Distributed under the Apache 2.0 License.
 */

// Растер суурь газрын зураг, энэ origin-оос.
//
// Яагаад вектор тайлын дээр нэмж байгаа вэ: манай вектор эх сурвалж
// Улаанбаатарын орчинд л нарийвчлалтай. Ховд, Чойбалсан, Дархан дээр z13
// хоосон (204) хариулдаг — өөрөөр хэлбэл 1500 ШТС-ийн ихэнх нь дэвсгэргүй
// цэг болж харагдана. Улсын хэмжээний хяналтын систем дээр тэр нь дутагдал
// биш, эвдрэл.
//
// Тиймээс дэвсгэр нь растер: хамрах хүрээ бүрэн, зурагласан загвар нь
// хэвээр. Вектор давхаргууд үүний ДЭЭР зурагдана — Улаанбаатар өөрийн
// нарийн загвараа хадгална, бусад газар жинхэнэ газрын зураг гарна.

import { parseTilePath, proxyRasterTile } from "@/lib/petro/tileProxy";

export async function GET(_request: Request, context: { params: Promise<{ tile: string[] }> }) {
  const { tile } = await context.params;
  const parsed = parseTilePath(tile);
  if (!parsed) {
    return new Response("expected /basemap/{z}/{x}/{y}[.png]", { status: 400 });
  }
  return proxyRasterTile(...parsed);
}
