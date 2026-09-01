/**
 * Цөмийн эх кодыг олох.
 *
 * Хоёр тест `../backend/internal/…` гэж заадаг байсан — тэр зам нь цөмийн
 * репод байдаг ба энэ суулгацад байхгүй: цөм нь Go модулийн хамаарал. Тиймээс
 * `skipIf` нь ҮРГЭЛЖ үнэн болж, консолын эрхийн хүснэгт серверийнхээс зөрөхөөс
 * хамгаалах шалгалт чимээгүй алгасагдан ногоон мэдээлж байв (аудитын арга).
 *
 * Модулийн кэш дэх зам нь go.mod-оос тодорхойлогддог: хувилбарыг уншаад
 * GOMODCACHE-тэй нийлүүлнэ. Кэш байхгүй орчинд (шинэ clone, `go mod download`
 * ажиллаагүй) тест хэвээрээ алгасагдана — гэхдээ одоо тэр нь ховор тохиолдол,
 * анхдагч биш.
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export function coreModuleDir(root) {
  const goMod = join(root, "..", "go.mod");
  if (!existsSync(goMod)) return null;

  const match = readFileSync(goMod, "utf8").match(
    /github\.com\/gerege-systems\/open-gerege-nexus\/backend (v\S+)/,
  );
  if (!match) return null;

  const cache = process.env.GOMODCACHE || join(homedir(), "go", "pkg", "mod");
  const dir = join(cache, "github.com", "gerege-systems", "open-gerege-nexus", `backend@${match[1]}`);
  return existsSync(dir) ? dir : null;
}
