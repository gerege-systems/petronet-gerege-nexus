-- Ваучерыг ШТС хаах нэрлэсэн үйлдэл.
--
-- # Юу ажиллахгүй байсан бэ
--
-- Иргэн бүр eID-ийн JIT тенантад (EID_JIT_TENANT_SLUG) багтдаг тул түүний
-- ваучер тэр тенантын мөр. Харин `handleRecordSale` нь ШТС-ийн операторын
-- сессээр ажиллана. `petro_vouchers` дээр `tenant_isolation`-оос өөр бодлого
-- байхгүй тул операторын `UPDATE … WHERE qr_token = …` нь 0 мөр буцаана —
-- алдаа биш, чимээгүй хоосон. Handler түүнийг «ваучер идэвхгүй, хугацаа
-- дууссан, эсвэл аль хэдийн ашиглагдсан» гэсэн 409 болгож зурдаг тул прод
-- дээр ваучер ХЭЗЭЭ Ч хаагдахгүй, гэтэл дэлгэц дээр ердийн бизнес хариу
-- шиг харагдана.
--
-- Интеграцийн тест үүнийг барьсангүй: ваучерыг операторын өөрийнх нь
-- `tenant_id`-ээр үүсгэсэн тул нэг тенантын дотор ажиллаад ногоон байв.
--
-- # Яагаад бодлого өргөсгөхгүй вэ
--
-- `oversight_read`-ийн адил «бүх ваучерыг харах/засах» бодлого нэмэх нь
-- аудитын №4-ийн алдааг давтана: мөрийн бодлого БАГАНА мэддэггүй тул ямар ч
-- оператор өөр иргэний ваучерын дурын баганыг дарж бичих эрхтэй болно.
-- 00011-ийн загвар энд ч мөн адил зөв: нэг зүйл хийдэг, дуудагчаа өөрөө
-- шалгадаг SECURITY DEFINER функц.
--
-- Дуудагчийн шалгуур нь «энэ ШТС танайх мөн үү» — ваучер нь ДУРЫН колонк дээр
-- хүчинтэй (00004) тул ваучерын эзэн тенантаас юу ч шаардахгүй, харин литр
-- гаргаж буй ШТС нь дуудагчийн бүртгэлд байх ёстой. Ингэснээр гуравдагч тал
-- өөр компанийн ШТС-ийн нэрээр ваучер хаах боломжгүй.
--
-- `search_path` энд зориуд тавигдаагүй: модулийн хүснэгтүүд угтваргүй үүсэж,
-- өгөгдлийн сангийн `search_path`-ийн эхний `tenant` тэднийг буулгадаг
-- (цөмийн 00080). Функцэд `pg_catalog, public` гэж хатуу бичих нь тэдгээр
-- хүснэгтийг олохгүй болгоно — `petro_is_oversight()`, `petro_set_site_status()`
-- хоёр яг ийм шалтгаанаар search_path-гүй.

-- +goose Up

-- +goose StatementBegin
CREATE FUNCTION petro_redeem_voucher(voucher UUID, qr TEXT, station UUID, liters NUMERIC)
RETURNS TABLE (voucher_id UUID, voucher_amount NUMERIC, voucher_fuel TEXT)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER AS $$
DECLARE
    caller UUID := NULLIF(current_setting('app.current_tenant', true), '')::uuid;
BEGIN
    IF caller IS NULL THEN
        RAISE EXCEPTION 'no organisation in scope'
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF voucher IS NULL AND qr IS NULL THEN
        RAISE EXCEPTION 'neither a voucher id nor a code'
            USING ERRCODE = 'check_violation';
    END IF;
    -- Тенантын дүр энэ хүснэгтийг бодлогоор шүүдэг ч энэ функц эзэмшигчийн
    -- эрхээр ажиллаж байгаа тул шалгуурыг өөрөө бичнэ.
    IF NOT EXISTS (
        SELECT 1 FROM petro_stations s
         WHERE s.id = station AND s.tenant_id = caller
    ) THEN
        RAISE EXCEPTION 'station is not this operator''s'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Нэг мэдэгдэл: хоёр удаа уншсан кодыг WHERE нь татгалзана, урьдчилсан
    -- SELECT биш. Хоёр колонк нэгэн зэрэг уншвал хоёулаа «идэвхтэй» гэж
    -- уншаад хоёулаа хасах болно.
    RETURN QUERY
    UPDATE petro_vouchers v
       SET status = 'redeemed',
           redeemed_at = NOW(),
           redeemed_station_id = station,
           redeemed_liters = liters
     WHERE (v.id = voucher OR v.qr_token = qr)
       AND v.status = 'active'
       AND v.expires_at > NOW()
    RETURNING v.id, v.amount_mnt, v.fuel_type;
END;
$$;
-- +goose StatementEnd

REVOKE ALL ON FUNCTION petro_redeem_voucher(UUID, TEXT, UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION petro_redeem_voucher(UUID, TEXT, UUID, NUMERIC) TO gerege_nexus_tenant;

-- +goose Down

DROP FUNCTION IF EXISTS petro_redeem_voucher(UUID, TEXT, UUID, NUMERIC);
