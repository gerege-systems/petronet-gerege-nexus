#!/bin/sh
# Угсрах: pages.mjs-ээс модыг бэлдээд MkDocs-оор бүтээнэ.
#
# MkDocs нь Python. Хост дээр Python орчин суулгахын оронд контейнерээр
# ажиллуулна — угсралт нь хаана ч ижил үр дүн өгөх ёстой, мөн энэ репод
# Python-ий хамаарал нэмэхгүй.
set -e
cd "$(dirname "$0")"

# Модыг бэлдэх алхам ч контейнерээр.
#
# Цөмийн хувилбар нь `node stage.mjs` гэж хостын Node-ыг дууддаг. Энэ суулгацын
# сервер дээр Node байхгүй — бас байх ч шаардлагагүй: угсралт хаана ч ижил үр
# дүн өгөх ёстой гэсэн шалтгаан нь MkDocs-д ч, stage-д ч ижилхэн хамаарна.
# Хостод суулгасан хэрэгсэл нь дараагийн хост дээр байхгүй байдаг.
docker run --rm -v "$(cd ../.. && pwd):/repo" -w /repo/docs/mkdocs node:22-alpine node stage.mjs

docker run --rm -v "$PWD:/w" -w /w/build python:3.12-slim sh -c '
  pip install --quiet --no-cache-dir \
    "mkdocs==1.6.1" "mkdocs-material==9.7.7" "mkdocs-static-i18n==1.3.0" "pymdown-extensions" &&
  mkdocs build --strict
'
echo "built → docs/mkdocs/build/site"
