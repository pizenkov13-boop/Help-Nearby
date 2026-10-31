import { test, expect } from "./fixtures";
import { parseChatMarkdown, parseInline, safeHttpUrl } from "@/lib/chatMarkdown";
import { preferFullMode } from "./helpers";

test.describe("Chat markdown parser (unit)", () => {
  test("bold, list, line breaks and safe links", () => {
    const blocks = parseChatMarkdown(
      "Intro line\nsecond line\n\n- **Pantry** (Nice) — food; [site](https://example.org/a)\n- Shelter",
    );
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ type: "paragraph" });
    expect((blocks[0] as { lines: unknown[] }).lines).toHaveLength(2);
    const list = blocks[1] as { type: string; items: { type: string; value: string; href?: string }[][] };
    expect(list.type).toBe("list");
    expect(list.items[0]![0]).toEqual({ type: "bold", value: "Pantry" });
    expect(list.items[0]!.at(-1)).toEqual({
      type: "link",
      value: "site",
      href: "https://example.org/a",
    });
  });

  test("rejects non-http(s) URLs", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("data:text/html,<b>x</b>")).toBeNull();
    expect(safeHttpUrl("//evil.example")).toBeNull();
    expect(safeHttpUrl("/relative")).toBeNull();
    expect(safeHttpUrl("https://ok.example")).toBe("https://ok.example/");

    const nodes = parseInline("[click](javascript:alert(1))");
    expect(nodes).toEqual([{ type: "text", value: "click" }]);
  });

  test("strips stray ** and never emits HTML", () => {
    const nodes = parseInline("**unclosed bold and <img src=x onerror=alert(1)>");
    expect(nodes.map((n) => n.type)).toEqual(["text"]);
    expect(nodes[0]!.value).not.toContain("**");
    expect(nodes[0]!.value).toContain("<img"); // kept as inert text, escaped by React
  });
});

test.describe("Chat markdown rendering (widget)", () => {
  test("renders bold, bullets and safe links; drops javascript: links", async ({ page }) => {
    await preferFullMode(page);
    await page.route(/\/api\/chat$/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: [
            "Nearby help:",
            "- **E2E Pantry** (Nice) — food; [source](https://example.org/pantry) — OpenStreetMap",
            "- **Bad Link** — [evil](javascript:alert(1)) stray ** marker",
          ].join("\n"),
        }),
      }),
    );

    await page.goto("/");
    await page.getByRole("button", { name: "AI Assistant" }).click();
    const panel = page.locator(".fixed.bottom-24");
    await panel.locator('input[type="text"]').fill("food in Nice");
    await panel.getByLabel("Send").click();

    const reply = panel.locator("ul");
    await expect(reply.locator("li")).toHaveCount(2);
    await expect(reply.locator("li strong").first()).toHaveText("E2E Pantry");

    const link = reply.locator("a");
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("href", "https://example.org/pantry");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
    await expect(link).toHaveAttribute("rel", /noreferrer/);

    // The javascript: link is plain text, and the stray ** marker is gone.
    await expect(panel.getByText("evil")).toBeVisible();
    await expect(panel.locator('a[href^="javascript"]')).toHaveCount(0);
    await expect(panel.locator("ul")).not.toContainText("**");
  });
});
