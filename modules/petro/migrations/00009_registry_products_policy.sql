-- Бүртгэл, бүтээгдэхүүний толь, бодлого, зохицуулагч — тайлан ирэхээс өмнөх дөрөв.
--
-- Тайлан хаана ч наалдахгүй байвал утгагүй. Энэ миграц наалдах гурван гадаргууг
-- бэлдэнэ: объект нь улсын дугаартай болно, бүтээгдэхүүн нь толь бичигтэй
-- болно, зохицуулагч нь хэн болох нь өгөгдлийн санд бичигдэнэ.
--
-- # Яагаад бүтээгдэхүүний толь нь тенантад харьяалагдахгүй вэ
--
-- «АИ-92» гэдэг нь нэг компанийн шийдвэр биш, улсын нэршил. Тенант бүр өөрийн
-- толь барьвал нэг литр хоёр өөр нэртэй болж, улсын нэгтгэл нь нийлбэр биш
-- таамаг болно. JODI-гийн ангилал багана нь мөн үүнтэй ижил шалтгаантай:
-- нэгтгэлийг олон улсын тодорхойлолт руу шууд буулгах цорын ганц зам.
--
-- # Зохицуулагч гэж хэн бэ — кодод биш, хүснэгтэд
--
-- Мөрийн түвшний тусгаарлалт нь компанийг бие биенээсээ хардаггүй болгодог.
-- Гэтэл АМГТГ нь бүгдийг харах ёстой. Үүнийг хоёр аргаар хийж болно: код дотор
-- «энэ бол зохицуулагч» гэж шийдэх, эсвэл өгөгдлийн санд бичих. Эхнийх нь
-- бодлогыг тойрч гардаг — SQL бичсэн хэн ч мартаж болно. Тиймээс энд
-- `petro_oversight_bodies` хүснэгт ба түүнийг уншдаг STABLE функц байна:
-- зөвшөөрөл нь бодлого дотор үлдэж, шалгалт нь мөр бүрд явагдана.

-- +goose Up

