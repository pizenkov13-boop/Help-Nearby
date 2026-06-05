-- ERC филиалы ОАЭ: Supabase → SQL → New query → вставить весь файл → Run
-- Удаляет старые ERC-точки и вставляет 10 заново.

DELETE FROM organizations WHERE slug LIKE 'erc-%-uae';

INSERT INTO organizations (
  name, slug, category, description, address, city, country,
  lat, lng, phone, website, hours, verified
) VALUES
(
  'Emirates Red Crescent — Abu Dhabi Branch',
  'erc-abu-dhabi-uae',
  ARRAY['volunteer', 'medical'],
  'Branch of the Emirates Red Crescent Authority. Source: emiratesrc.ae',
  'Baniyas',
  'Abu Dhabi', 'United Arab Emirates', 24.3503631, 54.6787129,
  NULL, 'https://emiratesrc.ae', NULL, true
),
(
  'Emirates Red Crescent — Dubai Branch',
  'erc-dubai-uae',
  ARRAY['volunteer', 'medical'],
  'Branch of the Emirates Red Crescent Authority. Source: emiratesrc.ae',
  'Garhoud street, beside Sheikh Zayed housing',
  'Dubai', 'United Arab Emirates', 25.2447002, 55.3401559,
  NULL, 'https://emiratesrc.ae', NULL, true
),
(
  'Emirates Red Crescent — Sharjah Branch',
  'erc-sharjah-uae',
  ARRAY['volunteer', 'medical'],
  'Branch of the Emirates Red Crescent Authority. Source: emiratesrc.ae',
  'Alrahmaniya area, althed intersection 6',
  'Sharjah', 'United Arab Emirates', 25.3371998, 55.5793188,
  NULL, 'https://emiratesrc.ae', NULL, true
),
(
  'Emirates Red Crescent — Ajman Branch',
  'erc-ajman-uae',
  ARRAY['volunteer', 'medical'],
  'Branch of the Emirates Red Crescent Authority. Source: emiratesrc.ae',
  'Meshairef area, behind Etisalat',
  'Ajman', 'United Arab Emirates', 25.408547, 55.4714297,
  NULL, 'https://emiratesrc.ae', NULL, true
),
(
  'Emirates Red Crescent — Ras Al Khaimah Branch',
  'erc-ras-al-khaimah-uae',
  ARRAY['volunteer', 'medical'],
  'Branch of the Emirates Red Crescent Authority. Source: emiratesrc.ae',
  'Dafan al Khor, beside RAK bridge',
  'Ras Al Khaimah', 'United Arab Emirates', 25.7728031, 55.9311444,
  NULL, 'https://emiratesrc.ae', NULL, true
),
(
  'Emirates Red Crescent — Fujairah Branch',
  'erc-fujairah-uae',
  ARRAY['volunteer', 'medical'],
  'Branch of the Emirates Red Crescent Authority. Source: emiratesrc.ae',
  'King Faisal street',
  'Fujairah', 'United Arab Emirates', 25.1103145, 56.3233552,
  NULL, 'https://emiratesrc.ae', NULL, true
),
(
  'Emirates Red Crescent — Al Ain Branch',
  'erc-al-ain-uae',
  ARRAY['volunteer', 'medical'],
  'Branch of the Emirates Red Crescent Authority. Source: emiratesrc.ae',
  'Beside Al Ain Coop',
  'Al Ain', 'United Arab Emirates', 24.0944685, 55.918142,
  NULL, 'https://emiratesrc.ae', NULL, true
),
(
  'Emirates Red Crescent — Al Dhafra Branch',
  'erc-al-dhafra-uae',
  ARRAY['volunteer', 'medical'],
  'Branch of the Emirates Red Crescent Authority. Source: emiratesrc.ae',
  'Near Baiet Alradwan mosque',
  'Al Dhafra', 'United Arab Emirates', 23.7399333, 53.9847333,
  NULL, 'https://emiratesrc.ae', NULL, true
),
(
  'Emirates Red Crescent — Umm Al Quwain Branch',
  'erc-umm-al-quwain-uae',
  ARRAY['volunteer', 'medical'],
  'Branch of the Emirates Red Crescent Authority. Source: emiratesrc.ae',
  'Alraas area C, AlMualla street 26',
  'Umm Al Quwain', 'United Arab Emirates', 25.5489758, 55.5380625,
  NULL, 'https://emiratesrc.ae', NULL, true
),
(
  'Emirates Red Crescent — Preservation of Grace Project',
  'erc-preservation-grace-uae',
  ARRAY['volunteer', 'medical'],
  'Preservation of Grace Project, Emirates Red Crescent Authority. Source: emiratesrc.ae',
  'Mussafah, ICAD 1',
  'Abu Dhabi', 'United Arab Emirates', 24.2826482, 54.4570299,
  '800733', 'https://emiratesrc.ae', NULL, true
);
