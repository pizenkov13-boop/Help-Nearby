import fs from "fs";

const migrationPath = "c:/Help Nearby/supabase/migrations/20250604120000_seed_nochelezhka.sql";
const resultsPath = "c:/Help Nearby/supabase/migrations/geocode-results.json";

const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));

// Manual fixes where Photon matched wrong city/street
const overrides = {
  "ioann-kronshtadtsky-food-spb": { lat: 59.9072, lng: 30.2621 },
  "warming-kalininsky-spb": { lat: 59.9408, lng: 30.3802 },
  "dnp-kalininsky-spb": { lat: 59.9408, lng: 30.3802 },
  "warming-krasnogvardeysky-spb": { lat: 59.9412, lng: 30.4125 },
  "dnp-krasnogvardeysky-spb": { lat: 59.9412, lng: 30.4125 },
  "botkin-zdravpunkt-spb": { lat: 59.9042, lng: 30.3185 },
  "tb-dispanser-8-spb": { lat: 59.9312, lng: 30.3682 },
  "warming-frunzensky-vitebskaya-spb": { lat: 59.8962, lng: 30.3552 },
};

for (const [slug, coords] of Object.entries(overrides)) {
  results[slug] = { ...coords, source: "manual" };
}

let sql = fs.readFileSync(migrationPath, "utf8");
sql = sql.replace(
  /^-- Координаты приблизительные.*$/m,
  "-- Координаты: OpenStreetMap (Photon), июнь 2026",
);

for (const [slug, data] of Object.entries(results)) {
  if (!data?.lat) continue;
  const lat = data.lat;
  const lng = data.lng;
  const re = new RegExp(
    `(\\n  '[^']+',\\n  '${slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}',[\\s\\S]*?'(?:Moscow|Saint Petersburg)', 'Russia', )([\\d.]+), ([\\d.]+)`,
  );
  const next = sql.replace(re, `$1${lat}, ${lng}`);
  if (next === sql) {
    console.error("WARN no replace:", slug);
  } else {
    sql = next;
  }
}

fs.writeFileSync(migrationPath, sql);

const updates = Object.entries({ ...results, ...overrides })
  .filter(([, d]) => d?.lat)
  .map(
    ([slug, d]) =>
      `UPDATE organizations SET lat = ${d.lat}, lng = ${d.lng} WHERE slug = '${slug}';`,
  )
  .join("\n");

const updateSql = `-- Обновление координат Ночлежки (OSM Photon, ${new Date().toISOString().slice(0, 10)})
-- Запуск в Supabase SQL Editor если seed уже залит.

${updates}
`;

fs.writeFileSync(
  "c:/Help Nearby/supabase/migrations/20250604130000_geocode_nochelezhka.sql",
  updateSql,
);
console.log("Updated seed + wrote UPDATE migration");
