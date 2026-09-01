-- `euro92` толь бичигт нэмэгдэв — аудитын №33.
--
-- `fuelLabels` нь Euro-92-ыг мэддэг, ШТС түүгээр марк бүртгэж, нөөц нь тэр
-- рүү хуримтлагдана. Гэтэл `petro_products`-д тэр мөр байгаагүй бөгөөд
-- `petro_report_lines.product_code` нь тэр хүснэгт рүү гадаад түлхүүртэй:
-- маягт тэр мөрийг санал болгоод, илгээхэд 23503 унана. Илгээгч засаж чадахгүй
-- мөрөнд 400 авах ба тэр нөөц хэзээ ч тайлагнагдахгүй.
--
-- Хоёр газарт нэг жагсаалт байгаа нь үндсэн шалтгаан — толь бичиг нь эх
-- сурвалж, `fuelLabels` нь түүний хуулбар. Хуулбарыг арилгах нь модулийн
-- дараагийн ажил; өнөөдөр дутуу мөрийг нөхнө.

-- +goose Up

INSERT INTO petro_products (code, label_mn, label_en, jodi_category, default_density_kg_m3, is_gas, sort_order)
VALUES ('euro92', 'Euro-92', 'Gasoline Euro-92', 'motor_gasoline', 745.00, FALSE, 25)
ON CONFLICT (code) DO NOTHING;

-- +goose Down

DELETE FROM petro_products WHERE code = 'euro92';
