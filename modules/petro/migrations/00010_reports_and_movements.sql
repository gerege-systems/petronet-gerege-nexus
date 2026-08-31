-- Тайлан, хөдөлгөөн, төхөөрөмж — зохицуулалтын гогцоо.
--
-- Энэ хүртэл модуль нь дотоод үйл ажиллагааг загварчилсан: бид өөрсдөө сав
-- дүүргэж, өөрсдөө цистерн явуулж, өөрсдөө хүлээж авдаг. Гэтэл шаардлага нь
-- өөр: 200+ гадны ААН өөрийн тоог ирүүлж, төр түүнийг шалгаж, буцааж, батална.
-- Тэр гогцоо энд эхэлнэ.
--
-- # Хувилбар нь өмнөхийг устгахгүй
--
-- Буцаагдсан тайлан засагдахдаа шинэ хувилбар болно, хуучин мөрүүд үлдэнэ.
-- Дарж бичдэг систем нь «юуг засав» гэсэн асуултад хариулж чадахгүй, тэр нь
-- зохицуулалтын системд хамгийн олон удаа асуугддаг асуулт.
--
-- # Ажиглалт ба тооцоолол хоёр өөр багана
--
-- API MPMS Ch. 3.1B: түвшин нь ажиглалт, эзлэхүүн нь тооцоолол. Тайлангийн мөр
-- нь ажиглалтын литр, температур, нягтыг хадгална; 15 °C-т шилжүүлсэн литр нь
-- тусдаа багана. Хоёрыг нэг нүдэнд шахвал дараа нь аль нь хэмжигдсэн, аль нь
-- бодогдсоныг хэн ч ялгаж чадахгүй — Монголын +35…−40 далайцад тэр ялгаа нь
-- 1–2%, өөрөөр хэлбэл хүлцлээсээ том.
--
-- # Хөдөлгөөн нь хаагддаг объект
--
-- ЕХ-ны EMCS: илгээгч хөдөлгөөн нээж давтагдашгүй дугаар авна, хүлээн авагч
-- хаана. Хаагдаагүй хөдөлгөөн бол өөрөө дохио. Үлдэгдлийн агшин зураг
-- маргаантай байж болно; хаагдаагүй хөдөлгөөн маргаангүй.

-- +goose Up

-- ─────────────────────────────────────────────────────────────────────────
-- Тайлангийн үе
-- ─────────────────────────────────────────────────────────────────────────
--
-- Тенантад харьяалагдахгүй: үеийг зохицуулагч зарлана, бүх ААН-д нэг ижил.
-- Кений 2026 оны жишиг — амралтын өдөр алгасахгүй, тиймээс өдөр тутмын үе нь
-- долоо хоногт долоон мөр.

CREATE TABLE petro_report_periods (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- daily · weekly · monthly
    kind          TEXT NOT NULL DEFAULT 'daily',
    period_start  DATE NOT NULL,
    period_end    DATE NOT NULL,
    due_at        TIMESTAMPTZ NOT NULL,
    -- open · closed
    status        TEXT NOT NULL DEFAULT 'open',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT period_ordered CHECK (period_end >= period_start),
    UNIQUE (kind, period_start)
);

CREATE INDEX idx_report_periods_due ON petro_report_periods (due_at DESC);

GRANT SELECT ON petro_report_periods TO gerege_nexus_tenant;

-- ─────────────────────────────────────────────────────────────────────────
-- Ирүүлэлт
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE petro_report_submissions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES registry.tenants (id) ON DELETE CASCADE,
    period_id        UUID NOT NULL REFERENCES petro_report_periods (id) ON DELETE CASCADE,

    version          INT NOT NULL DEFAULT 1,
    -- draft · submitted · returned · approved
    status           TEXT NOT NULL DEFAULT 'draft',

    -- form · excel · api
    source           TEXT NOT NULL DEFAULT 'form',
    file_name        TEXT NOT NULL DEFAULT '',

    row_count        INT NOT NULL DEFAULT 0,
    error_count      INT NOT NULL DEFAULT 0,
    warning_count    INT NOT NULL DEFAULT 0,

    submitted_by     UUID,
    submitted_at     TIMESTAMPTZ,
    reviewed_by      UUID,
    reviewed_at      TIMESTAMPTZ,
    review_note      TEXT NOT NULL DEFAULT '',

    -- Дахин илгээлтийг таних түлхүүр. Сүлжээ тасарч дахин илгээгдсэн нэг
    -- тайлан хоёр ирүүлэлт болох ёсгүй — Шри Ланкын 2026 оны гурав дахь алдаа.
    idempotency_key  TEXT,

    -- Хуурамчлалын хамгаалалт. Ирүүлэлт бүр өмнөхийнхөө хэшийг агуулна;
    -- дунд нь нэг мөр өөрчлөгдвөл түүнээс хойших бүх хэш таарахаа болино.
    prev_hash        BYTEA,
    hash             BYTEA,
    seq              BIGINT,

    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, period_id, version)
);

