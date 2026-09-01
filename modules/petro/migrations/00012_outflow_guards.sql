-- Гарах урсгалын хамгаалалт — аудитын №1 ба №8.
--
-- 00011 нь бичих эрхийг нарийсгасан бол энэ нь ТООГ хамгаална.
--
-- # ШТС-ийн савны хязгаар
--
-- `petro_depot_tanks` нь `tank_within_capacity` CHECK-тэй бөгөөд `depot.go`
-- түүнээс үүсэх 23514-ийг 409 болгодог. `petro_station_inventory` дээр ямар ч
-- CHECK байгаагүй: 30,000 л багтаамжтай, 28,000 л-тэй ШТС рүү 20,000 л ирэхэд
-- 48,000 л болж, HTTP 201 буцдаг байв. Нийтийн API дээрх `LEAST(…, 1)` нь
-- 100%-иар таслаад хаядаг тул боломжгүй тоо дэлгэц дээр огт харагдахгүй —
-- зөвхөн улсын нийлбэрт үлддэг.
--
-- Хоёр талын хязгаар: 0-ээс доош унахгүй (шинэ түгээлтийн зам үүнийг
-- шаардана), багтаамжаас хэтрэхгүй.
--
-- # Одоо байгаа өгөгдөл
--
-- Хэтэрсэн мөрүүд байж болзошгүй тул CHECK-ийг NOT VALID-аар нэмээд, дараа нь
-- баталгаажуулна. Баталгаажуулалт унавал энэ миграц зогсоно — тэр нь зөв:
-- боломжгүй үлдэгдэлтэй сан дээр хязгаар тавих гэдэг нь эхлээд тэр үлдэгдлийг
-- тайлбарлах явдал.

-- +goose Up

-- Багтаамж нь 0 байж болно (бүртгээгүй сав), тэр тохиолдолд дээд хязгаар
-- шалгагдахгүй — өнөөдрийн өгөгдлийн ихэнх нь тийм.
ALTER TABLE petro_station_inventory
    ADD CONSTRAINT station_stock_within_capacity
    CHECK (current_stock_liters >= 0
           AND (tank_capacity_liters <= 0 OR current_stock_liters <= tank_capacity_liters))
    NOT VALID;

ALTER TABLE petro_station_inventory VALIDATE CONSTRAINT station_stock_within_capacity;

-- Түгээлт, ачилт хоёр DELETE хийхгүй, зөвхөн UPDATE — гэхдээ тенантын дүрд
-- аль хэдийн UPDATE бий (00001, 00007). Нэмэх эрх байхгүй.

-- +goose Down

ALTER TABLE petro_station_inventory DROP CONSTRAINT IF EXISTS station_stock_within_capacity;
