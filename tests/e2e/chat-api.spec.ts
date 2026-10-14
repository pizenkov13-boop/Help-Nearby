import { test, expect } from "@playwright/test";

test.describe("Chat API without an AI key", () => {
  test("the public health route no longer exists (it could spend provider balance)", async ({ request }) => {
    const res = await request.get("/api/chat/health");
    expect(res.status()).toBe(404);
  });

  test("list follow-ups are not treated as a place name", async ({ request }) => {
    for (const text of ["дай список рядом", "list nearby"]) {
      const res = await request.post("/api/chat", {
        data: {
          language: text === "list nearby" ? "en" : "ru",
          messages: [{ role: "user", content: text }],
          context: {
            country: "",
            organizations: [
              { name: "E2E Context Pantry", category: "food", city: "Moscow", phone: "", source_url: "", verified: true },
            ],
          },
        },
      });
      expect((await res.json()).message).toContain("E2E Context Pantry");
    }
  });

  test("short follow-up falls back to the nearby context list", async ({ request }) => {
    const res = await request.post("/api/chat", {
      data: {
        language: "ru",
        messages: [{ role: "user", content: "дай список рядом" }],
        context: {
          country: "",
          organizations: [
            { name: "E2E Context Pantry", category: "food", city: "Moscow", phone: "+70000000000", source_url: "", verified: true },
          ],
        },
      },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.message).toContain("E2E Context Pantry");
    expect(body.message).not.toContain("Смотрите список выше");
  });
});
