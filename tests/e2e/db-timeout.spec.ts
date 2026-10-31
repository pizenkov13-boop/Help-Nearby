import { test, expect } from "./fixtures";
import {
  classifyDbFailure,
  createDbClient,
  DB_BREAKER_MS,
  DB_TIMEOUT_MS,
  resetDbBreaker,
  timedFetch,
} from "@/lib/supabase";

test.describe("Database deadline and breaker (unit)", () => {
  const realFetch = globalThis.fetch;

  test.afterEach(() => {
    globalThis.fetch = realFetch;
    resetDbBreaker();
  });

  test("a call that never answers fails at the 3 s deadline, even if it ignores the abort signal", async () => {
    globalThis.fetch = (() => new Promise(() => {})) as typeof fetch; // never settles, never aborts
    const started = Date.now();
    const error = await timedFetch("https://example.invalid/rest/v1/x").then(
      () => null,
      (e: unknown) => e,
    );
    const elapsed = Date.now() - started;

    expect(DB_TIMEOUT_MS).toBe(3_000);
    expect(elapsed).toBeGreaterThanOrEqual(2_900);
    expect(elapsed).toBeLessThan(4_500);
    expect(classifyDbFailure(error)).toBe("timeout");
  });

  test("after two failures in a row the next calls fail at once, and one success resets it", async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      throw new TypeError("fetch failed");
    }) as typeof fetch;

    await expect(timedFetch("https://example.invalid/a")).rejects.toThrow("fetch failed");
    await expect(timedFetch("https://example.invalid/b")).rejects.toThrow("fetch failed");
    expect(calls).toBe(2);

    const started = Date.now();
    const error = await timedFetch("https://example.invalid/c").then(() => null, (e: unknown) => e);
    expect(Date.now() - started).toBeLessThan(200);
    expect(calls).toBe(2); // the breaker did not even try
    expect(classifyDbFailure(error)).toBe("network");
    expect(DB_BREAKER_MS).toBeGreaterThan(0);

    resetDbBreaker();
    globalThis.fetch = (async () => new Response("{}", { status: 200 })) as typeof fetch;
    const ok = await timedFetch("https://example.invalid/d");
    expect(ok.status).toBe(200);
  });

  test("an HTTP error status is not a connection failure and does not trip the breaker", async () => {
    globalThis.fetch = (async () => new Response("{}", { status: 401 })) as typeof fetch;
    for (let i = 0; i < 4; i += 1) {
      expect((await timedFetch("https://example.invalid/x")).status).toBe(401);
    }
  });

  test("a failed read is attempted once: the library's 1 s + 2 s + 4 s retries are off", async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      throw new TypeError("fetch failed");
    }) as typeof fetch;

    const client = createDbClient("https://example.supabase.co", "anon-test-key");
    const started = Date.now();
    const { error } = await client
      .from("impact_clicks")
      .select("*", { count: "exact", head: true });

    expect(error).not.toBeNull();
    expect(calls).toBe(1);
    expect(Date.now() - started).toBeLessThan(1_000); // with retries this took 7 s
  });

  test("failures are told apart", () => {
    expect(classifyDbFailure(new TypeError("fetch failed"))).toBe("network");
    expect(classifyDbFailure(Object.assign(new Error("x"), { name: "TimeoutError" }))).toBe("timeout");
    expect(classifyDbFailure({ code: "42501", message: "permission denied for table impact_clicks" })).toBe("forbidden");
    expect(classifyDbFailure({ code: "XX000", message: "boom" })).toBe("db_error");
  });
});
