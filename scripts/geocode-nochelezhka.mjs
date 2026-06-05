/**
 * Geocode Nochlezhka seed via Photon (OSM). Run: node scripts/geocode-nochelezhka.mjs
 */
import fs from "fs";

const entries = [
  { slug: "nochlezhka-bus-krasnoprudnaya-moscow", q: "Краснопрудная улица 3/5 Москва Россия" },
  { slug: "nochlezhka-bus-izmailovo-moscow", q: "Измайловский проезд 28 Москва Россия" },
  { slug: "nochlezhka-bus-novogireevo-moscow", q: "Фрязевская улица 10Б Москва Россия" },
  { slug: "nochlezhka-consult-moscow", q: "Бумажный проезд 2/2 Москва Россия" },
  { slug: "nochlezhka-consult-spb", q: "Боровая улица 112Б Санкт-Петербург Россия" },
  { slug: "nochlezhka-bus-prospekt-slavy-spb", q: "Южное шоссе 37к4 Санкт-Петербург Россия" },
  { slug: "nochlezhka-bus-ligovo-spb", q: "Таллинское шоссе 90 Санкт-Петербург Россия" },
  { slug: "nochlezhka-bus-primorskaya-spb", q: "Канонерский остров 1 Санкт-Петербург Россия" },
  { slug: "nochlezhka-bus-lesnaya-spb", q: "Кантемировская улица 37 Санкт-Петербург Россия" },
  { slug: "marshrut-nadezhdy-bus-spb", q: "проспект Энгельса 133 Санкт-Петербург Россия" },
  { slug: "diakonia-bus-spb", q: "Атаманская улица 6 Санкт-Петербург Россия" },
  { slug: "kinonia-club-spb", q: "Маршала Тухачевского 41 Санкт-Петербург Россия" },
  { slug: "sup-i-hleb-spb", q: "Невский проспект 22 Санкт-Петербург Россия" },
  { slug: "eda-vmesto-bomb-veteranov-spb", q: "проспект Ветеранов метро Санкт-Петербург Россия" },
  { slug: "eda-vmesto-bomb-vladimirskaya-spb", q: "Большая Московская улица 6 Санкт-Петербург Россия" },
  { slug: "ioann-kronshtadtsky-food-spb", q: "Крупской улица 5В Санкт-Петербург Россия" },
  { slug: "novyi-rassvet-petrogradskaya-spb", q: "набережная Карповки 18 Санкт-Петербург Россия" },
  { slug: "novyi-rassvet-lesnaya-spb", q: "Кантемировская улица 37 Санкт-Петербург Россия" },
  { slug: "druzya-na-ulitse-spb", q: "Атаманская улица 6 Санкт-Петербург Россия" },
  { slug: "pokrovsky-food-spb", q: "4-я линия Васильевского острова 65 Санкт-Петербург Россия" },
  { slug: "sotsialnoe-byuro-food-spb", q: "Боровая улица 52 Санкт-Петербург Россия" },
  { slug: "nochlezhka-night-shelter-spb", q: "проспект Девятого Января 8 Санкт-Петербург Россия" },
  { slug: "nochlezhka-warming-muzhestva-spb", q: "Политехническая улица 11Б Санкт-Петербург Россия" },
  { slug: "nochlezhka-warming-primorskaya-spb", q: "Шкиперский проток 18 Санкт-Петербург Россия" },
  { slug: "nochlezhka-laundry-spb", q: "Боровая улица 116 Санкт-Петербург Россия" },
  { slug: "nochlezhka-vydacha-dush-spb", q: "Боровая улица 112Б Санкт-Петербург Россия" },
  { slug: "neravnodush-dush-spb", q: "Политехническая улица 11Б Санкт-Петербург Россия" },
  { slug: "botkin-zdravpunkt-spb", q: "Миргородская улица 3Д Санкт-Петербург Россия" },
  { slug: "tb-dispanser-8-spb", q: "8-я Советская улица 53 Санкт-Петербург Россия" },
  { slug: "charity-hospital-spb", q: "Балтийская улица 36 Санкт-Петербург Россия" },
  { slug: "gumanitarnoe-deystvie-med-spb", q: "Каменноостровский проспект 63 Санкт-Петербург Россия" },
  { slug: "spid-centr-spb", q: "Лиговский проспект 50Д Санкт-Петербург Россия" },
  { slug: "warming-admiralteysky-spb", q: "набережная Обводного канала 177 Санкт-Петербург Россия" },
  { slug: "warming-vyborgsky-spb", q: "Лесной проспект 37 Санкт-Петербург Россия" },
  { slug: "warming-kalininsky-spb", q: "Бестужевская улица 6 Санкт-Петербург Россия" },
  { slug: "warming-kirovsky-spb", q: "Балтийская улица 72 Санкт-Петербург Россия" },
  { slug: "warming-krasnogvardeysky-spb", q: "Республиканская улица 23 Санкт-Петербург Россия" },
  { slug: "warming-krasnoselsky-spb", q: "Октябрьская улица 8 Красное Село Россия" },
  { slug: "warming-kronshtadt-spb", q: "Мануильского улица 2 Кронштадт Россия" },
  { slug: "warming-moskovsky-spb", q: "Предпортовая улица 4 Санкт-Петербург Россия" },
  { slug: "warming-nevsky-spb", q: "3-й Рабфаковский переулок 5 Санкт-Петербург Россия" },
  { slug: "warming-petrogradsky-spb", q: "Чапаева улица 24 Санкт-Петербург Россия" },
  { slug: "warming-petrodvortsovy-spb", q: "Володи Дубинина улица 6 Петергоф Россия" },
  { slug: "warming-pushkinsky-spb", q: "Автомобильная улица 1А Пушкин Россия" },
  { slug: "warming-frunzensky-bukharestskaya-spb", q: "Бухарестская улица 43 Санкт-Петербург Россия" },
  { slug: "warming-frunzensky-vitebskaya-spb", q: "Витебский проспект 36 Санкт-Петербург Россия" },
  { slug: "warming-central-spb", q: "Кременчугская улица 25 Санкт-Петербург Россия" },
  { slug: "dnp-admiralteysky-spb", q: "набережная Обводного канала 177 Санкт-Петербург Россия" },
  { slug: "dnp-vasileostrovsky-spb", q: "6-я линия Васильевского острова 21 Санкт-Петербург Россия" },
  { slug: "dnp-kalininsky-spb", q: "Бестужевская улица 6 Санкт-Петербург Россия" },
  { slug: "dnp-kirovsky-spb", q: "Балтийская улица 72 Санкт-Петербург Россия" },
  { slug: "dnp-krasnogvardeysky-spb", q: "Республиканская улица 23 Санкт-Петербург Россия" },
  { slug: "dnp-krasnoselsky-spb", q: "Октябрьская улица 8 Красное Село Россия" },
  { slug: "dnp-kronshtadt-spb", q: "Мануильского улица 2 Кронштадт Россия" },
  { slug: "dnp-moskovsky-spb", q: "Предпортовая улица 4 Санкт-Петербург Россия" },
  { slug: "dnp-nevsky-spb", q: "3-й Рабфаковский переулок 5 Санкт-Петербург Россия" },
  { slug: "dnp-petrogradsky-spb", q: "Чапаева улица 24 Санкт-Петербург Россия" },
  { slug: "dnp-petrodvortsovy-spb", q: "Володи Дубинина улица 6 Петергоф Россия" },
  { slug: "dnp-pushkinsky-spb", q: "Автомобильная улица 1А Пушкин Россия" },
  { slug: "dnp-central-spb", q: "Кременчугская улица 25 Санкт-Петербург Россия" },
  { slug: "dnp-centr-ucheta-spb", q: "Обуховской Обороны проспект 108 Санкт-Петербург Россия" },
  { slug: "pomoshch-vozvrashcheniyu-domoy-spb", q: "Коломяжский проспект 6А Санкт-Петербург Россия" },
  { slug: "krizisny-center-women-spb", q: null },
  { slug: "dezinfektsiya-dush-spb", q: "Финский переулок 4 Санкт-Петербург Россия" },
  { slug: "magazin-spasibo-spb", q: "набережная Обводного канала 128 Санкт-Петербург Россия" },
];

