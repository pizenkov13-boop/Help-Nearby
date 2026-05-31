/**
 * Full smoke test: pages, APIs, and user-facing flows (HTTP-level).
 * Usage: node scripts/smoke-test.mjs [--url http://localhost:3000]
 */

const baseUrl = (() => {
  const idx = process.argv.indexOf("--url");
  return idx >= 0 ? process.argv[idx + 1] : "http://localhost:3000";
})().replace(/\/$/, "");

const NYC = { lat: 40.7128, lng: -74.006 };
const NEAR_ORG = { lat: 40.758, lng: -73.9855 };

const results = [];

function pass(area, detail) {
  results.push({ ok: true, area, detail });
  console.log(`✓  ${area}: ${detail}`);
}

function fail(area, detail) {
  results.push({ ok: false, area, detail });
  console.error(`✗  ${area}: ${detail}`);
}

async function get(path, opts = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, { redirect: "follow", ...opts });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html */
  }
  return { res, text, json };
}

async function testPages() {
  const pages = [
    { path: "/", must: ["Help Nearby", "id=\"nav\""] },
    { path: "/about", must: ["Our Story"] },
    { path: "/why-it-matters", must: ["Cities in Need"] },
    { path: "/reviews", must: ["Reviews"] },
    { path: "/submit", must: ["Submit an Organization"] },
    { path: "/admin", must: ["Admin"] },
  ];

  for (const { path, must } of pages) {
    try {
      const { res, text } = await get(path);
      const missing = must.filter((s) => !text.includes(s));
      if (res.status === 200 && missing.length === 0 && !text.includes('"statusCode":500')) {
        pass("Страница", path);
      } else {
        fail("Страница", `${path} status=${res.status} missing=${missing.join(",") || "500?"}`);
      }
    } catch (e) {
      fail("Страница", `${path} — ${e.message}`);
    }
  }
}

async function testStaticAssets() {
  for (const asset of ["/images/logo.svg", "/images/sdg/1.png"]) {
    try {
      const { res } = await get(asset);
      if (res.status === 200) pass("Ассет", asset);
      else fail("Ассет", `${asset} status=${res.status}`);
    } catch (e) {
      fail("Ассет", `${asset} — ${e.message}`);
    }
  }
}

