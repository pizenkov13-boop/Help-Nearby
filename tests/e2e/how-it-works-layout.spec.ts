import { test, expect } from "./fixtures";
import { preferFullMode } from "./helpers";

for (const width of [1024, 1440, 1920]) {
  test(`How It Works stays centered at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await preferFullMode(page);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const geometry = await page.locator(".hiw").evaluate((section) => {
      const center = (element: Element) => {
        const box = element.getBoundingClientRect();
        return box.left + box.width / 2;
      };
      const steps = [...section.querySelectorAll(".step")];
      return {
        heading: center(section.querySelector(".hiw-head h2")!),
        grid: center(section.querySelector(".hiw-grid")!),
        circles: steps.map((step) => center(step.querySelector(".step-num")!)),
        titles: steps.map((step) => center(step.querySelector("h3")!)),
        text: steps.map((step) => center(step.querySelector("p")!)),
      };
    });
    expect(Math.abs(geometry.heading - geometry.grid)).toBeLessThan(1);
    expect(Math.abs(geometry.circles[1]! - geometry.heading)).toBeLessThan(1);
    expect(Math.abs((geometry.circles[1]! - geometry.circles[0]!) - (geometry.circles[2]! - geometry.circles[1]!))).toBeLessThan(1);
    for (let i = 0; i < 3; i++) {
      expect(Math.abs(geometry.circles[i]! - geometry.titles[i]!)).toBeLessThan(1);
      expect(Math.abs(geometry.circles[i]! - geometry.text[i]!)).toBeLessThan(1);
    }
  });
}
