/** Common country names → ISO 3166-1 alpha-2 for flag emoji. */
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

function codeToFlagEmoji(code: string): string {
  const upper = code.toUpperCase();
  if (upper.length !== 2 || !/^[A-Z]{2}$/.test(upper)) return "🌍";
  const a = upper.charCodeAt(0) - 65 + 0x1f1e6;
  const b = upper.charCodeAt(1) - 65 + 0x1f1e6;
  return String.fromCodePoint(a, b);
}

export function countryToFlag(country: string): string {
  const trimmed = country.trim();
  if (!trimmed) return "🌍";

  if (/^[a-z]{2}$/i.test(trimmed)) {
    return codeToFlagEmoji(trimmed);
  }

  const code = COUNTRY_NAME_TO_CODE[trimmed.toLowerCase()];
  return code ? codeToFlagEmoji(code) : "🌍";
}
