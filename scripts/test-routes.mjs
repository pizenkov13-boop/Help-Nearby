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
  { path: "/about", mustInclude: "Our Story" },
  { path: "/why-it-matters", mustInclude: "The Problem" },
  { path: "/reviews", mustInclude: "Reviews" },
  { path: "/submit", mustInclude: "Submit an Organization" },
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

if (failed > 0) {
  console.error(`\n${failed} route(s) failed. Is the server running at ${baseUrl}?`);
  process.exit(1);
}

console.log("\nAll route smoke tests passed.");
