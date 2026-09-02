/**
 * Нэвтрэх картын толгой хоёр мөр: ХЭН асууж байна, юу болж байна.
 *
 * Хоёулаа `{brand}` байсан бөгөөд хоёр янзаар буруу байв. Платформ өөрөө
 * асууж байгаа үед нэг нэр хоёр удаа бичигдэж, карт өөрийгөө өөртөө
 * тайлбарлана. Гадны апп асуусан үед бүр дор: дээд мөр Grafana, доод мөр
 * PetroNet System — хоёр өөр зүйлийг нэрлэсэн нэг өгүүлбэр.
 */

import { expect, test } from "vitest";

import { auth } from "@/lib/i18n/addons/auth";

test("the two notes are different, and the self note does not repeat the name", () => {
  const asker = auth["auth.signin.asker_note"];
  const self = auth["auth.signin.self_note"];

  // Гадны апп асуусан үед аль нэвтрэлтээр орж байгааг нэрлэх ёстой.
  expect(asker.mn).toContain("{brand}");
  expect(asker.en).toContain("{brand}");

  // Платформ өөрөө асууж байгаа үед нэр нь дээд мөрөнд нэгэнт бичигдсэн:
  // энд дахин бичих нь картыг өөрийгөө өөртөө тайлбарлуулна.
  expect(self.mn).not.toContain("{brand}");
  expect(self.en).not.toContain("{brand}");

  // Хоёр тохиолдол хоёр өөр өгүүлбэр. Нэг мөрийг хоёуланд нь ашиглах нь яг
  // энэ алдааг буцааж авчирна.
  expect(self.mn).not.toBe(asker.mn);
  expect(self.en).not.toBe(asker.en);
});
