import { test, expect } from "@playwright/test";
import { buildOrganizationJsonLd, serializeJsonLd } from "@/lib/orgJsonLd";
import { buildOrgDescription, buildOrgTitle } from "@/lib/orgSeo";
import {
  buildSitemapChunk,
  renderSitemapIndex,
  renderUrlset,
  SITEMAP_ORGS_PER_FILE,
  sitemapChunkCount,
} from "@/lib/sitemapEntries";
import type { Organization } from "@/lib/types";
import { MOCK_NEARBY_ORGS, preferFullMode } from "./helpers";

const base = MOCK_NEARBY_ORGS[0] as Organization;

const exactOrg: Organization = {
  ...base,
  id: "1",
  slug: "exact-pantry",
  name: "Exact Pantry",
  category: "food",
  city: "Nice",
  country: "France",
  address: "1 Rue Test",
  phone: "+33400000000",
  website: "https://example.org/pantry",
  lat: 43.7,
  lng: 7.26,
  hours: {},
  hoursRaw: "",
  verified: true,
};

const jsonLdOf = async (page: import("@playwright/test").Page) => {
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(raw).toBeTruthy();
  return { raw: raw!, data: JSON.parse(raw!) as Record<string, unknown> };
};

test.describe("robots and sitemap", () => {
  test("robots.txt allows the site, blocks /api/ and links the sitemap", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/User-Agent: \*/i);
    expect(body).toMatch(/Allow: \//);
    expect(body).toMatch(/Disallow: \/api\//);
    expect(body).toContain("Sitemap: https://help-nearby.org/sitemap.xml");
  });

  test("sitemap.xml is served as XML with the static pages", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("xml");
    const body = await res.text();
    expect(body).toContain("<urlset");
    for (const path of ["/about", "/why-it-matters", "/reviews", "/recent"]) {
      expect(body).toContain(`https://help-nearby.org${path}</loc>`);
    }
    // Playwright-only fixtures are never listed.
    expect(body).not.toContain("/org/e2e-");
  });

  test("organization URLs, fixture exclusion and splitting above the per-file limit", () => {
    const entries = buildSitemapChunk(0, [
      { slug: "crf-moulins", lastModified: "2026-01-02T03:04:05Z" },
      { slug: "e2e-croix-rouge-moulins", lastModified: null },
      { slug: "no-date", lastModified: null },
    ]);
    const urls = entries.map((e) => e.url);
    expect(urls).toContain("https://help-nearby.org/org/crf-moulins");
    expect(urls).toContain("https://help-nearby.org/org/no-date");
    expect(urls.some((u) => u.includes("e2e-"))).toBe(false);
    expect(urls).toContain("https://help-nearby.org/");

    const dated = entries.find((e) => e.url.endsWith("/crf-moulins"))!;
    expect(dated.lastModified).toEqual(new Date("2026-01-02T03:04:05Z"));
    expect(entries.find((e) => e.url.endsWith("/no-date"))!.lastModified).toBeUndefined();

    const xml = renderUrlset(entries);
    expect(xml).toContain("/org/crf-moulins</loc>");
    expect(xml).toContain("<lastmod>2026-01-02T03:04:05.000Z</lastmod>");

    // Static pages live only in the first file; large catalogs get an index.
    expect(buildSitemapChunk(1, [{ slug: "x", lastModified: null }]).map((e) => e.url)).toEqual([
      "https://help-nearby.org/org/x",
    ]);
    expect(sitemapChunkCount(0)).toBe(1);
    expect(sitemapChunkCount(SITEMAP_ORGS_PER_FILE)).toBe(1);
    expect(sitemapChunkCount(SITEMAP_ORGS_PER_FILE + 1)).toBe(2);
    expect(sitemapChunkCount(120_000)).toBe(3);
    expect(renderSitemapIndex(3)).toContain("https://help-nearby.org/sitemap/2.xml");
  });
});

