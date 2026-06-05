-- Дополнительные точки из справочника Ночлежки (не вошли в основной seed).
-- Координаты: OSM Photon, июнь 2026.

INSERT INTO organizations (
  name, slug, category, description, address, city, country,
  lat, lng, phone, website, hours, verified
) VALUES
(
  'Группа поддержки бездомных женщин',
  'zhenskaya-gruppa-rubinshteina-spb',
  ARRAY['volunteer'],
  'Встречи по вторникам. Источник: справочник Ночлежки.',
  'ул. Рубинштейна, 25',
  'Saint Petersburg', 'Russia', 59.927378, 30.342749, '+79817914183', NULL,
  'Вт 17:00', true
),
(
  'Городской центр СПИД — анонимный кабинет №108',
  'spid-anon-kabinet-108-spb',
  ARRAY['medical'],
  'Тестирование и консультации без документов и прописки.',
  'наб. Обводного канала, 179А, корп. Б',
  'Saint Petersburg', 'Russia', 59.909665, 30.295238, NULL, NULL,
  NULL, true
),
(
  'Палатка МЧС — ж/д ст. Лигово (при −15 °C)',
  'mchs-warming-ligovo-spb',
  ARRAY['shelter'],
  'Красносельский район. Открывается только при температуре ниже −15 °C, 8 мест.',
  'Витебская-Сортировочная ул., между д. 36 и 40',
  'Saint Petersburg', 'Russia', 59.8962, 30.3552, NULL, NULL,
  'Сезонно при −15 °C, 20:00–08:00', true
),
(
  'Реабилитационный приют Ночлежки',
  'reabilitatsionnyy-priyt-nochelezhka-spb',
  ARRAY['shelter'],
  '52 места (12 женских, 40 мужских). Жильё, еда, соцработники, юристы, психологи. Заселение через консультацию.',
  'ул. Боровая, 112Б (м. Обводный канал)',
  'Saint Petersburg', 'Russia', 59.918504, 30.346321, '+78124073090', 'https://nochelezhka.ru',
  NULL, true
),
(
  'Благотворительная парикмахерская',
  'parikmakherskaya-krupskoy-spb',
  ARRAY['clothing'],
  'Бесплатная стрижка. Источник: справочник Ночлежки.',
  'ул. Крупской, 5В (м. Елизаровская)',
  'Saint Petersburg', 'Russia', 59.9072, 30.2621, NULL, NULL,
  NULL, true
)
ON CONFLICT (slug) DO NOTHING;
