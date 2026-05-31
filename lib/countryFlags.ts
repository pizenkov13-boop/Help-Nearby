/** Common country names → ISO 3166-1 alpha-2. */
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  sudan: "SD",
  yemen: "YE",
  afghanistan: "AF",
  haiti: "HT",
  "democratic republic of the congo": "CD",
  "dr congo": "CD",
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  canada: "CA",
  "united kingdom": "GB",
  uk: "GB",
  france: "FR",
  germany: "DE",
  spain: "ES",
  russia: "RU",
  ukraine: "UA",
  syria: "SY",
  iraq: "IQ",
  somalia: "SO",
  ethiopia: "ET",
  kenya: "KE",
  nigeria: "NG",
  india: "IN",
  china: "CN",
  mexico: "MX",
  brazil: "BR",
};

export function resolveCountryCode(country: string): string | null {
  const trimmed = country.trim();
  if (!trimmed) return null;

  if (/^[a-z]{2}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return COUNTRY_NAME_TO_CODE[trimmed.toLowerCase()] ?? null;
}
