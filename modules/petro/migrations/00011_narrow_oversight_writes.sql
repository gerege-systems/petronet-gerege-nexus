-- Зохицуулагчийн бичих эрхийг нарийсгав — аудитын №4 ба №5.
--
-- # Юу буруу байсан бэ
--
-- 00009 нь `oversight_suspend` гэсэн бодлого нэмсэн. Зорилго нь ганц зам байв:
-- объектыг түдгэлзүүлэх. Гэтэл мөрийн түвшний бодлого нь БАГАНА мэддэггүй —
-- `FOR UPDATE` гэдэг нь тэр мөрийн бүх баганыг хэлнэ. Тиймээс хяналтын
-- байгууллагад бүртгэгдсэн ямар ч менежер `PATCH /stations/{өрсөлдөгчийн-id}`
-- гээд өөр компанийн нэр, координат, утас, улсын дугаарыг дарж бичих
-- боломжтой байв. `handleUpdateStation`, `handleCensus`,
-- `handleSetNationalCode` гурав нь эзэмшлээ шалгадаггүй, RLS-д найддаг — тэр
-- найдвар нь энэ бодлогын улмаас худал болсон.
--
-- 00010 нь `petro_daily_national` дээр тенантын дүрд зөвхөн SELECT олгосон
-- атлаа `handleRefreshDaily` нь тенантын гарцан дотор ажилладаг. Өөрөөр
-- хэлбэл «дахин тооцоол» товч хэзээ ч ажиллаж байгаагүй: 42501 → 500.
-- Интеграцийн тест нь `RefreshDaily`-г түүхий pool дээр дууддаг тул HTTP зам
-- нь огт шалгагдаагүй.
--
-- # Яагаад функц вэ
--
-- Хоёулангийнх нь зөв хэлбэр нь ижил: «энэ дүр яг ЭНЭ үйлдлийг хийж болно»
-- гэдгийг мөрийн бодлогоор биш, нэр бүхий үйлдлээр илэрхийлэх. SECURITY
-- DEFINER функц нь эзэмшигчийн эрхээр ажиллаад, дотроо `petro_is_oversight()`
-- шалгана — `petro_is_oversight()` өөрөө яг ийм шалтгаанаар ийм хэлбэртэй
-- байсан. Ингэснээр бичих эрх нь нэг мэдэгдэлд хумигдаж, бусад бүх багана
-- эзэмшигчийнхээ мэдэлд үлдэнэ.

-- +goose Up

-- ─────────────────────────────────────────────────────────────────────────
-- №4 — багана мэддэггүй UPDATE бодлогыг авч, нэрлэсэн үйлдлээр солив
-- ─────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS oversight_suspend ON petro_stations;
DROP POLICY IF EXISTS oversight_suspend ON petro_depots;

-- +goose StatementBegin
CREATE FUNCTION petro_set_site_status(site_kind TEXT, site UUID, new_status TEXT)
RETURNS TEXT
LANGUAGE plpgsql VOLATILE SECURITY DEFINER AS $$
DECLARE
    site_name TEXT;
BEGIN
    IF NOT petro_is_oversight() THEN
        RAISE EXCEPTION 'not an oversight body' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF new_status NOT IN ('active', 'suspended', 'closed') THEN
        RAISE EXCEPTION 'unknown status %', new_status USING ERRCODE = 'check_violation';
    END IF;

    IF site_kind = 'station' THEN
        UPDATE petro_stations SET registry_status = new_status, updated_at = NOW()
         WHERE id = site RETURNING name INTO site_name;
    ELSIF site_kind = 'depot' THEN
        UPDATE petro_depots SET registry_status = new_status, updated_at = NOW()
         WHERE id = site RETURNING name INTO site_name;
    ELSE
        RAISE EXCEPTION 'unknown site kind %', site_kind USING ERRCODE = 'check_violation';
    END IF;

    RETURN site_name;
END;
$$;
-- +goose StatementEnd

