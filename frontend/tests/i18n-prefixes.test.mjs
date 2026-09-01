/**
 * Орчуулгын түлхүүрийн угтвар нь толь бичигт байгаа эсэх.
 *
 * `fuel.` → `petro.` нэршил солиход дэлгэц дээрх гурван дуудлага үлдсэн ба
 * `t()` нь танихгүй түлхүүрийг өөрийг нь буцаадаг тул оператор
 * «fuel.station.grade_status.available» гэсэн бичвэр хардаг байв. `|| status`
 * гэсэн нөөц хэзээ ч ажиллахгүй: буцсан утга хоосон биш, түлхүүр өөрөө.
 *
 * `scripts/i18n-check.mjs` толь бичгийг overlay-тай тулгадаг ч дуудлагын
 * цэгүүд рүү хардаггүй — энэ тест тэр цоорхойг хаана.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|mjs)$/.test(entry)) out.push(full);
  }
  return out;
}

test("t() дуудлагын угтвар бүр толь бичигт бий", () => {
  const dictionary = walk(join(root, "lib/i18n"))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");

  const prefixes = new Set();
  for (const file of walk(join(root, "app")).concat(walk(join(root, "components")))) {
    const source = readFileSync(file, "utf8");
    for (const m of source.matchAll(/\bt\(\s*[`"']([a-z][\w]*)\.[\w.$}{]*/g)) {
      prefixes.add(m[1]);
    }
  }

  const missing = [...prefixes].filter((prefix) => !dictionary.includes(`"${prefix}.`));
  expect(missing, `толь бичигт байхгүй угтвар: ${missing.join(", ")}`).toEqual([]);
});
