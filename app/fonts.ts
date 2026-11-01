import localFont from "next/font/local";

/**
 * Self-hosted fonts (no request to Google Fonts at build or run time).
 * DM Sans 5.3.0 and Newsreader 5.3.0 are the variable-weight woff2 files of the Fontsource project,
 * the same designs as on Google Fonts, under the SIL Open Font License (see OFL-*.txt in ./fonts).
 *
 * Latin and Latin-extended are separate files (as Google served them); a file is fetched only when the
 * page uses one of its characters (unicode-range). The families are combined into the original
 * --font-dm-sans / --font-newsreader variables in globals.css, so the rest of the CSS is unchanged.
 * Cyrillic, like before, is not bundled: it renders with the system font.
 */

export const dmSansLatin = localFont({
  src: [{ path: "./fonts/dm-sans-latin-wght-normal.woff2", weight: "100 1000", style: "normal" }],
  variable: "--font-dm-sans-latin",
  display: "swap",
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});

export const dmSansLatinExt = localFont({
  src: [{ path: "./fonts/dm-sans-latin-ext-wght-normal.woff2", weight: "100 1000", style: "normal" }],
  variable: "--font-dm-sans-latin-ext",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" }],
});

export const newsreaderLatin = localFont({
  src: [
    { path: "./fonts/newsreader-latin-wght-normal.woff2", weight: "200 800", style: "normal" },
    { path: "./fonts/newsreader-latin-wght-italic.woff2", weight: "200 800", style: "italic" },
  ],
  variable: "--font-newsreader-latin",
  display: "swap",
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});

export const newsreaderLatinExt = localFont({
  src: [
    { path: "./fonts/newsreader-latin-ext-wght-normal.woff2", weight: "200 800", style: "normal" },
    { path: "./fonts/newsreader-latin-ext-wght-italic.woff2", weight: "200 800", style: "italic" },
  ],
  variable: "--font-newsreader-latin-ext",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" }],
});

/** Arabic script (Noto Sans Arabic, SIL OFL, see OFL-Noto-Sans-Arabic.txt): fetched only for pages that contain Arabic letters. */
export const notoSansArabic = localFont({
  src: [{ path: "./fonts/noto-sans-arabic-arabic-wght-normal.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-noto-arabic",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC,U+0609,U+060C,U+061B,U+061F" }],
});

/** Class names that define the font variables on <html>. */
export const fontVariableClasses = [
  dmSansLatin.variable,
  dmSansLatinExt.variable,
  newsreaderLatin.variable,
  newsreaderLatinExt.variable,
  notoSansArabic.variable,
];