REVOKE ALL ON FUNCTION petro_set_site_status(TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION petro_set_site_status(TEXT, UUID, TEXT) TO gerege_nexus_tenant;

-- ─────────────────────────────────────────────────────────────────────────
-- №5 — улсын өдрийн нэгтгэлийг дахин тооцоолох нэрлэсэн үйлдэл
-- ─────────────────────────────────────────────────────────────────────────
--
-- Мөн №23-ыг зассан: өмнөх хувилбар нь зөвхөн upsert хийдэг байсан тул
-- хаагдсан ШТС-ийн бүлэг дахин гарахгүй болоод хуучин мөр нь нөөцтэйгээ
-- мөнхөд үлддэг байв — сүнс нөөц улсын нийлбэрт нэмэгдсээр. Одоо тухайн
-- өдрийг эхлээд цэвэрлээд дараа нь бичнэ.

-- +goose StatementBegin
CREATE FUNCTION petro_refresh_daily(for_day DATE)
RETURNS INT
LANGUAGE plpgsql VOLATILE SECURITY DEFINER AS $$
DECLARE
    written INT;
BEGIN
    -- Тенантгүй дуудлага нь хуваарьт ажил (нэвтрэлтийн дүр, RLS хамаарахгүй);
    -- тенанттай дуудлага нь зөвхөн хяналтын байгууллагынх.
    IF COALESCE(NULLIF(current_setting('app.current_tenant', true), ''), '') <> ''
       AND NOT petro_is_oversight() THEN
        RAISE EXCEPTION 'not an oversight body' USING ERRCODE = 'insufficient_privilege';
    END IF;

    DELETE FROM petro_daily_national WHERE day = for_day;

    WITH day_lines AS (
        SELECT DISTINCT ON (l.site_kind, l.site_id, l.product_code)
               l.site_kind, l.site_id, l.product_code,
               l.closing_liters, l.closing_liters_15c, l.receipts_liters, l.sales_liters
          FROM petro_report_lines l
          JOIN petro_report_submissions s ON s.id = l.submission_id
          JOIN petro_report_periods p ON p.id = s.period_id
         WHERE p.period_start = for_day
           AND s.status IN ('submitted', 'approved')
         ORDER BY l.site_kind, l.site_id, l.product_code, s.version DESC
    ),
    week_sales AS (
        SELECT l.site_kind, l.site_id, l.product_code, AVG(l.sales_liters) AS avg_sales
          FROM petro_report_lines l
          JOIN petro_report_submissions s ON s.id = l.submission_id
          JOIN petro_report_periods p ON p.id = s.period_id
         WHERE p.period_start BETWEEN (for_day - 6) AND for_day
           AND s.status IN ('submitted', 'approved')
         GROUP BY l.site_kind, l.site_id, l.product_code
    ),
    site_aimag AS (
        SELECT 'station'::text AS site_kind, id AS site_id,
               COALESCE(NULLIF(aimag, ''), '—') AS aimag
          FROM petro_stations WHERE registry_status <> 'closed'
        UNION ALL
        SELECT 'depot', id, COALESCE(NULLIF(aimag, ''), '—')
          FROM petro_depots WHERE registry_status <> 'closed'
    ),
    site_products AS (
        SELECT 'station'::text AS site_kind, station_id AS site_id, fuel_type AS product_code,
               tank_capacity_liters AS capacity_liters
          FROM petro_station_inventory
        UNION ALL
        SELECT 'depot', depot_id, fuel_type, SUM(capacity_liters)
          FROM petro_depot_tanks GROUP BY 1, 2, 3
    ),
    expected AS (
        SELECT sp.site_kind, sp.site_id, sp.product_code, sa.aimag, sp.capacity_liters
          FROM site_products sp
          JOIN site_aimag sa ON sa.site_kind = sp.site_kind AND sa.site_id = sp.site_id
          JOIN petro_products pr ON pr.code = sp.product_code
    )
    INSERT INTO petro_daily_national
           (day, product_code, aimag, stock_liters, capacity_liters, receipts_liters,
            sales_liters, sites_total, sites_reported, days_of_supply, refreshed_at)
    SELECT for_day, e.product_code, e.aimag,
           -- Standard litres where the sender measured, observed where they
           -- did not. volume.go computes the correction and the module stored
           -- it, and then every aggregate summed the observed figure anyway —
           -- so the national series carried the ±1–2% seasonal swing the
           -- correction exists to remove (audit §15).
           COALESCE(SUM(COALESCE(d.closing_liters_15c, d.closing_liters)), 0),
           COALESCE(SUM(e.capacity_liters), 0),
           COALESCE(SUM(d.receipts_liters), 0),
           COALESCE(SUM(d.sales_liters), 0),
           COUNT(*), COUNT(d.site_id),
           CASE WHEN COALESCE(SUM(w.avg_sales), 0) > 0
                THEN COALESCE(SUM(COALESCE(d.closing_liters_15c, d.closing_liters)), 0)
                     / SUM(w.avg_sales) END,
           NOW()
      FROM expected e
      LEFT JOIN day_lines d
             ON d.site_kind = e.site_kind AND d.site_id = e.site_id
            AND d.product_code = e.product_code
      LEFT JOIN week_sales w
             ON w.site_kind = e.site_kind AND w.site_id = e.site_id
            AND w.product_code = e.product_code
     GROUP BY e.product_code, e.aimag;

    GET DIAGNOSTICS written = ROW_COUNT;
    RETURN written;
END;
$$;
-- +goose StatementEnd

REVOKE ALL ON FUNCTION petro_refresh_daily(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION petro_refresh_daily(DATE) TO gerege_nexus_tenant;

-- +goose Down

DROP FUNCTION IF EXISTS petro_refresh_daily(DATE);
DROP FUNCTION IF EXISTS petro_set_site_status(TEXT, UUID, TEXT);

CREATE POLICY oversight_suspend ON petro_stations FOR UPDATE TO gerege_nexus_tenant
    USING (petro_is_oversight()) WITH CHECK (petro_is_oversight());
CREATE POLICY oversight_suspend ON petro_depots FOR UPDATE TO gerege_nexus_tenant
    USING (petro_is_oversight()) WITH CHECK (petro_is_oversight());