async function photon(q, retries = 3) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1&lang=default`;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "HelpNearby/1.0 (help-nearby.org)" },
        signal: AbortSignal.timeout(25_000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const c = data.features?.[0]?.geometry?.coordinates;
      if (!c) return null;
      return { lat: Math.round(c[1] * 1e6) / 1e6, lng: Math.round(c[0] * 1e6) / 1e6 };
    } catch {
      await sleep(1500 * (i + 1));
    }
  }
  return null;
}

async function nominatim(q) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "ru");
  const res = await fetch(url, {
    headers: { "User-Agent": "HelpNearby-Geocode/1.0 (help-nearby.org)" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const first = data[0];
  if (!first) return null;
  return {
    lat: Math.round(Number(first.lat) * 1e6) / 1e6,
    lng: Math.round(Number(first.lon) * 1e6) / 1e6,
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const outPath = new URL("../supabase/migrations/geocode-results.json", import.meta.url);
const results = fs.existsSync(outPath)
  ? JSON.parse(fs.readFileSync(outPath, "utf8"))
  : {};

for (const e of entries) {
  if (results[e.slug]?.lat) {
    console.error(e.slug, "cached");
    continue;
  }
  if (!e.q) {
    results[e.slug] = { lat: 59.934, lng: 30.335, source: "city-center" };
    console.error(e.slug, "SKIP (no address)");
    continue;
  }
  let coords = await photon(e.q);
  let source = "photon";
  if (!coords) {
    await sleep(1100);
    coords = await nominatim(e.q);
    source = "nominatim";
  }
  if (!coords) {
    console.error(e.slug, "MISS");
    results[e.slug] = null;
  } else {
    results[e.slug] = { ...coords, source };
    console.error(e.slug, coords.lat, coords.lng, source);
  }
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  await sleep(600);
}

fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log("Wrote", outPath.pathname);
