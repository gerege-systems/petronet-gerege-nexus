#!/bin/sh
# Угсрах: pages.mjs-ээс модыг бэлдээд MkDocs-оор бүтээнэ.
#
#   sh build.sh          → docs.petronet.mn
#   sh build.sh plan     → plan.petronet.mn
#
# MkDocs нь Python. Хост дээр Python орчин суулгахын оронд контейнерээр
# ажиллуулна — угсралт нь хаана ч ижил үр дүн өгөх ёстой, мөн энэ репод
# Python-ий хамаарал нэмэхгүй.
set -e
cd "$(dirname "$0")"
SITE="${1:-docs}"
# docs нь `build/`-д үлдэнэ — түүнийг compose болон .gitignore аль хэдийн
# нэрлэсэн бөгөөд нэрийг нь солих нь ямар ч ашиггүй өөрчлөлт.
if [ "$SITE" = "docs" ]; then OUT="build"; else OUT="build-$SITE"; fi

# Модыг бэлдэх алхам ч контейнерээр.
#
# Цөмийн хувилбар нь `node stage.mjs` гэж хостын Node-ыг дууддаг. Энэ системийн
# сервер дээр Node байхгүй — бас байх ч шаардлагагүй: угсралт хаана ч ижил үр
# дүн өгөх ёстой гэсэн шалтгаан нь MkDocs-д ч, stage-д ч ижилхэн хамаарна.
# Хостод суулгасан хэрэгсэл нь дараагийн хост дээр байхгүй байдаг.
docker run --rm -v "$(cd ../.. && pwd):/repo" -w /repo/docs/mkdocs node:22-alpine node stage.mjs "$SITE"

docker run --rm -v "$PWD:/w" -w "/w/$OUT" python:3.12-slim sh -c '
  pip install --quiet --no-cache-dir \
    "mkdocs==1.6.1" "mkdocs-material==9.7.7" "mkdocs-static-i18n==1.3.0" "pymdown-extensions" &&
  mkdocs build --strict
'
echo "built → docs/mkdocs/$OUT/site"
