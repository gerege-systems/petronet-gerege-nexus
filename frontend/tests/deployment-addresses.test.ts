/**
 * Хоёр хаяг, хоёр алдаа, нэг шалтгаан: суулгац хаанаа юу байгааг хэлсэн ч
 * код нь өөр газраас асууж байв.
 *
 * Толгойн «Баримт бичиг» нь `BRAND_DOCS_URL`-ыг уншдаг байсан бол суулгац
 * баримтынхаа хаягийг `SERVICE_URL_DOCS`-д бичсэн байв — тиймээс petronet.mn
 * дээр тэр цэс уншигчийг цөмийн docs.nexus.gerege.mn руу явуулж байлаа.
 *
 * Тайлын прокси нь `{z}/{x}/{y}.png` гэсэн XYZ-ийн жирийн бичлэгийг 400-аар
 * татгалзаж байв. Манай өөрийн style өргөтгөлгүй асуудаг тул зураг ажиллаж
 * байсан ч ямар ч стандарт клиент энэ проксиг ашиглаж чадахгүй байсан.
 */

import { expect, test } from "vitest";

import { brandFromEnv } from "@/lib/brandEnv";
import { parseTilePath } from "@/lib/petro/tileProxy";

test("the documentation menu prefers this deployment's own manual", () => {
  // `as unknown as` — `ProcessEnv` нь `NODE_ENV`-ыг шаарддаг ч `brandFromEnv`
  // түүнийг огт уншдаггүй, харин тестийн бүх мөрөнд бичих нь дуу чимээ.
  const docs = (vars: Record<string, string>) =>
    brandFromEnv(vars as unknown as NodeJS.ProcessEnv).docsUrl;

  // Тодорхой заасан нь хамгийн түрүүнд.
  expect(
    docs({
      BRAND_DOCS_URL: "https://handbook.example.mn",
      SERVICE_URL_DOCS: "https://docs.petronet.mn",
    }),
  ).toBe("https://handbook.example.mn");

  // Байхгүй бол суулгац аль хэдийн нэрлэсэн хаяг руу.
  expect(docs({ SERVICE_URL_DOCS: "https://docs.petronet.mn" })).toBe(
    "https://docs.petronet.mn",
  );

  // Аль нь ч байхгүй бол платформын ерөнхий ном — хаашаа ч хүрэхгүй цэснээс дээр.
  expect(docs({})).toBe("https://docs.nexus.gerege.mn/");

  // Хог утга нь хаяг биш: `javascript:` толгойн холбоос болж гарах ёсгүй.
  expect(docs({ SERVICE_URL_DOCS: "javascript:alert(1)" })).toBe(
    "https://docs.nexus.gerege.mn/",
  );
});

test("the tile proxy answers both XYZ spellings and nothing else", () => {
  expect(parseTilePath(["5", "23", "11"])).toEqual([5, 23, 11]);
  expect(parseTilePath(["5", "23", "11.png"])).toEqual([5, 23, 11]);

  expect(parseTilePath(["5", "23"])).toBeNull();
  expect(parseTilePath(["5", "23", "11", "12"])).toBeNull();
  expect(parseTilePath(["5", "23", "11.jpg"])).toBeNull();
  // Замыг дурын хаяг руу явуулагч болгох оролдлогууд.
  expect(parseTilePath(["5", "23", "../../etc/passwd"])).toBeNull();
  expect(parseTilePath(["5", "..", "11"])).toBeNull();
});
