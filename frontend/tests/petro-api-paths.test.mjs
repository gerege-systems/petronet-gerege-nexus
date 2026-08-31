/**
 * Фронтендийн асуудаг зам бүр модульд бүртгэгдсэн маршрут байх ёстой.
 *
 * `fuel` → `petro` нэр солиход `lib/api/petro.ts`-ийн арван зам орхигдсон.
 * Тэдгээр нь template literal дотор байсан тул нэр солих хайлтад ороогүй,
 * TypeScript нь мөрийн агуулгыг шалгадаггүй, тест нь fetch-ийг mock хийдэг —
 * гурван шат нь ямар ч гомдол гаргалгүй өнгөрөөсөн. Газрын зураг дээр
 * «Request failed» гэсэн улаан хайрцаг л үлдсэн: /api/v1/fuel/public/stations
 * гэж байхгүй хаяг руу асууж, 404 авч байв.
 *
 * Тиймээс хоёр файлыг эх сурвалж дээр нь тулгав. Хоёулаа мөр учраас хоёулаа
 * үнэнийг хэлж чадахгүй — гэхдээ нэг нь нөгөөдөө байхгүй бол аль нэг нь буруу
 * бөгөөд энэ тест унана.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { expect, test } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const client = readFileSync(join(here, "../lib/api/petro.ts"), "utf8");
const module_ = readFileSync(join(here, "../../modules/petro/petro.go"), "utf8");

/** `${...}` → `{}`, query → хаяж, харьцуулж болох хэлбэрт оруулна. */
function shape(path) {
  return path.replace(/\$\{[^}]*\}/g, "{}").replace(/\?.*$/, "").replace(/\/$/, "");
}

/** `request<T>("…")`-д дамжуулсан зам бүр. */
function clientPaths() {
  const found = new Set();
  for (const m of client.matchAll(/request<[^>]*>\(\s*[`"]([^`"]+)[`"]/g)) {
    found.add(shape(m[1]));
  }
  return [...found];
}

/**
 * `r.Route("/api/v1/petro…", …)` доторх `Get("/stations", …)` бүр.
 *
 * chi-ийн параметрийн нэр (`{id}`, `{fuelType}`) нь эндээс хамаарахгүй тул
 * фронтендийн `${…}`-тай адил `{}` болгоно.
 */
function modulePaths() {
  const found = new Set();
  for (const route of module_.matchAll(/r\.Route\("\/api\/v1(\/[^"]*)"/g)) {
    const prefix = route[1];
    // Тухайн Route блокийн дараах текстээс дараагийн Route хүртэлх хэсэг.
    const from = route.index;
    const next = module_.slice(from + 1).search(/r\.Route\("\/api/);
    const body = module_.slice(from, next === -1 ? undefined : from + 1 + next);
    for (const call of body.matchAll(/\b(?:Get|Post|Put|Patch|Delete)\("(\/[^"]*)"/g)) {
      found.add(shape(prefix + call[1]).replace(/\{[^}]*\}/g, "{}"));
    }
  }
  return found;
}

test("модулийн API-г дуудах зам бүр бүртгэгдсэн маршрут байна", () => {
  const routes = modulePaths();
  // Хүснэгт нь уншигдсан эсэх: хоосон бол дараагийн assert нь худал ногоон
  // болно. Маршрутын синтакс өөрчлөгдвөл энэ мөр унана. Тоо нь замаар
  // хэмжигдэнэ, verb-ээр биш — /stations нь GET, POST хоёулаа нэг зам.
  expect(routes.size).toBeGreaterThan(12);

  for (const path of clientPaths()) {
    // `/me/…` нь платформын өөрийн замууд биш — модулийн доторх бүгд /petro.
    expect(routes.has(path), `${path} нь modules/petro/petro.go-д алга`).toBe(true);
  }
});
