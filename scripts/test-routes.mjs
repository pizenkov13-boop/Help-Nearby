/**
 * Smoke tests for marketing routes and production build.
 * Usage: node scripts/test-routes.mjs [--url http://localhost:3000]
 */

const baseUrl = (() => {
  const idx = process.argv.indexOf("--url");
  return idx >= 0 ? process.argv[idx + 1] : "http://localhost:3000";
})();

const routes = [
  { path: "/", mustInclude: "Help Nearby" },
  { path: "/about", mustInclude: "How It Works" },
  { path: "/why-it-matters", mustInclude: "Cities in Need" },
  { path: "/recent", mustInclude: "Recently added organizations" },
];

let failed = 0;

for (const { path, mustInclude } of routes) {
  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    const html = await res.text();
    const ok =
      res.status === 200 &&
      html.includes(mustInclude) &&
      !html.includes('"statusCode":500');

    if (ok) {
      console.log(`OK  ${path} ${res.status}`);
    } else {
      failed++;
      console.error(
        `FAIL ${path} status=${res.status} snippet=${html.slice(0, 120).replace(/\s+/g, " ")}`,
      );
    }
  } catch (err) {
    failed++;
    console.error(`FAIL ${path}`, err instanceof Error ? err.message : err);
  }
}

for (const path of ["/reviews", "/submit"]) {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, { redirect: "manual" });
    if (![307, 308].includes(res.status) || new URL(res.headers.get("location"), baseUrl).pathname !== "/") {
      failed++;
      console.error(`FAIL ${path} did not redirect home`);
    } else console.log(`OK  ${path} redirects home`);
  } catch (err) {
    failed++;
    console.error(`FAIL ${path}`, err instanceof Error ? err.message : err);
  }
}

for (const path of ["/api/reviews", "/api/submit", "/api/chat"]) {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, { method: "POST" });
    if (res.status !== 410) { failed++; console.error(`FAIL ${path} status=${res.status}`); }
    else console.log(`OK  ${path} disabled`);
  } catch (err) {
    failed++;
    console.error(`FAIL ${path}`, err instanceof Error ? err.message : err);
  }
}

if (failed > 0) {
  console.error(`\n${failed} route(s) failed. Is the server running at ${baseUrl}?`);
  process.exit(1);
}

console.log("\nAll route smoke tests passed.");
