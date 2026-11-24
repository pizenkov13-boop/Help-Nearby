const countryCodes = new Map<string, string>();
const englishRegions = new Intl.DisplayNames(["en"], { type: "region" });

for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) {
  const code = String.fromCharCode(a, b);
  const name = englishRegions.of(code);
  if (name && name !== code) countryCodes.set(name.toLowerCase(), code);
}

export function localizeCountry(country: string, language: string): string {
  const code = countryCodes.get(country.toLowerCase());
  return code ? new Intl.DisplayNames([language], { type: "region" }).of(code) ?? country : country;
}
