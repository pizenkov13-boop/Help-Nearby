const CACHE_NAME = "help-nearby-v10";
const OFFLINE_URL = "/offline.html";

/** Static assets only — do not precache HTML routes (Next.js RSC pages are not cache-safe). */
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            await cache.add(url);
          } catch {
            /* skip missing assets during install */
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isNextJsCodeAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") &&
    (pathname.endsWith(".js") || pathname.endsWith(".css"))
  );
}

function shouldBypassServiceWorker(request, url) {
  if (request.method !== "GET") return true;
  if (url.origin !== self.location.origin) return true;
  if (isApiRequest(url)) return true;
  if (isNextJsCodeAsset(url.pathname)) return true;
  if (request.mode === "navigate") return false;
  if (url.pathname.startsWith("/_next/") && !url.pathname.startsWith("/_next/static/")) {
    return true;
  }
  if (request.headers.get("RSC") === "1") return true;
  if (request.headers.get("Next-Router-Prefetch") === "1") return true;
  if (request.headers.get("Next-Router-State-Tree")) return true;
  return false;
}

function isCacheableResponse(response) {
  return (
    response &&
    response.ok &&
    response.status === 200 &&
    response.type === "basic" &&
    !(response.headers.get("Cache-Control") || "").includes("no-store")
  );
}

async function safeCachePut(cache, request, response) {
  try {
    if (!isCacheableResponse(response)) return;
    await cache.put(request, response.clone());
  } catch {
    /* QuotaExceededError, opaque body, or RSC stream — ignore */
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (shouldBypassServiceWorker(request, url)) {
    if (request.mode === "navigate") {
      event.respondWith(networkFirstNavigation(request));
    }
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(networkFirstStatic(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(CACHE_NAME);
    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;

    return new Response("You are offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

async function networkFirstStatic(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    await safeCachePut(cache, request, response);
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response("", { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then(async (response) => {
      await safeCachePut(cache, request, response);
      return response;
    })
    .catch(() => null);

  if (cached) {
    void networkPromise;
    return cached;
  }

  const network = await networkPromise;
  return network || new Response("", { status: 503 });
}
