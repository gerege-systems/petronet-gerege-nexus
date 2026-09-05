#!/usr/bin/env python3
"""Тест сценариудын ХЭЛБЭРИЙГ шалгана — нууц, сүлжээ, TSM хоёулангүйгээр.

Яагаад энэ файл байна вэ. `tsm` нь түлхэхийн өмнө YAML-ыг өөрөө задалж
шалгадаг — гэхдээ тэр шалгалт нь `tsm push`-ын дотор бөгөөд TSM-ийн хаяг ба
нууц үгийг шаарддаг. Fork-оос ирсэн PR-д нууц огт байхгүй, мөн `tsm` өөрөө
хаалттай репод байдаг тул татаж ч чадахгүй. Үр дүнд нь «Тест сценари» гэдэг
ажил PR дээр сценариудын талаар ЮУ Ч шалгадаггүй байв — зөвхөн хаалттай
репогоос бинарь татахыг оролдоод унадаг байлаа.

Энэ нь серверийн шалгалтыг ОРЛОХГҮЙ. Зөвхөн хамгийн хямд, хамгийн эрт барьж
болох алдааг — эвдэрсэн YAML, дутуу `name`/`path`, буруу `auth`, HTTP код биш
`expect.status` — эх сурвалж дээр нь, файлын нэрээр нь нэрлэнэ.

    python3 .github/scripts/check-scenarios.py tsm/
"""

from __future__ import annotations

import sys
from pathlib import Path

try:
    import yaml
except ModuleNotFoundError:  # pragma: no cover - CI дээр pip install хийнэ
    sys.exit("PyYAML алга: pip install pyyaml")

AUTH = {"console", "tenant", "none"}


def check(path: Path) -> list[str]:
    bad: list[str] = []
    where = path.name

    try:
        doc = yaml.safe_load(path.read_text(encoding="utf-8"))
    except yaml.YAMLError as err:
        return [f"{where}: YAML задрахгүй байна — {str(err).splitlines()[0]}"]

    if not isinstance(doc, dict):
        return [f"{where}: дээд түвшин нь толь байх ёстой"]

    if not str(doc.get("name", "")).strip():
        bad.append(f"{where}: `name` дутуу")

    auth = doc.get("auth")
    if auth not in AUTH:
        bad.append(f"{where}: `auth` нь {sorted(AUTH)}-ийн нэг байх ёстой, «{auth}» биш")

    steps = doc.get("steps")
    if not isinstance(steps, list) or not steps:
        return bad + [f"{where}: `steps` нь хоосон биш жагсаалт байх ёстой"]

    for i, step in enumerate(steps, 1):
        at = f"{where} · алхам {i}"
        if not isinstance(step, dict):
            bad.append(f"{at}: толь байх ёстой")
            continue
        if not str(step.get("name", "")).strip():
            bad.append(f"{at}: `name` дутуу")
        if not str(step.get("path", "")).strip():
            bad.append(f"{at}: `path` дутуу")

        expect = step.get("expect")
        if expect is not None:
            if not isinstance(expect, dict):
                bad.append(f"{at}: `expect` нь толь байх ёстой")
            else:
                status = expect.get("status")
                codes = status if isinstance(status, list) else [status]
                for code in codes:
                    if code is not None and not (isinstance(code, int) and 100 <= code <= 599):
                        bad.append(f"{at}: `expect.status` нь HTTP код байх ёстой, «{code}» биш")

        # `undo` дутуу эсэхийг ШАЛГАХГҮЙ. POST бүр бичлэг үүсгэдэггүй —
        # нэвтрэлт, хайлт, тайлан бодуулах нь бүгд POST — тиймээс тэр дүрэм
        # одоо байгаа долоон зөв сценари дээр 12 худал дохио өгч байв. Бүх
        # файл дээр дуугардаг шалгалт бол шалгалт биш, дуу чимээ.

    return bad


def main(argv: list[str]) -> int:
    root = Path(argv[1] if len(argv) > 1 else "tsm")
    files = sorted(root.glob("*.yaml")) + sorted(root.glob("*.yml"))
    if not files:
        print(f"{root}/ дотор сценари алга", file=sys.stderr)
        return 1

    problems: list[str] = []
    for f in files:
        problems += check(f)

    for p in problems:
        print(f"АЛДАА · {p}", file=sys.stderr)

    print(f"{len(files)} сценари шалгав, {len(problems)} алдаа")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
