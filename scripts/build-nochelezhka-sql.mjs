import fs from "fs";

const dir = "c:/Help Nearby/supabase/migrations/";
const header = `-- ============================================================
-- НОЧЛЕЖКА: один файл для Supabase SQL Editor
-- 1) Очисти редактор (Ctrl+A, Delete)
-- 2) Вставь ВЕСЬ этот файл (Ctrl+A здесь, Ctrl+C, Ctrl+V)
-- 3) Ничего не выделяй — Run
-- Можно запускать повторно: дубликаты не создаст.
-- ============================================================

`;

const main = fs.readFileSync(dir + "20250604120000_seed_nochelezhka.sql", "utf8");
const geo = fs.readFileSync(dir + "20250604130000_geocode_nochelezhka.sql", "utf8");
const extra = fs.readFileSync(dir + "20250604140000_seed_nochelezhka_extra.sql", "utf8");

const geoOnly = geo
  .split("\n")
  .filter((line) => !line.startsWith("--"))
  .join("\n")
  .trim();

const out =
  header +
  "\n-- === 65 точек (INSERT) ===\n\n" +
  main +
  "\n\n-- === 5 доп. точек (INSERT) ===\n\n" +
  extra +
  "\n\n-- === координаты (UPDATE) ===\n\n" +
  geoOnly;

fs.writeFileSync("c:/Help Nearby/supabase/RUN_NOCHELEZHKa.sql", out);
console.log("OK:", out.split("\n").length, "lines");
