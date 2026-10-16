/**
 * Generates every favicon / app icon / social image from ONE logo (the heart-with-pin mark
 * in public/images/logo.svg). Run with: npm run icons:generate
 *
 * Outputs
 *   app/favicon.ico            16/32/48 multi-size
 *   app/icon.svg               vector favicon (adapts to light / dark tab backgrounds)
 *   app/icon.png               96x96
 *   app/apple-icon.png         180x180 apple-touch-icon (opaque background)
 *   public/icons/icon-192.png  PWA "any"
 *   public/icons/icon-512.png  PWA "any"
 *   public/icons/icon-maskable-512.png  PWA maskable (logo inside the 80% safe zone)
 *   public/og-image.png        1200x630 social preview
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import toIco from "to-ico";

const root = process.cwd();
const logoPath = path.join(root, "public", "images", "logo.svg");
const publicDir = path.join(root, "public");
const iconsDir = path.join(publicDir, "icons");
const appDir = path.join(root, "app");

const logoSvg = await readFile(logoPath, "utf8");
const HEART_PATH = logoSvg.match(/<path d="([^"]+)"/)[1];

/** Logo as a standalone SVG; `circle` is the fill of the centre dot. */
function logoMarkup({ circle = "#DBE9FC" } = {}) {
  return `
  <defs>
    <linearGradient id="hn-bar" x1="150" y1="388" x2="450" y2="388" gradientUnits="userSpaceOnUse">
      <stop stop-color="#1D82C5"/><stop offset="1" stop-color="#12AF8D"/>
    </linearGradient>
  </defs>
  <g transform="translate(162, 118)"><path d="${HEART_PATH}" fill="#1B88BD"/></g>
  <circle cx="300" cy="229" r="40" fill="${circle}"/>
  <rect x="150" y="378" width="300" height="20" rx="10" fill="url(#hn-bar)"/>`;
}

const LOGO_VIEWBOX = "148 112 304 290";

/** Square canvas of `size` with the logo scaled to `logoRatio` of it, on an optional solid background. */
async function renderSquare(size, { background = null, logoRatio = 0.86, circle = "#DBE9FC" } = {}) {
  const inner = Math.round(size * logoRatio);
  const logo = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}" width="${inner}" height="${inner}">${logoMarkup({ circle })}</svg>`,
    ),
    { density: Math.max(192, size * 3) },
  )
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toBuffer();
}

await mkdir(iconsDir, { recursive: true });
const write = async (file, buffer) => {
  await writeFile(file, buffer);
  console.log("Wrote", path.relative(root, file));
};

// Vector favicon: heart + bar are mid-tone brand colours that read on any tab background;
// only the centre dot follows the browser colour scheme.
await write(
  path.join(appDir, "icon.svg"),
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}">
  <style>.dot{fill:#DBE9FC}@media (prefers-color-scheme:dark){.dot{fill:#0A1731}}</style>
  ${logoMarkup().replace(/<circle ([^>]*) fill="[^"]+"\/>/, '<circle $1 class="dot"/>')}
</svg>
`,
  ),
);
// Keep the in-page copies the header already uses in sync with the same source.
await write(path.join(publicDir, "icon.svg"), await readFile(path.join(appDir, "icon.svg")));

// Raster favicons (transparent, light dot so they stay legible on dark tab strips).
const png16 = await renderSquare(16, { logoRatio: 1 });
const png32 = await renderSquare(32, { logoRatio: 1 });
const png48 = await renderSquare(48, { logoRatio: 1 });
await write(path.join(appDir, "favicon.ico"), await toIco([png16, png32, png48]));
await write(path.join(publicDir, "favicon.ico"), await readFile(path.join(appDir, "favicon.ico")));
await write(path.join(publicDir, "favicon-16x16.png"), png16);
await write(path.join(publicDir, "favicon-32x32.png"), png32);
await write(path.join(publicDir, "favicon.png"), png32);
await write(path.join(appDir, "icon.png"), await renderSquare(96, { logoRatio: 0.96 }));

// iOS ignores transparency, so the touch icon gets a solid light background.
await write(
  path.join(appDir, "apple-icon.png"),
  await renderSquare(180, { background: "#FFFFFF", logoRatio: 0.74 }),
);

await write(path.join(iconsDir, "icon-192.png"), await renderSquare(192, { logoRatio: 0.9 }));
await write(path.join(iconsDir, "icon-512.png"), await renderSquare(512, { logoRatio: 0.9 }));
// Maskable: opaque background and the logo inside the central 80% safe zone.
await write(
  path.join(iconsDir, "icon-maskable-512.png"),
  await renderSquare(512, { background: "#FFFFFF", logoRatio: 0.6 }),
);

// Social preview: logo + wordmark on white with the brand gradient bar.
const og = await renderSquare(380, { logoRatio: 1 });
const ogBase = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#1D82C5"/><stop offset="1" stop-color="#12AF8D"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#FFFFFF"/>
  <rect y="590" width="1200" height="40" fill="url(#g)"/>
  <text x="520" y="285" font-family="Arial, Helvetica, sans-serif" font-size="92" font-weight="700" fill="#0A1731">Help Nearby</text>
  <text x="522" y="360" font-family="Arial, Helvetica, sans-serif" font-size="36" fill="#44546A">Find food, shelter and medical</text>
  <text x="522" y="412" font-family="Arial, Helvetica, sans-serif" font-size="36" fill="#44546A">help near you. Free, in 7 languages.</text>
  <text x="522" y="500" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700" fill="#1B88BD">help-nearby.org</text>
</svg>`);
await write(
  path.join(publicDir, "og-image.png"),
  await sharp(ogBase)
    .composite([{ input: og, left: 96, top: 110 }])
    .png({ compressionLevel: 9 })
    .toBuffer(),
);