test.describe("titles and metadata", () => {
  test("home, about and an organization page each have their own title", async ({ page }) => {
    await preferFullMode(page); // sets the cache-version key so the first visit does not reload
    const titles: string[] = [];
    for (const path of ["/", "/about", "/org/e2e-croix-rouge-moulins"]) {
      await page.goto(path);
      titles.push(await page.title());
    }
    expect(new Set(titles).size).toBe(3);
    expect(titles[2]).toBe(
      "Croix-Rouge française – Unité locale de Moulins — Food in Moulins, France | HelpNearby",
    );
  });

  test("organization page has canonical, openGraph and twitter tags", async ({ page }) => {
    await preferFullMode(page);
    await page.goto("/org/e2e-croix-rouge-moulins");
    const attr = (selector: string, name: string) =>
      page.locator(selector).first().getAttribute(name);

    expect(await attr('link[rel="canonical"]', "href")).toBe(
      "https://help-nearby.org/org/e2e-croix-rouge-moulins",
    );
    expect(await attr('meta[property="og:title"]', "content")).toContain("| HelpNearby");
    expect(await attr('meta[property="og:url"]', "content")).toBe(
      "https://help-nearby.org/org/e2e-croix-rouge-moulins",
    );
    expect(await attr('meta[property="og:image"]', "content")).toContain("/og-image.png");
    expect(await attr('meta[name="twitter:card"]', "content")).toBe("summary_large_image");
    expect(await attr('meta[name="twitter:title"]', "content")).toContain("| HelpNearby");
    expect(await attr('meta[name="description"]', "content")).toBe("Aide alimentaire.");
    // No hreflang: the language is not part of the URL.
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  });

  test("title and description builders", () => {
    expect(buildOrgTitle(exactOrg)).toBe("Exact Pantry — Food in Nice, France | HelpNearby");
    expect(buildOrgTitle({ ...exactOrg, city: "", country: "" })).toBe(
      "Exact Pantry — Food | HelpNearby",
    );

    const long = "word ".repeat(80);
    const description = buildOrgDescription({ ...exactOrg, description: long });
    expect(description.length).toBeLessThanOrEqual(155);
    expect(description.endsWith("…")).toBe(true);

    expect(buildOrgDescription({ ...exactOrg, description: "" })).toContain("food help in Nice, France");
    expect(buildOrgDescription({ ...exactOrg, description: "Short real text." })).toBe("Short real text.");
  });
});

test.describe("JSON-LD", () => {
  test("exact organization: address, phone-less, sameAs and geo; no opening hours when unknown", async ({
    page,
  }) => {
    await page.goto("/org/e2e-croix-rouge-moulins");
    const { raw, data } = await jsonLdOf(page);

    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toEqual(["NGO", "LocalBusiness"]);
    expect(data.name).toBe("Croix-Rouge française – Unité locale de Moulins");
    expect(data.url).toBe("https://help-nearby.org/org/e2e-croix-rouge-moulins");
    expect(data.sameAs).toEqual(["https://www.croix-rouge.fr/annuaire/moulins"]);
    expect(data.address).toMatchObject({
      "@type": "PostalAddress",
      streetAddress: "12 Rue de la Paix, 03000 Moulins",
      addressLocality: "Moulins",
      addressCountry: "France",
    });
    expect(data.geo).toMatchObject({ "@type": "GeoCoordinates", latitude: 46.5667, longitude: 3.3333 });
    expect(data).not.toHaveProperty("telephone");
    expect(data).not.toHaveProperty("openingHoursSpecification");
    expect(raw).not.toContain("Closed");
  });

  test("approximate (hdx-) entry has neither geo nor openingHoursSpecification", async ({ page }) => {
    await page.goto("/org/e2e-hdx-approximate");
    const { raw, data } = await jsonLdOf(page);

    expect(data["@type"]).toBe("NGO"); // no physical address: not a LocalBusiness
    expect(data.name).toBe("E2E Approximate Relief Org");
    expect(data.sameAs).toEqual(["https://example.org/relief"]);
    expect(data).not.toHaveProperty("geo");
    expect(data).not.toHaveProperty("openingHoursSpecification");
    expect(raw).not.toContain("Closed");
  });

  test("opening hours only when really known; hostile text cannot break out of the script", () => {
    const withHours = buildOrganizationJsonLd({
      ...exactOrg,
      hours: { monday: { open: "09:00", close: "17:00" }, tuesday: null },
    });
    expect(withHours.openingHoursSpecification).toEqual([
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "09:00", closes: "17:00" },
    ]);

    const always = buildOrganizationJsonLd({ ...exactOrg, hoursRaw: "24/7" });
    expect(always.openingHoursSpecification).toBeTruthy();

    const none = buildOrganizationJsonLd(exactOrg);
    expect(none).not.toHaveProperty("openingHoursSpecification");

    for (const prefix of ["rw-1", "hdx-1", "gdho-1"]) {
      const approx = buildOrganizationJsonLd({ ...exactOrg, id: prefix, hoursRaw: "24/7" });
      expect(approx).not.toHaveProperty("geo");
      expect(approx).not.toHaveProperty("openingHoursSpecification");
      expect(approx["@type"]).toBe("NGO");
    }

    const hostile = serializeJsonLd(
      buildOrganizationJsonLd({
        ...exactOrg,
        name: '</script><script>alert(1)</script>',
        description: "<img src=x onerror=alert(1)>",
      }),
    );
    expect(hostile).not.toContain("<");
    expect(JSON.parse(hostile).name).toBe("</script><script>alert(1)</script>");
  });
});
