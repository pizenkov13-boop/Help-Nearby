import { test as base, expect } from "@playwright/test";

/**
 * Vercel Web Analytics requests /_vercel/insights/* from our own origin. That path only exists on Vercel:
 * on the local test server an answer (404 page or an empty 204) leaves Chromium's network never "idle"
 * under parallel load, and each 404 is a full page render. The request is still made (and can be asserted);
 * it is simply aborted, as if the analytics host were unreachable.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route(/\/_vercel\/insights\//, (route) => route.abort());
    await use(context);
  },
});

export { expect };
