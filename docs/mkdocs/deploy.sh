#!/bin/sh
# Угсраад байршуулна. Эхний аргумент нь ssh-ийн alias, хоёр дахь нь сайт.
#
#   sh deploy.sh <ssh-host>          → /var/www/docs
#   sh deploy.sh <ssh-host> plan     → /var/www/plan
#
# Угсралт нь алсын хост дээр явагдана: тэнд Docker байгаа, мөн macOS дээрх
# Docker Desktop-ийн хавтас хуваалцах зан төлөвөөс хамаарахгүй.
set -e
HOST="${1:?usage: deploy.sh <ssh-host> [site]}"
SITE="${2:-docs}"
if [ "$SITE" = "docs" ]; then OUT="build"; else OUT="build-$SITE"; fi
cd "$(dirname "$0")"

node stage.mjs "$SITE"
tar czf /tmp/nexus-docs-build.tgz "$OUT"
scp -q /tmp/nexus-docs-build.tgz "$HOST:/root/docs-build.tgz"
rm -f /tmp/nexus-docs-build.tgz

# Утгуудыг алсын скриптийн ЭХЭНД тавина. ssh нь аргументуудаа зайгаар залгаж
# нэг команд болгодог тул `ssh host "VAR=x" 'script'` нь VAR-ыг script-ийн
# орчинд биш, түүний эхний командын урд тавьдаг — тэндээс цааш харагдахгүй.
ssh "$HOST" "SITE='$SITE'; OUT='$OUT'; "'set -e
  rm -rf /root/docs-build && mkdir -p /root/docs-build
  cd /root/docs-build && tar xzf /root/docs-build.tgz
  # Гаралтыг файлд бичээд ДАРАА нь шүүнэ. Шууд grep рүү дамжуулбал pipe нь
  # угсралтын гарах кодыг залгидаг тул strict дээр унасан build ч гэсэн
  # нийтлэгдэж, хуучин сайт хагас шинэчлэгдэнэ.
  docker run --rm -v "/root/docs-build/$OUT:/w" -w /w python:3.12-slim sh -c "
    pip install --quiet --no-cache-dir mkdocs==1.6.1 mkdocs-material==9.7.7 mkdocs-static-i18n==1.3.0 pymdown-extensions >/dev/null 2>&1 &&
    mkdocs build --strict
  " > /root/docs-build/build.log 2>&1 || {
    grep -E "WARNING|ERROR|Aborted" /root/docs-build/build.log | head -20
    echo "build failed — nothing published" >&2
    exit 1
  }
  grep -E "Documentation built" /root/docs-build/build.log
  rm -rf "/var/www/$SITE" && mkdir -p "/var/www/$SITE"
  cp -r "/root/docs-build/$OUT/site/." "/var/www/$SITE/"
  echo "published to /var/www/$SITE"'
