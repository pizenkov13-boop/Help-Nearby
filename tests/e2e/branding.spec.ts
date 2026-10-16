import { test, expect } from "@playwright/test";

test.describe("Icons, manifest and social image", () => {
  test("every icon / manifest / og link in <head> resolves to a real file", async ({ request }) => {
    const html = await (await request.get("/")).text();
    const hrefs = new Set<string>();

    for (const match of html.matchAll(/<link[^>]+>/g)) {
      const tag = match[0];
      const rel = tag.match(/rel="([^"]+)"/)?.[1] ?? "";
      const href = tag.match(/href="([^"]+)"/)?.[1];
      if (href && /icon|manifest/.test(rel)) hrefs.add(href);
    }
    const og = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)?.[1];
    expect(og, "og:image meta").toBeTruthy();
    hrefs.add(new URL(og!).pathname);

    // Icon types the app promises: favicon, svg, png, apple-touch, manifest.
    const joined = [...hrefs].join(" ");
    expect(joined).toMatch(/favicon\.ico/);
    expect(joined).toMatch(/icon\.svg/);
    expect(joined).toMatch(/apple-icon/);
    expect(joined).toMatch(/manifest\.webmanifest/);

    for (const href of hrefs) {
      const url = new URL(href, "http://localhost").pathname;
      const res = await request.get(url);
      expect(res.status(), `${url} should exist`).toBe(200);
    }
  });

  test("manifest has 192/512 and maskable icons that exist", async ({ request }) => {
    const manifest = await (await request.get("/manifest.webmanifest")).json();
    const icons = manifest.icons as { src: string; sizes: string; purpose?: string }[];
    expect(icons.some((i) => i.sizes === "192x192")).toBe(true);
    expect(icons.some((i) => i.sizes === "512x512" && (i.purpose ?? "any") === "any")).toBe(true);
    expect(icons.some((i) => i.purpose === "maskable")).toBe(true);
    for (const icon of icons) {
      expect((await request.get(icon.src)).status(), icon.src).toBe(200);
    }
  });
});
