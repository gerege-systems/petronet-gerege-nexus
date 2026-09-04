import { describe, expect, it } from "vitest";

import { deviceLineFromHost, lineHomePath } from "@/lib/deviceLine";

/**
 * Шугамыг host-оос таних.
 *
 * Энэ таних үйлдэл нь middleware-ийн эхний алхам: буруу таньсан тохиолдолд
 * ажлын муж огт буруу нүүр дэлгэц үзүүлэх, эсвэл төхөөрөмжийн шугамыг хөтчийн
 * шугам гэж үзэх хоёрын аль нэг болно. Хоёулаа чимээгүй.
 */
describe("deviceLineFromHost", () => {
  it("хаягийн эхний шошгоор шугамыг таана", () => {
    expect(deviceLineFromHost("desktop.petronet.mn")?.line).toBe("desktop");
    expect(deviceLineFromHost("mobile.petronet.mn")?.line).toBe("mobile");
    expect(deviceLineFromHost("kiosk.petronet.mn")?.line).toBe("kiosk");
    expect(deviceLineFromHost("pos.petronet.mn")?.line).toBe("pos");
  });

  // Домэйн бүтнээр нь биш зөвхөн шошгоор тааруулдаг нь санаатай: staging,
  // preview, localhost гурав энэ файлыг хөндөхгүйгээр ажиллана.
  it("домэйны үлдсэн хэсгээс хамаарахгүй", () => {
    expect(deviceLineFromHost("mobile.staging.petronet.mn")?.line).toBe("mobile");
    expect(deviceLineFromHost("desktop.localhost:3000")?.line).toBe("desktop");
  });

  // Шугам нь ПЛАТФОРМ биш form factor-оор нэрлэгдэнэ. Энэ байрлуулалт
  // платформын нэртэй хост үйлчилдэггүй тул тэдгээр энд ч танигдах ёсгүй —
  // танивал байхгүй хост дээр ажиллах дүр эсгэсэн код үлдэнэ.
  it("платформын нэртэй хостыг шугам гэж танихгүй", () => {
    for (const host of ["mac.petronet.mn", "win.petronet.mn", "ios.petronet.mn", "android.petronet.mn"]) {
      expect(deviceLineFromHost(host)).toBeNull();
    }
  });

  it("хөтчийн шугам ба утгагүй оролтод null", () => {
    expect(deviceLineFromHost("petronet.mn")).toBeNull();
    expect(deviceLineFromHost("")).toBeNull();
    expect(deviceLineFromHost(null)).toBeNull();
    expect(deviceLineFromHost(undefined)).toBeNull();
  });

  it("нүүр дэлгэцийн зам нь шугамын нэрээр гарна", () => {
    const line = deviceLineFromHost("desktop.petronet.mn");
    expect(line && lineHomePath(line)).toBe("/line/desktop");
  });
});