-- ─────────────────────────────────────────────────────────────────────────
-- Бүтээгдэхүүний толь
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE petro_products (
    code                TEXT PRIMARY KEY,
    label_mn            TEXT NOT NULL,
    label_en            TEXT NOT NULL DEFAULT '',

    -- JODI-Oil-ийн асуумжийн ангилал. Улсын тайланг олон улсын тодорхойлолт
    -- руу буулгах багана — нэгтгэл нь эндээс GROUP BY хийгдэнэ.
    jodi_category       TEXT NOT NULL,

    -- Үйл ажиллагаа литрээр, тайлан тонноор. Хооронд нь нягт, ба нягт нь
    -- температураас хамаарч хөвдөг тул энэ нь анхдагч утга — ажиглалт нь
    -- тайлангийн мөр дээр ирнэ.
    default_density_kg_m3 NUMERIC(7, 2) NOT NULL,

    is_gas              BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order          INT NOT NULL DEFAULT 100,
    active              BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO petro_products (code, label_mn, label_en, jodi_category, default_density_kg_m3, is_gas, sort_order) VALUES
    ('ai80',         'АИ-80',      'Gasoline 80',   'motor_gasoline', 730.00, FALSE, 10),
    ('ai92',         'АИ-92',      'Gasoline 92',   'motor_gasoline', 745.00, FALSE, 20),
    ('ai95',         'АИ-95',      'Gasoline 95',   'motor_gasoline', 750.00, FALSE, 30),
    ('ai98',         'АИ-98',      'Gasoline 98',   'motor_gasoline', 755.00, FALSE, 40),
    ('diesel',       'Дизель (ДТ)', 'Gasoil',       'gas_diesel_oil', 840.00, FALSE, 50),
    ('euro5_diesel', 'Euro-5 ДТ',  'Gasoil Euro-5', 'gas_diesel_oil', 835.00, FALSE, 60),
    ('lpg',          'Газ (LPG)',  'LPG',           'lpg',            540.00, TRUE,  70);

GRANT SELECT ON petro_products TO gerege_nexus_tenant;

-- ─────────────────────────────────────────────────────────────────────────
-- Зохицуулагч
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE petro_oversight_bodies (
    tenant_id   UUID PRIMARY KEY REFERENCES registry.tenants (id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    -- Хандалтын түвшин: national (АМГТГ), tax (ТЕГ), customs (ГЕГ),
    -- aimag (орон нутаг), audit (зөвхөн унших).
    scope       TEXT NOT NULL DEFAULT 'national',
    aimag       TEXT NOT NULL DEFAULT '',
    added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SECURITY DEFINER: тенантын дүр өөрөө энэ хүснэгтийг уншиж чадахгүй, гэтэл
-- бодлого нь мөр бүрд түүнийг асуух ёстой. STABLE тул нэг асуулгад нэг удаа
-- бодогдоно.
-- +goose StatementBegin
CREATE FUNCTION petro_is_oversight() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM petro_oversight_bodies
         WHERE tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);
$$;
-- +goose StatementEnd

REVOKE ALL ON FUNCTION petro_is_oversight() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION petro_is_oversight() TO gerege_nexus_tenant;

-- ─────────────────────────────────────────────────────────────────────────
-- Бодлого — лимит, хүлцэл, хугацаа
-- ─────────────────────────────────────────────────────────────────────────
--
-- Хүлцлийн хувь кодод бичигдвэл түүнийг өөрчлөх нь байршуулалт болно.
-- Хямралын үед бодлого өдөрт хоёр удаа өөрчлөгдөж болох ба тэр бүрд образ
-- барих нь ажиллахгүй. Тиймээс дүрмүүд jsonb, хувилбартай, түүхтэй.

CREATE TABLE petro_policy (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version         INT NOT NULL UNIQUE,
    effective_from  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to    TIMESTAMPTZ,
    rules           JSONB NOT NULL,
    approved_by     UUID,
    approved_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note            TEXT NOT NULL DEFAULT ''
);

CREATE INDEX idx_petro_policy_window ON petro_policy (effective_from DESC);

-- Анхдагч дүрмүүд. Тоонууд нь docs/PLAN.md §6 ба BENCHMARKS §5-аас:
-- ΔA, ΔB нь 0.3%, ΔC нь 0.5%, тайлангийн хугацаа маргааш 12:00.
INSERT INTO petro_policy (version, rules, note) VALUES (1, '{
  "tolerance": {"border_pct": 0.3, "transport_pct": 0.3, "station_pct": 0.5},
  "report": {"cadence": "daily", "due_hour": 12, "grace_hours": 24},
  "deviation": {"max_change_pct": 60, "price_jump_pct": 15},
  "stale_hours": 26
}'::jsonb, 'Анхдагч — 2026 оны 9-р сарын нэвтрүүлэлт');

GRANT SELECT ON petro_policy TO gerege_nexus_tenant;

-- ─────────────────────────────────────────────────────────────────────────
-- Объектын бүртгэл — улсын дугаар, статус, техникийн тооллого
-- ─────────────────────────────────────────────────────────────────────────
--
-- `status` багана аль хэдийн бий, гэхдээ тэр нь «түлш байна уу» гэдгийг
-- хэлдэг. Тусгай зөвшөөрлийн төлөв бол өөр асуулт: түдгэлзүүлсэн ШТС нь
-- түлштэй байж болно. Хоёрыг нэг баганад хийвэл аль нэг нь нөгөөгөө дарна.

ALTER TABLE petro_stations
    ADD COLUMN national_code    TEXT,
    ADD COLUMN registry_status  TEXT NOT NULL DEFAULT 'active',
    ADD COLUMN hur_verified_at  TIMESTAMPTZ,
    -- Техникийн тооллого. Драйвер бичихээс өмнө талбар дээр юу байгааг мэдэх
    -- ёстой: A нь өөрийн POS-той, B нь controller-той, C нь зөвхөн импульс,
    -- D нь механик тоолуур — гар оруулалт.
    ADD COLUMN integration_class CHAR(1),
    ADD COLUMN pump_brand       TEXT NOT NULL DEFAULT '',
    ADD COLUMN pump_protocol    TEXT NOT NULL DEFAULT '',
    ADD COLUMN has_atg          BOOLEAN,
    ADD COLUMN has_internet     BOOLEAN,
    ADD COLUMN census_at        TIMESTAMPTZ;

ALTER TABLE petro_depots
    ADD COLUMN national_code    TEXT,
    ADD COLUMN registry_status  TEXT NOT NULL DEFAULT 'active',
    ADD COLUMN hur_verified_at  TIMESTAMPTZ;

-- Улсын дугаар нь улсын хэмжээнд давтагдахгүй — тенант дотор биш. Хоёр компани
-- ижил дугаар мэдүүлбэл тэдгээрийн аль нэг нь буруу, ба аль нь болохыг систем
-- мэдэхгүй; давхардлыг зөвшөөрвөл хоёуланг нь мэдэхгүй болно.
CREATE UNIQUE INDEX idx_petro_stations_national_code
    ON petro_stations (national_code) WHERE national_code IS NOT NULL;
CREATE UNIQUE INDEX idx_petro_depots_national_code
    ON petro_depots (national_code) WHERE national_code IS NOT NULL;

CREATE INDEX idx_petro_stations_census ON petro_stations (integration_class)
    WHERE census_at IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- Зохицуулагчийн харах эрх — одоо байгаа хүснэгтүүд дээр
-- ─────────────────────────────────────────────────────────────────────────
--
-- Нэмэлт бодлого нь permissive тул одоо байгаа `tenant_isolation`-той ЭСВЭЛ-ээр
-- нийлнэ. Зөвхөн SELECT: зохицуулагч компанийн мөрийг харна, засахгүй.

CREATE POLICY oversight_read ON petro_stations FOR SELECT TO gerege_nexus_tenant
    USING (petro_is_oversight());
CREATE POLICY oversight_read ON petro_station_inventory FOR SELECT TO gerege_nexus_tenant
    USING (petro_is_oversight());
CREATE POLICY oversight_read ON petro_depots FOR SELECT TO gerege_nexus_tenant
    USING (petro_is_oversight());
CREATE POLICY oversight_read ON petro_depot_tanks FOR SELECT TO gerege_nexus_tenant
    USING (petro_is_oversight());
CREATE POLICY oversight_read ON petro_customs_shipments FOR SELECT TO gerege_nexus_tenant
    USING (petro_is_oversight());
CREATE POLICY oversight_read ON petro_dispatch_trips FOR SELECT TO gerege_nexus_tenant
    USING (petro_is_oversight());

-- Түдгэлзүүлэх нь зохицуулагчийн үйлдэл: харахаас гадна удирдана.
CREATE POLICY oversight_suspend ON petro_stations FOR UPDATE TO gerege_nexus_tenant
    USING (petro_is_oversight()) WITH CHECK (petro_is_oversight());
CREATE POLICY oversight_suspend ON petro_depots FOR UPDATE TO gerege_nexus_tenant
    USING (petro_is_oversight()) WITH CHECK (petro_is_oversight());

-- +goose Down

DROP POLICY IF EXISTS oversight_suspend ON petro_depots;
DROP POLICY IF EXISTS oversight_suspend ON petro_stations;
DROP POLICY IF EXISTS oversight_read ON petro_dispatch_trips;
DROP POLICY IF EXISTS oversight_read ON petro_customs_shipments;
DROP POLICY IF EXISTS oversight_read ON petro_depot_tanks;
DROP POLICY IF EXISTS oversight_read ON petro_depots;
DROP POLICY IF EXISTS oversight_read ON petro_station_inventory;
DROP POLICY IF EXISTS oversight_read ON petro_stations;

DROP INDEX IF EXISTS idx_petro_stations_census;
DROP INDEX IF EXISTS idx_petro_depots_national_code;
DROP INDEX IF EXISTS idx_petro_stations_national_code;

ALTER TABLE petro_depots
    DROP COLUMN IF EXISTS hur_verified_at,
    DROP COLUMN IF EXISTS registry_status,
    DROP COLUMN IF EXISTS national_code;

ALTER TABLE petro_stations
    DROP COLUMN IF EXISTS census_at,
    DROP COLUMN IF EXISTS has_internet,
    DROP COLUMN IF EXISTS has_atg,
    DROP COLUMN IF EXISTS pump_protocol,
    DROP COLUMN IF EXISTS pump_brand,
    DROP COLUMN IF EXISTS integration_class,
    DROP COLUMN IF EXISTS hur_verified_at,
    DROP COLUMN IF EXISTS registry_status,
    DROP COLUMN IF EXISTS national_code;

DROP TABLE IF EXISTS petro_policy;
DROP FUNCTION IF EXISTS petro_is_oversight();
DROP TABLE IF EXISTS petro_oversight_bodies;
DROP TABLE IF EXISTS petro_products;
