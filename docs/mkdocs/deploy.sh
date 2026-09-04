#!/bin/sh
# Баримтын сайтыг сервер дээр угсраад үйлчилгээнд гаргана.
#
#   sh deploy.sh <ssh-host>          → docs.petronet.mn
#   sh deploy.sh <ssh-host> plan     → plan.petronet.mn
#
# Энэ нь ЦӨМИЙНХӨӨС ӨӨР. Цөмийн хувилбар нь угсралтыг tar-даж алсын хост руу
# явуулаад `/var/www/<site>` рүү хуулдаг — учир нь тэнд nginx статик хавтаснаас
# шууд уншдаг. Энэ байрлуулалт дээр nginx статик хавтас уншдаггүй: docs ба plan
# хоёулаа өөрийн nginx КОНТЕЙНЕРТЭЙ бөгөөд тэр контейнер нь репо доторх
# `docs/mkdocs/build*/site`-ыг bind mount-оор үйлчилдэг
# (`deploy/docker-compose.yml`, `nginx/docs.petronet.mn.conf` → 127.0.0.1:3021).
# Тиймээс `/var/www/docs` руу хуулах нь ямар ч нөлөөгүй: файлууд очих ч тэднийг
# хэн ч уншихгүй. Яг тэр алдаа 2026-09-04-нд гарч, «published» гэж хэлсэн
# байршуулалтын дараа хуудас 404 хэвээр байв.
#
# Тиймээс: сервер дээрх репо дээр `git pull` хийгээд ТЭНД угсарна.
set -e
HOST="${1:?usage: deploy.sh <ssh-host> [site]}"
SITE="${2:-docs}"
if [ "$SITE" = "docs" ]; then OUT="build"; else OUT="build-$SITE"; fi

ssh "$HOST" "SITE='$SITE'; OUT='$OUT'; "'set -e
  cd /opt/petronet/src
  git pull --ff-only
  sh docs/mkdocs/build.sh "$SITE"

  # Контейнерийг ДАХИН АСААНА. Сайн дурын биш: `mkdocs build` нь гаралтын
  # хавтсыг устгаад дахин үүсгэдэг («Cleaning site directory») тул түүний inode
  # солигдоно. Контейнерийн bind mount нь ХУУЧИН inode дээр үлдэх бөгөөд
  # доторх nginx устсан модыг үйлчилсээр байна: шинэ хуудас 404, хуучин хуудас
  # хуучин агуулгаараа 200. `nginx -t` ч, docker ps ч энэ талаар юу ч хэлэхгүй.
  docker restart "gerege_petronet_$SITE" >/dev/null
  echo "restarted gerege_petronet_$SITE"'

# Шалгалт нь байршуулалтын нэг хэсэг. Хуудас 200 буцаагаад агуулгагүй байх нь
# энэ сайтын хамгийн түгээмэл бүтэлгүйтэл тул зөвхөн код биш, хэмжээг нь ч
# хардаг.
host_name="$SITE.petronet.mn"
code=$(curl -s -o /dev/null -w '%{http_code} %{size_download}' --max-time 20 "https://$host_name/")
echo "https://$host_name/ → $code (код, байт)"
