import "server-only";
import { headers } from "next/headers";
import type { LanguageCode } from "@/lib/types";
import { parseAcceptLanguage, resolveLanguage } from "./detectLanguage";
import { translations, type TranslationKey } from "./translations";

/** The visitor's language on the server (Accept-Language), the same rule the root layout uses. */
export async function requestLanguage(): Promise<LanguageCode> {
  return resolveLanguage(parseAcceptLanguage((await headers()).get("accept-language")));
}

/** Translator for page metadata (title, description) in the visitor's language. */
export async function metaTranslator(): Promise<(key: TranslationKey) => string> {
  const language = await requestLanguage();
  return (key) => translations[language][key] ?? translations.en[key];
}
