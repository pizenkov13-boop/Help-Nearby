import type { LanguageCode } from "@/lib/types";
import { siteConfig } from "@/lib/siteConfig";
import { LANGUAGES } from "./translations";

export const LANGUAGE_STORAGE_KEY = "hn-language";

const RTL_LANGUAGES: readonly LanguageCode[] = ["ar"];

export function isLanguageCode(value: string | null | undefined): value is LanguageCode {
  return !!value && LANGUAGES.some((l) => l.code === value);
}

export function languageDirection(code: LanguageCode): "ltr" | "rtl" {
  return RTL_LANGUAGES.includes(code) ? "rtl" : "ltr";
}

/** NEXT_PUBLIC_DEFAULT_LANGUAGE (a copy's own default) when it names a supported language, else English. */
export const DEFAULT_LANGUAGE: LanguageCode = isLanguageCode(siteConfig.defaultLanguage)
  ? siteConfig.defaultLanguage
  : "en";

/** "ru-RU" -> "ru", "zh-Hans-CN" -> "zh"; undefined when that language is not supported. */
export function matchLanguageTag(tag: string): LanguageCode | undefined {
  const primary = tag.trim().toLowerCase().split(/[-_]/)[0];
  return isLanguageCode(primary) ? primary : undefined;
}

/** The first supported language in the visitor's preference order, if any. */
export function pickSupportedLanguage(tags: readonly string[]): LanguageCode | undefined {
  for (const tag of tags) {
    const match = matchLanguageTag(tag);
    if (match) return match;
  }
  return undefined;
}

/** Accept-Language header -> language tags, most preferred first (q-values respected, q=0 dropped). */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const weight = q ? Number.parseFloat(q.slice(2)) : 1;
      return { tag: tag.trim(), weight: Number.isNaN(weight) ? 0 : weight, index };
    })
    .filter((entry) => entry.tag && entry.tag !== "*" && entry.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index)
    .map((entry) => entry.tag);
}

/** Language for a first visit: the browser's, if supported; otherwise the deployment default. */
export function resolveLanguage(tags: readonly string[]): LanguageCode {
  return pickSupportedLanguage(tags) ?? DEFAULT_LANGUAGE;
}