CREATE INDEX idx_report_subs_tenant ON petro_report_submissions (tenant_id, created_at DESC);
CREATE INDEX idx_report_subs_queue ON petro_report_submissions (status, submitted_at)
    WHERE status = 'submitted';
CREATE UNIQUE INDEX idx_report_subs_idem
    ON petro_report_submissions (tenant_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX idx_report_subs_seq
    ON petro_report_submissions (tenant_id, seq) WHERE seq IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- Тайлангийн мөр
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE petro_report_lines (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id        UUID NOT NULL REFERENCES petro_report_submissions (id) ON DELETE CASCADE,
    tenant_id            UUID NOT NULL REFERENCES registry.tenants (id) ON DELETE CASCADE,

    -- station · depot. Объектын id нь хоёр өөр хүснэгт рүү заадаг тул гадаад
    -- түлхүүр биш: аль нь болохыг site_kind хэлнэ, оршин байгааг шалгалт хэлнэ.
    site_kind            TEXT NOT NULL,
    site_id              UUID NOT NULL,
    product_code         TEXT NOT NULL REFERENCES petro_products (code),

    -- Тэнцлийн тэгшитгэлийн таван гишүүн. Бүгд ажиглалтын литр.
    opening_liters       NUMERIC(14, 3) NOT NULL DEFAULT 0,
    receipts_liters      NUMERIC(14, 3) NOT NULL DEFAULT 0,
    sales_liters         NUMERIC(14, 3) NOT NULL DEFAULT 0,
    transfers_out_liters NUMERIC(14, 3) NOT NULL DEFAULT 0,
    adjustments_liters   NUMERIC(14, 3) NOT NULL DEFAULT 0,
    closing_liters       NUMERIC(14, 3) NOT NULL DEFAULT 0,

    price_mnt            NUMERIC(10, 2),

    -- Хэмжил зүйн ажиглалт. NULL нь «хэмжээгүй» — 0 биш.
    temperature_c        NUMERIC(5, 2),
    density_kg_m3        NUMERIC(7, 2),

    -- Тооцоолол. Ажиглалтаас гарсан, ажиглалтыг дарж бичээгүй.
    closing_liters_15c   NUMERIC(14, 3),
    variance_liters      NUMERIC(14, 3),
    variance_pct         NUMERIC(8, 4),

    note                 TEXT NOT NULL DEFAULT '',

    UNIQUE (submission_id, site_kind, site_id, product_code)
);

CREATE INDEX idx_report_lines_sub ON petro_report_lines (submission_id);
CREATE INDEX idx_report_lines_site ON petro_report_lines (site_kind, site_id);
CREATE INDEX idx_report_lines_variance ON petro_report_lines (variance_pct)
    WHERE variance_pct IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- Шалгалтын дүгнэлт
-- ─────────────────────────────────────────────────────────────────────────
--
-- «Тайлан алдаатай» гэдэг нь буцаалт биш. Аль мөр, ямар дүрэм, ямар тоо —
-- гурвыг хэлж байж л илгээгч засаж чадна.

CREATE TABLE petro_validation_findings (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id  UUID NOT NULL REFERENCES petro_report_submissions (id) ON DELETE CASCADE,
    tenant_id      UUID NOT NULL REFERENCES registry.tenants (id) ON DELETE CASCADE,
    line_id        UUID REFERENCES petro_report_lines (id) ON DELETE CASCADE,

    rule           TEXT NOT NULL,
    -- error нь буцаана, warning нь тэмдэглэнэ.
    severity       TEXT NOT NULL DEFAULT 'error',
    message        TEXT NOT NULL,
    detail         JSONB,

    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_findings_sub ON petro_validation_findings (submission_id, severity);

-- ─────────────────────────────────────────────────────────────────────────
-- Хөдөлгөөн — EMCS-ийн загвараар
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE petro_movements (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          UUID NOT NULL REFERENCES registry.tenants (id) ON DELETE CASCADE,

    -- Улсын хэмжээнд давтагдашгүй лавлагаа. Маргаан нэг дугаар дээр төвлөрнө —
    -- EMCS-ийн ARC-ийн үүрэг.
    national_ref       TEXT NOT NULL UNIQUE,

    from_kind          TEXT NOT NULL,
    from_id            UUID,
    to_kind            TEXT NOT NULL,
    to_id              UUID,

    product_code       TEXT NOT NULL REFERENCES petro_products (code),

    declared_liters    NUMERIC(14, 3) NOT NULL CHECK (declared_liters > 0),
    received_liters    NUMERIC(14, 3),
    declared_liters_15c NUMERIC(14, 3),
    received_liters_15c NUMERIC(14, 3),

    -- open · closed · disputed · cancelled
    status             TEXT NOT NULL DEFAULT 'open',
    variance_pct       NUMERIC(8, 4),

    trip_id            UUID REFERENCES petro_dispatch_trips (id) ON DELETE SET NULL,

    opened_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_at             TIMESTAMPTZ,
    closed_at          TIMESTAMPTZ,
    closed_by          UUID,
    note               TEXT NOT NULL DEFAULT ''
);

CREATE INDEX idx_movements_tenant ON petro_movements (tenant_id, opened_at DESC);
-- Хугацаандаа хаагдаагүй хөдөлгөөн — дохиоллын үндсэн асуулга.
CREATE INDEX idx_movements_open ON petro_movements (due_at)
    WHERE status = 'open';

-- ─────────────────────────────────────────────────────────────────────────
-- Төхөөрөмж — одоо хоосон, 2-р сард дүүрнэ
-- ─────────────────────────────────────────────────────────────────────────
--
-- ATG ирэхэд шинэ хүснэгт биш, шинэ мөр байх ёстой. Тиймээс бүртгэл нь
-- мэдрэгчээс өмнө орж ирнэ: аль сав, хэний, ямар дугаартай, ямар протоколтой.

CREATE TABLE petro_devices (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES registry.tenants (id) ON DELETE CASCADE,

    site_kind     TEXT NOT NULL,
    site_id       UUID NOT NULL,
    tank_id       UUID REFERENCES petro_depot_tanks (id) ON DELETE SET NULL,

    serial        TEXT NOT NULL,
    vendor        TEXT NOT NULL DEFAULT '',
    -- veeder_root · start_italiana · modbus · manual
    protocol      TEXT NOT NULL DEFAULT 'manual',

    -- registered · active · silent · retired
    status        TEXT NOT NULL DEFAULT 'registered',
    last_seen_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, serial)
);

CREATE INDEX idx_devices_site ON petro_devices (site_kind, site_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Улсын өдрийн нэгтгэл
-- ─────────────────────────────────────────────────────────────────────────
--
-- Materialized view биш, урьдчилан бөглөсөн хүснэгт. Шалтгаан нь refresh:
-- MV нь бүхэлдээ дахин тооцогддог, энэ нь өдрөөр upsert хийгддэг — нэг өдрийн
-- тайлан хожуу ирэхэд түүнийг л дахин бодно.
--
-- Тенантын багана байхгүй нь санаатай: энэ бол улсын тоо. Компанийн задаргаа
-- нь тайлангийн мөрөнд байгаа ба тэр нь мөрийн түвшний бодлогоор хамгаалагдана
-- (metrics.go-ийн ижил дүрэм).

CREATE TABLE petro_daily_national (
    day             DATE NOT NULL,
    product_code    TEXT NOT NULL REFERENCES petro_products (code),
    aimag           TEXT NOT NULL DEFAULT '',

    stock_liters    NUMERIC(16, 3) NOT NULL DEFAULT 0,
    capacity_liters NUMERIC(16, 3) NOT NULL DEFAULT 0,
    receipts_liters NUMERIC(16, 3) NOT NULL DEFAULT 0,
    sales_liters    NUMERIC(16, 3) NOT NULL DEFAULT 0,

    sites_total     INT NOT NULL DEFAULT 0,
    sites_reported  INT NOT NULL DEFAULT 0,

    -- Хоногийн нөөц. Борлуулалт 0 бол NULL — тэглэх нь «хязгааргүй нөөц»
    -- гэсэн худал хариулт болно.
    days_of_supply  NUMERIC(8, 2),

    refreshed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (day, product_code, aimag)
);

CREATE INDEX idx_daily_national_day ON petro_daily_national (day DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- Мөрийн түвшний тусгаарлалт
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE petro_report_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE petro_report_submissions FORCE ROW LEVEL SECURITY;
ALTER TABLE petro_report_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE petro_report_lines FORCE ROW LEVEL SECURITY;
ALTER TABLE petro_validation_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE petro_validation_findings FORCE ROW LEVEL SECURITY;
ALTER TABLE petro_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE petro_movements FORCE ROW LEVEL SECURITY;
ALTER TABLE petro_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE petro_devices FORCE ROW LEVEL SECURITY;
ALTER TABLE petro_daily_national ENABLE ROW LEVEL SECURITY;
ALTER TABLE petro_daily_national FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON petro_report_submissions TO gerege_nexus_tenant
    USING (tenant_id = ANY (COALESCE(
        NULLIF(current_setting('app.allowed_tenants', true), '')::uuid[],
        ARRAY[NULLIF(current_setting('app.current_tenant', true), '')::uuid])))
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

CREATE POLICY tenant_isolation ON petro_report_lines TO gerege_nexus_tenant
    USING (tenant_id = ANY (COALESCE(
        NULLIF(current_setting('app.allowed_tenants', true), '')::uuid[],
        ARRAY[NULLIF(current_setting('app.current_tenant', true), '')::uuid])))
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

CREATE POLICY tenant_isolation ON petro_validation_findings TO gerege_nexus_tenant
    USING (tenant_id = ANY (COALESCE(
        NULLIF(current_setting('app.allowed_tenants', true), '')::uuid[],
        ARRAY[NULLIF(current_setting('app.current_tenant', true), '')::uuid])))
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

CREATE POLICY tenant_isolation ON petro_movements TO gerege_nexus_tenant
    USING (tenant_id = ANY (COALESCE(
        NULLIF(current_setting('app.allowed_tenants', true), '')::uuid[],
        ARRAY[NULLIF(current_setting('app.current_tenant', true), '')::uuid])))
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

CREATE POLICY tenant_isolation ON petro_devices TO gerege_nexus_tenant
    USING (tenant_id = ANY (COALESCE(
        NULLIF(current_setting('app.allowed_tenants', true), '')::uuid[],
        ARRAY[NULLIF(current_setting('app.current_tenant', true), '')::uuid])))
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

-- Зохицуулагч: харна, батална, буцаана. Компанийн мөрийг өөрчлөхгүй —
-- батлах нь ирүүлэлтийн төлөв, мөрийн тоо биш.
CREATE POLICY oversight_read ON petro_report_submissions FOR SELECT TO gerege_nexus_tenant
    USING (petro_is_oversight());
CREATE POLICY oversight_review ON petro_report_submissions FOR UPDATE TO gerege_nexus_tenant
    USING (petro_is_oversight()) WITH CHECK (petro_is_oversight());
CREATE POLICY oversight_read ON petro_report_lines FOR SELECT TO gerege_nexus_tenant
    USING (petro_is_oversight());
CREATE POLICY oversight_read ON petro_validation_findings FOR SELECT TO gerege_nexus_tenant
    USING (petro_is_oversight());
CREATE POLICY oversight_read ON petro_movements FOR SELECT TO gerege_nexus_tenant
    USING (petro_is_oversight());
CREATE POLICY oversight_close ON petro_movements FOR UPDATE TO gerege_nexus_tenant
    USING (petro_is_oversight()) WITH CHECK (petro_is_oversight());
CREATE POLICY oversight_read ON petro_devices FOR SELECT TO gerege_nexus_tenant
    USING (petro_is_oversight());

-- Улсын нэгтгэлийг зохицуулагч уншина. Нийтийн хуудас нь тенантын дүрээр биш,
-- нэвтрэлтийн дүрээр уншдаг тул бодлого түүнд хамаарахгүй.
CREATE POLICY oversight_read ON petro_daily_national FOR SELECT TO gerege_nexus_tenant
    USING (petro_is_oversight());

GRANT SELECT, INSERT, UPDATE ON petro_report_submissions TO gerege_nexus_tenant;
GRANT SELECT, INSERT, DELETE ON petro_report_lines TO gerege_nexus_tenant;
GRANT SELECT, INSERT, DELETE ON petro_validation_findings TO gerege_nexus_tenant;
GRANT SELECT, INSERT, UPDATE ON petro_movements TO gerege_nexus_tenant;
GRANT SELECT, INSERT, UPDATE ON petro_devices TO gerege_nexus_tenant;
GRANT SELECT ON petro_daily_national TO gerege_nexus_tenant;

-- +goose Down

DROP TABLE IF EXISTS petro_daily_national;
DROP TABLE IF EXISTS petro_devices;
DROP TABLE IF EXISTS petro_movements;
DROP TABLE IF EXISTS petro_validation_findings;
DROP TABLE IF EXISTS petro_report_lines;
DROP TABLE IF EXISTS petro_report_submissions;
DROP TABLE IF EXISTS petro_report_periods;