async function testApis() {
  // Impact counter (hero stat)
  try {
    const { res, json } = await get("/api/impact");
    if (res.status === 200 && json && typeof json.count === "number") {
      pass("API", `/api/impact → count=${json.count}`);
    } else fail("API", `/api/impact status=${res.status}`);
  } catch (e) {
    fail("API", `/api/impact — ${e.message}`);
  }

  // Geocode (search bar)
  try {
    const { res, json } = await get("/api/geocode?q=New+York");
    if (res.status === 200 && json?.lat && json?.lng) {
      pass("API", `/api/geocode → ${json.lat.toFixed(2)}, ${json.lng.toFixed(2)}`);
    } else fail("API", `/api/geocode status=${res.status}`);
  } catch (e) {
    fail("API", `/api/geocode — ${e.message}`);
  }

  // Nearby orgs (map/list)
  try {
    const q = new URLSearchParams({
      lat: String(NYC.lat),
      lng: String(NYC.lng),
      radius: "5000",
    });
    const { res, json } = await get(`/api/nearby?${q}`);
    if (res.status === 200 && Array.isArray(json)) {
      pass("API", `/api/nearby → ${json.length} org(s)`);
    } else fail("API", `/api/nearby status=${res.status}`);
  } catch (e) {
    fail("API", `/api/nearby — ${e.message}`);
  }

  // Emergency help modal
  try {
    const q = new URLSearchParams({
      lat: String(NYC.lat),
      lng: String(NYC.lng),
      radius: "10000",
    });
    const { res, json } = await get(`/api/emergency?${q}`);
    if (res.status === 200 && Array.isArray(json)) {
      pass("API", `/api/emergency → ${json.length} org(s)`);
    } else fail("API", `/api/emergency status=${res.status}`);
  } catch (e) {
    fail("API", `/api/emergency — ${e.message}`);
  }

  // Walking route (directions button)
  try {
    const q = new URLSearchParams({
      fromLat: String(NYC.lat),
      fromLng: String(NYC.lng),
      toLat: String(NEAR_ORG.lat),
      toLng: String(NEAR_ORG.lng),
      mode: "walking",
    });
    const { res, json } = await get(`/api/route?${q}`);
    const coords = json?.coordinates;
    const hasRoute =
      res.status === 200 &&
      Array.isArray(coords) &&
      coords.length > 1 &&
      typeof json.distanceKm === "number";
    if (hasRoute) {
      const last = coords[coords.length - 1];
      const atDest =
        Math.abs(last[0] - NEAR_ORG.lat) < 0.001 &&
        Math.abs(last[1] - NEAR_ORG.lng) < 0.001;
      pass(
        "API",
        `/api/route → ${coords.length} pts, ${json.distanceKm} km${atDest ? ", до точки" : ""}`,
      );
    } else {
      fail("API", `/api/route status=${res.status} body=${JSON.stringify(json)?.slice(0, 80)}`);
    }
  } catch (e) {
    fail("API", `/api/route — ${e.message}`);
  }

  // Snap to road
  try {
    const q = new URLSearchParams({ lat: String(NYC.lat), lng: String(NYC.lng) });
    const { res, json } = await get(`/api/nearest?${q}`);
    if (res.status === 200 && json?.lat && json?.lng) {
      pass("API", `/api/nearest → snap ok`);
    } else fail("API", `/api/nearest status=${res.status}`);
  } catch (e) {
    fail("API", `/api/nearest — ${e.message}`);
  }

  // Reviews list
  try {
    const { res, json } = await get("/api/reviews");
    if (res.status === 200 && Array.isArray(json)) {
      pass("API", `/api/reviews → ${json.length} review(s)`);
    } else fail("API", `/api/reviews status=${res.status}`);
  } catch (e) {
    fail("API", `/api/reviews — ${e.message}`);
  }

  // Chat widget
  try {
    const { res, json } = await get("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "food in New York" }],
      }),
    });
    const msg = json?.message ?? json?.error;
    if (res.status === 200 && typeof msg === "string" && msg.length > 10) {
      pass("API", `/api/chat → ответ ${msg.length} симв.`);
    } else {
      fail("API", `/api/chat status=${res.status} msg=${String(msg)?.slice(0, 60)}`);
    }
  } catch (e) {
    fail("API", `/api/chat — ${e.message}`);
  }

  // Submit validation (empty body)
  try {
    const { res, json } = await get("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    if (res.status === 400 && json?.error) {
      pass("API", `/api/submit → валидация 400 ok`);
    } else fail("API", `/api/submit expected 400, got ${res.status}`);
  } catch (e) {
    fail("API", `/api/submit — ${e.message}`);
  }

  // Admin session (not logged in)
  try {
    const { res, json } = await get("/api/admin/session");
    if (res.status === 200 && typeof json?.authenticated === "boolean") {
      pass("API", `/api/admin/session → auth=${json.authenticated}`);
    } else fail("API", `/api/admin/session status=${res.status}`);
  } catch (e) {
    fail("API", `/api/admin/session — ${e.message}`);
  }

  // Impact POST validation
  try {
    const { res } = await get("/api/impact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId: "", action: "call" }),
    });
    if (res.status === 400) pass("API", `/api/impact POST → валидация 400 ok`);
    else fail("API", `/api/impact POST expected 400, got ${res.status}`);
  } catch (e) {
    fail("API", `/api/impact POST — ${e.message}`);
  }
}

async function testOrgDetailPage() {
  try {
    const q = new URLSearchParams({
      lat: String(NYC.lat),
      lng: String(NYC.lng),
      radius: "15000",
    });
    const { json: orgs } = await get(`/api/nearby?${q}`);
    const slug = orgs?.[0]?.slug;
    if (!slug) {
      fail("Карточка org", "нет org для проверки /org/[slug]");
      return;
    }
    const { res, text } = await get(`/org/${slug}`);
    if (res.status === 200 && text.includes(orgs[0].name?.slice(0, 10) ?? slug)) {
      pass("Карточка org", `/org/${slug}`);
    } else if (res.status === 200) {
      pass("Карточка org", `/org/${slug} (200)`);
    } else {
      fail("Карточка org", `/org/${slug} status=${res.status}`);
    }
  } catch (e) {
    fail("Карточка org", e.message);
  }
}

async function main() {
  console.log(`\nSmoke test → ${baseUrl}\n`);
  await testPages();
  await testStaticAssets();
  await testApis();
  await testOrgDetailPage();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n--- Итого: ${results.length - failed.length}/${results.length} ok ---`);
  if (failed.length > 0) {
    console.error(`\nПровалено (${failed.length}):`);
    for (const f of failed) console.error(`  • ${f.area}: ${f.detail}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
