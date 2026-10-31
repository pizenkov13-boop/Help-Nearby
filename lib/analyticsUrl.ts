/** The address of a page as Vercel Web Analytics may see it: origin and path only, no query string, no hash. */
export function stripQueryAndHash(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    // a relative or odd value: cut it at the first ? or #
    return url.split(/[?#]/)[0] ?? url;
  }
}
