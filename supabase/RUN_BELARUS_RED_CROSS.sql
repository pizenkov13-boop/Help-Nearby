-- БОКК филиалы: Supabase → SQL → New query → вставить весь файл → Run
-- Удаляет старые RCB-точки и вставляет 9 заново.

DELETE FROM organizations WHERE slug LIKE 'rcb-%-belarus';

INSERT INTO organizations (
  name, slug, category, description, address, city, country,
  lat, lng, phone, email, website, hours, verified
) VALUES
(
  'Белорусское общество Красного Креста — Витебская областная организация',
  'rcb-vitebsk-belarus',
  ARRAY['volunteer', 'medical'],
  'Филиал Белорусского общества Красного Креста. Источник: redcross.by',
  '210010, ул. Правды, 18',
  'Vitebsk', 'Belarus', 55.1982, 30.2145,
  '+375212366134', 'vitebsk@redcross.by', 'https://redcross.by', NULL, true
),
(
  'Белорусское общество Красного Креста — Гродненская областная организация',
  'rcb-grodno-belarus',
  ARRAY['volunteer', 'medical'],
  'Филиал Белорусского общества Красного Креста. Источник: redcross.by',
  '230023, ул. Ожешко, 1',
  'Grodno', 'Belarus', 53.6827, 23.8342,
  '+375152625751', 'grodno@redcross.by', 'https://redcross.by', NULL, true
),
(
  'Белорусское общество Красного Креста — Могилёвская областная организация',
  'rcb-mogilev-belarus',
  ARRAY['volunteer', 'medical'],
  'Филиал Белорусского общества Красного Креста. Источник: redcross.by',
  '212030, пр-т Мира, 12',
  'Mogilev', 'Belarus', 53.9109375, 27.4997941,
  '+375222634584', 'mogilev@redcross.by', 'https://redcross.by', NULL, true
),
(
  'Белорусское общество Красного Креста — Дорожная организация',
  'rcb-doroga-belarus',
  ARRAY['volunteer', 'medical'],
  'Филиал Белорусского общества Красного Креста. Источник: redcross.by',
  '220039, ул. Воронянского, 4, корп. 2',
  'Minsk', 'Belarus', 53.9142, 27.5488,
  '+375172250985', 'doroga@redcross.by', 'https://redcross.by', NULL, true
),
(
  'Белорусское общество Красного Креста — Секретариат',
  'rcb-secretariat-belarus',
  ARRAY['volunteer', 'medical'],
  'Секретариат Белорусского общества Красного Креста. Источник: redcross.by',
  '220030, ул. Карла Маркса, 35',
  'Minsk', 'Belarus', 53.8964, 27.5512,
  '+375172638417', 'info@redcross.by', 'https://redcross.by', NULL, true
),
(
  'Белорусское общество Красного Креста — Брестская областная организация',
  'rcb-brest-belarus',
  ARRAY['volunteer', 'medical'],
  'Филиал Белорусского общества Красного Креста. Источник: redcross.by',
  '224005, ул. Пушкинская, 19, каб. 111-113',
  'Brest', 'Belarus', 52.0949171, 23.6895363,
  '+375162937928', 'brest@redcross.by', 'https://redcross.by', NULL, true
),
(
  'Белорусское общество Красного Креста — Гомельская областная организация',
  'rcb-gomel-belarus',
  ARRAY['volunteer', 'medical'],
  'Филиал Белорусского общества Красного Креста. Источник: redcross.by',
  '246050, ул. Пролетарская, 9',
  'Gomel', 'Belarus', 52.4216024, 31.0117483,
  '+375232568571', 'gomel@redcross.by', 'https://redcross-gomel.by', NULL, true
),
(
  'Белорусское общество Красного Креста — Минская областная организация',
  'rcb-minsk-oblast-belarus',
  ARRAY['volunteer', 'medical'],
  'Филиал Белорусского общества Красного Креста. Источник: redcross.by',
  '220039, ул. Чкалова, 5',
  'Minsk', 'Belarus', 53.8831737, 27.5519354,
  '+375173639846', 'minobl@redcross.by', 'https://redcross.by', NULL, true
),
(
  'Белорусское общество Красного Креста — Минская городская организация',
  'rcb-minsk-city-belarus',
  ARRAY['volunteer', 'medical'],
  'Филиал Белорусского общества Красного Креста. Источник: redcross.by',
  '220030, ул. К. Маркса, 50',
  'Minsk', 'Belarus', 53.8948, 27.5536,
  '+375172438517', 'minsk@redcross.by', 'https://redcross.by', NULL, true
);
