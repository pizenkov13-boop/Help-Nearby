/** Fixed header height (matches `.header` in globals.css) plus breathing room. */
export const HEADER_SCROLL_OFFSET = 80;

export function scrollToSection(id: string, behavior: ScrollBehavior = "smooth"): void {
  const targetId = id.startsWith("#") ? id.slice(1) : id;
  const el = document.getElementById(targetId);
  if (!el) return;

  const top =
    el.getBoundingClientRect().top + window.scrollY - HEADER_SCROLL_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior });
}

export function parseHashHref(href: string): { path: string; hash: string | null } {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) {
    return { path: href, hash: null };
  }
  const path = href.slice(0, hashIndex) || "/";
  const hash = href.slice(hashIndex + 1);
  return { path, hash: hash || null };
}
