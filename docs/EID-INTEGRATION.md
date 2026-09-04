# `eid-gerege-mn` нэгтгэлийн бүртгэл

2026-09-03-нд `gerege-systems/eid-gerege-mn`-ийн `main` салбарын
`d2833f1` commit-ийг PetroNet System-тэй бүтнээр нь тулгасан. Энэ файл нь
нэр төстэй зүйлийг сохроор хуулалгүй, аль боломж хаана орсныг дахин шалгах
бүртгэл юм.

## Нэгтгэсэн зүйл

| EID-д байсан боломж | PetroNet-д тааруулсан байрлал |
| --- | --- |
| Хүсэлт бүрийн nonce-той, `strict-dynamic` CSP | `frontend/proxy.ts`; request ба response толгойд ижил CSP очдог |
| CSP болон HSTS-ийн browser smoke test | `frontend/tests/e2e/security-headers.spec.ts` |
| Web процессын тусдаа readiness endpoint | `frontend/app/api/health/route.ts`, Compose ба Docker healthcheck |
| Next.js standalone, non-root production image | `frontend/next.config.ts`, `frontend/Dockerfile` |
| Digest-ээр тогтоосон Node base image, яг lockfile-аар `npm ci` | `frontend/Dockerfile` |
| Бүх контейнерийн privilege escalation хаалт | `deploy/docker-compose.yml`-ийн `x-hardening` |
| nginx-ийн child `location` дээр алга болдог security header-ийн хамгаалалт | `nginx/*.conf`; edge нь тогтвортой толгойг нэг хувь гаргана |
| Key, certificate, service-account, backup файлын git хамгаалалт | `.gitignore` |

EID-ийн public web камер, микрофон, байршлыг бүхэлд нь хаадаг. PetroNet-ийн
газрын зураг `geolocation`, туслах нь `microphone`, төхөөрөмжийн урсгал нь
`camera` ашигладаг тул энд тэдгээрийг зөвхөн `(self)` origin-д нээлттэй
үлдээсэн. Энэ бол дутуу хуулалт биш, бүтээгдэхүүний бодит capability-д
тааруулсан ялгаа.

## Тусдаа системдээ үлдсэн зүйл

EID репогийн үлдсэн хэсэг нь ерөнхий платформын боломж биш, үндэсний цахим
таних ба гарын үсгийн **үйлчилгээ өөрөө** юм:

- CA, OCSP, CRL, HSM, threshold signing, PIN/PUK ба certificate lifecycle;
- иргэний үнэмлэх, паспортын NFC/MRZ, liveness/facematch;
- `mn.eidgerege.dan` iOS/Android апп;
- smart-card/PKCS#11 бүхий Windows/macOS desktop апп;
- EID-ийн PostgreSQL schema, Redis session/nonce store, RP API;
- `e-id.mn`, `api.eidgerege.mn`, `ocsp.*`, `crl.*`-ийн nginx ба certificate
  topology;
- EID-ийн store listing, logo, screenshot, privacy/terms агуулга.
- EID-ийн public marketing/dashboard хуудас, хоёр хэлний орчуулга, Tailwind 4
  component set; PetroNet өөрийн fuel UI, долоон хэл, Tailwind 3 гэрээтэй.

PetroNet нь эдгээрийг ажиллуулах identity provider биш, EID-ийн **relying
party**. Холболт нь `EID_RP_UUID`, `EID_RP_SECRET`, `EID_BASE_URL` болон
`/auth/eid/callback` гэрээгээр `open-gerege-nexus` core дотор хийгддэг.
Дээрх сервер, schema, native app-уудыг `petronet` гэж нэр солиод оруулбал нэг
үйлчилгээ хоёр эзэнтэй болж, CA private key ба иргэний PII шатахууны системд
хуулбарлагдана. Тиймээс тэдгээр нь санаатайгаар энэ репод ороогүй.

## Дахин тулгах шалгуур

EID-ийн дараагийн өөрчлөлтийг авч үзэхдээ дараах гурван асуултыг дарааллаар
асууна:

1. Энэ нь identity provider-ийн домэйн логик уу, эсвэл бүх web/deploy-д
   хамаарах ерөнхий хамгаалалт уу?
2. Ижил боломж `open-gerege-nexus` dependency дотор аль хэдийн байна уу?
3. PetroNet-ийн camera/microphone/geolocation, газрын зураг, том Excel upload,
   тусдаа control-plane host-ийн гэрээг эвдэх үү?

Зөвхөн ерөнхий бөгөөд core-д давхардаагүй, PetroNet-ийн гэрээг хадгалсан
өөрчлөлтийг энд авна.
